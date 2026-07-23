import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

// RNFirebase exige registrar el background handler antes de que
// cualquier otra cosa corra -- Android ya muestra la notificación del
// payload nativo en background/quit sin código propio; este handler
// solo evita el warning de RNFirebase y deja lugar a lógica futura.
messaging().setBackgroundMessageHandler(async () => {});

// Sin esto, expo-notifications NO muestra nada mientras la app está en
// foreground -- ni un push real ni la notificación local que
// PushProvider dispara desde onMessage (comportamiento documentado:
// "the default behavior when the handler is not set... is not to show
// the notification"). Decisión de producto: se muestra siempre, en
// foreground también (docs/phases/phase-5-tracking.md).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// eslint-disable-next-line import/first -- intencional: debe cargar después de los handlers de arriba.
import 'expo-router/entry';
