import { useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View, type TextInput } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { getClerkErrorMessage, getIncompleteSignInMessage } from '../clerkErrorMessage';
import { SocialSignInButtons } from '../components/SocialSignInButtons';
import { signInSchema, type SignInFormValues } from '../schemas';
import { Button, colors, KeyboardAwareScreen, spacing, Text, TextField } from '@/shared/ui';

export function SignInScreen() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [formError, setFormError] = useState<string | null>(null);
  const passwordRef = useRef<TextInput>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: SignInFormValues) {
    if (!isLoaded) {
      return;
    }
    setFormError(null);
    try {
      const attempt = await signIn.create({
        identifier: values.email,
        password: values.password,
      });
      if (attempt.status === 'complete') {
        await setActive({ session: attempt.createdSessionId });
      } else {
        // Estado no soportado en esta fase (ej. MFA — needs_second_factor,
        // backlog post-MVP). Mensaje accionable por status, nunca genérico
        // cuando lo conocemos.
        if (__DEV__) {
          console.log('[auth] Sign-in incompleto -- attempt completo:', {
            status: attempt.status,
            identifier: attempt.identifier,
            supportedFirstFactors: attempt.supportedFirstFactors,
            supportedSecondFactors: attempt.supportedSecondFactors,
          });
        }
        setFormError(getIncompleteSignInMessage(attempt.status));
      }
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  return (
    <KeyboardAwareScreen contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.brandTile}>
          <Svg width={36} height={36} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"
              stroke="#fff"
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Circle cx={12} cy={10} r={2.4} fill="#fff" />
          </Svg>
        </View>
        <Text variant="display">Cerquita</Text>
        <Text variant="bodyMd" color="secondary" style={styles.subtitle}>
          Iniciá sesión para entrar a tu cuenta.
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
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
              textContentType="password"
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
          title="Iniciar sesión"
          size="lg"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submit}
        />
      </View>

      <SocialSignInButtons onError={setFormError} />

      <Link href="/(auth)/sign-up" style={styles.footer}>
        <Text variant="bodyMd" color="secondary" style={styles.footerText}>
          ¿No tenés cuenta?{' '}
          <Text variant="bodyMd" color="brand">
            Crear cuenta
          </Text>
        </Text>
      </Link>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.xxl,
  },
  header: {
    paddingTop: spacing.xxxl * 3,
    alignItems: 'center',
    gap: spacing.md,
  },
  brandTile: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.brand.default,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.default,
    shadowOpacity: 0.34,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 250,
  },
  form: {
    marginTop: spacing.xxxl,
    gap: spacing.md,
  },
  submit: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: 'auto',
    paddingBottom: spacing.xxxl + spacing.sm,
  },
  footerText: {
    textAlign: 'center',
  },
});
