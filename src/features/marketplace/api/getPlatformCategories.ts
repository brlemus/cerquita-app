import { request } from '@/shared/api';
import type { PlatformCategory } from './types';

/** No paginado (docs/API_CONTRACT.md) -- devuelve el array completo. */
export async function getPlatformCategories(): Promise<PlatformCategory[]> {
  const data = await request<PlatformCategory[]>('/platform/categories');
  if (!data) {
    throw new Error('GET /platform/categories returned no body');
  }
  return data;
}
