const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
// EAS Build solo sube al builder los archivos trackeados por git -- estos
// dos están gitignorados a propósito (ver docs/phases/phase-5-tracking.md).
// En la nube resuelven desde una env var de tipo file (el path que EAS
// deja en el runner); en local caen al archivo de la raíz del repo.
const googleServicesJson = process.env.GOOGLE_SERVICES_JSON ?? './google-services.json';
const googleServiceInfoPlist =
  process.env.GOOGLE_SERVICE_INFO_PLIST ?? './GoogleService-Info.plist';

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
    './plugins/withFirebaseForegroundPresentation',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Usamos tu ubicación para ubicar tu dirección de entrega y calcular el envío.',
      },
    ],
    [
      'expo-build-properties',
      {
        // Contingencia del Checkpoint C2 ya documentada (docs/phases/phase-5-tracking.md):
        // firebase-ios-sdk exige use_frameworks -- sin esto, pods Swift
        // como FirebaseCoreInternal no pueden generar module maps para
        // sus deps de Objective-C (GoogleUtilities). Solo iOS --
        // Android no tiene este concepto, no se toca.
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp', 'RNFBMessaging'],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    usesAppleSignIn: true,
    bundleIdentifier: 'sv.cerquita.app',
    googleServicesFile: googleServiceInfoPlist,
  },
  android: {
    package: 'sv.cerquita.app',
    googleServicesFile: googleServicesJson,
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
