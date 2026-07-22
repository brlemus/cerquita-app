import { useEffect, useRef } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius as radiusTokens } from './theme';

export type SkeletonProps = {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Caja con pulso de opacidad. `Animated` nativo de RN -- `reanimated` no
 * está instalada y no se justifica para un pulso simple.
 */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = radiusTokens.sm,
  style,
  testID,
}: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surface.mutedAlt,
          opacity,
        },
        style,
      ]}
    />
  );
}
