import { StyleSheet, View } from 'react-native';

import { colors, Skeleton, spacing } from '@/shared/ui';

export function OrderRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width="45%" height={16} />
      <Skeleton width="65%" height={12} />
      <Skeleton width="35%" height={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
});
