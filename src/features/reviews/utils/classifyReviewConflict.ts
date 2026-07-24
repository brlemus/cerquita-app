import { getConflictReason } from '@/shared/api';

export type ReviewConflictKind = 'alreadyReviewed' | 'orderNotDelivered' | 'unknown';

/**
 * `details.reason` del 409 de `POST /orders/:orderId/reviews`. Sin `reason`
 * (backend desactualizado) se asume `alreadyReviewed` -- preserva el
 * comportamiento histórico del cliente, que trataba todo 409 de reseña como
 * "ya reseñado".
 */
export function classifyReviewConflict(
  details: Record<string, unknown> | undefined,
): ReviewConflictKind {
  const reason = getConflictReason(details);
  if (!reason || reason === 'REVIEW_ALREADY_EXISTS') {
    return 'alreadyReviewed';
  }
  if (reason === 'ORDER_NOT_DELIVERED') {
    return 'orderNotDelivered';
  }
  return 'unknown';
}
