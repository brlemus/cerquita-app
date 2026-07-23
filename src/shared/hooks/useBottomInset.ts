import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * OBLIGATORIO para el `paddingBottom`/`marginBottom` de cualquier
 * elemento anclado al borde inferior de una pantalla (footer, CTA
 * flotante, botón fijo). Android con edge-to-edge (default desde Expo
 * SDK 55) deja que el contenido dibuje detrás de la barra de gestos del
 * sistema -- sin sumar `insets.bottom`, el tap cae en la barra del SO,
 * no en el elemento (bug real de gate visual, Fase 5 --
 * docs/phases/phase-5-tracking.md). `extra` es el espaciado de diseño
 * que ya tenías pensado (`spacing.lg`, etc.), no un reemplazo.
 */
export function useBottomInset(extra: number): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}
