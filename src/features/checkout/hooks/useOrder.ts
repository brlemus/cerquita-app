import { useQuery } from '@tanstack/react-query';

import { getOrderById } from '../api/getOrderById';

/** Primer hook de `orders` -- keys reusables por Fase 5 (tracking) / Fase 6 (historial). */
export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ['orders', 'detail', orderId] as const,
    queryFn: () => getOrderById(orderId),
  });
}
