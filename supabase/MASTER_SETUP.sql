-- ==================== SCRIPT MAESTRO DE CONFIGURACIÓN ====================
-- Este script ejecuta TODO en el orden correcto:
-- 1. Schema optimizado
-- 2. Políticas RLS
-- 3. Restaurante inicial
-- 4. Productos iniciales
-- 
-- ⚠️ IMPORTANTE: Si ya tienes datos, haz backup primero
-- Este script puede eliminar/modificar tablas existentes

-- ==================== PASO 1: SCHEMA OPTIMIZADO ====================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabla de Restaurantes
DROP TABLE IF EXISTS restaurants CASCADE;
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
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

-- Tabla de Usuarios
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
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

-- Tabla de Productos (Optimizada)
DROP TABLE IF EXISTS products CASCADE;
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  badges TEXT[],
  category TEXT NOT NULL,
  origin TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT products_restaurant_name_unique UNIQUE (restaurant_id, name)
);

-- Tabla de Órdenes (Optimizada)
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'orden_enviada', 'orden_recibida', 'en_preparacion', 
    'lista_para_entregar', 'en_entrega', 'entregada', 'cancelada', 'con_incidencias'
  )),
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL,
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  table_number TEXT,
  delivery_address JSONB,
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de Items del Carrito (Optimizada)
-- Eliminar tabla si existe para recrearla con el schema correcto (si no hay datos importantes)
DROP TABLE IF EXISTS cart_items CASCADE;

CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT cart_items_user_product_unique UNIQUE (user_id, product_id, notes)
);

-- Tabla de Favoritos
-- Eliminar tabla si existe para recrearla con el schema correcto
DROP TABLE IF EXISTS favorite_dishes CASCADE;

CREATE TABLE favorite_dishes (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT favorite_dishes_user_product_unique UNIQUE (user_id, product_id)
);

-- Tabla de Combinaciones Guardadas
DROP TABLE IF EXISTS saved_combinations CASCADE;
CREATE TABLE saved_combinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  product_ids INTEGER[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE
);

