-- ==================== AGREGAR TIPO DE CUENTA A USUARIOS ====================
-- Agregar columna account_type a la tabla users

-- Crear tipo ENUM para los tipos de cuenta
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

-- Agregar la columna account_type a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS account_type account_type_enum NOT NULL DEFAULT 'customer';

-- Crear índice para búsquedas por tipo de cuenta
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);

-- Crear índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_users_account_type_active ON users(account_type, is_active) WHERE is_active = true;

-- Comentarios para documentar los tipos de cuenta
COMMENT ON TYPE account_type_enum IS 'Tipos de cuenta de usuario: owner (dueño), manager (gerente), hostess (anfitriona), waiter (mesero), cashier (cajero), kitchen (cocina), delivery_driver (repartidor), delivery_manager (gerente de entregas), accountant (contador), support (soporte), customer (cliente), valet_parking (valet parking)';

COMMENT ON COLUMN users.account_type IS 'Tipo de cuenta del usuario que define sus permisos y rol en el sistema';