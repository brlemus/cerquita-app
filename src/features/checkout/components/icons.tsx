import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from '@/shared/ui';

export function PinIcon({ color = colors.brand.default }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M12 21s-7-5.5-7-11a7 7 0 0114 0c0 5.5-7 11-7 11z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="12" cy="10" r="2" fill={color} />
    </Svg>
  );
}

export function ChevronRightIcon() {
  return (
    <Svg width={9} height={16} viewBox="0 0 8 14">
      <Path
        d="M1 1l6 6-6 6"
        stroke={colors.text.secondary}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
