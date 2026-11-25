import { Router } from 'express';
import type { Config } from '../config.js';
import type { Db } from '../db/connection.js';
import { AppError, unauthorized } from '../lib/errors.js';
import type { RateLimiters } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateBody.js';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from './auth.schemas.js';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './password.js';
import { createSession, revokeSession, type ActiveSession } from './sessions.js';
import { findUserByEmail, findUserById, insertUser, toPublicUser } from './users.js';

const emailTaken = () => new AppError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese email');
const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos');

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export function authRouter(db: Db, config: Config, limiters: RateLimiters): Router {
  const router = Router();
  const sessionTtlMs = config.SESSION_TTL_HOURS * 60 * 60 * 1000;
  const auth = requireAuth(db);

  router.post('/register', limiters.register, validateBody(registerSchema), async (_req, res) => {
    const input = res.locals.body as RegisterInput;
    if (findUserByEmail(db, input.email)) throw emailTaken();

    const passwordHash = await hashPassword(input.password);
    let userId: number;
    try {
      userId = insertUser(db, { ...input, passwordHash });
    } catch (err) {
      // Dos registros simultáneos con el mismo email: el UNIQUE de la BD decide.
      if (isUniqueViolation(err)) throw emailTaken();
      throw err;
    }

    res.status(201).json({ user: toPublicUser(findUserById(db, userId)!) });
  });

  router.post(
    '/login',
    limiters.loginByIp,
    validateBody(loginSchema),
    limiters.loginByEmail,
    async (_req, res) => {
      const { email, password } = res.locals.body as LoginInput;
      const user = findUserByEmail(db, email);

      if (!user) {
        await verifyAgainstDummy(password);
        throw invalidCredentials();
      }
      if (!(await verifyPassword(user.password_hash, password))) throw invalidCredentials();

      const { token, expiresAt } = createSession(db, user.id, sessionTtlMs);
      res.json({ token, expiresAt: new Date(expiresAt).toISOString(), user: toPublicUser(user) });
    },
  );

  router.get('/me', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    const user = findUserById(db, session.userId);
    if (!user) throw unauthorized();

    res.json({
      user: toPublicUser(user),
      session: { expiresAt: new Date(session.expiresAt).toISOString() },
    });
  });

  router.post('/logout', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    revokeSession(db, session.sessionId);
    res.status(204).end();
  });

  return router;
}
