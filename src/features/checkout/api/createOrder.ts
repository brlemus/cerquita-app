import { request } from '@/shared/api';
import type { Order } from '@/features/orders/api/types';
import type { CreateOrderPayload } from './types';

export async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string,
): Promise<Order> {
  const data = await request<Order>('/orders', {
    method: 'POST',
    body: payload,
    headers: { 'Idempotency-Key': idempotencyKey },
  });
  if (!data) {
    throw new Error('POST /orders returned no body');
  }
  return data;
}
