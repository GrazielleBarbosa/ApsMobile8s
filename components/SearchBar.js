/**
 * SearchBar.js
 * Componente de busca por cidade.
 *
 * Props:
 *  - value: string — texto atual do campo
 *  - onChangeText: function — callback ao digitar
 *  - onSubmit: function — callback ao pressionar Enter ou o botão de busca
 *  - loading: boolean — exibe spinner em vez do botão durante carregamento
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from '../styles';

export default function SearchBar({ value, onChangeText, onSubmit, loading = false, containerStyle }) {
  return (
    <View style={[styles.searchContainer, containerStyle]}>
      <Ionicons
        name="search-outline"
        size={22}
        color="#fff"
        style={{ marginRight: 8 }}
      />
      <TextInput
        placeholder="Buscar cidade..."
        placeholderTextColor="rgba(255,255,255,0.6)"
        value={value}
        onChangeText={onChangeText}
        style={styles.searchInput}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCorrect={false}
        accessibilityLabel="Campo de busca por cidade"
        accessibilityHint="Digite o nome de uma cidade e pressione buscar"
      />
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <TouchableOpacity
          onPress={onSubmit}
          accessibilityLabel="Buscar clima"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-forward-circle" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}
