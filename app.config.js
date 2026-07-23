const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'Cerquita',
  slug: 'cerquita-app',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'cerquita',
  userInterfaceStyle: 'light',
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-web-browser',
    'expo-apple-authentication',
    'expo-image',
    'expo-splash-screen',
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    'expo-notifications',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Usamos tu ubicación para ubicar tu dirección de entrega y calcular el envío.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    usesAppleSignIn: true,
    bundleIdentifier: 'com.cerquita.app',
  },
  android: {
    package: 'com.cerquita.app',
  },
  extra: {
    apiUrl,
    clerkPublishableKey,
    eas: {
      projectId: '9161baf9-5060-4703-b3c4-cde39f15c082',
    },
  },
};

module.exports = config;
