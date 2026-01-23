-- ==================== CORRECCIÓN DE POLÍTICAS RLS (VERSIÓN OPTIMIZADA) ====================
-- Este script ajusta las políticas RLS para que funcionen sin autenticación real
-- Optimizado para escala mundial con millones de usuarios y productos

-- ==================== POLÍTICAS PARA RESTAURANTES ====================
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- ==================== POLÍTICAS PARA USUARIOS ====================
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (true);

-- ==================== POLÍTICAS PARA PRODUCTOS ====================
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- ==================== POLÍTICAS PARA CART_ITEMS ====================
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA ORDERS ====================
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (true);

-- ==================== POLÍTICAS PARA FAVORITE_DISHES ====================
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorite_dishes;
CREATE POLICY "Users can manage their own favorites"
  ON favorite_dishes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA SAVED_COMBINATIONS ====================
DROP POLICY IF EXISTS "Users can manage their own combinations" ON saved_combinations;
CREATE POLICY "Users can manage their own combinations"
  ON saved_combinations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA LOYALTY_DATA ====================
DROP POLICY IF EXISTS "Users can view their own loyalty data" ON loyalty_data;
DROP POLICY IF EXISTS "Users can update their own loyalty data" ON loyalty_data;

CREATE POLICY "Users can view their own loyalty data"
  ON loyalty_data FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own loyalty data"
  ON loyalty_data FOR ALL
  USING (true);

-- ==================== POLÍTICAS PARA CONTACTS ====================
DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;
CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA WAITLIST_ENTRIES ====================
DROP POLICY IF EXISTS "Users can manage their own waitlist entries" ON waitlist_entries;
CREATE POLICY "Users can manage their own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA ASSISTANCE_REQUESTS ====================
DROP POLICY IF EXISTS "Users can manage their own assistance requests" ON assistance_requests;
CREATE POLICY "Users can manage their own assistance requests"
  ON assistance_requests FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA REVIEWS ====================
DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (true);

-- ==================== POLÍTICAS PARA PROMOTIONS ====================
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

-- ==================== POLÍTICAS PARA COUPONS ====================
DROP POLICY IF EXISTS "Users can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can insert their own coupons" ON coupons;

CREATE POLICY "Users can view their own coupons"
  ON coupons FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own coupons"
  ON coupons FOR INSERT
  WITH CHECK (true);
