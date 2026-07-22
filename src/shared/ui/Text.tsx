import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';

import { colors, typography, type TypographyVariant } from './theme';

type TextColor = keyof typeof colors.text;

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
};

export function Text({ variant = 'bodyMd', color = 'primary', style, ...rest }: TextProps) {
  return (
    <RNText
      style={[styles.base, typography[variant], { color: colors.text[color] }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: colors.text.primary,
  },
});
