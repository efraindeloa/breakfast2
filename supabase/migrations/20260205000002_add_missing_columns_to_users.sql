-- ==================== AGREGAR COLUMNAS FALTANTES A USUARIOS ====================
-- Esta migración agrega las columnas password_hash y account_type si no existen

-- Crear tipo ENUM para los tipos de cuenta (si no existe)
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM (
      'owner',
      'manager', 
      'hostess',
      'waiter',
      'cashier',
      'kitchen',
      'delivery_driver',
      'delivery_manager',
      'accountant',
      'support',
      'customer',
      'valet_parking'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Agregar la columna password_hash si no existe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Agregar la columna account_type si no existe
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type account_type_enum NOT NULL DEFAULT 'customer';

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type_active ON users(account_type, is_active) WHERE is_active = true;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN users.password_hash IS 'Hash de la contraseña del usuario (SHA-256 o bcrypt)';
COMMENT ON COLUMN users.account_type IS 'Tipo de cuenta del usuario que define sus permisos y rol en el sistema';

-- Verificar que las columnas existen
DO $$
BEGIN
    -- Verificar password_hash
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        RAISE EXCEPTION 'Column password_hash was not created successfully';
    END IF;
    
    -- Verificar account_type
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_type'
    ) THEN
        RAISE EXCEPTION 'Column account_type was not created successfully';
    END IF;
    
    RAISE NOTICE 'All columns created successfully';
END $$;