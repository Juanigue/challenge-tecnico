-- Fase 4: verificación de email, sesiones múltiples y códigos de un solo uso.

ALTER TABLE users ADD COLUMN email_verified_at INTEGER;

-- Para listar las sesiones abiertas: cuándo se usó por última vez y desde qué dispositivo.
ALTER TABLE sessions ADD COLUMN last_used_at INTEGER;
ALTER TABLE sessions ADD COLUMN device TEXT;

-- Códigos de 6 dígitos para recuperar la contraseña y verificar el email.
-- Igual que los tokens de sesión: solo se guarda su SHA-256.
CREATE TABLE one_time_codes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  purpose    TEXT    NOT NULL CHECK (purpose IN ('reset_password', 'verify_email')),
  code_hash  TEXT    NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);

CREATE INDEX idx_one_time_codes_user_purpose ON one_time_codes (user_id, purpose);
