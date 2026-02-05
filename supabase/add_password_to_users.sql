-- Agregar columna password_hash a la tabla users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;
