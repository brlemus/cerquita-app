import Svg, { Circle, Line, Path } from 'react-native-svg';

import { colors } from '@/shared/ui';

const STROKE = colors.text.primary;

/** Engranaje -- ícono real de la fila "Notificaciones" en el prototipo (Cerca.dc.html). */
export function GearIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="3" stroke={STROKE} strokeWidth={1.8} fill="none" />
      <Path
        d="M19.4 13a7.97 7.97 0 000-2l2.1-1.6-2-3.5-2.5 1a8 8 0 00-1.7-1L14.9 3h-4l-.4 2.9a8 8 0 00-1.7 1l-2.5-1-2 3.5L6.4 11a7.97 7.97 0 000 2l-2.1 1.6 2 3.5 2.5-1a8 8 0 001.7 1l.4 2.9h4l.4-2.9a8 8 0 001.7-1l2.5 1 2-3.5L19.4 13z"
        stroke={STROKE}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ShieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z"
        stroke={STROKE}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function ChatIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M4 5h16v11H8l-4 4V5z"
        stroke={STROKE}
        strokeWidth={1.8}
        strokeLinejoin="round"
        fill="none"
      />
      <Line x1="8" y1="9" x2="16" y2="9" stroke={STROKE} strokeWidth={1.4} strokeLinecap="round" />
      <Line
        x1="8"
        y1="12.5"
        x2="13"
        y2="12.5"
        stroke={STROKE}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
