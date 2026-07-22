import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors, spacing, Text } from '@/shared/ui';
import { formatMoneyCents } from '@/shared/utils';
import type { Business } from '../api/types';
import { AvatarFallback } from './AvatarFallback';
import { ClosedPill } from './ClosedPill';
import { RatingBadge } from './RatingBadge';

export type BusinessCardProps = {
  business: Business;
  categoryName?: string;
  onPress: () => void;
};

export const BusinessCard = memo(function BusinessCard({
  business,
  categoryName,
  onPress,
}: BusinessCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={business.name}
    >
      <AvatarFallback uri={business.logoUrl} label={business.name} size={64} />
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text variant="subtitle" numberOfLines={1} style={styles.name}>
            {business.name}
          </Text>
          {!business.isOpen ? <ClosedPill /> : null}
        </View>
        {categoryName ? (
          <Text variant="bodySm" color="secondary" numberOfLines={1}>
            {categoryName}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <RatingBadge avgRating={business.avgRating} reviewCount={business.reviewCount} />
          <Text variant="bodySm" color="secondary">
            {' '}
            · {business.prepTimeMinutes} min · Envío {formatMoneyCents(business.deliveryFeeCents)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
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
    justifyContent: 'center',
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
});
