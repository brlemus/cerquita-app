import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ChevronRightIcon, colors, spacing, Text } from '@/shared/ui';

export type SettingsRowProps = {
  icon: ReactNode;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  divider?: boolean;
  accessibilityHint?: string;
};

export function SettingsRow({
  icon,
  label,
  value,
  onPress,
  destructive = false,
  divider = true,
  accessibilityHint,
}: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, divider && styles.divider, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.icon}>{icon}</View>
      <Text variant="bodyLg" color={destructive ? 'danger' : 'primary'} style={styles.label}>
        {label}
      </Text>
      {value ? (
        <Text variant="bodySm" color="secondary">
          {value}
        </Text>
      ) : null}
      <ChevronRightIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 44,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  pressed: {
    backgroundColor: colors.surface.subtle,
  },
  icon: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
  },
});
