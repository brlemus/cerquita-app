import { useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { getClerkErrorMessage } from '../clerkErrorMessage';
import { BackButton } from '../components/BackButton';
import { getResetPasswordAvailability, getSocialOnlyMessage } from '../resetPasswordFactor';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';
import {
  Button,
  KeyboardAwareScreen,
  PressableOpacity,
  spacing,
  Text,
  TextField,
} from '@/shared/ui';

/**
 * Punto de entrada del reset -- pide el email, y según lo que devuelva
 * Clerk para ese identificador (`getResetPasswordAvailability`) manda el
 * código y navega, o explica por qué no puede (cuenta social-only o sin
 * ningún método de recuperación soportado). `signIn` queda vivo para
 * `ResetPasswordScreen`, mismo patrón que `SignInScreen` → `SecondFactorScreen`.
 */
export function ForgotPasswordScreen() {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    if (!isLoaded) {
      return;
    }
    setFormError(null);
    try {
      const attempt = await signIn.create({ identifier: values.email });
      const availability = getResetPasswordAvailability(attempt.supportedFirstFactors);

      if (availability.kind === 'available') {
        await signIn.prepareFirstFactor({
          strategy: 'reset_password_email_code',
          emailAddressId: availability.emailAddressId,
        });
        router.push('/(auth)/reset-password');
        return;
      }

      if (availability.kind === 'social-only') {
        setFormError(getSocialOnlyMessage(availability.providers));
        return;
      }

      setFormError('Esta cuenta no puede recuperar su contraseña así. Contactá soporte.');
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  return (
    <KeyboardAwareScreen
      contentContainerStyle={styles.content}
      header={
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
        </View>
      }
    >
      <View style={styles.header}>
        <Text variant="titleMd">¿Olvidaste tu contraseña?</Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          Te mandamos un código de 6 dígitos para crear una nueva.
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="email"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Email"
              placeholder="tu@correo.com"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              keyboardType="email-address"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.email?.message}
            />
          )}
        />
        {formError ? (
          <Text variant="bodySm" color="danger">
            {formError}
          </Text>
        ) : null}
        <Button
          title="Enviar código"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submit}
        />
        <Link href="/(auth)/sign-in" asChild>
          <PressableOpacity accessibilityRole="button" style={styles.footer}>
            <Text variant="bodySm" color="brand">
              Volver al inicio de sesión
            </Text>
          </PressableOpacity>
        </Link>
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
  },
  content: {
    paddingHorizontal: spacing.xxl,
  },
  header: {
    paddingTop: spacing.xl,
    gap: spacing.sm,
  },
  subtitle: {
    lineHeight: 20,
  },
  form: {
    marginTop: spacing.xxl,
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  footer: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
});
