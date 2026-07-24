import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking } from 'react-native';

import { getDevicePlatform } from '@/features/push/getDevicePlatform';
import { getFcmToken } from '@/features/push/getFcmToken';
import { useRegisterDevice } from '@/features/push/hooks/useRegisterDevice';

export type UseNotificationPermissionResult = {
  status: Notifications.PermissionStatus | null;
  canAskAgain: boolean;
  isGranted: boolean;
  refresh: () => Promise<void>;
  /** Pide el permiso si todavía es pedible; si no, manda a los ajustes del sistema. */
  requestOrOpenSettings: () => Promise<void>;
};

/**
 * Volver de los ajustes del sistema no dispara ningún evento propio -- sin
 * releer en cada foco, la fila de Perfil quedaría mostrando el estado
 * viejo. `wasGrantedRef` empieza en `null` (todavía no leímos nada) a
 * propósito: distingue "primera lectura, ya estaba concedido" (no hace
 * falta re-registrar, `PushProvider` ya lo hizo al loguearse) de una
 * transición real a `granted` en una lectura posterior -- la única que
 * dispara el registro del device, porque `PushProvider` solo intenta una
 * vez al autenticarse y corta si el permiso no estaba concedido en ese
 * momento.
 */
export function useNotificationPermission(): UseNotificationPermissionResult {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [canAskAgain, setCanAskAgain] = useState(true);
  const registerDevice = useRegisterDevice();
  const wasGrantedRef = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    const result = await Notifications.getPermissionsAsync();
    setStatus(result.status);
    setCanAskAgain(result.canAskAgain);

    const isGrantedNow = result.status === 'granted';
    const justGranted = wasGrantedRef.current === false && isGrantedNow;
    wasGrantedRef.current = isGrantedNow;
    if (!justGranted) {
      return;
    }

    const token = await getFcmToken();
    if (!token) {
      return;
    }
    registerDevice.mutate({ fcmToken: token, platform: getDevicePlatform() });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- registerDevice.mutate es estable (useMutation)
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const isGranted = status === 'granted';

  const requestOrOpenSettings = useCallback(async () => {
    if (!isGranted && canAskAgain) {
      await Notifications.requestPermissionsAsync();
      await refresh();
      return;
    }
    Linking.openSettings();
  }, [isGranted, canAskAgain, refresh]);

  return { status, canAskAgain, isGranted, refresh, requestOrOpenSettings };
}
