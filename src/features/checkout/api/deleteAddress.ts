import { request } from '@/shared/api';

export async function deleteAddress(addressId: string): Promise<void> {
  await request<void>(`/addresses/${addressId}`, { method: 'DELETE' });
}
