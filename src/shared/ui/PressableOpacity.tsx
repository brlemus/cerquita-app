import { Pressable, type PressableProps } from 'react-native';

export type PressableOpacityProps = PressableProps;

const PRESSED_STYLE = { opacity: 0.6 };

/**
 * Drop-in de `Pressable` para links de texto "pelados" (sin caja de
 * botón): agrega feedback de pressed por opacidad, componiendo sobre
 * cualquier `style` que ya traiga el caller -- mismo patrón que
 * `Button.tsx` (`typeof style === 'function' ? style(state) : style`).
 * Los elementos CON caja (botones, filas, cards) ya tienen su propio
 * patrón de pressed por color/fondo -- este componente es específico
 * para texto sin relleno, donde no hay un color de fondo que cambiar.
 */
export function PressableOpacity({ style, disabled, ...rest }: PressableOpacityProps) {
  return (
    <Pressable
      disabled={disabled}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && !disabled && PRESSED_STYLE,
      ]}
      {...rest}
    />
  );
}
