import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/shared/ui';
import { CerquitaSticker } from './CerquitaSticker';

const HEADER_HEIGHT = 280;
/** Spec: "escala font 28px" del wordmark (64px en el canvas local del sticker) -- ≈0.44×. */
const STICKER_SCALE = 28 / 64;
const STICKER_WIDTH = 640 * STICKER_SCALE;
const STICKER_HEIGHT = 320 * STICKER_SCALE;
/** Offsets ópticos del spec: compensan el badge/pin sobresaliendo del centro geométrico. */
const STICKER_OFFSET_X = 26;
const STICKER_OFFSET_Y = 34;
/**
 * Ancho de referencia para la ruta punteada -- no hay `d` exacto provisto
 * para el contexto del header (el de los masters splash/brand-square es
 * para otro canvas), se derivó a mano contra login-final-referencia.png.
 * `width="100%"` en el `Svg` estira este viewBox al ancho real del
 * dispositivo, igual criterio de resiliencia que ya usa el splash.
 */
const ROUTE_VIEWBOX_WIDTH = 390;

/**
 * Header violeta del login (dirección 8b), 280px fijos desde el borde
 * superior REAL (incluye status bar) -- `SignInScreen` pasa
 * `edges={['bottom']}` a `KeyboardAwareScreen` para que este `View`
 * arranque en y=0, no detrás de un padding de safe area. Sticker + ruta,
 * ambos "anclados al header" (spec del README), no a la pantalla.
 */
export function LoginHeader() {
  return (
    <View style={styles.header}>
      <Svg
        width="100%"
        height={HEADER_HEIGHT}
        viewBox={`0 0 ${ROUTE_VIEWBOX_WIDTH} ${HEADER_HEIGHT}`}
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Path
          d="M 25 84 C 150 90, 260 115, 300 155"
          stroke={colors.brand.soft}
          strokeWidth={4.5}
          strokeLinecap="round"
          strokeDasharray="0.5 13"
          fill="none"
        />
      </Svg>
      <View
        style={{
          transform: [{ translateX: STICKER_OFFSET_X }, { translateY: STICKER_OFFSET_Y }],
        }}
      >
        <CerquitaSticker width={STICKER_WIDTH} height={STICKER_HEIGHT} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: colors.brand.default,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
