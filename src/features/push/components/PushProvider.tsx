import { useAuth } from '@clerk/clerk-expo';
import messaging from '@react-native-firebase/messaging';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { useEffect, type PropsWithChildren } from 'react';

import { getDevicePlatform } from '../getDevicePlatform';
import { getFcmToken } from '../getFcmToken';
import { useRegisterDevice } from '../hooks/useRegisterDevice';
import { parseNotificationData } from '../utils/parseNotificationData';

/**
 * Listeners y orquestación de push, montado en `app/_layout.tsx` dentro
 * de `ClerkProvider`. El registro reactivo (permiso ya concedido de una
 * sesión anterior) corre en ambas plataformas desde el Checkpoint C2
 * (Apple Developer aprobado, APNs key lista -- ver
 * docs/phases/phase-5-tracking.md). Los listeners de RNFirebase ya eran
 * uniformes entre plataformas desde el Checkpoint C.
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
        const { status } = await Notifications.getPermissionsAsync();
        if (__DEV__) {
          console.log('[push] registro silencioso -- permission status:', status);
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
                console.log('[push] registerDevice (silencioso) falló:', error);
              }
            },
          },
        );
      } catch (error) {
        // Este bloque no tenía try/catch -- cualquier excepción acá
        // quedaba como unhandled rejection, invisible, sin romper la app
        // pero también sin dejar rastro (bug real de diagnosticabilidad,
        // ver docs/phases/phase-5-tracking.md).
        if (__DEV__) {
          console.log('[push] registro silencioso -- excepción:', error);
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
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification?.title ?? 'Tu pedido cambió de estado',
          body: remoteMessage.notification?.body,
          data: remoteMessage.data,
        },
        trigger: null,
      });
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
