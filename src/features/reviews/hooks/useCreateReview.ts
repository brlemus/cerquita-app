import { useMutation } from '@tanstack/react-query';

import { ApiRequestError } from '@/shared/api';
import { createReview } from '../api/createReview';
import type { CreateReviewPayload } from '../api/types';
import { useReviewedOrdersStore } from '../store/reviewedOrdersStore';

/**
 * En éxito o en 409 (ya reseñado -- por ejemplo desde otro device) se marca
 * igual como reseñado: el 409 es un backstop del store local, no un error a
 * mostrar distinto de "ya reseñaste este pedido".
 */
export function useCreateReview(orderId: string) {
  const markReviewed = useReviewedOrdersStore((state) => state.markReviewed);

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => createReview(orderId, payload),
    onSuccess: () => {
      markReviewed(orderId);
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.error.kind === 'conflict') {
        markReviewed(orderId);
      }
    },
  });
}
