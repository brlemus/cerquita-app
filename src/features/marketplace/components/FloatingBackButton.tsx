import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { radius, spacing } from '@/shared/ui';
import { BackIcon } from './icons';

/**
 * Posicionado con useSafeAreaInsets, no un SafeAreaView de borde superior --
 * eso rompería el full-bleed de la banda de cover que hay debajo.
 */
export function FloatingBackButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Volver"
      style={[styles.button, { top: insets.top + spacing.md }]}
    >
      <BackIcon />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    left: spacing.screenPadding,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
