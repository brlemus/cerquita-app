import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, radius, spacing } from './theme';
import { Text } from './Text';

export type StepperProps = {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Deshabilita el botón de incrementar (ej. tope de stock). El de decrementar sigue activo salvo `disabled`. */
  atMax?: boolean;
  /** Deshabilita todo el control (ej. opción sin stock). */
  disabled?: boolean;
};

const BUTTON_SIZE = 36;
const HIT_SLOP = 4; // BUTTON_SIZE + 2*HIT_SLOP = 44pt, el mínimo táctil

export function Stepper({
  value,
  onIncrement,
  onDecrement,
  atMax = false,
  disabled,
}: StepperProps) {
  return (
    <View style={styles.row}>
      <StepperButton
        icon="minus"
        onPress={onDecrement}
        disabled={disabled}
        accessibilityLabel="Quitar uno"
      />
      <Text variant="subtitle" style={styles.value}>
        {value}
      </Text>
      <StepperButton
        icon="plus"
        onPress={onIncrement}
        disabled={disabled || atMax}
        accessibilityLabel="Agregar uno"
      />
    </View>
  );
}

function StepperButton({
  icon,
  onPress,
  disabled,
  accessibilityLabel,
}: {
  icon: 'plus' | 'minus';
  onPress: () => void;
  disabled?: boolean;
  accessibilityLabel: string;
}) {
  const isPlus = icon === 'plus';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={HIT_SLOP}
      style={[
        styles.button,
        isPlus ? styles.buttonPlus : styles.buttonMinus,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Svg width={16} height={16} viewBox="0 0 24 24">
        <Path
          d={isPlus ? 'M12 5v14M5 12h14' : 'M5 12h14'}
          stroke={isPlus ? colors.text.onBrand : colors.text.primary}
          strokeWidth={2.6}
          strokeLinecap="round"
        />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonMinus: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.default,
  },
  buttonPlus: {
    backgroundColor: colors.brand.default,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  value: {
    minWidth: 20,
    textAlign: 'center',
  },
});
