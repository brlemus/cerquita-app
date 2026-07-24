import { request } from '@/shared/api';
import type { Order } from './types';

/** `POST /orders/:id/cancel` -- solo válido en `PENDIENTE`, sin body. */
export async function cancelOrder(orderId: string): Promise<Order> {
  const data = await request<Order>(`/orders/${orderId}/cancel`, { method: 'POST' });
  if (!data) {
    throw new Error('POST /orders/:id/cancel returned no body');
  }
  return data;
}
