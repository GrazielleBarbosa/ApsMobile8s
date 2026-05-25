/**
 * AlertCard.js
 * Card clicável de alerta ambiental com cor dinâmica por nível de severidade.
 *
 * CORREÇÃO: A versão anterior tinha cor fixa (rgba(255,255,255,0.15)) e texto
 * amarelo (#ffe082) para todos os alertas, independentemente do nível.
 * Agora cada nível tem cor de fundo e cor de texto distintas.
 *
 * MELHORIA: O card é TouchableOpacity — ao tocar, navega para AlertDetailScreen.
 *
 * Props:
 *  - alert: object — { type, level, message }
 *  - onPress: function — callback de navegação para a tela de detalhes
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

// Ícone por tipo de alerta ambiental
const ALERT_ICONS = {
  poluicao_ar:     'cloud-outline',
  alagamento:      'water-outline',
  inversao_termica:'thermometer-outline',
  mananciais:      'beaker-outline',
  desmatamento:    'leaf-outline',
  geral:           'information-circle-outline',
};

// Cor de fundo do card por nível de severidade
const LEVEL_BG = {
  alto:       'rgba(220,53,69,0.35)',    // vermelho
  moderado:   'rgba(255,193,7,0.25)',    // amarelo
  informativo:'rgba(13,202,240,0.2)',    // azul claro
  baixo:      'rgba(25,135,84,0.2)',     // verde
};

// Cor do rótulo de nível por severidade
const LEVEL_TEXT = {
  alto:       '#ff6b6b',
  moderado:   '#ffd93d',
  informativo:'#74c0fc',
  baixo:      '#69db7c',
};

export default function AlertCard({ alert, onPress }) {
  const bgColor   = LEVEL_BG[alert.level]   ?? 'rgba(255,255,255,0.15)';
  const textColor = LEVEL_TEXT[alert.level] ?? '#ffe082';
  const iconName  = ALERT_ICONS[alert.type] ?? 'alert-circle-outline';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.alertCard, { backgroundColor: bgColor }]}
      activeOpacity={0.75}
      accessibilityLabel={`Alerta nível ${alert.level}: ${alert.message}`}
      accessibilityRole="button"
      accessibilityHint="Toque para ver detalhes e recomendações"
    >
      <Ionicons name={iconName} size={24} color="#fff" />

      <View style={styles.alertContent}>
        <Text style={[styles.alertLevel, { color: textColor }]}>
          Nível: {alert.level}
        </Text>
        <Text style={styles.alertMessage}>{alert.message}</Text>
        <Text style={styles.alertMoreInfo}>Toque para ver detalhes →</Text>
      </View>
    </TouchableOpacity>
  );
}
