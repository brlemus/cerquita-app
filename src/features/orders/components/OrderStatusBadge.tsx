import { StyleSheet, View } from 'react-native';

import { radius, spacing, Text } from '@/shared/ui';
import type { OrderStatus } from '../api/types';
import { statusBadgeLabel, statusBadgeStyle } from '../utils/orderStatus';

export type OrderStatusBadgeProps = {
  status: OrderStatus;
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const { bg, fg } = statusBadgeStyle(status);

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="footnote" style={{ color: fg }}>
        {statusBadgeLabel(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
});
