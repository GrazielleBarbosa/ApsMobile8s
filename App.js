/**
 * App.js — Container de navegação do APS Ambiental.
 *
 * REFATORAÇÃO: O App.js anterior era monolítico (~180 linhas) com estado,
 * lógica de busca, rendering de dados e estilos todos misturados em um
 * único componente — violação direta do princípio Single Responsibility.
 *
 * Agora:
 *  - App.js: APENAS configura o NavigationContainer + Stack.Navigator
 *  - HomeScreen.js: tela principal (dashboard meteorológico)
 *  - AlertDetailScreen.js: tela de detalhe de alertas ambientais
 *  - HistoryScreen.js: histórico de consultas (integração com BD SQLite)
 *
 * Fluxo de navegação:
 *   HomeScreen ──[toque no alerta]──► AlertDetailScreen
 *   HomeScreen ──[ícone histórico]──► HistoryScreen
 *   AlertDetailScreen ──[voltar]────► HomeScreen
 *   HistoryScreen ──────[voltar]────► HomeScreen
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen        from './screens/HomeScreen';
import AlertDetailScreen from './screens/AlertDetailScreen';
import HistoryScreen     from './screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          // Header nativo desativado — cada tela gerencia seu próprio layout
          headerShown: false,
          // Animação de slide horizontal (padrão iOS/Android)
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'APS Ambiental' }}
        />
        <Stack.Screen
          name="AlertDetail"
          component={AlertDetailScreen}
          options={{ title: 'Detalhe do Alerta' }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{ title: 'Histórico de Consultas' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
