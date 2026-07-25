import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, EmptyState, spacing, Text } from '@/shared/ui';

export type OwnerPlaceholderScreenProps = {
  header: string;
  emptyTitle: string;
  emptyDescription: string;
};

/**
 * Placeholder diseñado para las tabs del modo admin que las Fases 11/12
 * reemplazan antes de la publicación (Decisión 6,
 * docs/phases/phase-10-owner-foundations.md) -- nunca "en construcción" ni
 * mención de fases, siempre copy de producto.
 */
export function OwnerPlaceholderScreen({
  header,
  emptyTitle,
  emptyDescription,
}: OwnerPlaceholderScreenProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <Text variant="titleMd" style={styles.header}>
        {header}
      </Text>
      <EmptyState title={emptyTitle} description={emptyDescription} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.sm,
  },
});
