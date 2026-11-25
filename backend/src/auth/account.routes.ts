import { Router } from 'express';
import type { Config } from '../config.js';
import type { Db } from '../db/connection.js';
import { AppError, unauthorized } from '../lib/errors.js';
import { resetPasswordMail, verifyEmailMail, type Mailer, type MailMessage } from '../mail/mailer.js';
import type { RateLimiters } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateBody } from '../middleware/validateBody.js';
import type { LogFn } from '../middleware/requestLogger.js';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from './auth.schemas.js';
import { consumeCode, issueCode } from './codes.js';
import { hashPassword } from './password.js';
import { revokeAllSessions, type ActiveSession } from './sessions.js';
import { findUserByEmail, findUserById, markEmailVerified, toPublicUser, updatePasswordHash } from './users.js';

// Mismo error si no hay cuenta, el código no coincide, venció, ya se usó o se agotaron los intentos.
const invalidCode = () => new AppError(400, 'INVALID_CODE', 'Código inválido o vencido');

const FORGOT_RESPONSE = {
  message: 'Si el email tiene una cuenta, te enviamos un código para restablecer la contraseña.',
};

export function accountRouter(db: Db, config: Config, limiters: RateLimiters, mailer: Mailer, log: LogFn) {
  const router = Router();
  const auth = requireAuth(db);
  const codeTtlMs = config.CODE_TTL_MINUTES * 60 * 1000;

  // El envío no se espera: así la respuesta tarda lo mismo exista o no la cuenta.
  // El log no incluye ni el destinatario ni el código.
  const sendInBackground = (message: MailMessage) => {
    mailer.send(message).catch((err: unknown) => {
      log(`[mail] envío fallido: ${err instanceof Error ? err.message : String(err)}`);
    });
  };

  const sendVerificationCode = (userId: number) => {
    const user = findUserById(db, userId);
    if (!user || user.email_verified_at !== null) return;
    const code = issueCode(db, userId, 'verify_email', codeTtlMs);
    sendInBackground(verifyEmailMail(user.email, code, config.CODE_TTL_MINUTES));
  };

  router.post(
    '/password/forgot',
    limiters.passwordByIp,
    validateBody(forgotPasswordSchema),
    limiters.passwordByEmail,
    (_req, res) => {
      const { email } = res.locals.body as ForgotPasswordInput;
      const user = findUserByEmail(db, email);
      if (user) {
        const code = issueCode(db, user.id, 'reset_password', codeTtlMs);
        sendInBackground(resetPasswordMail(user.email, code, config.CODE_TTL_MINUTES));
      }
      res.status(202).json(FORGOT_RESPONSE);
    },
  );

  router.post('/password/reset', limiters.passwordByIp, validateBody(resetPasswordSchema), async (_req, res) => {
    const { email, code, password } = res.locals.body as ResetPasswordInput;
    const user = findUserByEmail(db, email);
    if (!user || !consumeCode(db, user.id, 'reset_password', code, config.CODE_MAX_ATTEMPTS)) {
      throw invalidCode();
    }

    updatePasswordHash(db, user.id, await hashPassword(password));
    // Quien tenía la contraseña vieja pierde el acceso en todos los dispositivos.
    revokeAllSessions(db, user.id);
    res.status(204).end();
  });

  router.post('/email/verification', auth, limiters.verifyEmail, (_req, res) => {
    const session = res.locals.session as ActiveSession;
    sendVerificationCode(session.userId);
    res.status(202).json({ message: 'Si tu email no estaba verificado, te enviamos un código.' });
  });

  router.post('/email/verify', auth, limiters.verifyEmail, validateBody(verifyEmailSchema), (_req, res) => {
    const session = res.locals.session as ActiveSession;
    const { code } = res.locals.body as VerifyEmailInput;
    const user = findUserById(db, session.userId);
    if (!user) throw unauthorized();

    if (user.email_verified_at === null) {
      if (!consumeCode(db, user.id, 'verify_email', code, config.CODE_MAX_ATTEMPTS)) throw invalidCode();
      markEmailVerified(db, user.id);
    }
    res.json({ user: toPublicUser(findUserById(db, user.id)!) });
  });

  return { router, sendVerificationCode };
}
