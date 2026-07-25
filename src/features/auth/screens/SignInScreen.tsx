import { useSignIn } from '@clerk/clerk-expo';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StatusBar, StyleSheet, View, type TextInput } from 'react-native';

import { getClerkErrorMessage, getIncompleteSignInMessage } from '../clerkErrorMessage';
import { LoginHeader } from '../components/LoginHeader';
import { LoginPrimaryButton } from '../components/LoginPrimaryButton';
import { SocialSignInButtons } from '../components/SocialSignInButtons';
import { findEmailCodeSecondFactor } from '../findEmailCodeSecondFactor';
import { signInSchema, type SignInFormValues } from '../schemas';
import {
  colors,
  KeyboardAwareScreen,
  PressableOpacity,
  spacing,
  Text,
  TextField,
} from '@/shared/ui';

export function SignInScreen() {
  const router = useRouter();
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

  // El header violeta llega hasta atrás de la status bar (edges={['bottom']}
  // más abajo) -- iconos oscuros por default quedarían invisibles ahí.
  // Se revierte solo al desenfocar (vuelve a la próxima pantalla, blanca).
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBarStyle('light-content');
      return () => StatusBar.setBarStyle('dark-content');
    }, []),
  );

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

      if (__DEV__) {
        // Investigación en curso (docs/phases/chore-brand-v2-login-splash.md):
        // el mismo usuario recibe needs_second_factor en Android pero no
        // en iOS. Incondicional a propósito -- antes solo se logueaba en
        // la rama "incompleto", así que el caso real de iOS (resuelve
        // directo a `complete`) nunca se veía; con esto se compara qué
        // devuelve el servidor en cada plataforma para el mismo intento.
        console.log('[auth] signIn.create() -- attempt tras password:', {
          platform: Platform.OS,
          status: attempt.status,
          identifier: attempt.identifier,
          supportedFirstFactors: attempt.supportedFirstFactors,
          supportedSecondFactors: attempt.supportedSecondFactors,
        });
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

      // Estado no soportado en esta fase (ej. TOTP -- needs_second_factor
      // sin email_code disponible, backlog post-MVP). Mensaje accionable
      // por status, nunca genérico cuando lo conocemos.
      setFormError(getIncompleteSignInMessage(attempt.status));
    } catch (error) {
      setFormError(getClerkErrorMessage(error));
    }
  }

  return (
    <KeyboardAwareScreen edges={['bottom']}>
      {/* Adentro del scroll, no en el slot `header` -- a propósito: un
          header FIJO de 280px afuera del ScrollView no deja lugar para el
          teclado en Android (bug real de gate visual). Acá puede
          desplazarse como el resto del contenido cuando hace falta. */}
      <LoginHeader />
      <View style={styles.sheet}>
        <Text variant="titleLgHeavy">¡Hola de nuevo!</Text>
        <Text variant="bodyMd" style={styles.subtitle}>
          Todo lo que querés, cerquita.
        </Text>

        <View style={styles.form}>
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                variant="filled"
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
                variant="filled"
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
        </View>

        {formError ? (
          <Text variant="bodySm" color="danger" style={styles.formError}>
            {formError}
          </Text>
        ) : null}

        <LoginPrimaryButton
          title="Iniciar sesión"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
          style={styles.submit}
        />

        <SocialSignInButtons onError={setFormError} />

        <Link href="/(auth)/sign-up" asChild>
          <PressableOpacity style={styles.footer}>
            <Text variant="bodyMd" color="secondary" style={styles.footerText}>
              ¿No tenés cuenta?{' '}
              <Text variant="bodyMd" color="brand">
                Crear cuenta
              </Text>
            </Text>
          </PressableOpacity>
        </Link>
      </View>
    </KeyboardAwareScreen>
  );
}

const styles = StyleSheet.create({
  sheet: {
    // Sin flex:1 -- ahora vive adentro del ScrollView (ver arriba), se
    // dimensiona por contenido como cualquier otro hijo. El fondo blanco
    // coincide con el de la pantalla (KeyboardAwareScreen), así que un
    // resto corto en pantallas altas no se nota.
    //
    // Bug real de gate visual: `sheet` arrancaba justo donde termina
    // `LoginHeader`, sin superposición -- el recorte de la esquina
    // redondeada no tenía violeta detrás para revelar (blanco de la
    // curva sobre blanco del fondo de pantalla), invisible aunque el
    // radio se aplicara bien. `marginTop` negativo (= al radio) hace que
    // `sheet` pise los últimos 32px del header violeta, así la curva
    // corta contra violeta de verdad. `paddingTop` ya era 32 (spacing.xxxl)
    // -- se cancela con el margen, el contenido (saludo, inputs) no se
    // corre ni un pixel, solo el fondo/curva "sube" a superponerse.
    marginTop: -spacing.xxxl,
    backgroundColor: colors.surface.default,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  form: {
    // 26px del spec -- no está en la escala de spacing del theme (mismo
    // criterio ya usado en TextField para el padding de 14px).
    marginTop: 26,
    gap: spacing.lg,
  },
  formError: {
    marginTop: spacing.sm,
  },
  submit: {
    marginTop: spacing.xxl,
  },
  footer: {
    // Ya no `marginTop: 'auto'` -- sin flex:1 en `sheet` no hay espacio
    // sobrante que consumir (ver nota de `sheet`). Separación fija,
    // mismo ritmo que el resto del form.
    marginTop: spacing.xxl,
  },
  footerText: {
    textAlign: 'center',
  },
});
