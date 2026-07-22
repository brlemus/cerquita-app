import { ActivityIndicator, Pressable, type PressableProps, StyleSheet } from 'react-native';

import { colors, radius, spacing } from './theme';
import { Text } from './Text';

export type ButtonProps = Omit<PressableProps, 'children' | 'disabled'> & {
  title: string;
  disabled?: boolean;
  loading?: boolean;
};

export function Button({ title, disabled = false, loading = false, style, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.base,
        state.pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={colors.text.onBrand} />
      ) : (
        <Text variant="bodyMd" color="onBrand">
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand.default,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.brand.pressed,
  },
  disabled: {
    opacity: 0.5,
  },
});
