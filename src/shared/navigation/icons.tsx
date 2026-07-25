import Svg, { Circle, Path } from 'react-native-svg';

type TabIconProps = {
  color: string;
};

export function HomeIcon({ color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        d="M4 10.5L11 5l7 5.5V18a1 1 0 01-1 1h-4v-5.5H9V19H5a1 1 0 01-1-1v-7.5z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function OrdersIcon({ color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Path
        d="M5.5 3.5h11a1 1 0 011 1V19l-2.25-1.5L13 19l-2-1.5L9 19l-2.25-1.5L4.5 19V4.5a1 1 0 011-1z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M7.5 8h7M7.5 11.5h7M7.5 15h4"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ProductsIcon({ color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 8l8-4 8 4-8 4z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
      <Path d="M4 8v8l8 4 8-4V8" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    </Svg>
  );
}

export function ProfileIcon({ color }: TabIconProps) {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22">
      <Circle cx="11" cy="7.5" r="3.5" stroke={color} strokeWidth={1.6} fill="none" />
      <Path
        d="M4.5 19c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
