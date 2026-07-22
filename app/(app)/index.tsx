import { useAuth } from '@clerk/clerk-expo';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthMe } from '@/features/auth/hooks/useAuthMe';
import { Button, colors, spacing, Text } from '@/shared/ui';

// Home placeholder — la Fase 2 lo reemplaza por el marketplace real.
export default function Home() {
  const { signOut } = useAuth();
  const { data } = useAuthMe();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text variant="titleMd">Hola{data?.name ? `, ${data.name}` : ''}</Text>
        <Text variant="bodyMd" color="secondary">
          {data?.email}
        </Text>
        <Button title="Cerrar sesión" onPress={() => signOut()} style={styles.button} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.surface.default,
  },
  content: {
    flex: 1,
    padding: spacing.screenPadding,
    gap: spacing.sm,
  },
  button: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
});
