import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing, Text } from '@/shared/ui';

/** Tono neutro, no rojo de error -- cerrado es un estado normal, no un problema. */
export function ClosedPill() {
  return (
    <View style={styles.pill}>
      <Text variant="footnote" color="secondary">
        Cerrado
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: colors.surface.mutedAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
});
