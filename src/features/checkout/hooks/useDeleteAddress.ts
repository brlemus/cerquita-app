import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteAddress } from '../api/deleteAddress';
import { ADDRESSES_QUERY_KEY } from './useAddresses';

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
