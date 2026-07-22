import { useAuth } from '@clerk/clerk-expo';
import { useEffect, type PropsWithChildren } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApiRequestError } from '@/shared/api';
import { Button, colors, spacing, Text } from '@/shared/ui';
import { useAuthMe } from '../hooks/useAuthMe';
import { SuspendedScreen } from '../screens/SuspendedScreen';

/**
 * Corre GET /auth/me al entrar a rutas protegidas y ramifica por el
 * contrato de errores de cuenta (docs/API_CONTRACT.md): 401 desloguea,
 * 403 suspended y 409 re-registro bloqueado muestran la misma pantalla.
 */
export function AccountGate({ children }: PropsWithChildren) {
  const { signOut } = useAuth();
  const { data, error, isPending, refetch, isRefetching } = useAuthMe();

  const kind = error instanceof ApiRequestError ? error.error.kind : undefined;
  const isUnauthorized = kind === 'unauthorized';

  useEffect(() => {
    if (isUnauthorized) {
      signOut();
    }
  }, [isUnauthorized, signOut]);

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
