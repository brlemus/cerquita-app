import { request } from '@/shared/api';
import type { Business } from './types';

/**
 * 404 tanto si no existe como si `status !== ACTIVE` (PENDING/HIDDEN son
 * indistinguibles de "no existe" según el contrato) -- no se maneja acá,
 * lo mapea `mapError` como `notFound` y lo consume la pantalla.
 */
export async function getBusinessById(id: string): Promise<Business> {
  const data = await request<Business>(`/marketplace/businesses/${id}`);
  if (!data) {
    throw new Error('GET /marketplace/businesses/:id returned no body');
  }
  return data;
}
