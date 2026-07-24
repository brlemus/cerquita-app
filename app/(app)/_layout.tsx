import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { AccountGate } from '@/features/auth/components/AccountGate';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  // Baseline para el 100% de las pantallas de acá adentro (fondo blanco).
  // Sin esto, un usuario que ya estaba logueado (nunca pasa por
  // SignInScreen, que es el único lugar que hoy toca el status bar)
  // arrancaría con el default estático claro de Info.plist -- pensado
  // para el login violeta -- e invisible sobre blanco. Este layout se
  // monta una sola vez por sesión autenticada, sin necesidad de
  // useFocusEffect (no se "desenfoca" mientras se navega adentro).
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
  }, []);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <AccountGate>
      <Stack screenOptions={{ headerShown: false }} />
    </AccountGate>
  );
}
