/**
 * Theme derivado 1:1 de docs/design/TOKENS.md. Cualquier cambio de color,
 * tipografía, radio o spacing se hace ahí primero, acá después.
 */

export const colors = {
  brand: {
    default: '#6C4CF1',
    pressed: '#573BD1',
    dark: '#3B2A9E',
    tint: '#EDE9FC',
    tintStrong: '#C3B8F0',
    soft: '#8A6FF4',
  },
  surface: {
    default: '#FFFFFF',
    subtle: '#F7F7F7',
    warm: '#F4F1EE',
    mutedAlt: '#F1F1F1',
  },
  text: {
    primary: '#241C19',
    secondary: '#9A9A9A',
    onBrand: '#FFFFFF',
  },
  border: {
    default: '#EEEEEE',
    strong: '#DDDDDD',
  },
  success: {
    default: '#2F7D48',
    bg: '#E7F1E9',
  },
  danger: {
    default: '#D14343',
  },
} as const;

/** Overlays rgba (scrims/glass) — TOKENS.md no fija valores puntuales, solo rangos. */
export const overlay = {
  dark: (opacity: number) => `rgba(0, 0, 0, ${opacity})`,
  light: (opacity: number) => `rgba(255, 255, 255, ${opacity})`,
} as const;

type FontWeight = '400' | '500' | '600' | '700';

const fontFamily: Record<FontWeight, string> = {
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
};

type TypeVariant = {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  fontWeight: FontWeight;
};

function typeVariant(fontSize: number, weight: FontWeight): TypeVariant {
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.3),
    fontFamily: fontFamily[weight],
    fontWeight: weight,
  };
}

/**
 * Escala tipográfica de TOKENS.md. Cuerpo en peso 600 por default (la UI
 * del prototipo es "bold-first", casi no usa 400/500).
 */
export const typography = {
  caption: typeVariant(11, '600'),
  footnote: typeVariant(12, '600'),
  bodySm: typeVariant(13, '600'),
  bodyMd: typeVariant(14, '600'),
  bodyLg: typeVariant(15, '600'),
  subtitle: typeVariant(16, '700'),
  titleSm: typeVariant(18, '700'),
  titleMd: typeVariant(20, '700'),
  titleLg: typeVariant(24, '700'),
  display: typeVariant(28, '700'),
} as const;

export type TypographyVariant = keyof typeof typography;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  screenPadding: 16,
} as const;

export const theme = {
  colors,
  overlay,
  typography,
  radius,
  spacing,
} as const;

export type Theme = typeof theme;
