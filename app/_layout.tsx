import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PushProvider } from '@/features/push/components/PushProvider';
import { configureAuth } from '@/shared/api';
import { initQueryFocusManager } from '@/shared/api/queryFocusManager';
import { tokenCache } from '@/shared/auth/tokenCache';

SplashScreen.preventAutoHideAsync();
initQueryFocusManager();
// Requerido por el flujo OAuth de Clerk (useSSO/expo-auth-session) para
// cerrar sesiones de browser colgadas al volver a la app.
WebBrowser.maybeCompleteAuthSession();

const queryClient = new QueryClient();

const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string | undefined;

/** Cablea el seam `configureAuth` del API client al `getToken` de Clerk. */
function AuthConfigurator({ children }: PropsWithChildren) {
  const { getToken } = useAuth();

  useEffect(() => {
    configureAuth(() => getToken());

    // TEMPORAL -- gate manual de push (Checkpoint C2), sacar después.
    // __DEV__ evita que esto sobreviva a un build de producción incluso
    // si se olvida quitar. TTL del token: 60s default de Clerk -- copiarlo
    // de Metro y pegarlo en Swagger enseguida.
    if (__DEV__) {
      getToken().then((token) => {
        console.log('[DEV token]', token);
      });
    }
  }, [getToken]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <AuthConfigurator>
          <PushProvider>
            <SafeAreaProvider>
              <Stack screenOptions={{ headerShown: false }} />
            </SafeAreaProvider>
          </PushProvider>
        </AuthConfigurator>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
