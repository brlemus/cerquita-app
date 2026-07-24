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
  icon: './assets/icon.png',
  plugins: [
    'expo-router',
    'expo-font',
    'expo-secure-store',
    'expo-web-browser',
    'expo-apple-authentication',
    'expo-image',
    [
      'expo-splash-screen',
      {
        // splash-8b (dirección "sticker + ruta") -- pieza full-bleed
        // 1080x2340, no un glifo chico centrado. `imageWidth` grande a
        // propósito: `contain` se auto-ajusta al alto real de cada
        // pantalla, y el fondo #6C4CF1 (igual al del propio arte) hace
        // invisible cualquier letterbox.
        image: './assets/splash.png',
        backgroundColor: '#6C4CF1',
        resizeMode: 'contain',
        imageWidth: 400,
      },
    ],
    '@react-native-firebase/app',
    '@react-native-firebase/messaging',
    // Va antes de expo-notifications a propósito -- los mods de manifest
    // corren en orden inverso al de registro (ver comentario del plugin).
    './plugins/withNotificationColorManifestFix',
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#6C4CF1',
      },
    ],
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
    infoPlist: {
      // Default estático (rige antes de que JS monte y corra el
      // StatusBar.setBarStyle de SignInScreen) -- la primera pantalla
      // real de un usuario deslogueado es el login violeta, no blanca.
      // UIViewControllerBasedStatusBarAppearance ya está en `false` por
      // el template base de Expo (confirmado con un prebuild real), así
      // que esto es el único punto que faltaba para cerrar la ventana
      // splash-nativo→JS sin íconos oscuros invisibles sobre violeta.
      UIStatusBarStyle: 'UIStatusBarStyleLightContent',
    },
  },
  android: {
    package: 'sv.cerquita.app',
    googleServicesFile: googleServicesJson,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      monochromeImage: './assets/adaptive-icon-monochrome.png',
      backgroundColor: '#6C4CF1',
    },
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
