import type { PermissionStatus } from 'expo-notifications';

/**
 * Regla exacta de cuándo mostrar `NotificationPermissionCard`.
 *
 * NO alcanza con `status === 'undetermined'`: Android no tiene un
 * tercer estado nativo (el permiso del SO es binario, granted/denied) --
 * "nunca preguntado" y "preguntado y denegado pero todavía pedible"
 * llegan los DOS como `status: 'denied'` en esta API (confirmado contra
 * expo-modules-core y la doc real, no supuesto). El discriminador real
 * es `canAskAgain`: `true` significa que el diálogo del SO todavía se
 * puede mostrar (nunca preguntado, o denegado sin "no preguntar de
 * nuevo"); `false` significa que hay que mandar a Ajustes. Regla:
 * "pedible" = no está `granted` Y se puede volver a preguntar. Nuestro
 * propio `prompted` (tocó "Ahora no"/"Activar" alguna vez) sigue
 * ganando por encima de todo -- "no insistir en cada pedido"
 * (docs/phases/phase-5-tracking.md), no un bug.
 */
export function shouldShowPermissionCard(
  status: PermissionStatus,
  canAskAgain: boolean,
  prompted: string | null,
): boolean {
  return status !== 'granted' && canAskAgain && !prompted;
}
