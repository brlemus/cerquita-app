import { useInfiniteQuery } from '@tanstack/react-query';

import { getNextCursorParam } from '@/features/marketplace/api/pagination';
import { getOrders } from '../api/getOrders';

/** Historial del customer, orden cronológico (el backend ya lo devuelve así). */
export function useOrders() {
  return useInfiniteQuery({
    queryKey: ['orders', 'list'] as const,
    queryFn: ({ pageParam }) => getOrders({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextCursorParam,
  });
}
