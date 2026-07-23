import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, colors, radius, spacing, Text } from '@/shared/ui';
import { useLogout } from '../hooks/useLogout';

/**
 * Pantalla única para 403 SUSPENDED y 409 de re-registro rechazado — el
 * contrato pide el mismo tratamiento para ambos (docs/API_CONTRACT.md).
 */
export function SuspendedScreen() {
  const logout = useLogout();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text variant="titleLg" style={styles.badgeGlyph}>
            !
          </Text>
        </View>
        <Text variant="titleMd" style={styles.title}>
          Tu cuenta está bloqueada
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.body}>
          No podés acceder a Cerquita en este momento. Escribinos a soporte para resolverlo.
        </Text>
        <Button title="Cerrar sesión" onPress={() => logout()} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.md,
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.surface.mutedAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  badgeGlyph: {
    color: colors.danger.default,
  },
  title: {
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    maxWidth: 260,
  },
  button: {
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});
