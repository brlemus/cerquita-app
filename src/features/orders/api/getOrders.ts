import { buildQueryString, request, type PaginatedResponse } from '@/shared/api';
import type { Order } from './types';

export type GetOrdersParams = {
  cursor?: string;
  limit?: number;
};

export async function getOrders(params: GetOrdersParams = {}): Promise<PaginatedResponse<Order>> {
  const query = buildQueryString(params);
  const data = await request<PaginatedResponse<Order>>(`/orders${query}`);
  if (!data) {
    throw new Error('GET /orders returned no body');
  }
  return data;
}
