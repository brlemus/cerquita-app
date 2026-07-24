import { ApiRequestError, mapError, requestRaw } from '@/shared/api';
import type { OrderStatusPoll } from './types';

/**
 * `GET /orders/:id/status` -- polling con `If-None-Match`/`ETag`
 * (docs/API_CONTRACT.md, límite propio de 30/min). `etag: null` en la
 * primera llamada; a partir de ahí se reenvía el que devolvió la
 * respuesta anterior. 304 -> `data: null` ("sin cambios", nunca un error).
 */
export async function getOrderStatus(
  orderId: string,
  etag: string | null,
): Promise<{ data: OrderStatusPoll | null; etag: string | null }> {
  const { response, body } = await requestRaw(`/orders/${orderId}/status`, {
    headers: etag ? { 'If-None-Match': etag } : {},
  });

  if (response.status === 304) {
    return { data: null, etag };
  }
  if (!response.ok) {
    throw new ApiRequestError(mapError(response.status, body));
  }
  return { data: body as OrderStatusPoll, etag: response.headers.get('ETag') };
}
