import { Platform } from 'react-native';

import { TextField, type TextFieldProps } from '@/shared/ui';

export type CodeFieldProps = Pick<TextFieldProps, 'value' | 'onChangeText' | 'onBlur' | 'error'>;

/**
 * Campo de código de 6 dígitos -- mismas props fijas en los tres flujos
 * que lo usan (verificación de registro, segundo factor, reset de
 * contraseña).
 */
export function CodeField(props: CodeFieldProps) {
  return (
    <TextField
      label="Código de verificación"
      placeholder="123456"
      keyboardType="number-pad"
      maxLength={6}
      textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
      returnKeyType="done"
      submitBehavior="blurAndSubmit"
      {...props}
    />
  );
}
