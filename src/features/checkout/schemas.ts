import { z } from 'zod';

export const addressFormSchema = z.object({
  label: z.string().max(50, 'Máximo 50 caracteres').optional(),
  line: z.string().min(1, 'Contanos cómo llegar').max(300, 'Máximo 300 caracteres'),
  instructions: z.string().max(300, 'Máximo 300 caracteres').optional(),
});
export type AddressFormValues = z.infer<typeof addressFormSchema>;
