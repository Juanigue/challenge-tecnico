import { createHash, randomBytes } from 'node:crypto';
import type { Db } from '../db/connection.js';

export interface ActiveSession {
  sessionId: number;
  userId: number;
  expiresAt: number;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(db: Db, userId: number, ttlMs: number, now = Date.now()) {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = now + ttlMs;

  db.prepare(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).run(userId, hashToken(token), now, expiresAt);

  return { token, expiresAt };
}

export function findActiveSession(db: Db, token: string, now = Date.now()) {
  const row = db
    .prepare(
      `SELECT id, user_id, expires_at FROM sessions
       WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?`,
    )
    .get(hashToken(token), now) as
    | { id: number; user_id: number; expires_at: number }
    | undefined;

  if (!row) return undefined;
  return { sessionId: row.id, userId: row.user_id, expiresAt: row.expires_at } satisfies ActiveSession;
}

export function revokeSession(db: Db, sessionId: number, now = Date.now()): void {
  db.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(
    now,
    sessionId,
  );
}

export function deleteExpiredSessions(db: Db, now = Date.now()): number {
  return db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now).changes;
}
