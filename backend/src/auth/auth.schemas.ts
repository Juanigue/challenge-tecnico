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

const newPasswordSchema = z
  .string({ error: 'La contraseña es obligatoria' })
  .min(12, { error: 'La contraseña debe tener al menos 12 caracteres' })
  .max(128, { error: 'La contraseña admite hasta 128 caracteres' });

const codeSchema = z
  .string({ error: 'El código es obligatorio' })
  .regex(/^\d{6}$/, { error: 'El código tiene 6 dígitos' });

const passwordsMatch = {
  check: (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword,
  params: { error: 'Las contraseñas no coinciden', path: ['confirmPassword'] },
};

export const registerSchema = z
  .strictObject({
    firstName: nameSchema('El nombre'),
    lastName: nameSchema('El apellido'),
    email: emailSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ error: 'Confirmá la contraseña' }),
    acceptTerms: z.literal(true, { error: 'Tenés que aceptar los términos' }),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

// En el login solo se acota el largo: un 400 no debe dar pistas de la política ni de la cuenta.
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, { error: 'La contraseña es obligatoria' })
    .max(128, { error: 'La contraseña admite hasta 128 caracteres' }),
});

// Solo nombre y apellido: cambiar el email exigiría volver a verificarlo.
export const updateProfileSchema = z
  .strictObject({
    firstName: nameSchema('El nombre').optional(),
    lastName: nameSchema('El apellido').optional(),
  })
  .refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
    error: 'No hay cambios para guardar',
  });

export const sessionIdParamSchema = z.coerce.number().int().positive();

export const forgotPasswordSchema = z.strictObject({ email: emailSchema });

export const resetPasswordSchema = z
  .strictObject({
    email: emailSchema,
    code: codeSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ error: 'Confirmá la contraseña' }),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const verifyEmailSchema = z.strictObject({ code: codeSchema });

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
