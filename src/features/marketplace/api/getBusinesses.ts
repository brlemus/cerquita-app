import { buildQueryString, request, type PaginatedResponse } from '@/shared/api';
import type { Business } from './types';

export type GetBusinessesParams = {
  cursor?: string;
  limit?: number;
  platformCategoryId?: string;
  search?: string;
};

export async function getBusinesses(
  params: GetBusinessesParams = {},
): Promise<PaginatedResponse<Business>> {
  const query = buildQueryString(params);
  const data = await request<PaginatedResponse<Business>>(`/marketplace/businesses${query}`);
  if (!data) {
    throw new Error('GET /marketplace/businesses returned no body');
  }
  return data;
}
