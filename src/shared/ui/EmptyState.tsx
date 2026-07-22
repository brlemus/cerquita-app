import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from './theme';
import { Text } from './Text';

export type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleSm" style={styles.title}>
        {title}
      </Text>
      {description ? (
        <Text variant="bodyMd" color="secondary" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl,
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
