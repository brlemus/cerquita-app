import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, spacing } from '@/shared/ui';

export type StarRatingInputProps = {
  value: number;
  onChange?: (value: number) => void;
  /** Solo muestra el valor, sin permitir tocar -- estado "gracias" de OrderReviewCard. */
  readOnly?: boolean;
};

const STAR_PATH =
  'M10 1.5l2.59 5.86 6.41.56-4.85 4.27 1.45 6.31L10 15.4l-5.6 3.1 1.45-6.31L1 7.92l6.41-.56z';
const STARS = [1, 2, 3, 4, 5];

function Star({ filled }: { filled: boolean }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 20 20">
      <Path fill={filled ? colors.brand.default : colors.border.strong} d={STAR_PATH} />
    </Svg>
  );
}

/** Reusa la forma de estrella de `RatingBadge` (marketplace) -- misma marca, contexto tappable acá. */
export function StarRatingInput({ value, onChange, readOnly = false }: StarRatingInputProps) {
  if (readOnly) {
    return (
      <View style={styles.row} accessibilityLabel={`${value} de 5 estrellas`}>
        {STARS.map((star) => (
          <View key={star} style={styles.star}>
            <Star filled={star <= value} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      {STARS.map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange?.(star)}
          style={styles.star}
          accessibilityRole="button"
          accessibilityLabel={`${star} estrella${star > 1 ? 's' : ''}`}
          accessibilityState={{ selected: star <= value }}
        >
          <Star filled={star <= value} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  star: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
