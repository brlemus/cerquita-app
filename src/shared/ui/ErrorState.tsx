import { StyleSheet, View } from 'react-native';

import { spacing } from './theme';
import { Button } from './Button';
import { Text } from './Text';

export type ErrorStateProps = {
  message?: string;
  onRetry: () => void;
  retrying?: boolean;
};

/** Generaliza el bloque inline que ya usaba AccountGate.tsx para errores de red/servidor. */
export function ErrorState({ message, onRetry, retrying = false }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text variant="titleSm" style={styles.title}>
        No pudimos cargar esto
      </Text>
      <Text variant="bodyMd" color="secondary" style={styles.description}>
        {message ?? 'Revisá tu conexión e intentá de nuevo.'}
      </Text>
      <Button title="Reintentar" onPress={onRetry} loading={retrying} />
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
  },
  title: {
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
});