-- Tabla de Datos de Lealtad
DROP TABLE IF EXISTS loyalty_data CASCADE;
CREATE TABLE loyalty_data (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  current_level TEXT NOT NULL DEFAULT 'bronze' CHECK (current_level IN ('bronze', 'silver', 'gold', 'platinum')),
  monthly_growth INTEGER NOT NULL DEFAULT 0,
  points_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Contactos
DROP TABLE IF EXISTS contacts CASCADE;
CREATE TABLE contacts (
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

-- Tabla de Entradas de Lista de Espera
DROP TABLE IF EXISTS waitlist_entries CASCADE;
CREATE TABLE waitlist_entries (
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

-- Tabla de Solicitudes de Asistencia
DROP TABLE IF EXISTS assistance_requests CASCADE;
CREATE TABLE assistance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Reseñas
DROP TABLE IF EXISTS reviews CASCADE;
CREATE TABLE reviews (
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
  CHECK (restaurant_id IS NOT NULL OR product_id IS NOT NULL)
);

-- Tabla de Promociones
DROP TABLE IF EXISTS promotions CASCADE;
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  category TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10, 2),
  original_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  applicable_hours JSONB,
  applicable_days TEXT[],
  included_items JSONB,
  max_uses_per_user INTEGER,
  total_uses INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de Cupones
DROP TABLE IF EXISTS coupons CASCADE;
CREATE TABLE coupons (
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

-- ==================== ÍNDICES OPTIMIZADOS ====================

-- Índices para restaurantes
CREATE INDEX IF NOT EXISTS idx_restaurants_city ON restaurants(city);
CREATE INDEX IF NOT EXISTS idx_restaurants_country ON restaurants(country);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);

-- Índices para usuarios
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Índices para productos (millones de registros)
CREATE INDEX IF NOT EXISTS idx_products_restaurant_id ON products(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_restaurant_active ON products(restaurant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_category_restaurant ON products(category, restaurant_id, is_active);

-- Índices para órdenes (millones de registros)
-- Nota: Estos índices se crean después de que la tabla orders existe
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);

-- Agregar columna order_number si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'order_number'
  ) THEN
    ALTER TABLE orders ADD COLUMN order_number TEXT;
  END IF;
END $$;

-- Índice para order_number (solo indexa valores no nulos para mejor rendimiento)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number) WHERE order_number IS NOT NULL;

-- Índices para carrito
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant_id ON cart_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_restaurant ON cart_items(user_id, restaurant_id);

-- Índices para favoritos
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_user_id ON favorite_dishes(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_product_id ON favorite_dishes(product_id);
CREATE INDEX IF NOT EXISTS idx_favorite_dishes_restaurant_id ON favorite_dishes(restaurant_id);

-- Índices para combinaciones
CREATE INDEX IF NOT EXISTS idx_saved_combinations_user_id ON saved_combinations(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_combinations_restaurant_id ON saved_combinations(restaurant_id);

-- Índices para contactos
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- Índices para lista de espera
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_user_id ON waitlist_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_restaurant_id ON waitlist_entries(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_restaurant_status ON waitlist_entries(restaurant_id, status, position);

-- Índices para asistencia
CREATE INDEX IF NOT EXISTS idx_assistance_requests_user_id ON assistance_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_restaurant_id ON assistance_requests(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_order_id ON assistance_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_status ON assistance_requests(status);

-- Índices para reseñas
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Índices para promociones
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_id ON promotions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_promotions_category ON promotions(category);
CREATE INDEX IF NOT EXISTS idx_promotions_is_active ON promotions(is_active);
CREATE INDEX IF NOT EXISTS idx_promotions_valid_dates ON promotions(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promotions_restaurant_active ON promotions(restaurant_id, is_active) WHERE is_active = true;

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

-- ==================== TRIGGERS ====================

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

-- Función para generar número de orden único (se crea DESPUÉS de la tabla orders)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  sequence_num INTEGER;
BEGIN
  -- Solo generar si order_number está vacío o es NULL
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    year_part := TO_CHAR(NOW(), 'YYYY');
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM orders
    WHERE order_number LIKE 'ORD-' || year_part || '-%';
    NEW.order_number := 'ORD-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para generar número de orden automáticamente
DROP TRIGGER IF EXISTS generate_order_number_trigger ON orders;
CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number();

-- ==================== POLÍTICAS RLS ====================

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

-- Políticas para restaurantes
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Políticas para usuarios
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (true);

-- Políticas para productos
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Políticas para cart_items
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para orders
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (true);

-- Políticas para favorite_dishes
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorite_dishes;
CREATE POLICY "Users can manage their own favorites"
  ON favorite_dishes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para saved_combinations
DROP POLICY IF EXISTS "Users can manage their own combinations" ON saved_combinations;
CREATE POLICY "Users can manage their own combinations"
  ON saved_combinations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para loyalty_data
DROP POLICY IF EXISTS "Users can view their own loyalty data" ON loyalty_data;
DROP POLICY IF EXISTS "Users can update their own loyalty data" ON loyalty_data;
CREATE POLICY "Users can view their own loyalty data" ON loyalty_data FOR SELECT USING (true);
CREATE POLICY "Users can update their own loyalty data" ON loyalty_data FOR ALL USING (true);

-- Políticas para contacts
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para waitlist_entries
DROP POLICY IF EXISTS "Users can manage their own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can manage their own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para assistance_requests
DROP POLICY IF EXISTS "Users can manage their own assistance requests" ON assistance_requests;
CREATE POLICY "Users can manage their own assistance requests"
  ON assistance_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- Políticas para reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (true);

-- Políticas para promotions
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- Políticas para coupons
DROP POLICY IF EXISTS "Users can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can insert their own coupons" ON coupons;
CREATE POLICY "Users can view their own coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "Users can insert their own coupons" ON coupons FOR INSERT WITH CHECK (true);

-- ==================== CREAR RESTAURANTE INICIAL ====================

INSERT INTO restaurants (id, name, slug, city, country, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'DONK RESTAURANT', 
  'donk-restaurant', 
  'Ciudad de México', 
  'México', 
  true
)
ON CONFLICT (id) DO NOTHING;

-- ==================== INSERTAR PRODUCTOS ====================

DO $$
DECLARE
  restaurant_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  INSERT INTO products (restaurant_id, name, description, price, image_url, badges, category, origin) VALUES
  -- ENTRADAS
  (restaurant_uuid, 'Tacos de Atún Marinado', 'Atún fresco con aderezo de chipotle artesanal, aguacate y cebolla morada.', 18.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxagxlshYO2auuogSyw7OhNdc7J8dbVtovgy1mx2QnTHrkMM2grGKiD5FOKoTvHJCxaf3o2IELhRAX9KuZmf3PSo_hZMFmXbeQpucwaZ41LUFYyamXCfCpGD8b3ysaoiUZmN_hQx3AB0zC0PVC5YeERx23oMBXNH-Bix9Tpdb9CNzdIliDef0s4xZn5I_BDf46Q_4zQliQOmvnxglHcpo1lGW6PGIGHletH7NmXDLi-rmVLzUYaOOr3OZJFOHTy4bsX4Sb8uyCMTC', ARRAY['vegano'], 'Entradas', 'mar'),
  (restaurant_uuid, 'Ceviche de Maracuyá', 'Pescado blanco marinado en leche de tigre de maracuyá y toques de cilantro.', 22.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Entradas', 'mar'),
  (restaurant_uuid, 'Carpaccio de Res', 'Láminas finas de res con parmesano, arúgula y aceite de trufa blanca.', 19.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1Y98JWSxq59D6xrh4JHhm4q072LDOHj17OoZ6LzLrjORuYwpo5U34TJPTXqOI4jEB93fhXcE0vO3VyiAMBLQBDC0E2mFh_aAgBjf5Lyg9-1kfvymXKbxsPQpneXX2TyNW61UnZ3Fo8BP8jz0wJ6ZExUHJGeGUJavA4TKiT4e6JNUG5AdgejiOFA7Gw_lR4o0Q4Fq2jKpNkLbfqTPwfs-rTcYvGMJayKZ0OdUtJDbwETkbjK0bd2ufND56laE10uZeDOX6vMLfJAf', NULL, 'Entradas', 'tierra'),
  (restaurant_uuid, 'Ensalada Mediterránea', 'Fresco, saludable y de temporada', 12.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK', ARRAY['vegano'], 'Entradas', 'vegetariano'),
  -- PLATOS FUERTES
  (restaurant_uuid, 'Rib Eye a la Leña', 'Corte premium de 400g cocinado a fuego lento con madera de encino.', 45.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', ARRAY['especialidad'], 'Platos Fuertes', 'tierra'),
  (restaurant_uuid, 'Pollo al Limón & Hierbas', 'Plato insignia del día', 15.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz', NULL, 'Platos Fuertes', 'aire'),
  (restaurant_uuid, 'Quinoa & Aguacate Bowl', 'Nutritivo y equilibrado', 16.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g', ARRAY['vegano'], 'Platos Fuertes', 'vegetariano'),
  (restaurant_uuid, 'Pasta al Pomodoro', 'Elaboración artesanal', 20.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL', NULL, 'Platos Fuertes', 'vegetariano'),
  -- BEBIDAS
  (restaurant_uuid, 'Café Espresso', 'Café italiano intenso y aromático', 4.50, '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', ''),
  (restaurant_uuid, 'Jugo de Naranja Natural', 'Recién exprimido, rico en vitamina C', 6.00, '/jugo-naranja.avif', NULL, 'Bebidas', ''),
  (restaurant_uuid, 'Americano', '180 ml - NESPRESSO', 48.00, '/cafe-americano-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Espresso', '60 ml - NESPRESSO', 48.00, '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Capuchino', '180 ml - NESPRESSO. Opciones: Napolitano, baileys, vainilla', 60.00, '/capuchino-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Frapuccino', '180 ml - NESPRESSO', 70.00, '/frappuccino.jpg', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Té', 'Opciones: Hierbabuena / Manzanilla', 35.00, '/te.webp', NULL, 'Bebidas', 'cafe'),
  -- POSTRES
  (restaurant_uuid, 'Tarta de Chocolate', 'Deliciosa tarta con cobertura de chocolate belga', 8.50, '/tarta-chocolate.jpg', NULL, 'Postres', ''),
  (restaurant_uuid, 'Flan de Vainilla', 'Tradicional flan casero con caramelo', 7.00, '/flan-vainilla.jpg', NULL, 'Postres', ''),
  (restaurant_uuid, 'Volcán', 'Con una textura única, firme por fuera, suave por dentro, acompañado de helado. Opciones: Dulce de leche o chocolate', 140.00, '/volcan.jpg', ARRAY['favorito'], 'Postres', 'pastel'),
  (restaurant_uuid, 'Cheesecake Vasco', 'Cremoso pay de natilla montado sobre cama de galleta horneada y bañado con mermelada de frutos rojos. (200 g.)', 190.00, '/cheesecake-vasco.jpg', NULL, 'Postres', 'pay_de_queso'),
  (restaurant_uuid, 'Pan de Elote', 'Recién horneado, sobre una cama de mermelada, frutos rojos, helado de vainilla, bañado con dulce de cajeta y nuez. (200 g.)', 140.00, '/pan-elote.jpeg', NULL, 'Postres', 'pastel'),
  (restaurant_uuid, 'Cheesecake Lotus', 'Pay de queso con la autentica galleta "Lotus Biscoff", bañado con mezcla de leches, acompañado de frutos rojos.', 140.00, '/cheesecake-lotus.png', NULL, 'Postres', 'pay_de_queso'),
  (restaurant_uuid, 'Pastel 3 Leches', 'Delicioso pan de vainilla, con trozos de durazno, bañado con mezcla de 3 leches, con frutos rojos y nuez.', 140.00, '/pastel-3leches.jpg', NULL, 'Postres', 'pastel'),
  (restaurant_uuid, 'Red Velvet', 'Pan de red velvet con sabor a chocolate oscuro y betún de queso crema. Coronado con fresa natural.', 140.00, '/red-velvet.jpg', NULL, 'Postres', 'pastel'),
  -- COCTELERÍA
  (restaurant_uuid, 'Mojito Clásico', 'Ron, menta fresca, lima y soda', 12.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Coctelería', ''),
  (restaurant_uuid, 'Margarita Premium', 'Tequila reposado, triple sec y jugo de lima', 14.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', NULL, 'Coctelería', ''),
  (restaurant_uuid, 'Carajillo', 'Café con licor 43', 145.00, '/carajillo solo.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Coketillo', 'Carajillo con paleta de chocomilk', 160.00, '/coketillo_donk.jpg', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Carajilla', 'Café con Baileys', 145.00, '/carajilla.jpg', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Licor 43', '700 ml - Porción: $140.00 / Botella: $1,400.00', 140.00, '/licor43.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Baileys', '700 ml - Porción: $120.00 / Botella: $1,200.00', 120.00, '/baileys.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Frangelico', '700 ml - Porción: $120.00 / Botella: $1,200.00', 120.00, '/frangelico.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Sambuca', '700 ml - Porción: $100.00 / Botella: $1,000.00', 100.00, '/sambuca.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Chinchón Seco', '1000 ml - Porción: $95.00 / Botella: $950.00', 95.00, '/chincho-seco.avif', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Chinchón Dulce', '1000 ml - Porción: $95.00 / Botella: $950.00', 95.00, '/chinchon-dulce.jpg', NULL, 'Coctelería', 'digestivos')
  ON CONFLICT (restaurant_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    badges = EXCLUDED.badges,
    category = EXCLUDED.category,
    origin = EXCLUDED.origin,
    updated_at = NOW();
END $$;

-- ==================== VERIFICACIÓN ====================

-- Verificar que se crearon las tablas
SELECT 
  'restaurants' as tabla, COUNT(*) as registros FROM restaurants
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'users', COUNT(*) FROM users;

-- Mostrar productos insertados
SELECT id, name, category, price FROM products ORDER BY id LIMIT 10;
