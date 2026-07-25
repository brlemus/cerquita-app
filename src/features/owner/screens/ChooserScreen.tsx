import { useUser } from '@clerk/clerk-expo';
import { Pressable, StyleSheet, View } from 'react-native';

import { useLogout } from '@/features/auth/hooks/useLogout';
import { useBottomInset } from '@/shared/hooks';
import { CartIcon, ChevronRightIcon, colors, radius, spacing, StoreIcon, Text } from '@/shared/ui';
import { useMyBusiness } from '../hooks/useMyBusiness';
import { useSwitchMode } from '../hooks/useSwitchMode';

const ICON_CIRCLE_SIZE = 52;

/**
 * Chooser post-login para usuarios con negocio (Decisión 2,
 * docs/phases/phase-10-owner-foundations.md). Copy y layout literales del
 * prototipo, docs/design/Cerca.dc.html líneas 45-66. Tipografía con las
 * variantes existentes del theme (28/16px en vez de los 26/17px del
 * prototipo -- no se agregan variantes por 1-2px).
 */
export function ChooserScreen() {
  const { user } = useUser();
  const logout = useLogout();
  const { switchToOwner, switchToCustomer } = useSwitchMode();
  // Decisión 7: no bloquea el render -- si falla o tarda, el subtítulo cae a un texto genérico.
  const { data: business } = useMyBusiness(true);
  const footerMarginBottom = useBottomInset(spacing.xxl);

  const name = user?.firstName ?? user?.fullName ?? '';

  return (
    <View style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text variant="display" style={styles.title}>
          ¿Dónde querés entrar?
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          {name
            ? `Hola ${name}, tenés una tienda y una cuenta de cliente. Podés cambiar cuando quieras desde tu perfil.`
            : 'Tenés una tienda y una cuenta de cliente. Podés cambiar cuando quieras desde tu perfil.'}
        </Text>
      </View>

      <View style={styles.cards}>
        <Pressable
          onPress={switchToOwner}
          style={({ pressed }) => [styles.card, styles.ownerCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Administrar mi tienda"
        >
          <View style={[styles.iconCircle, styles.ownerIconCircle]}>
            <StoreIcon color={colors.text.onBrand} />
          </View>
          <View style={styles.cardText}>
            <Text variant="subtitle" style={styles.ownerTitle}>
              Administrar mi tienda
            </Text>
            <Text variant="bodySm" style={styles.ownerSubtitle}>
              {business ? `Panel de ${business.name}` : 'Panel de tu tienda'}
            </Text>
          </View>
          <ChevronRightIcon color={colors.brand.default} />
        </Pressable>

        <Pressable
          onPress={switchToCustomer}
          style={({ pressed }) => [styles.card, styles.clientCard, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Ir al marketplace"
        >
          <View style={[styles.iconCircle, styles.clientIconCircle]}>
            <CartIcon color={colors.text.primary} />
          </View>
          <View style={styles.cardText}>
            <Text variant="subtitle">Ir al marketplace</Text>
            <Text variant="bodySm" color="secondary">
              Explorá y pedí como cliente
            </Text>
          </View>
          <ChevronRightIcon />
        </Pressable>
      </View>

      <Pressable
        onPress={logout}
        style={[styles.logout, { marginBottom: footerMarginBottom }]}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Text variant="bodyMd" color="secondary">
          Cerrar sesión
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
    paddingHorizontal: spacing.xxl,
  },
  headerBlock: {
    paddingTop: 96,
    gap: spacing.xs,
  },
  title: {
    letterSpacing: -0.4,
  },
  subtitle: {
    lineHeight: 20,
  },
  cards: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderWidth: 1.5,
    borderRadius: radius.xl,
  },
  ownerCard: {
    borderColor: colors.brand.tint,
    backgroundColor: colors.brand.tint,
  },
  clientCard: {
    borderColor: colors.border.default,
    backgroundColor: colors.surface.default,
  },
  pressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerIconCircle: {
    backgroundColor: colors.brand.default,
  },
  clientIconCircle: {
    backgroundColor: colors.surface.subtle,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  ownerTitle: {
    color: colors.brand.dark,
  },
  ownerSubtitle: {
    color: colors.brand.default,
  },
  logout: {
    marginTop: 'auto',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
