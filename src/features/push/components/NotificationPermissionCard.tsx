import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing, Text } from '@/shared/ui';
import { getFcmToken } from '../getFcmToken';
import { useRegisterDevice } from '../hooks/useRegisterDevice';

const PROMPTED_FLAG_KEY = 'push_permission_prompted';

/**
 * Tarjeta de contexto (Store readiness, plan maestro): el permiso se
 * pide con un beneficio concreto a la vista, nunca en cold start. Se
 * muestra como mucho una vez -- ni de nuevo en el siguiente pedido si el
 * usuario tocó "Ahora no" o ya se le preguntó (ver PROMPTED_FLAG_KEY).
 * Solo Android por ahora: iOS no puede completar el registro sin la
 * APNs key (Fase 9) y pedir el permiso nativo ahí lo quemaría sin
 * beneficio real (docs/phases/phase-5-tracking.md).
 */
export function NotificationPermissionCard() {
  const [visible, setVisible] = useState(false);
  const registerDevice = useRegisterDevice();

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ status }, prompted] = await Promise.all([
        Notifications.getPermissionsAsync(),
        AsyncStorage.getItem(PROMPTED_FLAG_KEY),
      ]);
      if (!cancelled && status === 'undetermined' && !prompted) {
        setVisible(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function markPrompted() {
    await AsyncStorage.setItem(PROMPTED_FLAG_KEY, '1');
  }

  async function handleAccept() {
    setVisible(false);
    const { status } = await Notifications.requestPermissionsAsync();
    await markPrompted();
    if (status !== 'granted') {
      return;
    }
    const token = await getFcmToken();
    if (token) {
      registerDevice.mutate({ fcmToken: token, platform: 'android' });
    }
  }

  async function handleDismiss() {
    setVisible(false);
    await markPrompted();
  }

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text variant="bodyMd" style={styles.text}>
        Te avisamos cuando tu pedido esté en camino
      </Text>
      <View style={styles.actions}>
        <Pressable onPress={handleDismiss} accessibilityRole="button" style={styles.dismissButton}>
          <Text variant="bodySm" color="secondary">
            Ahora no
          </Text>
        </Pressable>
        <Pressable onPress={handleAccept} accessibilityRole="button" style={styles.acceptButton}>
          <Text variant="bodySm" color="onBrand">
            Activar notificaciones
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand.tint,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
  },
  text: {
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  dismissButton: {
    minHeight: 44,
    justifyContent: 'center',
  },
  acceptButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.brand.default,
  },
});
