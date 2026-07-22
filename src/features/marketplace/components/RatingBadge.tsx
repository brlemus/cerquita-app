import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors, radius, spacing, Text } from '@/shared/ui';

export type RatingBadgeProps = {
  avgRating: number | null;
  reviewCount: number;
};

function StarIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 20 20">
      <Path
        fill={colors.brand.default}
        d="M10 1.5l2.59 5.86 6.41.56-4.85 4.27 1.45 6.31L10 15.4l-5.6 3.1 1.45-6.31L1 7.92l6.41-.56z"
      />
    </Svg>
  );
}

/** "★ 4.9 (128)" cuando hay reviews, pill "Nuevo" cuando avgRating es null. */
export function RatingBadge({ avgRating, reviewCount }: RatingBadgeProps) {
  if (avgRating === null) {
    return (
      <View style={styles.newPill}>
        <Text variant="footnote" color="secondary">
          Nuevo
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <StarIcon />
      <Text variant="bodySm">
        {avgRating.toFixed(1)} ({reviewCount})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newPill: {
    backgroundColor: colors.surface.mutedAlt,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
});
