/**
 * environmentAlerts.js
 * Lógica de negócio para geração de alertas ambientais.
 *
 * Os dados da OpenWeatherMap são usados como indicadores proxy para
 * riscos ambientais urbanos, conforme requisitado pelo enunciado da APS:
 *   - Poluição do ar (via AQI)
 *   - Áreas de alagamento e inundações (via precipitação + umidade)
 *   - Invasões/degradação de mananciais (via condições de seca severa)
 *   - Desmatamento / risco de incêndio (via temperatura + umidade baixa)
 *   - Inversão térmica (via amplitude térmica + vento + umidade)
 */

const AQI_LABELS = {
  1: 'Boa',
  2: 'Razoável',
  3: 'Moderada',
  4: 'Ruim',
  5: 'Péssima',
};

/**
 * Mapeia o índice AQI (1-5) para um objeto descritivo.
 * @param {number|null} aqi
 */
export function mapAirQuality(aqi) {
  return {
    index: aqi,
    label: AQI_LABELS[aqi] ?? 'Indisponível',
  };
}

/**
 * Constrói a lista de alertas ambientais com base nos dados meteorológicos.
 *
 * @param {object} params
 * @param {object} params.current      - Resposta bruta do endpoint /weather
 * @param {Array}  params.forecastList - Lista de items do endpoint /forecast
 * @param {object} params.airQuality   - Resultado de mapAirQuality()
 * @returns {Array} Lista de alertas com type, level e message
 */
export function buildEnvironmentalAlerts({ current, forecastList, airQuality }) {
  const alerts = [];

  // Extrai métricas com valores padrão seguros
  const humidity  = current?.main?.humidity ?? 0;
  const wind      = current?.wind?.speed    ?? 0;
  const temp      = current?.main?.temp     ?? 0;
  const tempMax   = current?.main?.temp_max ?? 0;
  const tempMin   = current?.main?.temp_min ?? 0;
  const tempRange = tempMax - tempMin;

  // Descrições climáticas das próximas 24h (8 intervalos de 3h)
  const nextDescriptions = (forecastList ?? [])
    .slice(0, 8)
    .map((item) => (item.weather?.[0]?.main ?? '').toLowerCase());

  const hasRain  = nextDescriptions.some((d) => d.includes('rain') || d.includes('drizzle'));
  const hasStorm = nextDescriptions.some((d) => d.includes('thunder') || d.includes('storm'));

  // ── POLUIÇÃO DO AR ──────────────────────────────────────────────────────────
  // AQI 4 = "Ruim" | AQI 5 = "Péssima"
  if ((airQuality?.index ?? 0) >= 4) {
    alerts.push({
      type: 'poluicao_ar',
      level: 'alto',
      message:
        `Qualidade do ar ${airQuality.label} (AQI ${airQuality.index}). ` +
        'Evite atividades físicas ao ar livre. Grupos sensíveis (crianças, ' +
        'idosos, pessoas com asma) devem permanecer em ambientes fechados.',
    });
  } else if (airQuality?.index === 3) {
    alerts.push({
      type: 'poluicao_ar',
      level: 'moderado',
      message:
        `Poluição do ar moderada (AQI ${airQuality.index}). ` +
        'Grupos sensíveis devem reduzir esforços físicos externos prolongados.',
    });
  }

  // ── ALAGAMENTO / INUNDAÇÃO ──────────────────────────────────────────────────
  // Chuva prevista + umidade elevada = risco de escoamento insuficiente
  if (hasRain && humidity >= 75) {
    alerts.push({
      type: 'alagamento',
      level: hasStorm ? 'alto' : 'moderado',
      message: hasStorm
        ? `Tempestade prevista com umidade de ${humidity}%. Risco elevado de ` +
          'alagamentos e inundações. Evite áreas baixas, próximas a rios e córregos.'
        : `Chuva prevista com umidade de ${humidity}%. Atenção a pontos de ` +
          'alagamento em áreas com baixo escoamento pluvial.',
    });
  }

  // ── INVERSÃO TÉRMICA ────────────────────────────────────────────────────────
  // Amplitude baixa + alta umidade + vento fraco = poluentes presos próximo ao solo
  if (tempRange <= 4 && humidity >= 70 && wind < 2.5) {
    alerts.push({
      type: 'inversao_termica',
      level: 'moderado',
      message:
        `Condições favoráveis à inversão térmica: amplitude térmica de ${tempRange.toFixed(1)}°C, ` +
        `umidade de ${humidity}% e vento de ${wind} m/s. ` +
        'Poluentes tendem a se concentrar próximo ao solo. Evite exercícios ao ar livre nas primeiras horas da manhã.',
    });
  }

  // ── MANANCIAIS ──────────────────────────────────────────────────────────────
  // CORREÇÃO: O alerta original descrevia apenas "evaporação" — tema distinto de
  // "invasões de mananciais" do enunciado. A lógica agora usa seca severa como
  // indicador de período crítico para a conservação e proteção hídrica, que é
  // quando mananciais ficam mais vulneráveis a degradação e uso irregular.
  if (humidity < 35 && wind > 5) {
    alerts.push({
      type: 'mananciais',
      level: 'moderado',
      message:
        `Período crítico de seca: umidade de ${humidity}% e ventos de ${wind.toFixed(1)} m/s. ` +
        'Condições que favorecem degradação e uso irregular de áreas de mananciais. ' +
        'Economize água e evite atividades poluentes próximas a fontes hídricas.',
    });
  }

  // ── DESMATAMENTO / RISCO DE INCÊNDIO ───────────────────────────────────────
  // Temperatura alta + umidade baixa = condições críticas para propagação de fogo
  if (temp >= 32 && humidity < 40) {
    alerts.push({
      type: 'desmatamento',
      level: humidity < 25 ? 'alto' : 'informativo',
      message:
        `Clima crítico: ${temp.toFixed(1)}°C e umidade de ${humidity}%. ` +
        'Alto risco de incêndios em vegetação. Não realize queimadas. ' +
        'Reporte focos de incêndio ao Corpo de Bombeiros (193).',
    });
  }

  // ── FALLBACK ────────────────────────────────────────────────────────────────
  if (alerts.length === 0) {
    alerts.push({
      type: 'geral',
      level: 'baixo',
      message:
        'Nenhum alerta ambiental crítico identificado para as condições atuais. ' +
        'Clima favorável para atividades ao ar livre.',
    });
  }

  return alerts;
}

export { AQI_LABELS };
