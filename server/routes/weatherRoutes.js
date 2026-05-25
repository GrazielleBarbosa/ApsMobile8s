/**
 * weatherRoutes.js
 * Rotas da API intermediária APS Mobile.
 *
 * Arquitetura:
 *   Mobile App → [estas rotas] → openWeatherService → OpenWeatherMap API
 *                                      ↓
 *                               banco de dados SQLite (historico.db)
 *
 * Integração com BD:
 *   - Rota /environment/alerts: salva consulta completa no SQLite após gerar alertas
 *   - Rota /history: retorna histórico de consultas com alertas (JOIN via código)
 *   - Rota /history/:city: histórico filtrado por cidade
 *   - Rota /history/stats: estatísticas gerais do banco
 */

import { Router } from 'express';
import {
  getCurrentWeather,
  getForecast,
  getAirPollution,
} from '../services/openWeatherService.js';
import {
  mapAirQuality,
  buildEnvironmentalAlerts,
} from '../services/environmentAlerts.js';
import {
  salvarConsulta,
  buscarHistorico,
  buscarHistoricoPorCidade,
  buscarEstatisticas,
} from '../database/db.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────

/**
 * Converte timestamp Unix + offset de fuso horário em string "HH:MM".
 * Usa métodos UTC para evitar interferência do fuso da máquina servidora.
 */
function formatTime(unixSeconds, timezoneOffset = 0) {
  const localMs = (unixSeconds + timezoneOffset) * 1000;
  const d  = new Date(localMs);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Agrupa a lista de previsão (intervalos de 3h) em dias completos.
 * Calcula temperatura média, máxima e mínima reais por dia.
 */
function groupForecastByDay(list) {
  const byDate = {};

  list.forEach((item) => {
    const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0];
    if (!byDate[dateKey]) byDate[dateKey] = { temps: [], items: [] };
    byDate[dateKey].temps.push(item.main.temp);
    byDate[dateKey].items.push(item);
  });

  return Object.entries(byDate)
    .slice(0, 7)
    .map(([, { temps, items }]) => {
      const representative =
        items.find((i) => {
          const h = new Date(i.dt * 1000).getUTCHours();
          return h >= 11 && h <= 15;
        }) ||
        items[Math.floor(items.length / 2)] ||
        items[0];

      const avgTemp = temps.reduce((acc, t) => acc + t, 0) / temps.length;

      return {
        dt:          representative.dt,
        temp:        Number(avgTemp.toFixed(1)),
        tempMax:     Number(Math.max(...temps).toFixed(1)),
        tempMin:     Number(Math.min(...temps).toFixed(1)),
        description: representative.weather[0].description,
        icon:        representative.weather[0].icon,
        humidity:    representative.main.humidity,
        weatherMain: representative.weather[0].main,
      };
    });
}

// ─────────────────────────────────────────────────────────────
// ROTAS — SISTEMA DISTRIBUÍDO
// ─────────────────────────────────────────────────────────────

/** Health check da API intermediária */
router.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'APS Mobile API Intermediária',
    timestamp: new Date().toISOString(),
  });
});

/** Clima atual de uma cidade */
router.get('/weather/current', async (req, res, next) => {
  try {
    const city = req.query.city?.trim();
    if (!city) return res.status(400).json({ error: 'Parâmetro "city" é obrigatório' });

    const data     = await getCurrentWeather(city);
    const timezone = data.timezone ?? 0;

    res.json({
      name:        data.name,
      country:     data.sys?.country,
      coord:       data.coord,
      temp:        Number(data.main.temp.toFixed(1)),
      feelsLike:   Number(data.main.feels_like.toFixed(1)),
      max:         Number(data.main.temp_max.toFixed(1)),
      min:         Number(data.main.temp_min.toFixed(1)),
      humidity:    data.main.humidity,
      pressure:    data.main.pressure,
      windSpeed:   data.wind?.speed ?? 0,
      description: data.weather[0].description,
      icon:        data.weather[0].icon,
      sunrise:     formatTime(data.sys.sunrise, timezone),
      sunset:      formatTime(data.sys.sunset, timezone),
    });
  } catch (error) {
    next(error);
  }
});

/** Previsão de até 7 dias com temperatura média, máxima e mínima reais */
router.get('/weather/forecast', async (req, res, next) => {
  try {
    const city = req.query.city?.trim();
    if (!city) return res.status(400).json({ error: 'Parâmetro "city" é obrigatório' });

    const data  = await getForecast(city);
    const daily = groupForecastByDay(data.list);

    res.json({ city: data.city?.name, items: daily });
  } catch (error) {
    next(error);
  }
});

