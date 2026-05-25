/**
 * HomeScreen.js — Tela principal do painel ambiental.
 *
 * CORREÇÕES aplicadas nesta refatoração:
 *
 * 1. BUG useCallback/useEffect:
 *    Antes: useCallback([city]) + useEffect([]) — dependência incorreta,
 *    React warning de hook, comportamento imprevisível ao re-renderizar.
 *    Depois: separação entre `inputCity` (campo de texto) e `activeCity`
 *    (cidade que dispara a busca). O useEffect depende de fetchWeather,
 *    que depende de activeCity — cadeia de dependências correta e sem warnings.
 *
 * 2. COMPONENTIZAÇÃO:
 *    O App.js monolítico de 180 linhas foi dividido em 5 componentes
 *    reutilizáveis: SearchBar, WeatherHeader, ForecastList, InfoCards, AlertCard.
 *
 * 3. NAVEGAÇÃO:
 *    Ao tocar em um AlertCard → navega para AlertDetailScreen.
 *    Ao tocar no ícone de relógio (histórico) → navega para HistoryScreen,
 *    que exibe as consultas anteriores armazenadas no banco de dados SQLite.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import styles from '../styles';
import { loadWeatherDashboard } from '../services/weather';

// Componentes extraídos do antigo App.js monolítico
import SearchBar    from '../components/SearchBar';
import WeatherHeader from '../components/WeatherHeader';
import ForecastList  from '../components/ForecastList';
import InfoCards     from '../components/InfoCards';
import AlertCard     from '../components/AlertCard';

export default function HomeScreen() {
  const navigation = useNavigation();

  // ── Estado ────────────────────────────────────────────────────────────────
  // CORREÇÃO: inputCity → o que o usuário está digitando (sem disparar busca)
  //           activeCity → a cidade que realmente aciona a API (muda só no submit)
  const [inputCity,  setInputCity]  = useState('São Paulo');
  const [activeCity, setActiveCity] = useState('São Paulo');

  const [weather,    setWeather]    = useState(null);
  const [forecast,   setForecast]   = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── Busca de dados ────────────────────────────────────────────────────────
  // CORREÇÃO: fetchWeather depende de activeCity (não de inputCity).
  // O useEffect abaixo depende de fetchWeather — cadeia correta.
  const fetchWeather = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await loadWeatherDashboard(activeCity);
      setWeather(data.current);
      setForecast(data.forecast);
      setAirQuality(data.airQuality?.airQuality ?? null);
      setAlerts(data.alerts);
    } catch (err) {
      setError(err.message);
      Alert.alert('Erro ao buscar dados', err.message, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  }, [activeCity]); // Recria apenas quando a cidade ativa muda

  // CORREÇÃO: useEffect agora lista fetchWeather como dependência — sem warnings
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = () => {
    const trimmed = inputCity.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase() === activeCity.toLowerCase()) {
      // Mesma cidade: força re-busca sem mudar activeCity
      fetchWeather();
    } else {
      // Nova cidade: atualiza activeCity, dispara useEffect → fetchWeather
      setActiveCity(trimmed);
    }
  };

  const handleAlertPress = (alert) => {
    navigation.navigate('AlertDetail', {
      alert,
      cityName: weather?.name ?? activeCity,
    });
  };

  const handleHistoryPress = () => {
    navigation.navigate('History');
  };

  // ── Loading inicial (sem dados ainda) ────────────────────────────────────
  if (loading && !weather) {
    return (
      <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Consultando API intermediária...</Text>
      </LinearGradient>
    );
  }

  // ── Renderização principal ────────────────────────────────────────────────
  return (
    <LinearGradient colors={['#6a11cb', '#2575fc']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        accessibilityLabel="Painel de monitoramento ambiental"
      >
        {/* Barra superior: busca + botão de histórico */}
        <View style={styles.topBar}>
          <SearchBar
            value={inputCity}
            onChangeText={setInputCity}
            onSubmit={handleSearch}
            loading={loading}
            containerStyle={styles.searchBarInline}
          />
          <TouchableOpacity
            onPress={handleHistoryPress}
            style={styles.historyButton}
            accessibilityLabel="Ver histórico de consultas"
          >
            <Ionicons name="time-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Banner de erro */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* Cabeçalho com temperatura atual */}
        <WeatherHeader weather={weather} />

        {/* Previsão de 7 dias com max/min reais */}
        <ForecastList forecast={forecast} />

        {/* Cards: nascer/pôr do sol, qualidade do ar, vento */}
        <InfoCards weather={weather} airQuality={airQuality} />

        {/* Alertas ambientais clicáveis */}
        <Text style={styles.sectionTitle}>Alertas ambientais</Text>
        {alerts.map((alert, index) => (
          <AlertCard
            key={`${alert.type}-${index}`}
            alert={alert}
            onPress={() => handleAlertPress(alert)}
          />
        ))}

        <Text style={styles.footerNote}>
          Dados obtidos via API intermediária → OpenWeatherMap (serviço destino).
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}
