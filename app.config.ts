/// <reference types="node" />
import type { ExpoConfig } from 'expo/config';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const config: ExpoConfig = {
  name: 'Cerquita',
  slug: 'cerquita-app',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'cerquita',
  userInterfaceStyle: 'light',
  plugins: ['expo-router', 'expo-font'],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiUrl,
  },
};

export default config;
