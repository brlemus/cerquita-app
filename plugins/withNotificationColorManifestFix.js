const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

const CONFLICTING_META_DATA_NAME = 'com.google.firebase.messaging.default_notification_color';

/**
 * @react-native-firebase/messaging trae su propio AndroidManifest.xml
 * (node_modules/@react-native-firebase/messaging/android/src/main/AndroidManifest.xml)
 * con esta misma meta-data (fallback a @color/white cuando no hay
 * firebase.json). expo-notifications empieza a escribirla también apenas
 * se le pasa `color` en sus props -- dos manifests declarando la misma
 * clave con valores distintos rompe el manifest merger de Gradle
 * ("Run gradlew" -- ver docs/phases/phase-6-orders-tabs.md). El propio
 * error de Gradle sugiere el fix: `tools:replace="android:resource"` en
 * ese <meta-data> puntual, para que gane nuestro color de marca.
 *
 * `ensureToolsAvailable` es idempotente -- no asume que el manifest base
 * de Expo ya declara `xmlns:tools`, lo agrega solo si falta.
 *
 * Orden en `app.config.js`: este plugin va ANTES de `expo-notifications`
 * en el array `plugins`, no después -- verificado con un prebuild real
 * (no asumido): los mods `withAndroidManifest` de Expo se ejecutan en
 * orden INVERSO al de registro (el último registrado envuelve a los
 * anteriores y corre primero), así que para que esta meta-data ya exista
 * cuando este plugin corre, el suyo (expo-notifications) tiene que
 * registrarse DESPUÉS del nuestro.
 */
const withNotificationColorManifestFix = (config) => {
  return withAndroidManifest(config, (config) => {
    AndroidConfig.Manifest.ensureToolsAvailable(config.modResults);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    const index = AndroidConfig.Manifest.findMetaDataItem(
      mainApplication,
      CONFLICTING_META_DATA_NAME,
    );
    if (index !== -1) {
      mainApplication['meta-data'][index].$['tools:replace'] = 'android:resource';
    }

    return config;
  });
};

module.exports = withNotificationColorManifestFix;
