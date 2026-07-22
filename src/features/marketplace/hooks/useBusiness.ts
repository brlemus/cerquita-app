import { useQuery } from '@tanstack/react-query';

import { getBusinessById } from '../api/getBusinessById';

export function useBusiness(businessId: string) {
  return useQuery({
    queryKey: ['marketplace', 'businesses', 'detail', businessId] as const,
    queryFn: () => getBusinessById(businessId),
  });
}
