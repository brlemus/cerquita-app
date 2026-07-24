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
 * Fuente de verdad local de "ya reseñado" -- el contrato no expone forma de
 * saberlo salvo el 409 al re-postear (docs/API_CONTRACT.md, sección 6). Un
 * 409 real también llama a `markReviewed` como backstop (ver
 * `useCreateReview`). Gap de contrato anotado en `PLAN_MOBILE_CERQUITA.md`
 * (Backlog post-MVP): cuando `GET /orders/:id` sume el estado de reseña,
 * este store pasa de fuente de verdad a cache.
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
