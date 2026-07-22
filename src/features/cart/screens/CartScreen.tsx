import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackIcon } from '@/features/marketplace/components/icons';
import { useBusiness } from '@/features/marketplace/hooks/useBusiness';
import { ApiRequestError } from '@/shared/api';
import { Button, colors, EmptyState, ErrorState, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import { CartLineRow } from '../components/CartLineRow';
import { subtotalCents, useCartStore } from '../store/cartStore';

/**
 * Sin CTA de pagar todavía (Fase 4) -- ver docs/phases/phase-3-cart.md.
 * minOrderCents se resuelve vía useBusiness (fuente fresca); el nombre
 * persistido en el store es el fallback instantáneo mientras esa query
 * resuelve, para no parpadear el header.
 */
export function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const businessId = useCartStore((state) => state.businessId);
  const businessNameFallback = useCartStore((state) => state.businessName);
  const lines = useCartStore((state) => state.lines);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  const businessQuery = useBusiness(businessId);
  const businessName = businessQuery.data?.name ?? businessNameFallback;
  const isBusinessNotFound =
    businessQuery.isError &&
    businessQuery.error instanceof ApiRequestError &&
    businessQuery.error.error.kind === 'notFound';

  const subtotal = subtotalCents(lines);
  const minOrderCents = businessQuery.data?.minOrderCents ?? 0;
  const needsMore = lines.length > 0 && subtotal < minOrderCents;

  function goToHome() {
    router.replace('/');
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <BackIcon />
        </Pressable>
        <Text variant="titleMd">Mi carrito</Text>
      </View>

      {lines.length === 0 ? (
        <EmptyState
          title="Tu carrito está vacío"
          description="Retomá donde quedaste o descubrí algo nuevo."
          action={<Button title="Descubrí negocios" onPress={goToHome} />}
        />
      ) : isBusinessNotFound ? (
        <EmptyState
          title="Este negocio ya no está disponible"
          description="Vaciá el carrito para seguir comprando en otro negocio."
          action={
            <Button
              title="Vaciar carrito"
              onPress={() => {
                clearCart();
                goToHome();
              }}
            />
          }
        />
      ) : businessQuery.isError ? (
        <ErrorState onRetry={() => businessQuery.refetch()} retrying={businessQuery.isRefetching} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.listContent}>
            {businessName ? (
              <Text variant="bodySm" color="secondary" style={styles.businessName}>
                {businessName}
              </Text>
            ) : null}
            {lines.map((line) => (
              <CartLineRow
                key={line.key}
                line={line}
                onIncrement={() => updateQuantity(line.key, line.quantity + 1)}
                onDecrement={() => updateQuantity(line.key, line.quantity - 1)}
              />
            ))}
            {needsMore ? (
              <View style={styles.minOrderBanner}>
                <Text variant="bodySm" style={styles.minOrderText}>
                  Agregá {formatMoneyCents(minOrderCents - subtotal)} para llegar al mínimo
                </Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.subtotalRow}>
              <Text variant="bodyMd" color="secondary">
                Subtotal
              </Text>
              <Text variant="subtitle">{formatMoneyCents(subtotal)}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  businessName: {
    marginBottom: spacing.sm,
  },
  minOrderBanner: {
    marginTop: spacing.lg,
    backgroundColor: colors.brand.tint,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  minOrderText: {
    color: colors.brand.dark,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  subtotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
