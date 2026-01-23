-- ==================== SCHEMA OPTIMIZADO PARA ESCALA MUNDIAL ====================
-- Este schema está diseñado para manejar:
-- - Cientos de miles de restaurantes
-- - Millones de productos
-- - Cientos de miles de usuarios
-- - Millones de órdenes

-- ==================== EXTENSIONES ====================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsquedas de texto eficientes

-- ==================== TABLA DE RESTAURANTES ====================
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
  description TEXT,
  address TEXT,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para restaurantes
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_country ON restaurants(country);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_location ON restaurants USING GIST (
  ll_to_earth(latitude, longitude)
) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- ==================== TABLA DE USUARIOS ====================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'es',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- ==================== TABLA DE PRODUCTOS (OPTIMIZADA) ====================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  badges TEXT[], -- Array de badges: ['vegano', 'especialidad', 'favorito']
  category TEXT NOT NULL, -- 'Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Coctelería'
  origin TEXT DEFAULT '', -- 'mar', 'tierra', 'aire', 'vegetariano', 'vegano', 'cafe', etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Índice compuesto para búsquedas comunes
  CONSTRAINT products_restaurant_name_unique UNIQUE (restaurant_id, name)
);

-- Índices optimizados para productos (millones de registros)
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_restaurant_active ON products(restaurant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING GIN (name gin_trgm_ops); -- Búsqueda de texto
CREATE INDEX IF NOT EXISTS idx_products_category_restaurant ON products(category, restaurant_id, is_active);

-- ==================== TABLA DE ÓRDENES (OPTIMIZADA) ====================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL, -- Número de orden legible (ej: ORD-2025-001234)
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'orden_enviada', 'orden_recibida', 'en_preparacion', 
    'lista_para_entregar', 'en_entrega', 'entregada', 'cancelada', 'con_incidencias'
  )),
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL, -- Array de OrderItem
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  table_number TEXT,
  delivery_address JSONB, -- Para órdenes a domicilio
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices optimizados para órdenes (millones de registros)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Particionamiento por fecha (opcional, para millones de órdenes)
-- CREATE TABLE orders_2025_01 PARTITION OF orders FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- ==================== TABLA DE ITEMS DEL CARRITO (OPTIMIZADA) ====================
CREATE TABLE IF NOT EXISTS cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Un usuario solo puede tener un item del mismo producto con las mismas notas
  CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id, notes)
);

-- Índices para carrito
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant_id ON cart_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_restaurant ON cart_items(user_id, restaurant_id);

-- ==================== TABLA DE FAVORITOS ====================
CREATE TABLE IF NOT EXISTS favorite_dishes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT favorite_dishes_user_product_unique UNIQUE (user_id, product_id)
);

-- Índices para favoritos
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_user_id ON favorite_dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_product_id ON favorite_dishes(product_id);
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_restaurant_id ON favorite_dishes(restaurant_id);

-- ==================== TABLA DE COMBINACIONES GUARDADAS ====================
CREATE TABLE IF NOT EXISTS saved_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_ids INTEGER[] NOT NULL, -- Array de IDs de productos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

-- Índices para combinaciones
CREATE INDEX IF NOT EXISTS idx_saved_combinations_user_id ON saved_combinations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combinations_restaurant_id ON saved_combinations(restaurant_id);

-- ==================== TABLA DE DATOS DE LEALTAD ====================
CREATE TABLE IF NOT EXISTS loyalty_data (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  current_level TEXT NOT NULL DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum')),
  monthly_growth INTEGER NOT NULL DEFAULT 0,
  points_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TABLA DE CONTACTOS ====================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL)
);

-- Índices para contactos
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- ==================== TABLA DE ENTRADAS DE LISTA DE ESPERA ====================
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  zones TEXT[] NOT NULL,
  number_of_people INTEGER NOT NULL CHECK (number_of_people > 0),
  position INTEGER NOT NULL DEFAULT 0,
  estimated_wait_minutes INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para lista de espera
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_restaurant_id ON waitlist_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_restaurant_status ON waitlist_entries(restaurant_id, status, position);

-- ==================== TABLA DE SOLICITUDES DE ASISTENCIA ====================
CREATE TABLE IF NOT EXISTS assistance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para solicitudes de asistencia
CREATE INDEX IF NOT EXISTS idx_assistance_requests_user_id ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_restaurant_id ON assistance_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_order_id ON assistance_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON assistance_requests(status);

-- ==================== TABLA DE RESEÑAS ====================
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  media_urls TEXT[],
  is_verified_purchase BOOLEAN NOT NULL DEFAULT false,
  helpful_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (restaurant_id IS NOT NULL OR product_id IS NOT NULL) -- Debe ser reseña de restaurante o producto
);

