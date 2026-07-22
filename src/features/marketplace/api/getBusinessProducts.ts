import { buildQueryString, request, type PaginatedResponse } from '@/shared/api';
import type { Product } from './types';

export type GetBusinessProductsParams = {
  cursor?: string;
  limit?: number;
};

export async function getBusinessProducts(
  businessId: string,
  params: GetBusinessProductsParams = {},
): Promise<PaginatedResponse<Product>> {
  const query = buildQueryString(params);
  const data = await request<PaginatedResponse<Product>>(
    `/marketplace/businesses/${businessId}/products${query}`,
  );
  if (!data) {
    throw new Error('GET /marketplace/businesses/:id/products returned no body');
  }
  return data;
}
