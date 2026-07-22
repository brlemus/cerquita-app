import { forwardRef } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, radius, spacing, typography } from './theme';
import { Text } from './Text';

export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, style, ...rest },
  ref,
) {
  return (
    <View>
      <Text variant="bodySm" style={styles.label}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={colors.text.secondary}
        style={[styles.input, Boolean(error) && styles.inputError, style]}
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
  inputError: {
    borderColor: colors.danger.default,
  },
  error: {
    marginTop: spacing.xs,
  },
});
