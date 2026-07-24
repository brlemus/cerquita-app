import { getConflictReason, type OrderConflictReason } from '@/shared/api';

export type OrderConflictKind =
  'stockInsufficient' | 'productInactive' | 'businessClosed' | 'minOrderNotMet' | 'unknown';

const REASON_TO_KIND: Partial<Record<OrderConflictReason, OrderConflictKind>> = {
  BUSINESS_NOT_ACCEPTING_ORDERS: 'businessClosed',
  BELOW_MINIMUM_ORDER: 'minOrderNotMet',
  PRODUCT_NOT_ACTIVE: 'productInactive',
  VARIANT_OPTION_NOT_ACTIVE: 'productInactive',
  INSUFFICIENT_STOCK: 'stockInsufficient',
};

/**
 * `details.reason` (catálogo del contrato, cerquita-api PR #16) es el
 * discriminador primario. Fallback a la heurística estructural legacy solo
 * si `reason` viene ausente -- defensivo ante un backend desactualizado,
 * no se espera en producción tras este deploy.
 */
export function classifyOrderConflict(
  details: Record<string, unknown> | undefined,
): OrderConflictKind {
  const reason = getConflictReason(details);
  if (reason) {
    return REASON_TO_KIND[reason] ?? 'unknown';
  }
  if (!details) return 'minOrderNotMet';
  if ('variantOptionId' in details || 'productId' in details) return 'stockInsufficient';
  if ('businessId' in details && 'isOpen' in details) return 'businessClosed';
  return 'unknown';
}

export type OrderConflictLine = { productId?: string; variantOptionId?: string };

/**
 * Extrae la línea identificada por un 409 de stock o de producto/variante
 * inactivos -- ambas familias reportan la misma forma `{variantOptionId}`/
 * `{productId}`. `undefined` si `details` no tiene ninguno de los dos.
 */
export function extractConflictLine(
  details: Record<string, unknown> | undefined,
): OrderConflictLine | undefined {
  if (!details) return undefined;
  const { productId, variantOptionId } = details;
  if (typeof variantOptionId === 'string') return { variantOptionId };
  if (typeof productId === 'string') return { productId };
  return undefined;
}
