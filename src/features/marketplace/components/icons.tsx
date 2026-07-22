import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/shared/ui';

export function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx="8" cy="8" r="6" stroke={colors.text.secondary} strokeWidth={1.6} fill="none" />
      <Line
        x1="12.5"
        y1="12.5"
        x2="16.5"
        y2="16.5"
        stroke={colors.text.secondary}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function BackIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Path
        d="M11 3.5L5.5 9l5.5 5.5"
        stroke={colors.text.primary}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
