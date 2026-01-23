-- ==================== CORRECCIÓN DE POLÍTICAS RLS ====================
-- Este script ajusta las políticas RLS para que funcionen sin autenticación real
-- Ejecuta este script DESPUÉS de ejecutar el schema.sql principal

-- ==================== POLÍTICAS PARA CART_ITEMS ====================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;

-- Crear nueva política que permite operaciones con user_id de texto
CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== POLÍTICAS PARA ORDERS ====================

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Crear nuevas políticas
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
