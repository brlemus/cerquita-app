import { request } from '@/shared/api';
import type { MyBusiness } from './types';

export async function getMyBusiness(): Promise<MyBusiness> {
  const data = await request<MyBusiness>('/business/me');
  if (!data) {
    throw new Error('GET /business/me returned no body');
  }
  return data;
}
