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
