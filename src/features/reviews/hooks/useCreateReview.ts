import { useMutation } from '@tanstack/react-query';

import { ApiRequestError } from '@/shared/api';
import { createReview } from '../api/createReview';
import type { CreateReviewPayload } from '../api/types';
import { useReviewedOrdersStore } from '../store/reviewedOrdersStore';
import { classifyReviewConflict } from '../utils/classifyReviewConflict';

/**
 * En éxito o en 409 `REVIEW_ALREADY_EXISTS` (ya reseñado -- por ejemplo
 * desde otro device, o backend viejo sin `reason` -- ver
 * classifyReviewConflict) se marca como reseñado: es un backstop del store
 * local, no un error a mostrar. `ORDER_NOT_DELIVERED` NO marca -- es un
 * error real (antes de este chore ambos se trataban igual, un bug real).
 */
export function useCreateReview(orderId: string) {
  const markReviewed = useReviewedOrdersStore((state) => state.markReviewed);

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(orderId, payload),
    onSuccess: () => {
      markReviewed(orderId);
    },
    onError: (error) => {
      if (
        error instanceof ApiRequestError &&
        error.error.kind === 'conflict' &&
        classifyReviewConflict(error.error.details) === 'alreadyReviewed'
      ) {
        markReviewed(orderId);
      }
    },
  });
}
