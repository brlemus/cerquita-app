import { z } from 'zod';

export const feedbackSchema = z.object({
  text: z.string().min(1, 'Contanos qué pasó').max(2000, 'Máximo 2000 caracteres'),
  category: z.enum(['BUG', 'SUGERENCIA', 'QUEJA', 'OTRO']).optional(),
});
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
