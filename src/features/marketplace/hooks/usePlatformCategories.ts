import { useQuery } from '@tanstack/react-query';

import { getPlatformCategories } from '../api/getPlatformCategories';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** `staleTime` explícito -- sin esto, refetchea en cada focus de pantalla datos que casi no cambian en una sesión. */
export function usePlatformCategories() {
  return useQuery({
    queryKey: ['marketplace', 'categories'] as const,
    queryFn: getPlatformCategories,
    staleTime: TEN_MINUTES_MS,
  });
}
