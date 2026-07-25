import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, colors, radius, spacing, Text } from '@/shared/ui';

export type ModeSwitchRowProps = {
  icon: ReactNode;
  label: string;
  onPress: () => void;
};

/**
 * Fila violeta de switch de modo, reusada en el Perfil del cliente
 * ("Cambiar a administrar mi tienda") y en el Perfil del owner ("Cambiar
 * a modo cliente") -- prototipo, docs/design/Cerca.dc.html líneas 246/792.
 */
export function ModeSwitchRow({ icon, label, onPress }: ModeSwitchRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.icon}>{icon}</View>
      <Text variant="bodyLg" style={styles.label}>
        {label}
      </Text>
      <ChevronRightIcon color={colors.brand.dark} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.tint,
    backgroundColor: colors.brand.tint,
    borderRadius: radius.xl,
  },
  pressed: {
    opacity: 0.7,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    color: colors.brand.dark,
  },
});
