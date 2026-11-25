import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createSession, deleteExpiredSessions } from '../src/auth/sessions.js';
import { openDatabase } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';
import { countUsers, makeTestApp, me, registerAndLogin } from './helpers.js';

const tempDirs: string[] = [];

function tempDatabasePath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wod-test-'));
  tempDirs.push(dir);
  // Subcarpeta que todavía no existe: openDatabase tiene que crearla.
  return path.join(dir, 'nested', 'app.db');
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('Persistencia en SQLite', () => {
  it('F-07 (persistencia): usuario y sesión sobreviven a cerrar y reabrir la BD', async () => {
    const databasePath = tempDatabasePath();

    const first = makeTestApp({ DATABASE_PATH: databasePath }, openDatabase(databasePath));
    expect(fs.existsSync(databasePath)).toBe(true);
    const token = await registerAndLogin(first.app);
    first.db.close();

    const reopened = openDatabase(databasePath);
    expect(runMigrations(reopened)).toEqual([]);
    const second = makeTestApp({ DATABASE_PATH: databasePath }, reopened);

    expect(countUsers(second.db)).toBe(1);
    const res = await me(second.app, token).expect(200);
    expect(res.body.user.email).toBe('ana@example.com');
    second.db.close();
  });

  it('Arranque: deleteExpiredSessions borra solo las sesiones vencidas', () => {
    const db = openDatabase(':memory:');
    runMigrations(db);
    db.prepare(
      `INSERT INTO users (first_name, last_name, email, password_hash, terms_accepted_at, created_at)
       VALUES ('Ana', 'García', 'ana@example.com', 'x', 0, 0)`,
    ).run();
    const now = Date.now();
    createSession(db, 1, 1000, { now: now - 5000 });
    createSession(db, 1, 60_000, { now });

    expect(deleteExpiredSessions(db, now)).toBe(1);

    const remaining = db.prepare('SELECT expires_at FROM sessions').all() as { expires_at: number }[];
    expect(remaining).toEqual([{ expires_at: now + 60_000 }]);
    db.close();
  });
});
