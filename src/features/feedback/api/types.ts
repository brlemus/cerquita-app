/**
 * DTOs de feedback (docs/API_CONTRACT.md, sección 7). Espejo 1:1 del
 * contrato -- el backend está fijado, esta app se adapta a él.
 */

export type FeedbackCategory = 'BUG' | 'SUGERENCIA' | 'QUEJA' | 'OTRO';

export type CreateFeedbackPayload = {
  text: string;
  category?: FeedbackCategory;
};

export type Feedback = {
  id: string;
  userId: string;
  category?: FeedbackCategory;
  text: string;
  createdAt: string;
};
