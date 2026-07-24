import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, Text } from '@/shared/ui';

const BUTTON_HEIGHT = 54;
const SHADOW_OFFSET = 4;
const PRESSED_TRANSLATE = 3;

export type LoginPrimaryButtonProps = Omit<PressableProps, 'children' | 'disabled' | 'style'> & {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  /**
   * Va al `View` externo (wrapper), no al `Pressable` interno -- ver el
   * bug real que esto arregla en el comentario de `styles.wrapper` más
   * abajo. `PressableStateCallbackType` no aplica acá a propósito: el
   * único estado visual (pressed) ya lo maneja el componente internamente.
   */
  style?: StyleProp<ViewStyle>;
};

/**
 * Botón "sombra plana" del login (dirección 8b) — pill + sombra sólida sin
 * blur (un `View` offset, no el shadow nativo de RN que sale difuminado) +
 * estado pressed que se hunde: el `View` de sombra queda fijo en
 * `top: 4`, el botón se traslada 3px al presionar, así el remanente
 * visible da exactamente los "0 1px" del spec sin animar la sombra por
 * separado.
 *
 * Aparte de `shared/ui/Button` a propósito — hoy es un momento de marca
 * puntual del auth (el resto de la app sigue con `Button`). Si este
 * estilo se extiende a más CTAs, se promueve a variant de `Button` — no
 * se duplica una tercera vez.
 */
export function LoginPrimaryButton({
  title,
  loading = false,
  disabled = false,
  style,
  ...rest
}: LoginPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.shadow} />
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        disabled={isDisabled}
        style={(state) => [
          styles.button,
          state.pressed && !isDisabled && styles.buttonPressed,
          isDisabled && styles.disabled,
        ]}
        {...rest}
      >
        {loading ? (
          <ActivityIndicator color={colors.text.onBrand} />
        ) : (
          <Text color="onBrand" style={styles.label}>
            {title}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // Bug real del gate visual (iOS): el `style` del caller (ej.
    // marginTop) estaba llegando al Pressable interno -- eso desplazaba
    // el pill DENTRO del wrapper sin mover `shadow` (que se posiciona
    // absoluta relativa al wrapper, no al pill), así que el margen
    // externo rompía la alineación pill/sombra y la sombra asomaba por
    // arriba. `style` ahora entra acá, en el contenedor externo, dejando
    // pill y sombra siempre alineados entre sí sin importar el margen
    // que pida el caller.
    paddingBottom: SHADOW_OFFSET,
  },
  shadow: {
    position: 'absolute',
    top: SHADOW_OFFSET,
    left: 0,
    right: 0,
    height: BUTTON_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.brand.shadow,
  },
  button: {
    height: BUTTON_HEIGHT,
    borderRadius: radius.full,
    backgroundColor: colors.brand.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ translateY: PRESSED_TRANSLATE }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: 'Inter_800ExtraBold',
    fontWeight: '800',
    fontSize: 16,
  },
});
