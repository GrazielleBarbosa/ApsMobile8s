/**
 * openWeatherService.js
 * Cliente HTTP para a API OpenWeatherMap (Web Service de Destino).
 *
 * Responsabilidades:
 *  - Construir URLs autenticadas com a API key do servidor
 *  - Aplicar timeout de 10 segundos em todas as requisições
 *  - Mapear erros da API para códigos HTTP semânticos corretos
 *  - Garantir que a API key nunca seja exposta ao cliente mobile
 */

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE = 'https://api.openweathermap.org/data/2.5';
const TIMEOUT_MS = 10_000; // 10 segundos

/**
 * Realiza requisição HTTP com timeout via AbortController.
 *
 * CORREÇÃO 1: O status HTTP do erro agora reflete o código real da API
 *   (401, 404, 429, etc.) em vez de sempre retornar 404.
 *
 * CORREÇÃO 2: Adicionado timeout de 10s para evitar requisições pendentes
 *   indefinidamente caso o serviço externo não responda.
 *
 * NOTA sobre data.cod:
 *   - /weather  → retorna `cod` como número (200) ou string de erro ("404")
 *   - /forecast → retorna `cod` como string ("200") ou número de erro
 *   - /air_pollution → NÃO retorna `cod` em sucesso; retorna {list:[...]}
 *   O guard `data.cod !== undefined` protege o caso de air_pollution.
 */
async function request(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();

    if (data.cod !== undefined && String(data.cod) !== '200') {
      const codNumber = Number(data.cod);
      const error = new Error(data.message || 'Cidade não encontrada');
      // Preserva o código HTTP original da API (401, 404, 429…) ou usa 404 como fallback
      error.status = codNumber >= 400 && codNumber < 600 ? codNumber : 404;
      throw error;
    }

    if (!response.ok) {
      const message = data?.message || 'Erro ao consultar o serviço meteorológico';
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error(
        'O serviço meteorológico não respondeu a tempo. Tente novamente.'
      );
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function ensureApiKey() {
  if (!API_KEY) {
    const error = new Error(
      'OPENWEATHER_API_KEY não está configurada no servidor intermediário. ' +
      'Verifique o arquivo server/.env'
    );
    error.status = 503;
    throw error;
  }
}

export async function getCurrentWeather(city) {
  ensureApiKey();
  const url = `${BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  return request(url);
}

export async function getForecast(city) {
  ensureApiKey();
  const url = `${BASE}/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`;
  return request(url);
}

export async function getAirPollution(lat, lon) {
  ensureApiKey();
  const url = `${BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  return request(url);
}
