import { useSignUp } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, StyleSheet, View, type TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { getClerkErrorMessage } from '../clerkErrorMessage';
import { signUpSchema, type SignUpFormValues } from '../schemas';
import { Button, colors, KeyboardAwareScreen, radius, spacing, Text, TextField } from '@/shared/ui';

export function SignUpScreen() {
  const router = useRouter();
  const { isLoaded, signUp } = useSignUp();
  const [formError, setFormError] = useState<string | null>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  async function onSubmit(values: SignUpFormValues) {
    if (!isLoaded) {
      return;
    }
    setFormError(null);
    try {
      // firstName alimenta {{user.full_name}} del session token de Clerk —
      // sin esto /auth/me devuelve 400 (claim `name` faltante).
      await signUp.create({
        firstName: values.name,
        emailAddress: values.email,
        password: values.password,
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      router.push('/(auth)/verify-email');
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  return (
    <KeyboardAwareScreen
      contentContainerStyle={styles.form}
      header={
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M15 5l-7 7 7 7"
                stroke={colors.text.primary}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
          <Text variant="titleSm">Crear cuenta</Text>
        </View>
      }
    >
      <Controller
        control={control}
        name="name"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            label="Nombre"
            placeholder="Tu nombre"
            autoComplete="name"
            textContentType="name"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => emailRef.current?.focus()}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.name?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            ref={emailRef}
            label="Email"
            placeholder="tu@correo.com"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            keyboardType="email-address"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { value, onChange, onBlur } }) => (
          <TextField
            ref={passwordRef}
            label="Contraseña"
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            autoComplete="password-new"
            textContentType="newPassword"
            returnKeyType="done"
            submitBehavior="blurAndSubmit"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.password?.message}
          />
        )}
      />
      {formError ? (
        <Text variant="bodySm" color="danger">
          {formError}
        </Text>
      ) : null}
      <Button
        title="Crear cuenta"
        size="lg"
        loading={isSubmitting}
        onPress={handleSubmit(onSubmit)}
        style={styles.submit}
      />
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  form: {
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.sm,
  },
});
