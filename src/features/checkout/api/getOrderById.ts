import { request } from '@/shared/api';
import type { Order } from './types';

export async function getOrderById(orderId: string): Promise<Order> {
  const data = await request<Order>(`/orders/${orderId}`);
  if (!data) {
    throw new Error('GET /orders/:id returned no body');
  }
  return data;
}
