import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useCartStore } from '@/features/cart/store/cartStore';
import { colors, radius, spacing, Text } from '@/shared/ui';

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const logout = useLogout();

  const name = user?.fullName ?? user?.firstName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initial = name.charAt(0).toUpperCase();

  function handleLogout() {
    // el carrito es del usuario que sale de sesión -- no debe sobrevivir para el próximo login
    useCartStore.getState().clearCart();
    logout();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="titleMd" style={styles.header}>
        Perfil
      </Text>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text variant="titleLg" color="brand">
            {initial}
          </Text>
        </View>
        <Text variant="titleSm" style={styles.centerText}>
          {name}
        </Text>
        {email ? (
          <Text variant="bodyMd" color="secondary" style={styles.centerText}>
            {email}
          </Text>
        ) : null}
        <Pressable
          onPress={() => router.push('/feedback')}
          style={styles.actionRow}
          accessibilityRole="button"
          accessibilityLabel="Enviar comentarios"
        >
          <Text variant="bodyMd">Enviar comentarios</Text>
        </Pressable>
        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text variant="bodyMd" color="danger">
            Cerrar sesión
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  content: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  actionRow: {
    marginTop: spacing.xxl,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    marginTop: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
