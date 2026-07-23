import messaging from '@react-native-firebase/messaging';

import 'expo-router/entry';

// RNFirebase exige registrar el background handler antes de que
// cualquier otra cosa corra -- Android ya muestra la notificación del
// payload nativo en background/quit sin código propio; este handler
// solo evita el warning de RNFirebase y deja lugar a lógica futura.
messaging().setBackgroundMessageHandler(async () => {});
