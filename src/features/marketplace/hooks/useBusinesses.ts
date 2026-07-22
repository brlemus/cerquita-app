import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { getBusinesses } from '../api/getBusinesses';
import { getNextCursorParam } from '../api/pagination';

export type UseBusinessesParams = {
  search?: string;
  platformCategoryId?: string | null;
};

/**
 * `keepPreviousData` evita que cambiar de chip de categoría o el término de
 * búsqueda debounced blanquee toda la lista a skeleton en cada tap -- la
 * página anterior queda mientras llega la nueva.
 */
export function useBusinesses({ search, platformCategoryId }: UseBusinessesParams = {}) {
  const normalizedSearch = search?.trim() ?? '';
  const normalizedCategoryId = platformCategoryId ?? null;

  return useInfiniteQuery({
    queryKey: [
      'marketplace',
      'businesses',
      'list',
      { search: normalizedSearch, platformCategoryId: normalizedCategoryId },
    ] as const,
    queryFn: ({ pageParam }) =>
      getBusinesses({
        cursor: pageParam,
        search: normalizedSearch || undefined,
        platformCategoryId: normalizedCategoryId ?? undefined,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: getNextCursorParam,
    placeholderData: keepPreviousData,
  });
}
