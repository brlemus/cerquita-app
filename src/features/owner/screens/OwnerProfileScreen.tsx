import { useUser } from '@clerk/clerk-expo';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { usePlatformCategories } from '@/features/marketplace/hooks/usePlatformCategories';
import { CartIcon, colors, PressableOpacity, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils/money';
import { ModeSwitchRow } from '../components/ModeSwitchRow';
import { useMyBusiness } from '../hooks/useMyBusiness';
import { useOwnerAccess } from '../hooks/useOwnerAccess';
import { useSwitchMode } from '../hooks/useSwitchMode';

const STATUS_NOTICE: Partial<Record<string, string>> = {
  PENDING: 'Tu negocio está pendiente de aprobación.',
  HIDDEN: 'Tu negocio está oculto para los clientes.',
};

export function OwnerProfileScreen() {
  const { user } = useUser();
  const logout = useLogout();
  const { switchToCustomer } = useSwitchMode();
  const { hasBusiness } = useOwnerAccess();
  const { data: business } = useMyBusiness(hasBusiness);
  const { data: categories } = usePlatformCategories();

  const name = user?.fullName ?? user?.firstName ?? 'Usuario';
  const email = user?.primaryEmailAddress?.emailAddress ?? '';
  const initial = name.charAt(0).toUpperCase();
  const businessInitial = business?.name.charAt(0).toUpperCase() ?? '';
  const categoryName = categories?.find((c) => c.id === business?.platformCategoryId)?.name;
  const notice = business ? STATUS_NOTICE[business.status] : undefined;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="titleLg" style={styles.header}>
        Perfil
      </Text>
      <View style={styles.content}>
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

        <Text variant="caption" color="secondary" style={styles.sectionLabel}>
          MI NEGOCIO
        </Text>
        <View style={styles.businessCard}>
          <View style={styles.businessInitial}>
            <Text variant="bodyLg" color="brand">
              {businessInitial}
            </Text>
          </View>
          <View style={styles.businessInfo}>
            <Text variant="bodyLg">{business?.name ?? ''}</Text>
            {business ? (
              <Text variant="bodySm" color="secondary">
                {categoryName ? `${categoryName} · ` : ''}Envío{' '}
                {formatMoneyCents(business.deliveryFeeCents)}
              </Text>
            ) : null}
            {notice ? (
              <Text variant="bodySm" color="danger" style={styles.notice}>
                {notice}
              </Text>
            ) : null}
          </View>
        </View>

        <ModeSwitchRow
          icon={<CartIcon color={colors.brand.dark} />}
          label="Cambiar a modo cliente"
          onPress={switchToCustomer}
        />

        <PressableOpacity
          onPress={logout}
          style={styles.logoutButton}
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesión"
        >
          <Text variant="bodyLg" color="danger">
            Cerrar sesión
          </Text>
        </PressableOpacity>
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
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
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
  sectionLabel: {
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  businessCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  businessInitial: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessInfo: {
    flex: 1,
    gap: 2,
  },
  notice: {
    marginTop: 2,
  },
  logoutButton: {
    marginTop: spacing.sm,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
  },
});
