import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, typography, type TypographyVariant } from './theme';

type TextColor = keyof typeof colors.text | 'brand' | 'danger';

const COLOR_MAP: Record<TextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  onBrand: colors.text.onBrand,
  brand: colors.brand.default,
  danger: colors.danger.default,
};

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
};

export function Text({ variant = 'bodyMd', color = 'primary', style, ...rest }: TextProps) {
  return (
    <RNText
      style={[styles.base, typography[variant], { color: COLOR_MAP[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },
});
