import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Stack } from 'expo-router';

import { AccountGate } from '@/features/auth/components/AccountGate';

export default function AppLayout() {
  const { isLoaded, isSignedIn } = useAuth();

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
