import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { unregisterDevice } from '@/features/push/api/unregisterDevice';
import { getFcmToken } from '@/features/push/getFcmToken';
import { useLogout } from './useLogout';

jest.mock('@/features/push/api/unregisterDevice');
// Factory explícita: getFcmToken.ts importa @react-native-firebase/messaging
// (módulo nativo no linkeado en test env) -- un automock de jest.mock()
// sin factory igual evalúa el módulo real para inferir la forma.
jest.mock('@/features/push/getFcmToken', () => ({ getFcmToken: jest.fn() }));

const mockUnregisterDevice = unregisterDevice as jest.Mock;
const mockGetFcmToken = getFcmToken as jest.Mock;
const mockSignOut = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ signOut: mockSignOut }),
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

describe('useLogout', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('cancela y limpia las queries activas antes de cerrar sesión', async () => {
    mockGetFcmToken.mockResolvedValue(null);
    const { queryClient, Wrapper } = createClientAndWrapper();
    const cancelSpy = jest.spyOn(queryClient, 'cancelQueries');
    const clearSpy = jest.spyOn(queryClient, 'clear');

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });
    await act(() => result.current());

    expect(cancelSpy).toHaveBeenCalled();
    expect(clearSpy).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(cancelSpy.mock.invocationCallOrder[0]).toBeLessThan(
      mockSignOut.mock.invocationCallOrder[0],
    );
  });

  it('un rechazo tardío de la mutación de unregister (perdedora de la carrera contra el timeout) no produce un unhandled rejection', async () => {
    jest.useFakeTimers();
    const unhandledRejections: unknown[] = [];
    const onUnhandledRejection = (reason: unknown) => unhandledRejections.push(reason);
    process.on('unhandledRejection', onUnhandledRejection);

    mockGetFcmToken.mockResolvedValue('fcm-token');
    // Nunca se resuelve dentro de la ventana del timeout -- pierde la
    // carrera -- y rechaza recién después, ya con signOut() en curso.
    let rejectUnregister: (error: unknown) => void = () => {};
    mockUnregisterDevice.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectUnregister = reject;
      }),
    );
    const { Wrapper } = createClientAndWrapper();

    const { result } = renderHook(() => useLogout(), { wrapper: Wrapper });
    const logoutPromise = result.current();

    await act(async () => {
      jest.advanceTimersByTime(2500);
      await Promise.resolve();
    });
    await act(async () => {
      rejectUnregister(new Error('token ya inválido tras signOut'));
      // deja correr microtasks para que el rechazo huérfano se procese
      await Promise.resolve();
      await Promise.resolve();
    });

    await expect(logoutPromise).resolves.toBeUndefined();
    expect(mockSignOut).toHaveBeenCalled();

    process.off('unhandledRejection', onUnhandledRejection);
    jest.useRealTimers();
    expect(unhandledRejections).toEqual([]);
  });
});
