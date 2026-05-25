import { Platform } from 'react-native';

const getDefaultHost = () => {
  if (Platform.OS === 'android') return '10.0.2.2';
  return 'localhost';
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || `http://${getDefaultHost()}:3001/api`;
