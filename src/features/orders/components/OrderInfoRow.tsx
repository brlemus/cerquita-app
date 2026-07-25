import { StyleSheet, View } from 'react-native';

import { spacing, Text } from '@/shared/ui';

export type OrderInfoRowProps = {
  label: string;
  value: string;
  emphasized?: boolean;
};

/** Label a la izquierda, valor a la derecha -- receta ya usada en OrderConfirmationScreen. */
export function OrderInfoRow({ label, value, emphasized }: OrderInfoRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="bodyMd" color="secondary">
        {label}
      </Text>
      <Text variant={emphasized ? 'subtitle' : 'bodyMd'}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
