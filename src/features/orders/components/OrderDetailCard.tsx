import { StyleSheet, View } from 'react-native';

import { AvatarFallback } from '@/features/marketplace/components/AvatarFallback';
import { colors, radius, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import type { Order } from '../api/types';
import { OrderInfoRow } from './OrderInfoRow';

export type OrderDetailCardProps = {
  order: Order;
};

const PAYMENT_METHOD_LABEL: Record<Order['paymentMethod'], string> = {
  CASH: 'Efectivo contra entrega',
};

const LOGO_SIZE = 40;

/**
 * Qué pedí, cuánto pagué, a dónde va -- vive en el tracking en cualquier
 * estado, no solo ENTREGADO. Todos los datos ya vienen en `Order`
 * (GET /orders/:id), cero fetch nuevo.
 */
export function OrderDetailCard({ order }: OrderDetailCardProps) {
  return (
    <View style={styles.card}>
      <Text variant="subtitle">Detalle del pedido</Text>

      {order.businessName ? (
        <View style={styles.businessRow}>
          <AvatarFallback uri={order.logoUrl} label={order.businessName} size={LOGO_SIZE} />
          <Text variant="bodyLg" style={styles.businessName} numberOfLines={1}>
            {order.businessName}
          </Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      {order.items.map((item) => (
        <View key={`${item.productId}|${item.variantOptionId ?? ''}`} style={styles.itemRow}>
          <Text variant="bodyMd" style={styles.itemName}>
            {item.quantity}× {item.productName}
            {item.variantOptionName ? ` — ${item.variantOptionName}` : ''}
          </Text>
          <Text variant="bodyMd">{formatMoneyCents(item.unitPriceCents * item.quantity)}</Text>
        </View>
      ))}

      <View style={styles.divider} />

      <OrderInfoRow label="Subtotal" value={formatMoneyCents(order.subtotalCents)} />
      <OrderInfoRow label="Envío" value={formatMoneyCents(order.deliveryFeeCents)} />
      <OrderInfoRow label="Total" value={formatMoneyCents(order.totalCents)} emphasized />

      <View style={styles.divider} />

      <OrderInfoRow label="Dirección" value={order.addressLine} />
      {order.instructions ? (
        <OrderInfoRow label="Instrucciones" value={order.instructions} />
      ) : null}
      <OrderInfoRow label="Pago" value={PAYMENT_METHOD_LABEL[order.paymentMethod]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.xxl,
    backgroundColor: colors.surface.subtle,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  businessName: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.default,
    marginVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  itemName: {
    flex: 1,
  },
});
