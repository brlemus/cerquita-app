const { withInfoPlist } = require('expo/config-plugins');

const FOREGROUND_PRESENTATION_OPTIONS = ['banner', 'list', 'sound'];

/**
 * Sin `firebase.json`, `RNFBMessagingUNUserNotificationCenter` (RNFB
 * messaging, iOS) resuelve `messaging_ios_foreground_presentation_options`
 * a `[]` y responde `willPresent` con opciones vacías -- eso gana la
 * carrera contra la aprobación async del handler de expo-notifications
 * (docs/phases/phase-5-tracking.md, diagnóstico foreground iOS).
 *
 * Bajo Expo prebuild, `firebase.json` no se inyecta (el mecanismo real es
 * el Run Script `ios_config.sh` de un proyecto RN bare, que prebuild nunca
 * ejecuta) -- así que en vez de depender de ese archivo, esta plugin fija
 * directamente la clave final de Info.plist que `RNFBJSON.m` lee
 * (`firebase_json_raw`: JSON en base64, verificado contra el código
 * instalado de `@react-native-firebase/app` -- NO es la forma anidada
 * `{"react-native": {...}}` del `firebase.json` de un proyecto bare, esa
 * capa ya la saca `ios_config.sh` antes de codificar).
 */
const withFirebaseForegroundPresentation = (config) => {
  return withInfoPlist(config, (config) => {
    const firebaseJson = {
      messaging_ios_foreground_presentation_options: FOREGROUND_PRESENTATION_OPTIONS,
    };
    config.modResults.firebase_json_raw = Buffer.from(
      JSON.stringify(firebaseJson),
      'utf-8',
    ).toString('base64');
    return config;
  });
};

module.exports = withFirebaseForegroundPresentation;
