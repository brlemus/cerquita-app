import { Pressable, StyleSheet, type PressableProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, radius } from './theme';

export type QuickAddButtonProps = Omit<PressableProps, 'children'> & {
  size?: number;
};

/** Botón circular "+" -- agregado rápido sin abrir el detalle del producto. */
export function QuickAddButton({ size = 30, style, ...rest }: QuickAddButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Agregar"
      hitSlop={8}
      style={(state) => [
        styles.button,
        { width: size, height: size },
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24">
        <Path
          d="M12 5v14M5 12h14"
          stroke={colors.text.onBrand}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.md,
    backgroundColor: colors.brand.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.brand.pressed,
  },
});
