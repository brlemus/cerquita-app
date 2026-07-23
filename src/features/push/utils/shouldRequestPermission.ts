import type { PermissionStatus } from 'expo-notifications';

/**
 * Al autenticarse, ¿corresponde disparar `requestPermissionsAsync()`
 * directo (patrón WhatsApp/Instagram -- sin tarjeta intermedia, decisión
 * de producto en docs/phases/phase-5-tracking.md)? Una sola vez por
 * instalación (`attempted`, no por login) y solo si el permiso todavía
 * es pedible -- mismo discriminador `canAskAgain` que el resto del
 * proyecto ya usa: Android no tiene un tercer estado nativo, "nunca
 * preguntado" y "denegado pero todavía pedible" llegan los dos como
 * `denied` (ver commits previos de esta fase).
 */
export function shouldRequestPermission(
  status: PermissionStatus,
  canAskAgain: boolean,
  attempted: string | null,
): boolean {
  return !attempted && status !== 'granted' && canAskAgain;
}
