import { useAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { getClerkErrorMessage } from '@/features/auth/clerkErrorMessage';
import { useCartStore } from '@/features/cart/store/cartStore';
import { getFcmToken } from '@/features/push/getFcmToken';
import { useUnregisterDevice } from '@/features/push/hooks/useUnregisterDevice';
import { PERMISSION_REQUEST_ATTEMPTED_KEY } from '@/features/push/permissionRequestKey';
import { useReviewedOrdersStore } from '@/features/reviews/store/reviewedOrdersStore';

const UNREGISTER_TIMEOUT_MS = 2500;

function delay(ms: number): Promise<'timeout'> {
  return new Promise((resolve) => setTimeout(() => resolve('timeout'), ms));
}

// A nivel módulo, no `useState` -- mismo motivo que `isLoggingOut` en
// useLogout.ts: dos taps rápidos sobre el CTA (antes de que el primer
// `setIsPending(true)` llegue a comprometerse) verían `isPending` en `false`
// en ambos closures y dispararían `user.delete()` dos veces. Acción
// irreversible: no vale la pena confiar solo en el estado de React acá.
let isDeleting = false;

export type UseDeleteAccountResult = {
  /** `false` solo cuando Clerk confirma que el self-service deletion está apagado. */
  canDelete: boolean;
  isPending: boolean;
  error: string | null;
  deleteAccount: () => Promise<void>;
};

/**
 * Modelado sobre useLogout.ts: mismo guard de concurrencia a nivel módulo,
 * mismo criterio de "best-effort nunca bloquea" para el des-registro de
 * FCM. `isPending` (estado de React) solo maneja el spinner del botón; la
 * concurrencia real la corta `isDeleting`.
 *
 * Orden, no arbitrario: (1) DELETE /devices con el bearer todavía válido,
 * (2) cancelQueries() antes de borrar -- si queda una query en vuelo (ej.
 * el polling de tracking) devolvería 401 y AccountGate dispararía su
 * auto-logout compitiendo con este flujo, (3) user.delete(), (4) limpieza
 * local, (5) signOut() en su propio try/catch -- puede rechazar con "You
 * are signed out" si Clerk ya cerró la sesión al borrar
 * (docs/phases/chore-logout-unhandled-rejection.md).
 */
export function useDeleteAccount(): UseDeleteAccountResult {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { mutateAsync: unregisterDeviceAsync } = useUnregisterDevice();
  const queryClient = useQueryClient();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = user?.deleteSelfEnabled !== false;

  useEffect(() => {
    if (user && !canDelete && __DEV__) {
      console.warn(
        '[profile] useDeleteAccount -- deleteSelfEnabled está en false en el dashboard de Clerk',
      );
    }
  }, [user, canDelete]);

  const deleteAccount = useCallback(async () => {
    if (isDeleting || !user) {
      return;
    }
    isDeleting = true;
    setIsPending(true);
    setError(null);
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
        // best-effort: nunca bloquea el borrado.
      }

      await queryClient.cancelQueries();
      await user.delete();

      useCartStore.getState().clearCart();
      useReviewedOrdersStore.getState().clearReviewed();
      queryClient.clear();
      await AsyncStorage.removeItem(PERMISSION_REQUEST_ATTEMPTED_KEY);

      try {
        await signOut();
      } catch (signOutError) {
        if (__DEV__) {
          console.log(
            '[profile] useDeleteAccount -- signOut() rechazó tras el borrado:',
            signOutError,
          );
        }
      }
    } catch (deleteError) {
      setError(getClerkErrorMessage(deleteError));
    } finally {
      isDeleting = false;
      setIsPending(false);
    }
  }, [user, unregisterDeviceAsync, queryClient, signOut]);

  return { canDelete, isPending, error, deleteAccount };
}
