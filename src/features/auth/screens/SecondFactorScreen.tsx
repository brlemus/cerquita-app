import { useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { getClerkErrorMessage } from '../clerkErrorMessage';
import { verificationSchema, type VerificationFormValues } from '../schemas';
import {
  Button,
  colors,
  KeyboardAwareScreen,
  PressableOpacity,
  radius,
  spacing,
  Text,
  TextField,
} from '@/shared/ui';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * Segundo factor por email (`email_code` -- el único que la app soporta,
 * ver `findEmailCodeSecondFactor`). `SignInScreen` ya disparó
 * `prepareSecondFactor` antes de navegar acá; esta pantalla lee
 * `signIn.supportedSecondFactors` directo (recurso vivo compartido de
 * Clerk entre pantallas, sin threadearlo por route params) -- mismo
 * patrón que `VerifyEmailScreen` con `signUp.emailAddress`.
 */
export function SecondFactorScreen() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [isResending, setIsResending] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: '' },
  });

  useEffect(() => {
    if (cooldown === 0) {
      return;
    }
    const id = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const emailFactor = signIn?.supportedSecondFactors?.find((f) => f.strategy === 'email_code');

  async function onSubmit(values: VerificationFormValues) {
    if (!isLoaded) {
      return;
    }
    setFormError(null);
    try {
      const attempt = await signIn.attemptSecondFactor({
        strategy: 'email_code',
        code: values.code,
      });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
      } else {
        if (__DEV__) {
          console.log('[auth] Segundo factor incompleto -- status:', attempt.status);
        }
        setFormError('No pudimos verificar el código. Intentá de nuevo.');
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  async function onResend() {
    if (!isLoaded || cooldown > 0 || !emailFactor) {
      return;
    }
    setFormError(null);
    setIsResending(true);
    try {
      await signIn.prepareSecondFactor({
        strategy: 'email_code',
        emailAddressId: emailFactor.emailAddressId,
      });
      setCooldown(RESEND_COOLDOWN_SECONDS);
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
        </View>
      }
    >
      <View style={styles.header}>
        <Text variant="titleMd">Confirmá tu identidad</Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          {emailFactor?.safeIdentifier
            ? `Te enviamos un código a ${emailFactor.safeIdentifier} para confirmar tu identidad.`
            : 'Te enviamos un código a tu email para confirmar tu identidad.'}
        </Text>
      </View>

      <View style={styles.form}>
        <Controller
          control={control}
          name="code"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextField
              label="Código de verificación"
              placeholder="123456"
              keyboardType="number-pad"
              maxLength={6}
              textContentType={Platform.OS === 'ios' ? 'oneTimeCode' : undefined}
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={errors.code?.message}
            />
          )}
        />
        {formError ? (
          <Text variant="bodySm" color="danger">
            {formError}
          </Text>
        ) : null}
        <Button
          title="Confirmar"
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
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
