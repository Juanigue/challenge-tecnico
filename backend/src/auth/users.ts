import type { Db } from '../db/connection.js';

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
  email_verified_at: number | null;
  created_at: number;
}

export interface NewUser {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

export function insertUser(db: Db, user: NewUser, now = Date.now()): number {
  const result = db
    .prepare(
      `INSERT INTO users (first_name, last_name, email, password_hash, terms_accepted_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(user.firstName, user.lastName, user.email, user.passwordHash, now, now);
  return Number(result.lastInsertRowid);
}

export function findUserByEmail(db: Db, email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function findUserById(db: Db, id: number): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function updateUserNames(db: Db, id: number, names: { firstName?: string; lastName?: string }): void {
  db.prepare(
    `UPDATE users SET first_name = COALESCE(?, first_name), last_name = COALESCE(?, last_name)
     WHERE id = ?`,
  ).run(names.firstName ?? null, names.lastName ?? null, id);
}

export function updatePasswordHash(db: Db, id: number, passwordHash: string): void {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, id);
}

export function markEmailVerified(db: Db, id: number, now = Date.now()): void {
  db.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(now, id);
}

// Lo único que sale por la API: nunca el hash.
export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    emailVerified: user.email_verified_at !== null,
    createdAt: new Date(user.created_at).toISOString(),
  };
}
