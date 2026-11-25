import { z } from 'zod';

export function normalizeEmail(email: string): string {
  return email.normalize('NFKC').trim().toLowerCase();
}

const emailSchema = z
  .string({ error: 'El email es obligatorio' })
  .max(254, { error: 'El email es demasiado largo' })
  .transform(normalizeEmail)
  .pipe(z.email({ error: 'El email no es válido' }));

const nameSchema = (label: string) =>
  z
    .string({ error: `${label} es obligatorio` })
    .trim()
    .min(1, { error: `${label} es obligatorio` })
    .max(50, { error: `${label} admite hasta 50 caracteres` });

export const registerSchema = z
  .strictObject({
    firstName: nameSchema('El nombre'),
    lastName: nameSchema('El apellido'),
    email: emailSchema,
    password: z
      .string({ error: 'La contraseña es obligatoria' })
      .min(12, { error: 'La contraseña debe tener al menos 12 caracteres' })
      .max(128, { error: 'La contraseña admite hasta 128 caracteres' }),
    confirmPassword: z.string({ error: 'Confirmá la contraseña' }),
    acceptTerms: z.literal(true, { error: 'Tenés que aceptar los términos' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

// En el login solo se acota el largo: un 400 no debe dar pistas de la política ni de la cuenta.
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, { error: 'La contraseña es obligatoria' })
    .max(128, { error: 'La contraseña admite hasta 128 caracteres' }),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
