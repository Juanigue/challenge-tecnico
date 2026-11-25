import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Db } from './connection.js';

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url));

export function runMigrations(db: Db): string[] {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT    PRIMARY KEY,
      applied_at INTEGER NOT NULL
    )
  `);

  const applied = new Set(
    db
      .prepare('SELECT version FROM schema_migrations')
      .all()
      .map((row) => (row as { version: string }).version),
  );

  const pending = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql') && !applied.has(file))
    .sort();

  const insertVersion = db.prepare(
    'INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)',
  );

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    db.transaction(() => {
      db.exec(sql);
      insertVersion.run(file, Date.now());
    })();
  }

  return pending;
}

// Permite correrlo solo con `npm run migrate`.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { loadConfig } = await import('../config.js');
  const { openDatabase } = await import('./connection.js');
  const db = openDatabase(loadConfig().DATABASE_PATH);
  const applied = runMigrations(db);
  console.log(applied.length ? `Migraciones aplicadas: ${applied.join(', ')}` : 'Sin migraciones pendientes');
  db.close();
}
