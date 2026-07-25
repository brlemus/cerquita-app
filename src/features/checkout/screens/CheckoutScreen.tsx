import { useQueryClient } from '@tanstack/react-query';
import { randomUUID } from 'expo-crypto';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { subtotalCents, useCartStore } from '@/features/cart/store/cartStore';
import { BackIcon } from '@/features/marketplace/components/icons';
import { useBusiness } from '@/features/marketplace/hooks/useBusiness';
import { useBottomInset } from '@/shared/hooks';
import {
  Button,
  ChevronRightIcon,
  colors,
  EmptyState,
  PinIcon,
  PressableOpacity,
  radius,
  spacing,
  Text,
} from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import { useAddresses } from '../hooks/useAddresses';
import { useCreateOrder } from '../hooks/useCreateOrder';
import type { CreateOrderPayload } from '../api/types';
import { deriveCheckoutError, type CheckoutErrorAction } from '../utils/deriveCheckoutError';

/**
 * Idempotency-Key: nace una vez por mount (un intento de compra), se
 * reusa en cada retry dentro de ese mismo mount -- ver
 * docs/phases/phase-4-checkout.md.
 */
export function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomInset(spacing.lg);
  const queryClient = useQueryClient();
  const { addressId: addressIdParam } = useLocalSearchParams<{ addressId?: string }>();

  const businessId = useCartStore((state) => state.businessId);
  const businessNameFallback = useCartStore((state) => state.businessName);
  const lines = useCartStore((state) => state.lines);
  const clearCart = useCartStore((state) => state.clearCart);

  const businessQuery = useBusiness(businessId);
  const business = businessQuery.data;
  const businessName = business?.name ?? businessNameFallback;

  const addressesQuery = useAddresses();
  const addresses = addressesQuery.data?.data ?? [];
  const selectedAddress = addressIdParam
    ? addresses.find((address) => address.id === addressIdParam)
    : (addresses.find((address) => address.isDefault) ?? addresses[0]);

  const [idempotencyKey] = useState(() => randomUUID());
  const createOrderMutation = useCreateOrder();

  const subtotal = subtotalCents(lines);
  const deliveryFeeCents = business?.deliveryFeeCents ?? 0;
  const total = subtotal + deliveryFeeCents;
  const minOrderCents = business?.minOrderCents ?? 0;
  const needsMore = subtotal < minOrderCents;
  const businessClosed = business?.isOpen === false;

  const confirmDisabled =
    !businessId || !selectedAddress || needsMore || businessClosed || createOrderMutation.isPending;

  function handleConfirm() {
    if (!businessId || !selectedAddress) return;
    const payload: CreateOrderPayload = {
      businessId,
      addressId: selectedAddress.id,
      items: lines.map((line) => ({
        productId: line.productId,
        variantOptionId: line.variantOptionId,
        quantity: line.quantity,
      })),
      paymentMethod: 'CASH',
    };
    createOrderMutation.mutate(
      { payload, idempotencyKey },
      {
        onSuccess: (order) => {
          clearCart();
          queryClient.invalidateQueries({
            queryKey: ['marketplace', 'businesses', 'detail', businessId, 'products'],
          });
          router.replace(`/checkout/confirmation?orderId=${order.id}`);
        },
      },
    );
  }

  function handleErrorAction(action: CheckoutErrorAction) {
    if (action === 'goToCart') router.replace('/cart');
    else if (action === 'goToHome') router.replace('/');
    else handleConfirm();
  }

  if (lines.length === 0 || !businessId) {
    return (
      <View style={styles.screen}>
        <EmptyState
          title="Tu carrito está vacío"
          description="Agregá productos antes de ir a pagar."
          action={<Button title="Volver al inicio" onPress={() => router.replace('/')} />}
        />
      </View>
    );
  }

  const errorView = deriveCheckoutError(createOrderMutation.error, lines);

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
        <Text variant="titleMd">Último paso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          style={styles.row}
          onPress={() =>
            selectedAddress
              ? router.push(`/addresses/${selectedAddress.id}/edit?returnTo=/checkout`)
              : router.push('/addresses/new?returnTo=/checkout')
          }
          accessibilityRole="button"
        >
          <View style={styles.rowIcon}>
            <PinIcon />
          </View>
          <View style={styles.rowInfo}>
            <Text variant="bodySm" color="secondary">
              Dirección de entrega
            </Text>
            {selectedAddress ? (
              <>
                <Text variant="bodyLg">{selectedAddress.line}</Text>
                {selectedAddress.instructions ? (
                  <Text variant="bodySm" color="secondary">
                    {selectedAddress.instructions}
                  </Text>
                ) : null}
              </>
            ) : (
              <Text variant="bodyLg" color="brand">
                Agregar dirección de entrega
              </Text>
            )}
          </View>
          <ChevronRightIcon />
        </Pressable>
        {selectedAddress && addresses.length > 1 ? (
          <PressableOpacity
            onPress={() => router.push('/addresses?returnTo=/checkout')}
            accessibilityRole="button"
            style={styles.changeAddress}
          >
            <Text variant="bodySm" color="brand">
              Cambiar dirección
            </Text>
          </PressableOpacity>
        ) : null}

        <View style={[styles.row, styles.staticRow]}>
          <View style={styles.rowIcon}>
            <PinIcon />
          </View>
          <View style={styles.rowInfo}>
            <Text variant="bodySm" color="secondary">
              Forma de pago
            </Text>
            <Text variant="bodyLg">Pago en efectivo contra entrega</Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <Text variant="subtitle" style={styles.summaryTitle}>
            Resumen{businessName ? ` — ${businessName}` : ''}
          </Text>
          {lines.map((line) => (
            <View key={line.key} style={styles.summaryLine}>
              <Text variant="bodyMd">
                {line.quantity}× {line.productName}
                {line.variantOptionName ? ` — ${line.variantOptionName}` : ''}
              </Text>
              <Text variant="bodyMd">{formatMoneyCents(line.unitPriceCents * line.quantity)}</Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.summaryLine}>
            <Text variant="bodyMd" color="secondary">
              Subtotal
            </Text>
            <Text variant="bodyMd" color="secondary">
              {formatMoneyCents(subtotal)}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Text variant="bodyMd" color="secondary">
              Envío
            </Text>
            <Text variant="bodyMd" color="secondary">
              {formatMoneyCents(deliveryFeeCents)}
            </Text>
          </View>
          <View style={styles.summaryLine}>
            <Text variant="subtitle">Total</Text>
            <Text variant="subtitle">{formatMoneyCents(total)}</Text>
          </View>
        </View>

        {needsMore ? (
          <Text variant="bodySm" color="danger" style={styles.hint}>
            Tu pedido no alcanza el mínimo de compra de este negocio.
          </Text>
        ) : null}
        {businessClosed ? (
          <Text variant="bodySm" color="danger" style={styles.hint}>
            Este negocio no está aceptando pedidos ahora.
          </Text>
        ) : null}
        {errorView ? (
          <View style={styles.errorBlock}>
            <Text variant="bodySm" color="danger">
              {errorView.message}
            </Text>
            <PressableOpacity
              onPress={() => handleErrorAction(errorView.action)}
              accessibilityRole="button"
            >
              <Text variant="bodySm" color="brand">
                {errorView.actionLabel}
              </Text>
            </PressableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <Button
          title={`Confirmar pedido · ${formatMoneyCents(total)}`}
          size="lg"
          loading={createOrderMutation.isPending}
          disabled={confirmDisabled}
          onPress={handleConfirm}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.subtle,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.default,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface.default,
    borderRadius: radius.xl,
  },
  staticRow: {
    marginTop: spacing.sm,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.brand.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: 2,
  },
  changeAddress: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
  },
  summaryCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surface.default,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  summaryTitle: {
    marginBottom: spacing.md,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.sm,
  },
  hint: {
    paddingHorizontal: spacing.sm,
  },
  errorBlock: {
    backgroundColor: 'rgba(209, 67, 67, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface.default,
  },
});
