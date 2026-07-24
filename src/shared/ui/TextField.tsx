import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from './theme';
import { Text } from './Text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  /**
   * `'filled'`: sin borde, fondo `surface.tint` + halo de foco (login,
   * dirección 8b). Default `'outline'` -- el resto de la app (checkout,
   * direcciones, etc.) no cambia un solo pixel.
   */
  variant?: 'outline' | 'filled';
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, variant = 'outline', style, onFocus, onBlur, ...rest },
  ref,
) {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = variant === 'filled';

  return (
    <View>
      <Text variant="bodySm" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.text.secondary}
        style={[
          styles.input,
          isFilled && styles.inputFilled,
          isFilled && isFocused && styles.inputFilledFocused,
          Boolean(error) && styles.inputError,
          style,
        ]}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...rest}
      />
      {error ? (
        <Text variant="footnote" color="danger" style={styles.error} testID="text-field-error">
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    marginBottom: spacing.sm,
  },
  input: {
    // Fidelidad al prototipo (docs/design/): 14px no está en la escala de
    // spacing del theme.
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    ...typography.bodyLg,
    color: colors.text.primary,
  },
  inputFilled: {
    borderWidth: 0,
    backgroundColor: colors.surface.tint,
  },
  inputFilledFocused: {
    borderWidth: 1.5,
    borderColor: colors.brand.default,
    shadowColor: colors.brand.default,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  inputError: {
    borderColor: colors.danger.default,
  },
  error: {
    marginTop: spacing.xs,
  },
});
