import { useMutation } from '@tanstack/react-query';

import { submitFeedback } from '../api/submitFeedback';

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: submitFeedback,
  });
}
