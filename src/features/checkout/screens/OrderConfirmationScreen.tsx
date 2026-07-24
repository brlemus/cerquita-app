import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBusiness } from '@/features/marketplace/hooks/useBusiness';
import { OrderInfoRow } from '@/features/orders/components/OrderInfoRow';
import { useOrder } from '@/features/orders/hooks/useOrder';
import { shortOrderId } from '@/features/orders/utils/orderStatus';
import { useBottomInset } from '@/shared/hooks';
import { Button, colors, ErrorState, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';

/**
 * Fuente propia (GET /orders/:id) en vez de threadear los datos de la
 * mutación por query params: sobrevive incluso a un cold-start improbable
 * sobre este deep link. El tracking en vivo (polling/cancelación) vive en
 * `OrderTrackingScreen` (Fase 5) -- acá solo el link de entrada.
 */
export function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const orderQuery = useOrder(orderId);
  const businessQuery = useBusiness(orderQuery.data?.businessId ?? null);
  const bottomInset = useBottomInset(spacing.xxl);

  if (orderQuery.isPending) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ActivityIndicator color={colors.brand.default} />
      </SafeAreaView>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <SafeAreaView style={[styles.screen, styles.centered]} edges={['top']}>
        <ErrorState onRetry={() => orderQuery.refetch()} retrying={orderQuery.isRefetching} />
      </SafeAreaView>
    );
  }

  const order = orderQuery.data;
  const shortId = shortOrderId(order.id);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text variant="display">✓</Text>
        </View>
        <Text variant="titleLg" style={styles.centerText}>
          ¡Pedido confirmado!
        </Text>
        <Text variant="bodyMd" color="secondary" style={styles.centerText}>
          Pedido #{shortId}
        </Text>

        <View style={styles.card}>
          {businessQuery.data ? (
            <OrderInfoRow label="Negocio" value={businessQuery.data.name} />
          ) : null}
          <OrderInfoRow label="Dirección" value={order.addressLine} />
          {order.instructions ? (
            <OrderInfoRow label="Instrucciones" value={order.instructions} />
          ) : null}
          <OrderInfoRow label="Pago" value="Efectivo contra entrega" />
          {order.etaMinutes !== undefined ? (
            <OrderInfoRow label="Tiempo estimado" value={`~${order.etaMinutes} min`} />
          ) : null}
          <View style={styles.divider} />
          <OrderInfoRow label="Total" value={formatMoneyCents(order.totalCents)} emphasized />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset }]}>
        <Pressable
          onPress={() => router.push(`/orders/${order.id}`)}
          accessibilityRole="button"
          style={styles.trackLink}
        >
          <Text variant="bodySm" color="brand">
            Ver seguimiento ›
          </Text>
        </Pressable>
        <Button title="Volver al inicio" size="lg" onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.xxl,
    gap: spacing.sm,
    justifyContent: 'center',
  },
  badge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.success.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface.subtle,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  trackLink: {
    alignSelf: 'center',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
