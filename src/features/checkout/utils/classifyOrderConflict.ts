export type OrderConflictKind =
  'stockInsufficient' | 'businessClosed' | 'minOrderNotMet' | 'unknown';

/**
 * Discriminador ESTRUCTURAL (forma de `details`) de los tres 409 reales
 * de POST /orders -- todos comparten `code: "CONFLICT"`, confirmado
 * leyendo create-order.handler.ts / stock-adjuster.ts en cerquita-api
 * (ver docs/API_CONTRACT.md). Gap de backend anotado: debería traer un
 * `reason` estable en vez de depender de la ausencia/forma de `details`.
 */
export function classifyOrderConflict(
  details: Record<string, unknown> | undefined,
): OrderConflictKind {
  if (!details) return 'minOrderNotMet';
  if ('variantOptionId' in details || 'productId' in details) return 'stockInsufficient';
  if ('businessId' in details && 'isOpen' in details) return 'businessClosed';
  return 'unknown';
}

export type StockConflictLine = { productId?: string; variantOptionId?: string };

/** Extrae la línea identificada por un 409 de stock -- undefined si `details` no tiene la forma esperada. */
export function extractStockConflictLine(
  details: Record<string, unknown> | undefined,
): StockConflictLine | undefined {
  if (!details) return undefined;
  const { productId, variantOptionId } = details;
  if (typeof variantOptionId === 'string') return { variantOptionId };
  if (typeof productId === 'string') return { productId };
  return undefined;
}
