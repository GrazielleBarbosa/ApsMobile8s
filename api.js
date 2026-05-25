/**
 * api.js — Camada de comunicação entre o app mobile e a API intermediária.
 *
 * Responsabilidades:
 *  - Construir URLs a partir da configuração centralizada
 *  - Aplicar timeout de 15s nas requisições (evita loading infinito)
 *  - Normalizar erros de rede em mensagens amigáveis em português
 *  - Nunca expor detalhes internos do servidor ao usuário final
 */

import { API_BASE_URL } from './config/apiConfig';

const TIMEOUT_MS = 15_000; // 15 segundos — considera latência de rede mobile

/**
 * Realiza uma requisição GET com timeout para a API intermediária.
 * @param {string} path   - Caminho do endpoint (ex: '/weather/current')
 * @param {object} query  - Parâmetros de query string (ex: { city: 'São Paulo' })
 */
async function request(path, query = {}) {
  const params = new URLSearchParams(query).toString();
  const url = `${API_BASE_URL}${path}${params ? `?${params}` : ''}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro ${response.status} na API intermediária`);
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'A requisição demorou muito. Verifique sua conexão com a internet.'
      );
    }

    // TypeError geralmente indica falha de rede (servidor não está rodando)
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        'Não foi possível conectar à API intermediária. ' +
        'Verifique se o servidor está em execução (npm run server).'
      );
    }

    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Funções de acesso aos endpoints ───────────────────────────────────────

/** Clima atual de uma cidade */
export const fetchCurrentWeather = (city) =>
  request('/weather/current', { city });

/** Previsão de 7 dias (temperatura média, máxima e mínima por dia) */
export const fetchForecast = (city) =>
  request('/weather/forecast', { city });

/** Qualidade do ar e componentes atmosféricos */
export const fetchAirQuality = (city) =>
  request('/environment/air-quality', { city });

/** Alertas ambientais gerados a partir das condições climáticas */
export const fetchEnvironmentalAlerts = (city) =>
  request('/environment/alerts', { city });

/** Verifica se a API intermediária está acessível */
export const checkApiHealth = () =>
  request('/health');

// ─── Endpoints de Banco de Dados / Histórico ───────────────────────────────

/**
 * Retorna as últimas N consultas salvas no banco de dados.
 * @param {number} limit - Número máximo de registros (padrão: 20)
 */
export const fetchHistory = (limit = 20) =>
  request('/history', { limit });

/**
 * Retorna o histórico de consultas de uma cidade específica.
 * @param {string} city  - Nome da cidade
 * @param {number} limit - Número máximo de registros (padrão: 10)
 */
export const fetchHistoryByCity = (city, limit = 10) =>
  request(`/history/${encodeURIComponent(city)}`, { limit });

/** Retorna estatísticas gerais do banco (total de consultas, cidades únicas) */
export const fetchHistoryStats = () =>
  request('/history/stats');
