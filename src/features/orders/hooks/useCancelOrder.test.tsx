import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ApiRequestError } from '@/shared/api';
import { cancelOrder } from '../api/cancelOrder';
import { useCancelOrder } from './useCancelOrder';

jest.mock('../api/cancelOrder');
const mockCancelOrder = cancelOrder as jest.Mock;

function createClientAndWrapper() {
  const queryClient = new QueryClient({
    // gcTime:0 en mutations también -- si no, el mutationCache agenda un
    // setTimeout real con el gcTime default (5min) tras cada mutación, que
    // mantiene el proceso de Jest vivo mucho más allá del test.
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe('useCancelOrder', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('en éxito escribe el pedido actualizado directo al cache, sin refetch', async () => {
    const { queryClient, Wrapper } = createClientAndWrapper();
    const updatedOrder = { id: 'order-1', status: 'CANCELADO' };
    mockCancelOrder.mockResolvedValueOnce(updatedOrder);

    const { result, unmount } = renderHook(() => useCancelOrder('order-1'), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync());

    expect(queryClient.getQueryData(['orders', 'detail', 'order-1'])).toEqual(updatedOrder);
    unmount();
  });

  it('en 409 de carrera invalida el pedido y el status en vez de asumir el resultado', async () => {
    const { queryClient, Wrapper } = createClientAndWrapper();
    queryClient.setQueryData(['orders', 'detail', 'order-1'], {
      id: 'order-1',
      status: 'PENDIENTE',
    });
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    mockCancelOrder.mockRejectedValueOnce(
      new ApiRequestError({ kind: 'conflict', status: 409, message: 'x' }),
    );

    const { result, unmount } = renderHook(() => useCancelOrder('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync()).rejects.toThrow());

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'detail', 'order-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'status', 'order-1'] });
    unmount();
  });

  it('en un error que no es conflict no invalida nada', async () => {
    const { queryClient, Wrapper } = createClientAndWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    mockCancelOrder.mockRejectedValueOnce(new ApiRequestError({ kind: 'network', message: 'x' }));

    const { result, unmount } = renderHook(() => useCancelOrder('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync()).rejects.toThrow());

    expect(invalidateSpy).not.toHaveBeenCalled();
    unmount();
  });
});
