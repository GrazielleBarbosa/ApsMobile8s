/**
 * styles.js — Folha de estilos centralizada do APS Ambiental.
 *
 * Organização:
 *  1. Layout geral (container, loading, erros)
 *  2. Busca
 *  3. Cabeçalho meteorológico
 *  4. Previsão (forecast)
 *  5. Cards de informação
 *  6. Alertas ambientais
 *  7. Tela de detalhe de alerta (AlertDetailScreen)
 *  8. Navegação
 */

import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default StyleSheet.create({

  // ── 1. LAYOUT GERAL ──────────────────────────────────────────────────────────

  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(220,53,69,0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220,53,69,0.5)',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 14,
  },

  // ── 2. BUSCA ─────────────────────────────────────────────────────────────────

  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 25,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 4,
  },

  // ── 3. CABEÇALHO METEOROLÓGICO ───────────────────────────────────────────────

  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  city: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 5,
  },
  mainIcon: {
    width: width * 0.35,
    height: width * 0.35,
  },
  temp: {
    fontSize: 64,
    color: '#fff',
    fontWeight: 'bold',
  },
  description: {
    fontSize: 20,
    color: '#e0e0e0',
    textTransform: 'capitalize',
    marginBottom: 5,
  },
  range: {
    fontSize: 14,
    color: '#ddd',
  },

  // ── 4. PREVISÃO ───────────────────────────────────────────────────────────────

  sectionTitle: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 10,
    fontWeight: '500',
  },
  forecastScroll: {
    marginBottom: 20,
  },
  forecastCard: {
    width: 85,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    alignItems: 'center',
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  forecastDay: {
    color: '#fff',
    textTransform: 'capitalize',
    fontSize: 13,
    marginBottom: 4,
  },
  forecastIcon: {
    width: 48,
    height: 48,
  },
  forecastTemp: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  forecastRange: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 2,
  },

  // ── 5. CARDS DE INFORMAÇÃO ───────────────────────────────────────────────────

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  infoLabel: {
    color: '#ddd',
    marginTop: 8,
    fontSize: 13,
    textAlign: 'center',
  },
  infoValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 4,
    textAlign: 'center',
  },

  // ── 6. ALERTAS AMBIENTAIS ────────────────────────────────────────────────────

  alertCard: {
    flexDirection: 'row',
    // Nota: backgroundColor é definido dinamicamente em AlertCard.js
    // com base no nível do alerta. Este valor é o fallback.
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertLevel: {
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'capitalize',
    fontSize: 13,
    // cor definida dinamicamente em AlertCard.js
    color: '#ffe082',
  },
  alertMessage: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  alertMoreInfo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // ── 7. TELA DE DETALHE (AlertDetailScreen) ───────────────────────────────────

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 4,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  detailHeader: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 6,
  },
  detailLevel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailCity: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  detailCardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  detailCardText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 22,
  },
  detailRecommendation: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 24,
    marginBottom: 2,
  },

  // ── 8. RODAPÉ ────────────────────────────────────────────────────────────────

  footerNote: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },

  // ── 9. BARRA SUPERIOR (HomeScreen) ───────────────────────────────────────────
  // Envolve SearchBar + botão de histórico lado a lado

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,          // espaçamento abaixo de toda a barra de busca
  },
  // Versão inline do searchContainer (sem marginBottom próprio)
  searchBarInline: {
    flex: 1,
    marginBottom: 0,
  },
  historyButton: {
    marginLeft: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── 10. TELA DE HISTÓRICO (HistoryScreen) ────────────────────────────────────

  historyContainer: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 16,
  },
  historyHeaderBar: {
    marginBottom: 16,
  },
  historyTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
  },
  historyStatsText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginBottom: 4,
  },

  // Lista
  historyList: {
    paddingBottom: 40,
  },

  // Item individual
  historyItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCity: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  historyTimestamp: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    marginLeft: 8,
  },

  historyMeteo: {
    marginBottom: 8,
  },
  historyTemp: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  historyRange: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '400',
  },
  historyDesc: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    textTransform: 'capitalize',
    marginTop: 2,
  },

  historyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  historyAqi: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  historyAlertBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  historyAlertBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Estados especiais da HistoryScreen
  historyLoadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLoadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 12,
    fontSize: 14,
  },
  historyErrorArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  historyErrorText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  historyRetryButton: {
    marginTop: 20,
    backgroundColor: 'rgba(124,131,253,0.4)',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  historyRetryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  historyEmptyArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  historyEmptyText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  historyFooterNote: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
