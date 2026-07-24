import { getConflictReason } from '@/shared/api';

export type CancelConflictKind =
  'alreadyDelivered' | 'alreadyCancelled' | 'statusChanged' | 'unknown';

/**
 * `details.reason` del 409 de `POST /orders/:id/cancel`. El customer solo
 * puede cancelar desde `PENDIENTE` -- si el pedido ya está en un estado
 * terminal, `INVALID_STATUS_TRANSITION` siempre trae `details.from` en
 * `ENTREGADO` o `CANCELADO` (son los únicos estados sin arista de salida;
 * `PREPARANDO`/`EN_CAMINO` dan 403, no 409 -- el customer ahí no está
 * habilitado, pero la arista existe). Fallback sin `reason`: mismo copy
 * genérico que ya mostraba la pantalla antes de este chore.
 */
export function classifyCancelConflict(
  details: Record<string, unknown> | undefined,
): CancelConflictKind {
  const reason = getConflictReason(details);
  if (reason === 'STATUS_CHANGED_CONCURRENTLY') {
    return 'statusChanged';
  }
  if (reason === 'INVALID_STATUS_TRANSITION') {
    if (details?.from === 'ENTREGADO') return 'alreadyDelivered';
    if (details?.from === 'CANCELADO') return 'alreadyCancelled';
    return 'unknown';
  }
  return 'unknown';
}
