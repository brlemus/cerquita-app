import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().min(1, 'Ingresá tu email').email('Email inválido'),
  password: z.string().min(1, 'Ingresá tu contraseña'),
});
export type SignInFormValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z.string().min(1, 'Ingresá tu nombre'),
  email: z.string().min(1, 'Ingresá tu email').email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
export type SignUpFormValues = z.infer<typeof signUpSchema>;

export const verificationSchema = z.object({
  code: z
    .string()
    .length(6, 'El código tiene 6 dígitos')
    .regex(/^\d+$/, 'El código es solo números'),
});
export type VerificationFormValues = z.infer<typeof verificationSchema>;
