import { buildQueryString, request, type PaginatedResponse } from '@/shared/api';
import type { Address } from './types';

export type GetAddressesParams = {
  cursor?: string;
  limit?: number;
};

/**
 * Sin useInfiniteQuery -- un customer tiene realistically pocas
 * direcciones; pedir un límite generoso de una vez es proporcional.
 */
export async function getAddresses(
  params: GetAddressesParams = {},
): Promise<PaginatedResponse<Address>> {
  const query = buildQueryString(params);
  const data = await request<PaginatedResponse<Address>>(`/addresses${query}`);
  if (!data) {
    throw new Error('GET /addresses returned no body');
  }
  return data;
}
