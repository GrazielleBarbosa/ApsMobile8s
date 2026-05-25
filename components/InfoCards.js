/**
 * InfoCards.js
 * Exibe 4 cards informativos: nascer/pôr do sol, qualidade do ar e vento.
 *
 * Props:
 *  - weather: object — dados do clima atual { sunrise, sunset, windSpeed }
 *  - airQuality: object | null — { index, label } ou null se indisponível
 */

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import styles from '../styles';

function Card({ icon, iconLib = 'ionicons', label, value }) {
  const IconComponent = iconLib === 'feather' ? Feather : Ionicons;
  return (
    <View style={styles.infoCard}>
      <IconComponent name={icon} size={22} color="#fff" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function InfoCards({ weather, airQuality }) {
  if (!weather) return null;

  const aqiText = airQuality
    ? `${airQuality.index} — ${airQuality.label}`
    : 'Indisponível';

  return (
    <>
      {/* Linha 1: Nascer e pôr do sol */}
      <View style={styles.infoRow}>
        <Card
          icon="sunny"
          label="Nascer do sol"
          value={weather.sunrise || '--'}
        />
        <Card
          icon="moon"
          label="Pôr do sol"
          value={weather.sunset || '--'}
        />
      </View>

      {/* Linha 2: Qualidade do ar e vento */}
      <View style={styles.infoRow}>
        <Card
          icon="activity"
          iconLib="feather"
          label="Qualidade do ar"
          value={aqiText}
        />
        <Card
          icon="speedometer-outline"
          label="Vento"
          value={`${weather.windSpeed ?? '--'} m/s`}
        />
      </View>
    </>
  );
}
