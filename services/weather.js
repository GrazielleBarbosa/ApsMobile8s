/**
 * weather.js — Serviço de orquestração de dados meteorológicos.
 *
 * Responsabilidade: coordenar múltiplas chamadas à API intermediária em paralelo
 * e retornar um objeto unificado para as telas do aplicativo.
 *
 * Este serviço é a única camada que conhece a estrutura de resposta da API.
 * As telas apenas consomem o resultado sem saber de onde os dados vêm.
 */

import {
  fetchCurrentWeather,
  fetchForecast,
  fetchAirQuality,
  fetchEnvironmentalAlerts,
  checkApiHealth,
} from '../api';

/**
 * Carrega todos os dados necessários para o dashboard meteorológico.
 *
 * Executa 4 chamadas à API intermediária em paralelo (Promise.all),
 * minimizando o tempo total de espera.
 *
 * @param {string} city - Nome da cidade a consultar
 * @returns {Promise<{current, forecast, airQuality, alerts}>}
 * @throws {Error} Se a API não estiver acessível ou a cidade for inválida
 */
export async function loadWeatherDashboard(city) {
  const trimmed = city?.trim();
  if (!trimmed) {
    throw new Error('Digite o nome de uma cidade válida.');
  }

  // Verifica se o servidor intermediário está acessível antes de prosseguir
  await checkApiHealth().catch(() => {
    throw new Error(
      'Servidor intermediário não está respondendo.\n' +
      'Execute: npm run server (em outro terminal) e tente novamente.'
    );
  });

  // Executa todas as chamadas em paralelo para melhor performance
  const [current, forecastData, airQualityData, environmentData] = await Promise.all([
    fetchCurrentWeather(trimmed),
    fetchForecast(trimmed),
    fetchAirQuality(trimmed),
    fetchEnvironmentalAlerts(trimmed),
  ]);

  return {
    current,
    forecast:   forecastData.items ?? [],
    airQuality: airQualityData,
    alerts:     environmentData.alerts ?? [],
  };
}
