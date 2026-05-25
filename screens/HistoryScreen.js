/**
 * HistoryScreen.js — Tela de histórico de consultas (Banco de Dados).
 *
 * Integração com BD (disciplina de Banco de Dados):
 *   Consome o endpoint GET /api/history da API intermediária, que por sua
 *   vez consulta o SQLite via JOIN entre as tabelas:
 *     - consultas       (dados climáticos de cada busca)
 *     - alertas         (alertas gerados — N:1 por consulta)
 *     - qualidade_ar    (índice AQI — 1:1 por consulta)
 *
 * Justificativa arquitetural:
 *   O banco de dados está no SERVIDOR (camada intermediária), não no mobile.
 *   O app apenas faz uma chamada REST para obter os dados — correta separação
 *   de responsabilidades em um sistema distribuído de 3 camadas.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import styles from '../styles';
import { fetchHistory, fetchHistoryStats } from '../api';

// ── Utilitários ────────────────────────────────────────────────────────────

/** Formata timestamp ISO do SQLite em string legível em PT-BR */
function formatTimestamp(ts) {
  if (!ts) return '—';
  const d = new Date(ts.replace(' ', 'T'));
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/** Retorna cor de fundo de acordo com o nível do alerta mais grave */
function getBadgeColor(nivel) {
  switch (nivel) {
    case 'alto':        return 'rgba(220,53,69,0.8)';
    case 'moderado':    return 'rgba(255,193,7,0.8)';
    case 'informativo': return 'rgba(13,202,240,0.8)';
    default:            return 'rgba(100,100,100,0.6)';
  }
}

/** Ícone do índice AQI */
function aqiIcon(label) {
  switch (label) {
    case 'Boa':         return '🟢';
    case 'Moderada':    return '🟡';
    case 'Ruim':        return '🟠';
    case 'Muito Ruim':  return '🔴';
    case 'Péssima':     return '🟣';
    default:            return '⚪';
  }
}

// ── Componente de item da lista ────────────────────────────────────────────

function HistoryItem({ item }) {
  // Alerta de nível mais grave primeiro (para destacar no badge)
  const nivelOrder = { alto: 0, moderado: 1, informativo: 2, baixo: 3 };
  const alertaMaisGrave = item.alertas?.slice()
    .sort((a, b) => (nivelOrder[a.nivel] ?? 9) - (nivelOrder[b.nivel] ?? 9))[0];

  return (
    <View style={styles.historyItem}>
      {/* Linha 1: cidade + país + timestamp */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyCity}>
          📍 {item.cidade}{item.pais ? `, ${item.pais}` : ''}
        </Text>
        <Text style={styles.historyTimestamp}>{formatTimestamp(item.timestamp)}</Text>
      </View>

      {/* Linha 2: temperatura + descrição */}
      <View style={styles.historyMeteo}>
        <Text style={styles.historyTemp}>
          🌡 {item.temp != null ? `${item.temp.toFixed(1)}°C` : '—'}
          {'  '}
          <Text style={styles.historyRange}>
            ↑{item.temp_max?.toFixed(1)}° ↓{item.temp_min?.toFixed(1)}°
          </Text>
        </Text>
        {item.descricao ? (
          <Text style={styles.historyDesc}>{item.descricao}</Text>
        ) : null}
      </View>

      {/* Linha 3: qualidade do ar + badge de alertas */}
      <View style={styles.historyFooter}>
        {item.qualidade_ar?.aqi_label ? (
          <Text style={styles.historyAqi}>
            {aqiIcon(item.qualidade_ar.aqi_label)} Ar: {item.qualidade_ar.aqi_label}
          </Text>
        ) : (
          <Text style={styles.historyAqi}>⚪ Ar: —</Text>
        )}

        {item.alertas?.length > 0 ? (
          <View style={[
            styles.historyAlertBadge,
            { backgroundColor: getBadgeColor(alertaMaisGrave?.nivel) },
          ]}>
            <Text style={styles.historyAlertBadgeText}>
              ⚠ {item.alertas.length} alerta{item.alertas.length !== 1 ? 's' : ''}
            </Text>
          </View>
        ) : (
          <View style={[styles.historyAlertBadge, { backgroundColor: 'rgba(25,135,84,0.7)' }]}>
            <Text style={styles.historyAlertBadgeText}>✓ Sem alertas</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Tela principal ─────────────────────────────────────────────────────────

export default function HistoryScreen() {
  const navigation = useNavigation();

  const [consultas,   setConsultas]   = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);

  // ── Busca de dados ─────────────────────────────────────────────────────
  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [histResponse, statsResponse] = await Promise.all([
        fetchHistory(30),
        fetchHistoryStats(),
      ]);
      setConsultas(histResponse.consultas ?? []);
      setStats(statsResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Renderização ───────────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={styles.historyContainer}>

      {/* Cabeçalho */}
      <View style={styles.historyHeaderBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Voltar para a tela principal"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.historyTitle}>Histórico de Consultas</Text>

        {/* Estatísticas do BD */}
        {stats && (
          <Text style={styles.historyStatsText}>
            🗄 {stats.totalConsultas} consulta{stats.totalConsultas !== 1 ? 's' : ''}
            {'  ·  '}
            🌍 {stats.cidadesUnicas} cidade{stats.cidadesUnicas !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {/* Conteúdo */}
      {loading && !refreshing ? (
        <View style={styles.historyLoadingArea}>
          <ActivityIndicator size="large" color="#7c83fd" />
          <Text style={styles.historyLoadingText}>Consultando banco de dados...</Text>
        </View>
      ) : error ? (
        <View style={styles.historyErrorArea}>
          <Ionicons name="alert-circle-outline" size={48} color="rgba(220,53,69,0.8)" />
          <Text style={styles.historyErrorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => loadData()}
            style={styles.historyRetryButton}
          >
            <Text style={styles.historyRetryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : consultas.length === 0 ? (
        <View style={styles.historyEmptyArea}>
          <Ionicons name="time-outline" size={64} color="rgba(255,255,255,0.3)" />
          <Text style={styles.historyEmptyText}>
            Nenhuma consulta registrada ainda.{'\n'}
            Busque uma cidade na tela principal.
          </Text>
        </View>
      ) : (
        <FlatList
          data={consultas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <HistoryItem item={item} />}
          contentContainerStyle={styles.historyList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              tintColor="#7c83fd"
              colors={['#7c83fd']}
            />
          }
          ListFooterComponent={
            <Text style={styles.historyFooterNote}>
              Dados armazenados localmente no servidor (SQLite).{'\n'}
              Puxe para baixo para atualizar.
            </Text>
          }
        />
      )}
    </LinearGradient>
  );
}
