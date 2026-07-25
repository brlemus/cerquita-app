import Svg, { Circle, Path } from 'react-native-svg';

import { colors } from './theme';

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

export function ChevronRightIcon({ color = colors.text.secondary }: { color?: string }) {
  return (
    <Svg width={9} height={16} viewBox="0 0 8 14">
      <Path
        d="M1 1l6 6-6 6"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Ícono de "tienda" -- switch a modo owner (prototipo CHOOSER/perfil, docs/design/Cerca.dc.html). */
export function StoreIcon({ color = colors.brand.dark }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 9l1-4h14l1 4M5 9v9h14V9M5 9h14"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Ícono de "carrito" -- switch a modo cliente (prototipo CHOOSER/perfil, docs/design/Cerca.dc.html). */
export function CartIcon({ color = colors.text.primary }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 6h15l-1.5 9h-12L4 3H2"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="8" cy="20" r="1.5" fill={color} />
      <Circle cx="17" cy="20" r="1.5" fill={color} />
    </Svg>
  );
}
