import { request } from '@/shared/api';
import type { Address, CreateAddressRequest } from './types';

export async function createAddress(payload: CreateAddressRequest): Promise<Address> {
  const data = await request<Address>('/addresses', { method: 'POST', body: payload });
  if (!data) {
    throw new Error('POST /addresses returned no body');
  }
  return data;
}
