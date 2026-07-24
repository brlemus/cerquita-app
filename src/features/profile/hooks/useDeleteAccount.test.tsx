import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useCartStore } from '@/features/cart/store/cartStore';
import { unregisterDevice } from '@/features/push/api/unregisterDevice';
import { getFcmToken } from '@/features/push/getFcmToken';
import { useReviewedOrdersStore } from '@/features/reviews/store/reviewedOrdersStore';
import { useDeleteAccount } from './useDeleteAccount';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@/features/push/api/unregisterDevice');
// factory explícita: getFcmToken.ts importa @react-native-firebase/messaging
// (módulo nativo no linkeado en test env), mismo criterio que useLogout.test.tsx.
jest.mock('@/features/push/getFcmToken', () => ({ getFcmToken: jest.fn() }));

const mockUnregisterDevice = unregisterDevice as jest.Mock;
const mockGetFcmToken = getFcmToken as jest.Mock;
const mockSignOut = jest.fn();
const mockDeleteUser = jest.fn();

let mockUser: { deleteSelfEnabled: boolean; delete: jest.Mock } | null;

jest.mock('@clerk/clerk-expo', () => ({
  useUser: () => ({ user: mockUser }),
  useAuth: () => ({ signOut: mockSignOut }),
  // getClerkErrorMessage (real, no mockeado) la usa para distinguir errores
  // de la API de Clerk -- en estos tests siempre cae al fallback genérico.
  isClerkAPIResponseError: () => false,
}));

function createClientAndWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe('useDeleteAccount', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDeleteUser.mockResolvedValue(undefined);
    mockUser = { deleteSelfEnabled: true, delete: mockDeleteUser };
    mockGetFcmToken.mockResolvedValue(null);
    useCartStore.getState().clearCart();
  });

  it('canDelete refleja deleteSelfEnabled del usuario de Clerk', () => {
    mockUser = { deleteSelfEnabled: false, delete: mockDeleteUser };
    const { Wrapper } = createClientAndWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });

    expect(result.current.canDelete).toBe(false);
  });

  it('borra en orden: cancela queries antes de user.delete(), y llama signOut() después', async () => {
    const { queryClient, Wrapper } = createClientAndWrapper();
    const cancelSpy = jest.spyOn(queryClient, 'cancelQueries');

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });
    await act(() => result.current.deleteAccount());

    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(cancelSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mockDeleteUser.mock.invocationCallOrder[0],
    );
    expect(mockDeleteUser.mock.invocationCallOrder[0]).toBeLessThan(
      mockSignOut.mock.invocationCallOrder[0],
    );
  });

  it('limpia el carrito y las reseñas locales tras borrar la cuenta', async () => {
    useCartStore.getState().addLine('b1', 'Paletería Lili', {
      productId: 'p1',
      productName: 'Paleta de sombrilla',
      photoUrl: null,
      unitPriceCents: 65,
      quantity: 1,
    });
    useReviewedOrdersStore.getState().markReviewed('order-1');
    const { Wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });
    await act(() => result.current.deleteAccount());

    expect(useCartStore.getState().lines).toEqual([]);
    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual([]);
  });

  it('un fallo al des-registrar el device (FCM) no bloquea el borrado', async () => {
    // Fake timers: `delay(UNREGISTER_TIMEOUT_MS)` deja un setTimeout real
    // corriendo de fondo aunque pierda la carrera contra el `.catch()` del
    // rechazo -- sin esto, Jest se queja de un worker que no cierra limpio
    // (mismo criterio que useLogout.test.tsx).
    jest.useFakeTimers();
    mockGetFcmToken.mockResolvedValue('fcm-token');
    mockUnregisterDevice.mockRejectedValue(new Error('network'));
    const { Wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });
    const deletePromise = act(() => result.current.deleteAccount());
    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    await deletePromise;

    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    jest.useRealTimers();
  });

  it('un error de Clerk en user.delete() se expone en error y no rompe la promesa', async () => {
    mockDeleteUser.mockRejectedValue(new Error('boom'));
    const { Wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });
    await act(() => result.current.deleteAccount());

    expect(result.current.error).toBe('Ocurrió un error. Intentá de nuevo.');
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  it('dos invocaciones concurrentes solo ejecutan user.delete() una vez (guard de concurrencia)', async () => {
    const { Wrapper } = createClientAndWrapper();
    const { result } = renderHook(() => useDeleteAccount(), { wrapper: Wrapper });

    await act(async () => {
      await Promise.all([result.current.deleteAccount(), result.current.deleteAccount()]);
    });

    expect(mockDeleteUser).toHaveBeenCalledTimes(1);
  });
});
