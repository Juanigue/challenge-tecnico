-- Fechas en epoch milisegundos (INTEGER) para compararlas directamente con Date.now().

CREATE TABLE users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name        TEXT    NOT NULL CHECK (length(first_name) BETWEEN 1 AND 50),
  last_name         TEXT    NOT NULL CHECK (length(last_name) BETWEEN 1 AND 50),
  -- Se guarda ya normalizado (trim + lowercase + NFKC).
  email             TEXT    NOT NULL UNIQUE,
  -- Formato PHC de Argon2id: incluye sal y parámetros.
  password_hash     TEXT    NOT NULL,
  terms_accepted_at INTEGER NOT NULL,
  created_at        INTEGER NOT NULL
);

CREATE TABLE sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  -- SHA-256 en hex del token. El token en claro nunca se guarda.
  token_hash TEXT    NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX idx_sessions_user_id ON sessions (user_id);
