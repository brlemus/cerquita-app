import { useMutation, useQueryClient } from '@tanstack/react-query';

import { setDefaultAddress } from '../api/setDefaultAddress';
import { ADDRESSES_QUERY_KEY } from './useAddresses';

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
