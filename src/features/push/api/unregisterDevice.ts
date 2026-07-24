import { request } from '@/shared/api';
import type { UnregisterDeviceRequest } from './types';

/** El token va en el body, no en la URL (no queda en logs de acceso) -- 204. */
export async function unregisterDevice(payload: UnregisterDeviceRequest): Promise<void> {
  await request('/devices', { method: 'DELETE', body: payload });
}
