import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { getOrderStatus } from '../api/getOrderStatus';
import { getPollInterval, useOrderStatus } from './useOrderStatus';

jest.mock('../api/getOrderStatus');
const mockGetOrderStatus = getOrderStatus as jest.Mock;

describe('getPollInterval', () => {
  it('devuelve el intervalo mientras el estado no sea terminal', () => {
    expect(getPollInterval('PENDIENTE')).toBe(5000);
    expect(getPollInterval('PREPARANDO')).toBe(5000);
    expect(getPollInterval('EN_CAMINO')).toBe(5000);
  });

  it('devuelve false (detiene el polling) en estados terminales', () => {
    expect(getPollInterval('ENTREGADO')).toBe(false);
    expect(getPollInterval('CANCELADO')).toBe(false);
  });

  it('devuelve el intervalo si todavía no hay data (primer tick)', () => {
    expect(getPollInterval(undefined)).toBe(5000);
  });
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useOrderStatus', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('llama con etag null en el primer fetch', async () => {
    mockGetOrderStatus.mockResolvedValueOnce({
      data: { status: 'PENDIENTE', updatedAt: 't1' },
      etag: 'W/"PENDIENTE-t1"',
    });

    const { result, unmount } = renderHook(() => useOrderStatus('order-1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(result.current.data).toEqual({ status: 'PENDIENTE', updatedAt: 't1' }),
    );
    expect(mockGetOrderStatus).toHaveBeenCalledWith('order-1', null);

    // Desmonta para cancelar el refetchInterval real (5s) -- si no, el
    // timer sobrevive al test y dispara warnings de act() fuera de turno.
    unmount();
  });

  it('reenvía el etag recibido en el fetch siguiente', async () => {
    mockGetOrderStatus.mockResolvedValueOnce({
      data: { status: 'PENDIENTE', updatedAt: 't1' },
      etag: 'W/"PENDIENTE-t1"',
    });

    const { result, unmount } = renderHook(() => useOrderStatus('order-1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeTruthy());

    mockGetOrderStatus.mockResolvedValueOnce({ data: null, etag: 'W/"PENDIENTE-t1"' });
    await result.current.refetch();

    expect(mockGetOrderStatus).toHaveBeenLastCalledWith('order-1', 'W/"PENDIENTE-t1"');
    unmount();
  });

  it('un 304 (data: null) conserva el último valor conocido en vez de pisarlo', async () => {
    mockGetOrderStatus.mockResolvedValueOnce({
      data: { status: 'PREPARANDO', updatedAt: 't1' },
      etag: 'W/"PREPARANDO-t1"',
    });

    const { result, unmount } = renderHook(() => useOrderStatus('order-1'), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.data).toBeTruthy());

    mockGetOrderStatus.mockResolvedValueOnce({ data: null, etag: 'W/"PREPARANDO-t1"' });
    await result.current.refetch();

    expect(result.current.data).toEqual({ status: 'PREPARANDO', updatedAt: 't1' });
    unmount();
  });
});
