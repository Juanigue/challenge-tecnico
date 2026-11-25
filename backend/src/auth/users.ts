import type { Db } from '../db/connection.js';

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string;
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

// Lo único que sale por la API: nunca el hash.
export function toPublicUser(user: UserRow) {
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    createdAt: new Date(user.created_at).toISOString(),
  };
}
