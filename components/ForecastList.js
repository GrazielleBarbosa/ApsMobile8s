/**
 * ForecastList.js
 * Lista horizontal com previsão de até 7 dias.
 *
 * MELHORIA: Agora exibe também tempMax e tempMin (quando disponíveis),
 * retornados pela nova lógica de agrupamento por dia do servidor.
 *
 * Props:
 *  - forecast: Array — lista de dias retornada por /weather/forecast
 *    [{ dt, temp, tempMax, tempMin, icon, description }]
 */

import React from 'react';
import { View, Text, Image, ScrollView } from 'react-native';
import styles from '../styles';

function formatWeekday(dt) {
  return new Date(dt * 1000).toLocaleDateString('pt-BR', { weekday: 'short' });
}

export default function ForecastList({ forecast }) {
  if (!forecast || forecast.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Previsão 7 dias</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.forecastScroll}
        accessibilityLabel="Previsão do tempo para os próximos 7 dias"
      >
        {forecast.map((day) => (
          <View key={day.dt} style={styles.forecastCard}>
            <Text style={styles.forecastDay}>{formatWeekday(day.dt)}</Text>

            <Image
              source={{
                uri: `https://openweathermap.org/img/wn/${day.icon}@2x.png`,
              }}
              style={styles.forecastIcon}
              accessibilityLabel={day.description}
            />

            <Text style={styles.forecastTemp}>{day.temp}°C</Text>

            {/* Máxima e mínima reais do dia (nova funcionalidade) */}
            {day.tempMax !== undefined && day.tempMin !== undefined && (
              <Text style={styles.forecastRange}>
                {day.tempMax}° / {day.tempMin}°
              </Text>
            )}
          </View>
        ))}
      </ScrollView>
    </>
  );
}
