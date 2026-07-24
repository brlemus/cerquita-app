import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z.number().int('Elegí una calificación').min(1, 'Elegí una calificación').max(5),
  comment: z.string().max(1000, 'Máximo 1000 caracteres').optional(),
});
export type ReviewFormValues = z.infer<typeof reviewSchema>;
