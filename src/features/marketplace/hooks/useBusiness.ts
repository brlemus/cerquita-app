import { useQuery } from '@tanstack/react-query';

import { getBusinessById } from '../api/getBusinessById';

/** `businessId: null` deshabilita la query (ej. carrito todavía sin negocio). */
export function useBusiness(businessId: string | null) {
  return useQuery({
    queryKey: ['marketplace', 'businesses', 'detail', businessId ?? 'none'] as const,
    queryFn: () => getBusinessById(businessId!),
    enabled: businessId !== null,
  });
}
