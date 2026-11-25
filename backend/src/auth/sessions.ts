import { createHash, randomBytes } from 'node:crypto';
import type { Db } from '../db/connection.js';

export interface ActiveSession {
  sessionId: number;
  userId: number;
  createdAt: number;
  expiresAt: number;
}

// Solo se registra el último uso si pasó más de un minuto: evita una escritura por request.
const TOUCH_INTERVAL_MS = 60 * 1000;
const DEVICE_MAX_LENGTH = 120;

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// El User-Agent lo controla el cliente: se guarda solo ASCII imprimible y acotado.
export function sanitizeDevice(userAgent: string | undefined): string | null {
  const clean = (userAgent ?? '').replace(/[^\x20-\x7E]/g, '').trim().slice(0, DEVICE_MAX_LENGTH);
  return clean || null;
}

export function createSession(
  db: Db,
  userId: number,
  ttlMs: number,
  { device = null, now = Date.now() }: { device?: string | null; now?: number } = {},
) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + ttlMs;

  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at, last_used_at, device)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(userId, hashToken(token), now, expiresAt, now, device);

  return { token, expiresAt };
}

export function findActiveSession(db: Db, token: string, now = Date.now()) {
  const row = db
    .prepare(
      `SELECT id, user_id, created_at, expires_at FROM sessions
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
    .get(hashToken(token), now) as
    | { id: number; user_id: number; created_at: number; expires_at: number }
    | undefined;

  if (!row) return undefined;
  return {
    sessionId: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  } satisfies ActiveSession;
}

export function touchSession(db: Db, sessionId: number, now = Date.now()): void {
  db.prepare(
    `UPDATE sessions SET last_used_at = ?
     WHERE id = ? AND (last_used_at IS NULL OR last_used_at < ?)`,
  ).run(now, sessionId, now - TOUCH_INTERVAL_MS);
}

export function revokeSession(db: Db, sessionId: number, now = Date.now()): void {
  db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(
    now,
    sessionId,
  );
}

// Filtra por user_id: un usuario no puede revocar sesiones ajenas. Devuelve si revocó algo.
export function revokeUserSession(db: Db, userId: number, sessionId: number, now = Date.now()): boolean {
  const result = db
    .prepare(
      `UPDATE sessions SET revoked_at = ?
       WHERE id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
    .run(now, sessionId, userId, now);
  return result.changes > 0;
}

export function revokeAllSessions(db: Db, userId: number, now = Date.now()): number {
  return db
    .prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
    .run(now, userId).changes;
}

// Reemplaza el token de la sesión actual: el viejo queda revocado en la misma transacción.
export function rotateSession(db: Db, session: ActiveSession, ttlMs: number, now = Date.now()) {
  const { device } = db.prepare('SELECT device FROM sessions WHERE id = ?').get(session.sessionId) as {
    device: string | null;
  };
  return db.transaction(() => {
    revokeSession(db, session.sessionId, now);
    return createSession(db, session.userId, ttlMs, { device, now });
  })();
}

interface SessionRow {
  id: number;
  device: string | null;
  created_at: number;
  last_used_at: number | null;
  expires_at: number;
}

export function listActiveSessions(db: Db, userId: number, now = Date.now()): SessionRow[] {
  return db
    .prepare(
      `SELECT id, device, created_at, last_used_at, expires_at FROM sessions
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
       ORDER BY COALESCE(last_used_at, created_at) DESC`,
    )
    .all(userId, now) as SessionRow[];
}

export function deleteExpiredSessions(db: Db, now = Date.now()): number {
  return db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes;
}
