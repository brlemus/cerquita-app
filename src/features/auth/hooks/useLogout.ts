import { useAuth } from '@clerk/clerk-expo';
import { useQueryClient } from '@tanstack/react-query';
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
 * el plan, docs/phases/phase-5-tracking.md). El `.catch` sobre la
 * mutación es necesario aparte del try/catch de afuera: si pierde la
 * carrera contra el timeout queda huérfana, y un rechazo tardío (ej. el
 * token ya inválido tras `signOut()`) sería un unhandled rejection real,
 * no atrapado por nada -- bug encontrado en el gate de Fase 5.
 *
 * `cancelQueries` + `clear` antes de `signOut()`: corta cualquier query
 * activa (ej. el polling de `useOrderStatus`) para que no quede un fetch
 * en vuelo que llame `getToken()` recién después de que la sesión ya se
 * cerró, y limpia del cache los datos autenticados al instante.
 *
 * Referencia estable (`useCallback`) -- `AccountGate` la usa como
 * dependencia de un `useEffect` (auto-logout en 401) y necesita el mismo
 * comportamiento que el `signOut` de Clerk, que ya es estable.
 *
 * Segunda instancia del unhandled rejection "You are signed out"
 * (backlog de Fase 5, docs/phases/phase-5-tracking.md): el try/catch de
 * arriba solo cubría el des-registro de FCM -- `cancelQueries`/`clear`/
 * `signOut()` quedaban sin protección, y ningún caller (`AccountGate`,
 * `ProfileScreen`) atrapa la promesa que devuelve `useLogout()` (la usan
 * fire-and-forget). Si `signOut()` rechaza -- ej. un segundo tap en
 * "Cerrar sesión" mientras el primer `signOut()` todavía no terminó de
 * invalidar la sesión -- esa excepción quedaba sin capturar en ningún
 * lado. `isLoggingOut` es a nivel módulo (no un `useRef`) porque
 * `useLogout()` se llama desde dos componentes distintos que pueden
 * disparar un logout casi al mismo tiempo (`AccountGate` por 401 +
 * tap manual) -- un guard por instancia no alcanzaría.
 */
let isLoggingOut = false;

export function useLogout() {
  const { signOut } = useAuth();
  const { mutateAsync: unregisterDeviceAsync } = useUnregisterDevice();
  const queryClient = useQueryClient();

  return useCallback(async () => {
    if (isLoggingOut) {
      return;
    }
    isLoggingOut = true;
    try {
      try {
        const token = await getFcmToken();
        if (token) {
          await Promise.race([
            unregisterDeviceAsync({ fcmToken: token }).catch(() => undefined),
            delay(UNREGISTER_TIMEOUT_MS),
          ]);
        }
      } catch {
        // best-effort: nunca bloquea el logout.
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
    } catch (error) {
      if (__DEV__) {
        console.log('[auth] logout -- excepción no atrapada por nada más:', error);
      }
    } finally {
      isLoggingOut = false;
    }
  }, [signOut, unregisterDeviceAsync, queryClient]);
}
