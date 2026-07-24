import { request } from '@/shared/api';
import type { RegisterDeviceRequest } from './types';

/** Upsert por token, idempotente (docs/API_CONTRACT.md) -- 201 vacío. */
export async function registerDevice(payload: RegisterDeviceRequest): Promise<void> {
  await request('/devices', { method: 'POST', body: payload });
}
