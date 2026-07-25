import { useSignIn } from '@clerk/clerk-expo';
import type { ResetPasswordEmailCodeFactor } from '@clerk/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

import { getClerkErrorMessage, getIncompleteSignInMessage } from '../clerkErrorMessage';
import { BackButton } from '../components/BackButton';
import { CodeField } from '../components/CodeField';
import { findEmailCodeSecondFactor } from '../findEmailCodeSecondFactor';
import { useResendCooldown } from '../hooks/useResendCooldown';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import {
  Button,
  KeyboardAwareScreen,
  PressableOpacity,
  spacing,
  Text,
  TextField,
} from '@/shared/ui';

/**
 * Segundo paso del reset -- código + contraseña nueva en un solo submit
 * (`ResetPasswordEmailCodeAttempt.password`, ver Decisión 2 del plan de
 * fase). `signIn` es el mismo recurso vivo que `ForgotPasswordScreen` ya
 * preparó, así que acá se lee directo (`supportedFirstFactors`) sin
 * threadear nada por route params -- mismo patrón que `SecondFactorScreen`
 * con `signIn.supportedSecondFactors`.
 */
export function ResetPasswordScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const { cooldown, restart } = useResendCooldown();
  const [isResending, setIsResending] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '' },
  });

  const resetFactor = signIn?.supportedFirstFactors?.find(
    (factor): factor is ResetPasswordEmailCodeFactor =>
      factor.strategy === 'reset_password_email_code',
  );

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!isLoaded) {
      return;
    }
    setFormError(null);
    try {
      let attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: values.code,
        password: values.password,
      });

      // Defensivo: `ResetPasswordEmailCodeAttempt.password` (@clerk/shared)
      // documenta que mandar la contraseña acá resuelve directo a
      // `complete`, pero si el servidor igual devuelve el paso intermedio
      // del flujo de dos llamadas, se completa con `resetPassword` sin
      // pedirle el código de nuevo al usuario.
      if (attempt.status === 'needs_new_password') {
        attempt = await signIn.resetPassword({ password: values.password });
      }

      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
        return;
      }

      const emailFactor = findEmailCodeSecondFactor(attempt.status, attempt.supportedSecondFactors);
      if (emailFactor) {
        await signIn.prepareSecondFactor({
          strategy: 'email_code',
          emailAddressId: emailFactor.emailAddressId,
        });
        router.push('/(auth)/second-factor');
        return;
      }

      setFormError(getIncompleteSignInMessage(attempt.status));
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  async function onResend() {
    if (!isLoaded || cooldown > 0 || !resetFactor) {
      return;
    }
    setFormError(null);
    setIsResending(true);
    try {
      await signIn.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: resetFactor.emailAddressId,
      });
      restart();
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    } finally {
      setIsResending(false);
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
        <Text variant="titleMd">Creá tu contraseña nueva</Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          {resetFactor?.safeIdentifier
            ? `Te enviamos un código de 6 dígitos a ${resetFactor.safeIdentifier}.`
            : 'Te enviamos un código de 6 dígitos a tu email.'}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <CodeField
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.code?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Contraseña nueva"
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
          title="Cambiar contraseña"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submit}
        />
        <PressableOpacity
          accessibilityRole="button"
          disabled={cooldown > 0 || isResending}
          onPress={onResend}
          style={styles.resend}
        >
          <Text variant="bodySm" color={cooldown > 0 ? 'secondary' : 'brand'}>
            {cooldown > 0 ? `Reenviar código (${cooldown}s)` : 'Reenviar código'}
          </Text>
        </PressableOpacity>
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
  resend: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
});
