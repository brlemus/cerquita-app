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
import { useEffect, type PropsWithChildren } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureAuth } from '@/shared/api';
import { tokenCache } from '@/shared/auth/tokenCache';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey as string | undefined;

/** Cablea el seam `configureAuth` del API client al `getToken` de Clerk. */
function AuthConfigurator({ children }: PropsWithChildren) {
  const { getToken } = useAuth();

  useEffect(() => {
    configureAuth(() => getToken());
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
          <SafeAreaProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </SafeAreaProvider>
        </AuthConfigurator>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
