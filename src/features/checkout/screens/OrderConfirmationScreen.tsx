import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useBusiness } from '@/features/marketplace/hooks/useBusiness';
import { Button, colors, ErrorState, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import { useOrder } from '../hooks/useOrder';

/**
 * Sin tracking/polling todavía (Fase 5) -- muestra solo lo que
 * POST /orders ya devolvió. Fuente propia (GET /orders/:id) en vez de
 * threadear los datos de la mutación por query params: sobrevive incluso
 * a un cold-start improbable sobre este deep link.
 */
export function OrderConfirmationScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const orderQuery = useOrder(orderId);
  const businessQuery = useBusiness(orderQuery.data?.businessId ?? null);

  if (orderQuery.isPending) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={colors.brand.default} />
      </View>
    );
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ErrorState onRetry={() => orderQuery.refetch()} retrying={orderQuery.isRefetching} />
      </View>
    );
  }

  const order = orderQuery.data;
  const shortId = order.id.replace(/-/g, '').slice(-6).toUpperCase();

  return (
    <View style={styles.screen}>
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
          {businessQuery.data ? <Row label="Negocio" value={businessQuery.data.name} /> : null}
          <Row label="Dirección" value={order.addressLine} />
          {order.instructions ? <Row label="Instrucciones" value={order.instructions} /> : null}
          <Row label="Pago" value="Efectivo contra entrega" />
          {order.etaMinutes !== undefined ? (
            <Row label="Tiempo estimado" value={`~${order.etaMinutes} min`} />
          ) : null}
          <View style={styles.divider} />
          <Row label="Total" value={formatMoneyCents(order.totalCents)} emphasized />
        </View>
      </View>

      <View style={styles.footer}>
        <Button title="Volver al inicio" size="lg" onPress={() => router.replace('/')} />
      </View>
    </View>
  );
}

function Row({ label, value, emphasized }: { label: string; value: string; emphasized?: boolean }) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMd" color="secondary">
        {label}
      </Text>
      <Text variant={emphasized ? 'subtitle' : 'bodyMd'}>{value}</Text>
    </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxl,
  },
});
