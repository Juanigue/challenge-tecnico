import { z } from 'zod';

const positiveInt = (defaultValue: number) =>
  z.coerce.number().int().positive().default(defaultValue);

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: positiveInt(3000),
  DATABASE_PATH: z.string().min(1).default('./data/app.db'),
  SESSION_TTL_HOURS: positiveInt(168),
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  RATE_LIMIT_GLOBAL_PER_15MIN: positiveInt(300),
  RATE_LIMIT_REGISTER_PER_HOUR: positiveInt(30),
  RATE_LIMIT_LOGIN_IP_PER_15MIN: positiveInt(10),
  RATE_LIMIT_LOGIN_EMAIL_PER_15MIN: positiveInt(5),
  RATE_LIMIT_PASSWORD_IP_PER_15MIN: positiveInt(10),
  RATE_LIMIT_PASSWORD_EMAIL_PER_15MIN: positiveInt(3),
  RATE_LIMIT_VERIFY_EMAIL_PER_15MIN: positiveInt(10),
  // Mailpit en desarrollo (docker compose up mailpit): SMTP en 1025, bandeja en :8025.
  SMTP_HOST: z.string().min(1).default('localhost'),
  SMTP_PORT: positiveInt(1025),
  MAIL_FROM: z.string().min(1).default('WOD <no-reply@wod.local>'),
  CODE_TTL_MINUTES: positiveInt(15),
  CODE_MAX_ATTEMPTS: positiveInt(5),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Configuración inválida en: ${fields}`);
  }
  return result.data;
}