-- Índices para reseñas
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- ==================== TABLA DE PROMOCIONES ====================
CREATE TABLE IF NOT EXISTS promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL, -- 'Desayuno', 'Temporada', 'Exclusivo VIP'
  discount_type TEXT NOT NULL, -- 'percentage', 'fixed', '2x1', 'combo'
  discount_value DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_hours JSONB, -- Horarios de aplicación
  applicable_days TEXT[], -- Días de la semana
  included_items JSONB, -- Productos incluidos
  max_uses_per_user INTEGER,
  total_uses INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para promociones
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_valid_dates ON promotions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_active ON promotions(restaurant_id, is_active) WHERE is_active = true;

-- ==================== TABLA DE CUPONES ====================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para cupones
CREATE INDEX IF NOT EXISTS idx_coupons_user_id ON coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_coupons_restaurant_id ON coupons(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_used ON coupons(is_used);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);

-- ==================== FUNCIONES ====================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Función para generar número de orden único
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM orders
  WHERE order_number LIKE 'ORD-' || year_part || '-%';
  RETURN 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
END;
$$ language 'plpgsql';

-- ==================== TRIGGERS ====================

-- Triggers para actualizar updated_at
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
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

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para generar número de orden automáticamente
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  WHEN (NEW.order_number IS NULL)
  EXECUTE FUNCTION generate_order_number();

-- ==================== POLÍTICAS RLS (Row Level Security) ====================

-- Habilitar RLS en todas las tablas
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_combinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Políticas para restaurantes (todos pueden leer activos)
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Políticas para usuarios (solo pueden ver/editar sus propios datos)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id OR id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (auth.uid() = id OR id = current_setting('app.user_id', true)::uuid);

-- Políticas para productos (todos pueden leer activos)
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Políticas para órdenes
CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para cart_items
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para favorite_dishes
CREATE POLICY "Users can manage their own favorites"
  ON favorite_dishes FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para saved_combinations
CREATE POLICY "Users can manage their own combinations"
  ON saved_combinations FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para loyalty_data
CREATE POLICY "Users can view their own loyalty data"
  ON loyalty_data FOR SELECT
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own loyalty data"
  ON loyalty_data FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para contacts
CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para waitlist_entries
CREATE POLICY "Users can manage their own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para assistance_requests
CREATE POLICY "Users can manage their own assistance requests"
  ON assistance_requests FOR ALL
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true))
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para reviews (todos pueden leer, solo el autor puede escribir)
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- Políticas para promotions (todos pueden leer activas)
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- Políticas para coupons
CREATE POLICY "Users can view their own coupons"
  ON coupons FOR SELECT
  USING (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

CREATE POLICY "Users can insert their own coupons"
  ON coupons FOR INSERT
  WITH CHECK (auth.uid()::text = user_id::text OR user_id::text = current_setting('app.user_id', true));

-- ==================== VISTAS MATERIALIZADAS (OPCIONAL, PARA RENDIMIENTO) ====================

-- Vista materializada para estadísticas de restaurantes (se actualiza periódicamente)
CREATE MATERIALIZED VIEW IF NOT EXISTS restaurant_stats AS
SELECT 
  r.id,
  r.name,
  COUNT(DISTINCT o.id) as total_orders,
  COUNT(DISTINCT rv.id) as total_reviews,
  AVG(rv.rating) as avg_rating,
  COUNT(DISTINCT p.id) as total_products
FROM restaurants r
LEFT JOIN orders o ON o.restaurant_id = r.id
LEFT JOIN reviews rv ON rv.restaurant_id = r.id
LEFT JOIN products p ON p.restaurant_id = r.id AND p.is_active = true
WHERE r.is_active = true
GROUP BY r.id, r.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_restaurant_stats_id ON restaurant_stats(id);

-- ==================== COMENTARIOS Y DOCUMENTACIÓN ====================

COMMENT ON TABLE restaurants IS 'Tabla de restaurantes. Soporta cientos de miles de restaurantes.';
COMMENT ON TABLE products IS 'Tabla de productos. Optimizada para millones de productos con índices compuestos.';
COMMENT ON TABLE orders IS 'Tabla de órdenes. Optimizada para millones de órdenes con particionamiento opcional por fecha.';
COMMENT ON TABLE users IS 'Tabla de usuarios. Soporta cientos de miles de usuarios.';
COMMENT ON INDEX idx_products_restaurant_active IS 'Índice compuesto optimizado para consultas de productos activos por restaurante';
COMMENT ON INDEX idx_orders_user_created IS 'Índice compuesto para consultas de historial de órdenes por usuario';
