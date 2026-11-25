import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

export type Db = Database.Database;

export function openDatabase(databasePath: string): Db {
  if (databasePath !== ':memory:') {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  }

  const db = new Database(databasePath);
  // SQLite no aplica las claves foráneas si no se activa en cada conexión.
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  return db;
}
