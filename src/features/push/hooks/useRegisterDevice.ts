import { useMutation } from '@tanstack/react-query';

import { registerDevice } from '../api/registerDevice';

export function useRegisterDevice() {
  return useMutation({ mutationFn: registerDevice });
}
