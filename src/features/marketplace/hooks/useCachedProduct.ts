import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import type { PaginatedResponse } from '@/shared/api';
import type { Product } from '../api/types';

/**
 * No existe GET /products/:id en el contrato -- el producto ya está en
 * cache de la infinite query de productos del negocio (solo se llega acá
 * tocando una fila ya renderizada, con Business Detail montado debajo en
 * el stack). Cero red, cero loading state en el caso normal.
 */
export function useCachedProduct(businessId: string, productId: string): Product | undefined {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const data = queryClient.getQueryData<{ pages: PaginatedResponse<Product>[] }>([
      'marketplace',
      'businesses',
      'detail',
      businessId,
      'products',
    ]);
    return data?.pages.flatMap((page) => page.data).find((product) => product.id === productId);
  }, [queryClient, businessId, productId]);
}
