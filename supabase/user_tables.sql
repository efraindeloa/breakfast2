-- ==================== TABLAS DE USUARIO ====================
-- Este script crea todas las tablas necesarias para guardar
-- información del usuario, configuración, métodos de pago y transacciones
-- Nada se guarda localmente, todo en la base de datos

-- ==================== TABLA DE PERFILES DE USUARIO ====================
-- Información extendida del usuario (complementa la tabla users)
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT,
  gender TEXT,
  country TEXT,
  city TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para perfiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- ==================== TABLA DE CONFIGURACIÓN DE USUARIO ====================
-- Reemplaza localStorage para preferencias del usuario
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'es',
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  marketing_emails_enabled BOOLEAN DEFAULT false,
  default_payment_method TEXT,
  default_tip_percentage INTEGER DEFAULT 10 CHECK (default_tip_percentage >= 0 AND default_tip_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para configuraciones
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- ==================== TABLA DE DIRECCIONES DEL USUARIO ====================
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  street TEXT NOT NULL,
  external_number TEXT,
  internal_number TEXT,
  neighborhood TEXT,
  city TEXT NOT NULL,
  state TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'México',
  is_default_shipping BOOLEAN DEFAULT false,
  is_default_billing BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para direcciones
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default_shipping ON user_addresses(user_id, is_default_shipping) WHERE is_default_shipping = true;
CREATE INDEX IF NOT EXISTS idx_user_addresses_default_billing ON user_addresses(user_id, is_default_billing) WHERE is_default_billing = true;

-- ==================== TABLA DE MÉTODOS DE PAGO DEL USUARIO ====================
-- IMPORTANTE: En producción, usar tokens de un procesador de pagos (Stripe, etc.)
-- NUNCA guardar números de tarjeta completos
CREATE TABLE IF NOT EXISTS user_payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'test', -- 'stripe', 'mercadopago', 'test'
  type TEXT NOT NULL CHECK (type IN ('card', 'cash', 'wallet')),
  brand TEXT, -- 'VISA', 'Mastercard', 'AMEX', etc.
  last4 TEXT, -- Últimos 4 dígitos de la tarjeta
  exp_month INTEGER CHECK (exp_month >= 1 AND exp_month <= 12),
  exp_year INTEGER CHECK (exp_year >= 2020),
  holder_name TEXT,
  token TEXT, -- Token del procesador de pagos (NUNCA el número completo)
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asegurar que la columna is_active existe (por si la tabla ya existía)
ALTER TABLE user_payment_methods ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Índices para métodos de pago
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_default ON user_payment_methods(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_active ON user_payment_methods(user_id, is_active) WHERE is_active = true;

-- ==================== TABLA DE PERFILES DE FACTURACIÓN ====================
CREATE TABLE IF NOT EXISTS user_billing_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tax_id TEXT NOT NULL, -- RFC u otro identificador fiscal
  business_name TEXT NOT NULL, -- Razón social
  email TEXT NOT NULL, -- Correo para facturas
  street TEXT,
  external_number TEXT,
  internal_number TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'México',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para perfiles de facturación
CREATE INDEX IF NOT EXISTS idx_user_billing_profiles_user_id ON user_billing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_billing_profiles_default ON user_billing_profiles(user_id, is_default) WHERE is_default = true;

-- ==================== TABLA DE PAGOS ====================
-- Pagos individuales asociados a una orden
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES user_payment_methods(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  provider TEXT, -- 'stripe', 'cash', 'mercadopago', etc.
  provider_payment_id TEXT, -- ID de la transacción en el procesador de pagos
  error_message TEXT,
  metadata JSONB, -- Información adicional del pago
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para pagos
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);

-- ==================== TABLA DE TRANSACCIONES DEL USUARIO ====================
-- Vista lógica de transacciones para el historial del usuario
CREATE TABLE IF NOT EXISTS user_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  restaurant_name TEXT NOT NULL, -- Cache del nombre del restaurante
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip_percentage INTEGER,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL, -- 'card', 'cash', etc. (cache para consultas rápidas)
  payment_method_last4 TEXT, -- Últimos 4 dígitos de la tarjeta si aplica
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'failed', 'refunded')),
  invoice_sent BOOLEAN DEFAULT false,
  invoice_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para transacciones
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_id ON user_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_order_id ON user_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_payment_id ON user_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_restaurant_id ON user_transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_user_transactions_created_at ON user_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_transactions_user_created ON user_transactions(user_id, created_at DESC);

-- ==================== TRIGGERS PARA ACTUALIZAR updated_at ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON user_addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_payment_methods_updated_at ON user_payment_methods;
CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_billing_profiles_updated_at ON user_billing_profiles;
CREATE TRIGGER update_user_billing_profiles_updated_at BEFORE UPDATE ON user_billing_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== POLÍTICAS RLS (Row Level Security) ====================
-- Habilitar RLS en todas las tablas
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_settings
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas para user_addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON user_addresses;
CREATE POLICY "Users can view their own addresses" ON user_addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own addresses" ON user_addresses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own addresses" ON user_addresses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own addresses" ON user_addresses FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_payment_methods
DROP POLICY IF EXISTS "Users can view their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON user_payment_methods;
CREATE POLICY "Users can view their own payment methods" ON user_payment_methods FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own payment methods" ON user_payment_methods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own payment methods" ON user_payment_methods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own payment methods" ON user_payment_methods FOR DELETE USING (auth.uid() = user_id);

-- Políticas para user_billing_profiles
DROP POLICY IF EXISTS "Users can view their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can update their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can insert their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can delete their own billing profiles" ON user_billing_profiles;
CREATE POLICY "Users can view their own billing profiles" ON user_billing_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own billing profiles" ON user_billing_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own billing profiles" ON user_billing_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own billing profiles" ON user_billing_profiles FOR DELETE USING (auth.uid() = user_id);

-- Políticas para payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (auth.uid() = user_id);

-- Políticas para user_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON user_transactions;
CREATE POLICY "Users can view their own transactions" ON user_transactions FOR SELECT USING (auth.uid() = user_id);
