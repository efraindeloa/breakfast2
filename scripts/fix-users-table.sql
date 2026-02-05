-- ==================== FIX TABLA USERS - AGREGAR COLUMNAS FALTANTES ====================
-- Ejecutar con: supabase db push --db-url "postgresql://..." < scripts/fix-users-table.sql

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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'account_type_enum ya existe, continuando...';
END $$;

-- Agregar la columna password_hash si no existe
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
    RAISE NOTICE 'Columna password_hash agregada exitosamente';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Columna password_hash ya existe, continuando...';
END $$;

-- Agregar la columna account_type si no existe
DO $$ BEGIN
    ALTER TABLE users ADD COLUMN account_type account_type_enum NOT NULL DEFAULT 'customer';
    RAISE NOTICE 'Columna account_type agregada exitosamente';
EXCEPTION
    WHEN duplicate_column THEN 
        RAISE NOTICE 'Columna account_type ya existe, continuando...';
END $$;

-- Crear índices para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type_active ON users(account_type, is_active) WHERE is_active = true;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN users.password_hash IS 'Hash de la contraseña del usuario (SHA-256 o bcrypt)';
COMMENT ON COLUMN users.account_type IS 'Tipo de cuenta del usuario que define sus permisos y rol en el sistema';

-- Verificar que las columnas existen
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
    AND column_name IN ('password_hash', 'account_type')
ORDER BY column_name;