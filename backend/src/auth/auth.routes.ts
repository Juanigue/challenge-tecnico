import { Router } from 'express';
import type { Config } from '../config.js';
import type { Db } from '../db/connection.js';
import { AppError, unauthorized } from '../lib/errors.js';
import type { RateLimiters } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateBody.js';
import {
  loginSchema,
  registerSchema,
  sessionIdParamSchema,
  updateProfileSchema,
  type LoginInput,
  type RegisterInput,
  type UpdateProfileInput,
} from './auth.schemas.js';
import { hashPassword, verifyAgainstDummy, verifyPassword } from './password.js';
import {
  createSession,
  listActiveSessions,
  revokeAllSessions,
  revokeSession,
  revokeUserSession,
  rotateSession,
  sanitizeDevice,
  type ActiveSession,
} from './sessions.js';
import { findUserByEmail, findUserById, insertUser, toPublicUser, updateUserNames } from './users.js';

const emailTaken = () => new AppError(409, 'EMAIL_TAKEN', 'Ya existe una cuenta con ese email');
const invalidCredentials = () =>
  new AppError(401, 'INVALID_CREDENTIALS', 'Email o contraseña incorrectos');
const sessionNotFound = () => new AppError(404, 'SESSION_NOT_FOUND', 'Sesión no encontrada');

const toIso = (epochMs: number) => new Date(epochMs).toISOString();

function isUniqueViolation(err: unknown): boolean {
  return (err as { code?: string }).code === 'SQLITE_CONSTRAINT_UNIQUE';
}

export interface AuthHooks {
  // La provee el router de cuenta para enviar el código de verificación tras el registro.
  onRegistered?: (userId: number) => void;
}

export function authRouter(db: Db, config: Config, limiters: RateLimiters, hooks: AuthHooks = {}): Router {
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

    hooks.onRegistered?.(userId);
    res.status(201).json({ user: toPublicUser(findUserById(db, userId)!) });
  });

  router.post(
    '/login',
    limiters.loginByIp,
    validateBody(loginSchema),
    limiters.loginByEmail,
    async (req, res) => {
      const { email, password } = res.locals.body as LoginInput;
      const user = findUserByEmail(db, email);

      if (!user) {
        await verifyAgainstDummy(password);
        throw invalidCredentials();
      }
      if (!(await verifyPassword(user.password_hash, password))) throw invalidCredentials();

      const device = sanitizeDevice(req.get('user-agent'));
      const { token, expiresAt } = createSession(db, user.id, sessionTtlMs, { device });
      res.json({ token, expiresAt: toIso(expiresAt), user: toPublicUser(user) });
    },
  );

  router.get('/me', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    const user = findUserById(db, session.userId);
    if (!user) throw unauthorized();

    res.json({
      user: toPublicUser(user),
      session: { createdAt: toIso(session.createdAt), expiresAt: toIso(session.expiresAt) },
    });
  });

  router.patch('/me', auth, validateBody(updateProfileSchema), (_req, res) => {
    const session = res.locals.session as ActiveSession;
    updateUserNames(db, session.userId, res.locals.body as UpdateProfileInput);
    res.json({ user: toPublicUser(findUserById(db, session.userId)!) });
  });

  router.post('/logout', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    revokeSession(db, session.sessionId);
    res.status(204).end();
  });

  router.post('/logout-all', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    revokeAllSessions(db, session.userId);
    res.status(204).end();
  });

  router.post('/rotate', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    const { token, expiresAt } = rotateSession(db, session, sessionTtlMs);
    res.json({ token, expiresAt: toIso(expiresAt) });
  });

  router.get('/sessions', auth, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    const sessions = listActiveSessions(db, session.userId).map((row) => ({
      id: row.id,
      device: row.device,
      createdAt: toIso(row.created_at),
      lastUsedAt: toIso(row.last_used_at ?? row.created_at),
      expiresAt: toIso(row.expires_at),
      current: row.id === session.sessionId,
    }));
    res.json({ sessions });
  });

  router.delete('/sessions/:id', auth, (req, res) => {
    const session = res.locals.session as ActiveSession;
    const sessionId = sessionIdParamSchema.safeParse(req.params.id);
    // Mismo 404 si el id es inválido, no existe o es de otro usuario: no revela sesiones ajenas.
    if (!sessionId.success || !revokeUserSession(db, session.userId, sessionId.data)) {
      throw sessionNotFound();
    }
    res.status(204).end();
  });

  return router;
}
