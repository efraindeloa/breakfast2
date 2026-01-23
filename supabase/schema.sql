-- ==================== EXTENSIONES ====================
-- Habilitar UUID si no está habilitado
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== TABLAS ====================

-- Tabla de Órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total DECIMAL(10, 2) NOT NULL,
  items JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Items del Carrito
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  dish_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Favoritos
CREATE TABLE IF NOT EXISTS favorite_dishes (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  dish_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dish_id)
);

-- Tabla de Combinaciones Guardadas
CREATE TABLE IF NOT EXISTS saved_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dishes INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

-- Tabla de Datos de Lealtad
CREATE TABLE IF NOT EXISTS loyalty_data (
  user_id TEXT PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum')),
  monthly_growth INTEGER NOT NULL DEFAULT 0,
  points_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Contactos
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Tabla de Entradas de Lista de Espera
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  zones TEXT[] NOT NULL,
  number_of_people INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Solicitudes de Asistencia
CREATE TABLE IF NOT EXISTS assistance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  restaurant_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Reseñas
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  dish_id INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ÍNDICES ====================

-- Índices para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_user_id ON favorite_dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combinations_user_id ON saved_combinations(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_user_id ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_dish_id ON reviews(dish_id);

-- ==================== FUNCIONES ====================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_data_updated_at BEFORE UPDATE ON loyalty_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waitlist_entries_updated_at BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistance_requests_updated_at BEFORE UPDATE ON assistance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== POLÍTICAS RLS (Row Level Security) ====================
-- Nota: Estas políticas asumen que usarás autenticación de Supabase
-- Si no usas autenticación, puedes deshabilitar RLS o ajustar las políticas

-- Habilitar RLS en todas las tablas
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas básicas: Los usuarios solo pueden ver/editar sus propios datos
-- Nota: Si no usas autenticación de Supabase, puedes comentar estas políticas
-- y usar user_id directamente en las consultas

-- Políticas para orders
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para cart_items
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para favorite_dishes
CREATE POLICY "Users can manage their own favorites"
  ON favorite_dishes FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para saved_combinations
CREATE POLICY "Users can manage their own combinations"
  ON saved_combinations FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para loyalty_data
CREATE POLICY "Users can view their own loyalty data"
  ON loyalty_data FOR SELECT
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own loyalty data"
  ON loyalty_data FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para contacts
CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para waitlist_entries
CREATE POLICY "Users can manage their own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para assistance_requests
CREATE POLICY "Users can manage their own assistance requests"
  ON assistance_requests FOR ALL
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

-- Políticas para reviews (todos pueden leer, solo el autor puede escribir)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id = current_setting('app.user_id', true));
