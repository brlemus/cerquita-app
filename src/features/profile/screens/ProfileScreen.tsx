import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useCartStore } from '@/features/cart/store/cartStore';
import { colors, PinIcon, radius, spacing, Text } from '@/shared/ui';
import { ChatIcon, GearIcon, ShieldIcon } from '../components/icons';
import { SettingsRow } from '../components/SettingsRow';
import { useNotificationPermission } from '../hooks/useNotificationPermission';

export function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const logout = useLogout();
  const notificationPermission = useNotificationPermission();

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
      <Text variant="titleLg" style={styles.header}>
        Perfil
      </Text>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text variant="titleMd" color="brand">
              {initial}
            </Text>
          </View>
          <View style={styles.identityText}>
            <Text variant="titleSm">{name}</Text>
            {email ? (
              <Text variant="bodySm" color="secondary">
                {email}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <SettingsRow
            icon={<PinIcon color={colors.text.primary} />}
            label="Mis direcciones"
            onPress={() => router.push('/addresses')}
          />
          <SettingsRow
            icon={<GearIcon />}
            label="Notificaciones"
            value={notificationPermission.isGranted ? 'Activadas' : 'Desactivadas'}
            onPress={notificationPermission.requestOrOpenSettings}
          />
          <SettingsRow
            icon={<ShieldIcon />}
            label="Privacidad"
            onPress={() => router.push('/privacy')}
          />
          <SettingsRow
            icon={<ChatIcon />}
            label="Enviar comentarios"
            onPress={() => router.push('/feedback')}
            divider={false}
          />
        </View>

        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text variant="bodyLg" color="secondary">
            Cerrar sesión
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push('/delete-account')}
          style={styles.deleteAccountButton}
          accessibilityRole="button"
          accessibilityLabel="Eliminar mi cuenta"
        >
          <Text variant="bodyLg" color="danger">
            Eliminar mi cuenta
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityText: {
    gap: 2,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface.default,
  },
  logoutButton: {
    marginTop: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  deleteAccountButton: {
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
});
