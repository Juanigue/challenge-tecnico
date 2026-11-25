import { z } from 'zod';

// Copia de backend/src/auth/auth.schemas.ts. El backend vuelve a validar todo;
// esto solo evita enviar formularios que se sabe que van a fallar.

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

export const codeSchema = z
  .string({ error: 'El código es obligatorio' })
  .trim()
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

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, { error: 'La contraseña es obligatoria' })
    .max(128, { error: 'La contraseña admite hasta 128 caracteres' }),
});

export const forgotPasswordSchema = z.strictObject({ email: emailSchema });

export const resetPasswordSchema = z
  .strictObject({
    email: emailSchema,
    code: codeSchema,
    password: newPasswordSchema,
    confirmPassword: z.string({ error: 'Confirmá la contraseña' }),
  })
  .refine(passwordsMatch.check, passwordsMatch.params);

export const profileSchema = z.strictObject({
  firstName: nameSchema('El nombre'),
  lastName: nameSchema('El apellido'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export type FieldErrors = Record<string, string>;

// Primer mensaje por campo, con la misma forma que devuelve el backend en `fields`.
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    fields[key] ??= issue.message;
  }
  return fields;
}
