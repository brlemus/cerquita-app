import { request } from '@/shared/api';
import type { Address } from './types';

export async function setDefaultAddress(addressId: string): Promise<Address> {
  const data = await request<Address>(`/addresses/${addressId}/set-default`, { method: 'PATCH' });
  if (!data) {
    throw new Error('PATCH /addresses/:id/set-default returned no body');
  }
  return data;
}
