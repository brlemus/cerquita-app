import { useAuth } from '@clerk/clerk-expo';
import { useCallback } from 'react';

import { getFcmToken } from '@/features/push/getFcmToken';
import { useUnregisterDevice } from '@/features/push/hooks/useUnregisterDevice';

const UNREGISTER_TIMEOUT_MS = 2500;

function delay(ms: number): Promise<'timeout'> {
  return new Promise((resolve) => setTimeout(() => resolve('timeout'), ms));
}

/**
 * `DELETE /devices` corre ANTES de `signOut()` -- necesita el bearer
 * token, que `signOut()` invalida. Best-effort real, no solo atrapado en
 * un catch: con `Promise.race` contra un timeout corto, una red mala
 * nunca deja el botón de salir sin salir (precisión pedida al aprobar
 * el plan, docs/phases/phase-5-tracking.md).
 *
 * Referencia estable (`useCallback`) -- `AccountGate` la usa como
 * dependencia de un `useEffect` (auto-logout en 401) y necesita el mismo
 * comportamiento que el `signOut` de Clerk, que ya es estable.
 */
export function useLogout() {
  const { signOut } = useAuth();
  const { mutateAsync: unregisterDeviceAsync } = useUnregisterDevice();

  return useCallback(async () => {
    try {
      const token = await getFcmToken();
      if (token) {
        await Promise.race([
          unregisterDeviceAsync({ fcmToken: token }),
          delay(UNREGISTER_TIMEOUT_MS),
        ]);
      }
    } catch {
      // best-effort: nunca bloquea el logout.
    }
    await signOut();
  }, [signOut, unregisterDeviceAsync]);
}
