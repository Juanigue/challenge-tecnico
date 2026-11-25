import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import type { Config } from '../config.js';

const MINUTE = 60 * 1000;

// Store en memoria: se resetea al reiniciar el servidor.
function limiter(windowMs: number, limit: number, extra: Parameters<typeof rateLimit>[0] = {}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Probá de nuevo más tarde.' },
      });
    },
    ...extra,
  });
}

export interface RateLimiters {
  global: RequestHandler;
  register: RequestHandler;
  loginByIp: RequestHandler;
  loginByEmail: RequestHandler;
}

export function createRateLimiters(config: Config): RateLimiters {
  return {
    global: limiter(15 * MINUTE, config.RATE_LIMIT_GLOBAL_PER_15MIN),
    register: limiter(60 * MINUTE, config.RATE_LIMIT_REGISTER_PER_HOUR),
    loginByIp: limiter(15 * MINUTE, config.RATE_LIMIT_LOGIN_IP_PER_15MIN),
    // Va después de validateBody: la clave es el email ya normalizado. No consulta
    // la BD, así que un email inexistente llega al 429 igual que uno existente.
    loginByEmail: limiter(15 * MINUTE, config.RATE_LIMIT_LOGIN_EMAIL_PER_15MIN, {
      keyGenerator: (_req, res) => `email:${res.locals.body.email}`,
      skipSuccessfulRequests: true,
    }),
  };
}
