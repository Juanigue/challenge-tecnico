import type { RequestHandler } from 'express';
import type { Db } from '../db/connection.js';
import { findActiveSession } from '../auth/sessions.js';
import { unauthorized } from '../lib/errors.js';

// 32 bytes en base64url = 43 caracteres.
const BEARER_PATTERN = /^Bearer ([A-Za-z0-9_-]{43})$/;

// Mismo 401 si falta el token, está mal formado, no existe, venció o fue revocado.
export function requireAuth(db: Db): RequestHandler {
  return (req, res, next) => {
    const match = BEARER_PATTERN.exec(req.get('authorization') ?? '');
    const session = match?.[1] ? findActiveSession(db, match[1]) : undefined;
    if (!session) throw unauthorized();

    res.locals.session = session;
    next();
  };
}
