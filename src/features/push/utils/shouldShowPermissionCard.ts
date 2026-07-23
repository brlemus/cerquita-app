import type { PermissionStatus } from 'expo-notifications';

/**
 * Regla exacta de cuándo mostrar `NotificationPermissionCard`: solo si
 * el SO nunca preguntó (`undetermined`) Y nuestra propia tarjeta tampoco
 * lo hizo todavía. Si el usuario ya la vio (tocó "Ahora no" o
 * "Activar"), `prompted` queda seteado y no se vuelve a mostrar aunque
 * el status siga `undetermined` -- decisión de producto ("no insistir
 * en cada pedido", ver docs/phases/phase-5-tracking.md), no un bug.
 */
export function shouldShowPermissionCard(
  status: PermissionStatus,
  prompted: string | null,
): boolean {
  return status === 'undetermined' && !prompted;
}
