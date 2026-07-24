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
  return { Wrapper };
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

  it('en 409 (ya reseñado) también marca el pedido como reseñado', async () => {
    const { Wrapper } = createClientAndWrapper();
    mockCreateReview.mockRejectedValueOnce(
      new ApiRequestError({ kind: 'conflict', status: 409, message: 'x' }),
    );

    const { result, unmount } = renderHook(() => useCreateReview('order-1'), { wrapper: Wrapper });
    await act(() => expect(result.current.mutateAsync({ rating: 5 })).rejects.toThrow());

    expect(useReviewedOrdersStore.getState().reviewedIds).toEqual(['order-1']);
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
