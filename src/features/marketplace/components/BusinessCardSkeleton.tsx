import { StyleSheet, View } from 'react-native';

import { colors, radius, Skeleton, spacing } from '@/shared/ui';

export function BusinessCardSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={64} height={64} radius={radius.xl} />
      <View style={styles.info}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} />
        <Skeleton width="55%" height={12} />
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
