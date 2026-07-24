import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, colors, spacing, Text } from '@/shared/ui';
import { formatMoneyCents, formatOrderDate } from '@/shared/utils';
import type { Order } from '../api/types';
import { shortOrderId } from '../utils/orderStatus';
import { OrderStatusBadge } from './OrderStatusBadge';

export type OrderRowProps = {
  order: Order;
  onPress: () => void;
};

export const OrderRow = memo(function OrderRow({ order, onPress }: OrderRowProps) {
  const [firstItem, ...restItems] = order.items;
  const itemsSummary = firstItem
    ? restItems.length > 0
      ? `${firstItem.productName} y ${restItems.length} más`
      : firstItem.productName
    : '';
  const shortId = shortOrderId(order.id);
  const title = order.businessName ?? `Pedido #${shortId}`;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text variant="bodyLg" numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <OrderStatusBadge status={order.status} />
        </View>
        {order.businessName ? (
          <Text variant="footnote" color="secondary">
            Pedido #{shortId}
          </Text>
        ) : null}
        {itemsSummary ? (
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {itemsSummary}
          </Text>
        ) : null}
        <View style={styles.bottomRow}>
          <Text variant="footnote" color="secondary">
            {formatOrderDate(order.createdAt)}
          </Text>
          <Text variant="bodySm">{formatMoneyCents(order.totalCents)}</Text>
        </View>
      </View>
      <ChevronRightIcon />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  pressed: {
    backgroundColor: colors.surface.subtle,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
