import { useMutation } from '@tanstack/react-query';

import { unregisterDevice } from '../api/unregisterDevice';

export function useUnregisterDevice() {
  return useMutation({ mutationFn: unregisterDevice });
}
