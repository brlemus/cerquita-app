import type { PaginatedResponse } from '@/shared/api';

/**
 * Nunca confiar solo en `nextCursor` -- el contrato lo describe como opaco,
 * no garantiza que sea `null` cuando no hay más páginas. `hasNextPage` es
 * la fuente de verdad.
 */
export function getNextCursorParam<T>(page: PaginatedResponse<T>): string | undefined {
  return page.hasNextPage ? (page.nextCursor ?? undefined) : undefined;
}
