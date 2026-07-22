import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { UpdateAddressRequest } from '../api/types';
import { updateAddress } from '../api/updateAddress';
import { ADDRESSES_QUERY_KEY } from './useAddresses';

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ addressId, payload }: { addressId: string; payload: UpdateAddressRequest }) =>
      updateAddress(addressId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
