import { useQuery } from '@tanstack/react-query';

import { getAddresses } from '../api/getAddresses';

export const ADDRESSES_QUERY_KEY = ['checkout', 'addresses', 'list'] as const;

export function useAddresses() {
  return useQuery({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: () => getAddresses({ limit: 50 }),
  });
}
