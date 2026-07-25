import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, radius } from '@/shared/ui';

export type BackButtonProps = {
  onPress: () => void;
};

/**
 * Botón circular de "volver" -- mismo ícono y tamaño en los flujos con
 * header propio (verificación, segundo factor, registro, reset de
 * contraseña). No incluye la barra contenedora: cada pantalla arma su
 * propio `topBar` (ej. SignUp lleva el título al lado).
 */
export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Volver"
      onPress={onPress}
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
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
