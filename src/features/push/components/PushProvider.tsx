import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@clerk/clerk-expo';
import messaging from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { getDevicePlatform } from '../getDevicePlatform';
import { getFcmToken } from '../getFcmToken';
import { useRegisterDevice } from '../hooks/useRegisterDevice';
import { parseNotificationData } from '../utils/parseNotificationData';
import { shouldRequestPermission } from '../utils/shouldRequestPermission';

const PERMISSION_REQUEST_ATTEMPTED_KEY = 'push_permission_requested';

/**
 * Listeners y orquestación de push, montado en `app/_layout.tsx` dentro
 * de `ClerkProvider`. Corre en ambas plataformas desde el Checkpoint C2
 * (Apple Developer aprobado, APNs key lista).
 *
 * Permiso: sin tarjeta intermedia (decisión de producto, patrón
 * WhatsApp/Instagram -- docs/phases/phase-5-tracking.md). Al
 * autenticarse, una sola vez por instalación (no por login), si el
 * permiso es pedible se dispara el diálogo nativo directo; si concede,
 * el mismo registro de acá abajo sigue. Sesiones siguientes con permiso
 * ya concedido: registro silencioso, sin volver a preguntar nada.
 */
export function PushProvider({ children }: PropsWithChildren) {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const registerDevice = useRegisterDevice();

  useEffect(() => {
    if (!isSignedIn) {
      return;
    }
    (async () => {
      try {
        const [{ status: currentStatus, canAskAgain }, attempted] = await Promise.all([
          Notifications.getPermissionsAsync(),
          AsyncStorage.getItem(PERMISSION_REQUEST_ATTEMPTED_KEY),
        ]);

        let status = currentStatus;
        if (shouldRequestPermission(status, canAskAgain, attempted)) {
          await AsyncStorage.setItem(PERMISSION_REQUEST_ATTEMPTED_KEY, '1');
          ({ status } = await Notifications.requestPermissionsAsync());
        }

        if (status !== 'granted') {
          return;
        }
        const token = await getFcmToken();
        if (!token) {
          return;
        }
        registerDevice.mutate(
          { fcmToken: token, platform: getDevicePlatform() },
          {
            onError: (error) => {
              if (__DEV__) {
                console.log('[push] registerDevice falló:', error);
              }
            },
          },
        );
      } catch (error) {
        if (__DEV__) {
          console.log('[push] registro -- excepción:', error);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registerDevice (mutate) es estable por identidad de useMutation, no hace falta como dep
  }, [isSignedIn]);

  useEffect(() => {
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        const parsed = parseNotificationData(
          remoteMessage?.data as Record<string, string> | undefined,
        );
        if (parsed) {
          router.push(`/orders/${parsed.orderId}`);
        }
      });

    return messaging().onNotificationOpenedApp((remoteMessage) => {
      const parsed = parseNotificationData(
        remoteMessage.data as Record<string, string> | undefined,
      );
      if (parsed) {
        router.push(`/orders/${parsed.orderId}`);
      }
    });
  }, [router]);

  useEffect(() => {
    return messaging().onMessage(async (remoteMessage) => {
      const parsed = parseNotificationData(
        remoteMessage.data as Record<string, string> | undefined,
      );
      if (!parsed) {
        return;
      }
      if (Platform.OS === 'ios') {
        // iOS presenta la remota sola vía RNFB (delegate de
        // UNUserNotificationCenter con las opciones de foreground
        // inyectadas por Info.plist -- plugins/withFirebaseForegroundPresentation.js).
        // Reprogramarla acá duplicaría el banner.
        return;
      }
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification?.title ?? 'Tu pedido cambió de estado',
            body: remoteMessage.notification?.body,
            data: remoteMessage.data,
          },
          trigger: null,
        });
      } catch (error) {
        if (__DEV__) {
          console.log('[push] onMessage -- scheduleNotificationAsync falló:', error);
        }
      }
    });
  }, []);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const parsed = parseNotificationData(
        response.notification.request.content.data as Record<string, string> | undefined,
      );
      if (parsed) {
        router.push(`/orders/${parsed.orderId}`);
      }
    });
    return () => subscription.remove();
  }, [router]);

  return <>{children}</>;
}
