import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ApiRequestError } from '@/shared/api';
import { createReview } from '../api/createReview';
import { useReviewedOrdersStore } from '../store/reviewedOrdersStore';
import { useCreateReview } from './useCreateReview';

jest.mock('../api/createReview');
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory se hoistea, no puede referenciar un import de módulo externo
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
const mockCreateReview = createReview as jest.Mock;

function createClientAndWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, Wrapper };
}

describe('useCreateReview', () => {
  beforeEach(() => {
    useReviewedOrdersStore.setState({ reviewedIds: [] });
    jest.clearAllMocks();
  });

  it('en éxito marca el pedido como reseñado', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockResolvedValueOnce({ id: 'r1', orderId: 'order-1' });

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync({ rating: 5 }));

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
    unmount();
  });

  it('en éxito invalida el detalle y la lista de pedidos', async () => {
    const { queryClient, Wrapper } = createClientAndWrapper();
    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');
    mockCreateReview.mockResolvedValueOnce({ id: 'r1', orderId: 'order-1' });

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => result.current.mutateAsync({ rating: 5 }));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'detail', 'order-1'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] });
    unmount();
  });

  it('en 409 sin reason (backend desactualizado) marca el pedido como reseñado -- fallback legacy', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockRejectedValueOnce(
      new ApiRequestError({ kind: 'conflict', status: 409, message: 'x' }),
    );

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync({ rating: 5 })).rejects.toThrow());

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
    unmount();
  });

  it('en 409 REVIEW_ALREADY_EXISTS marca el pedido como reseñado', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockRejectedValueOnce(
      new ApiRequestError({
        kind: 'conflict',
        status: 409,
        message: 'Ya existe una reseña para este pedido',
        details: { reason: 'REVIEW_ALREADY_EXISTS', orderId: 'order-1' },
      }),
    );

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync({ rating: 5 })).rejects.toThrow());

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
    unmount();
  });

  it('en 409 ORDER_NOT_DELIVERED NO marca el pedido como reseñado', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockRejectedValueOnce(
      new ApiRequestError({
        kind: 'conflict',
        status: 409,
        message: 'Order must be ENTREGADO to be reviewed',
        details: { reason: 'ORDER_NOT_DELIVERED', orderId: 'order-1', status: 'PENDIENTE' },
      }),
    );

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync({ rating: 5 })).rejects.toThrow());

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual([]);
    unmount();
  });

  it('en un error que no es conflict no marca nada', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockRejectedValueOnce(new ApiRequestError({ kind: 'network', message: 'x' }));

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync({ rating: 5 })).rejects.toThrow());

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual([]);
    unmount();
  });
});
