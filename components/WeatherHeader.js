/**
 * WeatherHeader.js
 * Exibe o resumo do clima atual: cidade, ícone, temperatura e detalhes.
 *
 * Props:
 *  - weather: object — dados do clima atual retornados pela API intermediária
 *    { name, temp, description, icon, max, min, humidity }
 */

import React from 'react';
import { View, Text, Image, Dimensions } from 'react-native';
import styles from '../styles';

const { width } = Dimensions.get('window');

export default function WeatherHeader({ weather }) {
  if (!weather) return null;

  const iconUri = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;

  return (
    <View style={styles.header} accessibilityLabel={`Clima em ${weather.name}`}>
      <Text style={styles.city}>{weather.name}</Text>

      <Image
        source={{ uri: iconUri }}
        style={styles.mainIcon}
        accessibilityLabel={`Ícone do tempo: ${weather.description}`}
      />

      <Text style={styles.temp} accessibilityLabel={`${weather.temp} graus Celsius`}>
        {weather.temp}°C
      </Text>

      <Text style={styles.description}>{weather.description}</Text>

      <Text style={styles.range}>
        Máx: {weather.max}° · Mín: {weather.min}° · Umidade: {weather.humidity}%
      </Text>
    </View>
  );
}
