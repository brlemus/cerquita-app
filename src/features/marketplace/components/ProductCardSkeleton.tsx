import { StyleSheet, View } from 'react-native';

import { colors, radius, Skeleton, spacing } from '@/shared/ui';

export function ProductCardSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={74} height={74} radius={radius.lg} />
      <View style={styles.info}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="80%" height={12} />
        <Skeleton width="30%" height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
