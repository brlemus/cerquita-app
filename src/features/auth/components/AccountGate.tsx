import { useAuth, useUser } from '@clerk/clerk-expo';
import { useEffect, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiRequestError } from '@/shared/api';
import { Button, colors, spacing, Text } from '@/shared/ui';
import { saveNameAndRefreshToken } from '../completeNameFlow';
import { useAuthMe } from '../hooks/useAuthMe';
import { useLogout } from '../hooks/useLogout';
import { CompleteNameScreen } from '../screens/CompleteNameScreen';
import { SuspendedScreen } from '../screens/SuspendedScreen';

/**
 * Corre GET /auth/me al entrar a rutas protegidas y ramifica por el
 * contrato de errores de cuenta (docs/API_CONTRACT.md): 401 desloguea,
 * 403 suspended y 409 re-registro bloqueado muestran la misma pantalla.
 * También cubre el caso de Apple sin nombre compartido (Fase 1.5, ver
 * docs/phases/phase-1.5-social-login.md): sin `firstName` en Clerk, el
 * claim `name` del session token queda vacío y el backend devuelve 400.
 */
export function AccountGate({ children }: PropsWithChildren) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { data, error, isPending, refetch, isRefetching } = useAuthMe();
  const logout = useLogout();

  const kind = error instanceof ApiRequestError ? error.error.kind : undefined;
  const isUnauthorized = kind === 'unauthorized';
  const needsName = Boolean(user) && !user?.firstName;

  useEffect(() => {
    if (isUnauthorized) {
      logout();
    }
  }, [isUnauthorized, logout]);

  async function handleNameSaved(name: string) {
    if (!user) {
      return;
    }
    await saveNameAndRefreshToken(user, getToken, refetch, name);
  }

  // Proactivo: evita llamar /auth/me sabiendo que va a dar 400 por claim
  // faltante. Antes de mirar el resultado de la query.
  if (needsName) {
    return <CompleteNameScreen onSubmit={handleNameSaved} />;
  }

  if (isPending || isUnauthorized) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']} testID="account-gate-loading">
        <ActivityIndicator color={colors.brand.default} />
      </SafeAreaView>
    );
  }

  if (kind === 'suspended' || kind === 'reRegisterBlocked') {
    return <SuspendedScreen />;
  }

  // Defensivo: el único 400 documentado de /auth/me es claim faltante — si
  // llegó hasta acá pese al chequeo proactivo (ej. lag del token), misma
  // pantalla, no el error genérico.
  if (kind === 'validation') {
    return <CompleteNameScreen onSubmit={handleNameSaved} />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={['top', 'bottom']}>
        <View style={styles.errorContent}>
          <Text variant="titleSm" style={styles.errorTitle}>
            No pudimos cargar tu cuenta
          </Text>
          <Text variant="bodyMd" color="secondary" style={styles.errorBody}>
            Revisá tu conexión e intentá de nuevo.
          </Text>
          <Button title="Reintentar" onPress={() => refetch()} loading={isRefetching} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return null;
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.default,
  },
  errorContent: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
  },
  errorTitle: {
    textAlign: 'center',
  },
  errorBody: {
    textAlign: 'center',
  },
});
