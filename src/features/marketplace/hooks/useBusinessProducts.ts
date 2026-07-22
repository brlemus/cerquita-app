import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { getBusinessProducts } from '../api/getBusinessProducts';
import { getNextCursorParam } from '../api/pagination';

export function useBusinessProducts(businessId: string) {
  return useInfiniteQuery({
    queryKey: ['marketplace', 'businesses', 'detail', businessId, 'products'] as const,
    queryFn: ({ pageParam }) => getBusinessProducts(businessId, { cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextCursorParam,
    placeholderData: keepPreviousData,
  });
}
