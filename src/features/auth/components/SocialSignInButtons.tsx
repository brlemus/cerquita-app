import { useSSO } from '@clerk/clerk-expo';
import type { OAuthStrategy } from '@clerk/types';
import {
  AppleAuthenticationButton,
  AppleAuthenticationButtonStyle,
  AppleAuthenticationButtonType,
} from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import Svg, { Path } from 'react-native-svg';

import { getClerkErrorMessage } from '../clerkErrorMessage';
import { colors, radius, spacing, Text } from '@/shared/ui';

const BUTTON_HEIGHT = 50;

/**
 * Recomendado por Expo/expo-auth-session: precalienta el navegador in-app
 * en Android para que el OAuth abra más rápido. No-op en iOS, inocuo.
 */
function useWarmUpBrowser() {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 18 18">
      <Path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <Path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <Path
        fill="#FBBC05"
        d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
      />
      <Path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </Svg>
  );
}

export type SocialSignInButtonsProps = {
  onError?: (message: string) => void;
};

/**
 * Botones de Google y Apple vía OAuth de Clerk (useSSO) — mismo componente
 * para Sign In y Sign Up, Clerk resuelve cuenta nueva vs existente. Apple
 * solo se muestra en iOS (Apple no tiene sentido en Android y la guideline
 * 4.8 no lo exige ahí). El botón de Apple usa el asset oficial de
 * expo-apple-authentication por cumplimiento visual, pero dispara el mismo
 * flujo useSSO que Google -- no el hook nativo (ver docs/phases/
 * phase-1.5-social-login.md, sección Apple, para el porqué y el plan de
 * migración de Fase 9).
 */
export function SocialSignInButtons({ onError }: SocialSignInButtonsProps) {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [loadingStrategy, setLoadingStrategy] = useState<OAuthStrategy | null>(null);

  async function handleSSO(strategy: OAuthStrategy) {
    setLoadingStrategy(strategy);
    onError?.('');
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
      // createdSessionId nulo sin excepción = el usuario canceló el
      // flujo (cerró el navegador) -- no es un error, no se muestra nada.
    } catch (error) {
      onError?.(getClerkErrorMessage(error));
    } finally {
      setLoadingStrategy(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text variant="footnote" color="secondary">
          O
        </Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continuar con Google"
        disabled={loadingStrategy !== null}
        onPress={() => handleSSO('oauth_google')}
        style={({ pressed }) => [
          styles.googleButton,
          pressed && styles.googleButtonPressed,
          loadingStrategy !== null && styles.disabled,
        ]}
      >
        <GoogleIcon />
        <Text variant="bodyMd" style={styles.googleLabel}>
          Continuar con Google
        </Text>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <AppleAuthenticationButton
          buttonType={AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius.lg}
          style={styles.appleButton}
          onPress={() => handleSSO('oauth_apple')}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.default,
  },
  googleButton: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.default,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  googleButtonPressed: {
    backgroundColor: colors.surface.subtle,
  },
  googleLabel: {
    color: colors.text.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  appleButton: {
    height: BUTTON_HEIGHT,
  },
});