/** Qualidade do ar e componentes atmosféricos */
router.get('/environment/air-quality', async (req, res, next) => {
  try {
    const city = req.query.city?.trim();
    if (!city) return res.status(400).json({ error: 'Parâmetro "city" é obrigatório' });

    const current    = await getCurrentWeather(city);
    const pollution  = await getAirPollution(current.coord.lat, current.coord.lon);
    const aqi        = pollution.list?.[0]?.main?.aqi ?? null;
    const components = pollution.list?.[0]?.components ?? {};

    res.json({
      city: current.name,
      airQuality: mapAirQuality(aqi),
      components: {
        pm25: components.pm2_5 ?? null,
        pm10: components.pm10  ?? null,
        co:   components.co    ?? null,
        no2:  components.no2   ?? null,
        o3:   components.o3    ?? null,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Alertas ambientais + PERSISTÊNCIA NO BANCO DE DADOS.
 *
 * Esta rota agrega todos os dados (clima + previsão + poluição + alertas)
 * e salva a consulta completa no SQLite para histórico.
 * A falha no BD não interrompe a resposta ao mobile (graceful degradation).
 */
router.get('/environment/alerts', async (req, res, next) => {
  try {
    const city = req.query.city?.trim();
    if (!city) return res.status(400).json({ error: 'Parâmetro "city" é obrigatório' });

    const current = await getCurrentWeather(city);

    const [forecastData, pollution] = await Promise.all([
      getForecast(city),
      getAirPollution(current.coord.lat, current.coord.lon).catch(() => null),
    ]);

    const aqi        = pollution?.list?.[0]?.main?.aqi ?? 1;
    const components = pollution?.list?.[0]?.components ?? {};
    const airQuality = {
      ...mapAirQuality(aqi),
      components: {
        pm25: components.pm2_5 ?? null,
        pm10: components.pm10  ?? null,
        co:   components.co    ?? null,
        no2:  components.no2   ?? null,
      },
    };

    const alerts = buildEnvironmentalAlerts({
      current,
      forecastList: forecastData.list,
      airQuality,
    });

    // ── INTEGRAÇÃO COM BD ──────────────────────────────────────────────────
    // Salva a consulta completa no SQLite (transação atômica).
    // Erros no BD são logados mas NÃO interrompem a resposta ao mobile.
    try {
      const consultaId = salvarConsulta({ current, alerts, airQuality });
      console.log(`[BD] Consulta #${consultaId} salva: ${current.name} (${aqi} AQI, ${alerts.length} alerta(s))`);
    } catch (dbErr) {
      console.error('[BD] Falha ao salvar consulta:', dbErr.message);
    }
    // ──────────────────────────────────────────────────────────────────────

    res.json({ city: current.name, airQuality, alerts });
  } catch (error) {
    next(error);
  }
});

// ─────────────────────────────────────────────────────────────
// ROTAS — BANCO DE DADOS / HISTÓRICO
// ─────────────────────────────────────────────────────────────

/**
 * Retorna o histórico das últimas consultas realizadas.
 * Query param: ?limit=N (padrão: 20, máximo: 100)
 */
router.get('/history', (req, res) => {
  const limite = Math.min(Number(req.query.limit) || 20, 100);
  const historico = buscarHistorico(limite);
  res.json({ total: historico.length, consultas: historico });
});

/**
 * Retorna estatísticas gerais do banco de dados.
 * ATENÇÃO: esta rota DEVE vir antes de /history/:city para que o Express
 * não interprete "stats" como parâmetro de cidade.
 */
router.get('/history/stats', (req, res) => {
  const stats = buscarEstatisticas();
  res.json(stats);
});

/**
 * Retorna o histórico de consultas para uma cidade específica.
 * Parâmetro de rota: /history/:city
 * Query param: ?limit=N (padrão: 10)
 */
router.get('/history/:city', (req, res) => {
  const city   = req.params.city?.trim();
  const limite = Math.min(Number(req.query.limit) || 10, 50);

  if (!city) return res.status(400).json({ error: 'Informe o nome da cidade na URL' });

  const historico = buscarHistoricoPorCidade(city, limite);
  res.json({ city, total: historico.length, consultas: historico });
});

export default router;
