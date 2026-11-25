import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import type { Db } from '../db/connection.js';

export type CodePurpose = 'reset_password' | 'verify_email';

const hashCode = (code: string) => createHash('sha256').update(code).digest();

// Emite un código nuevo y descarta los anteriores sin usar del mismo propósito.
export function issueCode(db: Db, userId: number, purpose: CodePurpose, ttlMs: number, now = Date.now()) {
  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');

  db.transaction(() => {
    db.prepare('DELETE FROM one_time_codes WHERE user_id = ? AND purpose = ? AND used_at IS NULL').run(
      userId,
      purpose,
    );
    db.prepare(
      `INSERT INTO one_time_codes (user_id, purpose, code_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(userId, purpose, hashCode(code).toString('hex'), now, now + ttlMs);
  })();

  return code;
}

// Con 6 dígitos el límite de intentos es lo que impide adivinarlo: al llegar al
// máximo el código queda inutilizable aunque después se envíe el correcto.
export function consumeCode(
  db: Db,
  userId: number,
  purpose: CodePurpose,
  code: string,
  maxAttempts: number,
  now = Date.now(),
): boolean {
  const row = db
    .prepare(
      `SELECT id, code_hash, attempts FROM one_time_codes
       WHERE user_id = ? AND purpose = ? AND used_at IS NULL AND expires_at > ?
       ORDER BY id DESC LIMIT 1`,
    )
    .get(userId, purpose, now) as { id: number; code_hash: string; attempts: number } | undefined;

  if (!row || row.attempts >= maxAttempts) return false;

  const matches = timingSafeEqual(Buffer.from(row.code_hash, 'hex'), hashCode(code));
  if (!matches) {
    db.prepare('UPDATE one_time_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return false;
  }

  db.prepare('UPDATE one_time_codes SET used_at = ? WHERE id = ?').run(now, row.id);
  return true;
}
