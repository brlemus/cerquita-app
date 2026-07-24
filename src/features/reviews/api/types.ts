/**
 * DTOs de reviews (docs/API_CONTRACT.md, sección 6). Espejo 1:1 del
 * contrato -- el backend está fijado, esta app se adapta a él.
 */

export type CreateReviewPayload = {
  rating: number;
  comment?: string;
};

export type Review = {
  id: string;
  orderId: string;
  businessId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
};
