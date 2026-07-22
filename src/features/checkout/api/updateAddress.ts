import { request } from '@/shared/api';
import type { Address, UpdateAddressRequest } from './types';

export async function updateAddress(
  addressId: string,
  payload: UpdateAddressRequest,
): Promise<Address> {
  const data = await request<Address>(`/addresses/${addressId}`, {
    method: 'PATCH',
    body: payload,
  });
  if (!data) {
    throw new Error('PATCH /addresses/:id returned no body');
  }
  return data;
}
