import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ReviewedOrdersState = {
  reviewedIds: string[];
};

type ReviewedOrdersActions = {
  markReviewed: (orderId: string) => void;
  clearReviewed: () => void;
};

/**
 * Cache optimista de "ya reseñado" -- la fuente de verdad es `Order.review`
 * (`GET /orders`/`GET /orders/:id`, `review !== null`, ver
 * `docs/API_CONTRACT.md` sección 4). Este store solo cubre el instante
 * entre "el customer califica" y el próximo refetch del pedido, que
 * todavía no trae el `review` real -- `markReviewed` se llama en éxito y
 * en el 409 `REVIEW_ALREADY_EXISTS` (backstop, ver `useCreateReview` y
 * `classifyReviewConflict`).
 */
export const useReviewedOrdersStore = create<ReviewedOrdersState & ReviewedOrdersActions>()(
  persist(
    (set) => ({
      reviewedIds: [],
      markReviewed: (orderId) =>
        set((state) =>
          state.reviewedIds.includes(orderId)
            ? state
            : { reviewedIds: [...state.reviewedIds, orderId] },
        ),
      // Borrado de cuenta (Fase 7a): es dato del usuario que se va, no debe
      // sobrevivir para el próximo login -- mismo criterio que clearCart().
      clearReviewed: () => set({ reviewedIds: [] }),
    }),
    {
      name: '@cerquita/reviewed-orders',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function isOrderReviewed(state: ReviewedOrdersState, orderId: string): boolean {
  return state.reviewedIds.includes(orderId);
}
