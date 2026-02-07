-- ==================== ACTUALIZAR TODAS LAS POLÍTICAS RLS PARA AUTENTICACIÓN SIMPLE ====================
-- Este script actualiza TODAS las políticas RLS de todas las tablas para que funcionen con autenticación simple
-- Compatible con Supabase Auth (auth.uid()) y autenticación simple (current_setting('app.user_id'))
-- Ejecutar en Supabase SQL Editor

-- ==================== FUNCIÓN AUXILIAR ====================
-- Asegurar que la función set_config existe (para establecer variables de sesión)
CREATE OR REPLACE FUNCTION set_config(setting_name text, setting_value text)
RETURNS void AS $$
BEGIN
    PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función auxiliar para obtener app.user_id de forma segura
CREATE OR REPLACE FUNCTION get_app_user_id()
RETURNS text AS $$
BEGIN
    BEGIN
        RETURN current_setting('app.user_id', true);
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==================== ELIMINAR TODAS LAS POLÍTICAS EXISTENTES ====================
-- Este bloque elimina todas las políticas RLS existentes para evitar conflictos
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ==================== 1. RESTAURANTS ====================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_insert" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_select" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_update" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can update restaurants" ON restaurants;

-- Políticas para restaurants (todos pueden ver activos, todos pueden insertar/actualizar)
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

CREATE POLICY "Anyone can insert restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update restaurants"
  ON restaurants FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==================== 2. USERS ====================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Allow all SELECT on users" ON users;
DROP POLICY IF EXISTS "Allow all INSERT on users" ON users;
DROP POLICY IF EXISTS "Allow all UPDATE on users" ON users;
DROP POLICY IF EXISTS "simple_users_insert" ON users;
DROP POLICY IF EXISTS "simple_users_select" ON users;
DROP POLICY IF EXISTS "simple_users_update" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Políticas para users (muy permisivas para desarrollo)
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update users"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "simple_restaurant_staff_insert" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_restaurant_staff_select" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_restaurant_staff_update" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_staff_insert" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_staff_select" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_staff_update" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can view staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can update staff records" ON restaurant_staff;

-- Políticas PERMISIVAS para restaurant_staff (sin dependencia de auth.uid ni app.user_id)
-- Esto evita problemas de RLS con autenticación simple y durante el registro
CREATE POLICY "simple_restaurant_staff_all"
  ON restaurant_staff FOR ALL
  USING (true)
  WITH CHECK (true);

-- ==================== 4. PRODUCTS ====================
-- Ya actualizado en fix-products-rls-simple-auth.sql, pero incluimos aquí para completitud
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Restaurants can view their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can insert their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can update their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can delete their own products" ON products;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Restaurants can view their own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurant owners can insert their own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurant owners can update their own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurant owners can delete their own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 5. ORDERS ====================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

CREATE POLICY "Users can view their own orders"
  ON orders FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own orders"
  ON orders FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own orders"
  ON orders FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 6. CART_ITEMS ====================
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;

CREATE POLICY "Users can manage their own cart"
  ON cart_items FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 7. FAVORITE_DISHES ====================
ALTER TABLE favorite_dishes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorite_dishes;

CREATE POLICY "Users can manage their own favorites"
  ON favorite_dishes FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 8. SAVED_COMBINATIONS ====================
ALTER TABLE saved_combinations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own combinations" ON saved_combinations;

CREATE POLICY "Users can manage their own combinations"
  ON saved_combinations FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 9. LOYALTY_DATA ====================
ALTER TABLE loyalty_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own loyalty data" ON loyalty_data;
DROP POLICY IF EXISTS "Users can update their own loyalty data" ON loyalty_data;

CREATE POLICY "Users can view their own loyalty data"
  ON loyalty_data FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own loyalty data"
  ON loyalty_data FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 10. CONTACTS ====================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own contacts" ON contacts;

CREATE POLICY "Users can manage their own contacts"
  ON contacts FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 11. WAITLIST_ENTRIES ====================
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own waitlist entries" ON waitlist_entries;

CREATE POLICY "Users can manage their own waitlist entries"
  ON waitlist_entries FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 12. ASSISTANCE_REQUESTS ====================
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own assistance requests" ON assistance_requests;

CREATE POLICY "Users can manage their own assistance requests"
  ON assistance_requests FOR ALL
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 13. REVIEWS ====================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own reviews"
  ON reviews FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 14. PROMOTIONS ====================
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Restaurants can manage their own promotions" ON promotions;

CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (is_active = true AND NOW() BETWEEN valid_from AND valid_until);

CREATE POLICY "Restaurants can manage their own promotions"
  ON promotions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 15. COUPONS ====================
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coupons" ON coupons;
DROP POLICY IF EXISTS "Users can insert their own coupons" ON coupons;

CREATE POLICY "Users can view their own coupons"
  ON coupons FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own coupons"
  ON coupons FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 16. RESERVATIONS ====================
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can create their own reservations" ON reservations;
DROP POLICY IF EXISTS "Users can update their own pending or confirmed reservations" ON reservations;
DROP POLICY IF EXISTS "Users can cancel their own reservations" ON reservations;
DROP POLICY IF EXISTS "Restaurants can view their restaurant reservations" ON reservations;
DROP POLICY IF EXISTS "Restaurants can update their restaurant reservations status" ON reservations;

CREATE POLICY "Users can view their own reservations"
  ON reservations FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can create their own reservations"
  ON reservations FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own pending or confirmed reservations"
  ON reservations FOR UPDATE
  USING (
    (user_id::text = auth.uid()::text OR user_id::text = current_setting('app.user_id', true))
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can cancel their own reservations"
  ON reservations FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    (user_id::text = auth.uid()::text OR user_id::text = current_setting('app.user_id', true))
    AND status = 'cancelled'
  );

CREATE POLICY "Restaurants can view their restaurant reservations"
  ON reservations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = reservations.restaurant_id
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurants can update their restaurant reservations status"
  ON reservations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = reservations.restaurant_id
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = reservations.restaurant_id
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 17. RESTAURANT_MENU_SECTIONS ====================
-- Ya actualizado en fix-restaurant-menu-sections-rls-simple-auth.sql, pero incluimos aquí
ALTER TABLE restaurant_menu_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurants can view their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can insert their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can update their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can delete their own menu sections" ON restaurant_menu_sections;

-- Política: Cualquiera puede ver las secciones de menú de restaurantes activos (para comensales)
CREATE POLICY "Anyone can view menu sections of active restaurants"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_menu_sections.restaurant_id
        AND r.is_active = true
    )
  );

-- Política: Los restaurantes pueden ver sus propias secciones (para gestión)
CREATE POLICY "Restaurants can view their own menu sections"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_menu_sections.restaurant_id
        AND rs.is_active = true
        AND rs.role IN ('owner', 'admin', 'manager')
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurants can insert their own menu sections"
  ON restaurant_menu_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_menu_sections.restaurant_id
        AND rs.is_active = true
        AND rs.role IN ('owner', 'admin', 'manager')
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurants can update their own menu sections"
  ON restaurant_menu_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_menu_sections.restaurant_id
        AND rs.is_active = true
        AND rs.role IN ('owner', 'admin', 'manager')
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_menu_sections.restaurant_id
        AND rs.is_active = true
        AND rs.role IN ('owner', 'admin', 'manager')
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurants can delete their own menu sections"
  ON restaurant_menu_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_menu_sections.restaurant_id
        AND rs.is_active = true
        AND rs.role IN ('owner', 'admin', 'manager')
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 18. USER_PROFILES ====================
-- Ya actualizado en fix-user-profiles-rls.sql, pero incluimos aquí para completitud
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 19. PAYMENTS ====================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

CREATE POLICY "Users can view their own payments"
  ON payments FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 20. USER_ADDRESSES ====================
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON user_addresses;

CREATE POLICY "Users can view their own addresses"
  ON user_addresses FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own addresses"
  ON user_addresses FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own addresses"
  ON user_addresses FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can delete their own addresses"
  ON user_addresses FOR DELETE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 21. USER_PAYMENT_METHODS ====================
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can insert their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can update their own payment methods" ON user_payment_methods;
DROP POLICY IF EXISTS "Users can delete their own payment methods" ON user_payment_methods;

CREATE POLICY "Users can view their own payment methods"
  ON user_payment_methods FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own payment methods"
  ON user_payment_methods FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own payment methods"
  ON user_payment_methods FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can delete their own payment methods"
  ON user_payment_methods FOR DELETE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 22. USER_BILLING_PROFILES ====================
ALTER TABLE user_billing_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can insert their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can update their own billing profiles" ON user_billing_profiles;
DROP POLICY IF EXISTS "Users can delete their own billing profiles" ON user_billing_profiles;

CREATE POLICY "Users can view their own billing profiles"
  ON user_billing_profiles FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own billing profiles"
  ON user_billing_profiles FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own billing profiles"
  ON user_billing_profiles FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can delete their own billing profiles"
  ON user_billing_profiles FOR DELETE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 23. USER_BILLING_RECEPTION_EMAILS ====================
ALTER TABLE user_billing_reception_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own reception emails" ON user_billing_reception_emails;
DROP POLICY IF EXISTS "Users can insert their own reception emails" ON user_billing_reception_emails;
DROP POLICY IF EXISTS "Users can update their own reception emails" ON user_billing_reception_emails;
DROP POLICY IF EXISTS "Users can delete their own reception emails" ON user_billing_reception_emails;

CREATE POLICY "Users can view their own reception emails"
  ON user_billing_reception_emails FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own reception emails"
  ON user_billing_reception_emails FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own reception emails"
  ON user_billing_reception_emails FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can delete their own reception emails"
  ON user_billing_reception_emails FOR DELETE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 24. USER_SETTINGS ====================
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;

CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  )
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 25. USER_TRANSACTIONS ====================
ALTER TABLE user_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON user_transactions;

CREATE POLICY "Users can view their own transactions"
  ON user_transactions FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== 26. RESTAURANT_COVER_IMAGES ====================
ALTER TABLE restaurant_cover_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant cover images" ON restaurant_cover_images;
DROP POLICY IF EXISTS "Restaurant owners can manage their cover images" ON restaurant_cover_images;

CREATE POLICY "Anyone can view restaurant cover images"
  ON restaurant_cover_images FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their cover images"
  ON restaurant_cover_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_cover_images.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_cover_images.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 27. RESTAURANT_SOCIAL_MEDIA ====================
ALTER TABLE restaurant_social_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant social media" ON restaurant_social_media;
DROP POLICY IF EXISTS "Restaurant owners can manage their social media" ON restaurant_social_media;

CREATE POLICY "Anyone can view restaurant social media"
  ON restaurant_social_media FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their social media"
  ON restaurant_social_media FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_social_media.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_social_media.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 28. RESTAURANT_HOURS ====================
ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant hours" ON restaurant_hours;
DROP POLICY IF EXISTS "Restaurant owners can manage their hours" ON restaurant_hours;

CREATE POLICY "Anyone can view restaurant hours"
  ON restaurant_hours FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their hours"
  ON restaurant_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_hours.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_hours.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 29. RESTAURANT_SPECIAL_HOURS ====================
ALTER TABLE restaurant_special_hours ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant special hours" ON restaurant_special_hours;
DROP POLICY IF EXISTS "Restaurant owners can manage their special hours" ON restaurant_special_hours;

CREATE POLICY "Anyone can view restaurant special hours"
  ON restaurant_special_hours FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their special hours"
  ON restaurant_special_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_special_hours.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_special_hours.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 30. RESTAURANT_SERVICE_CONFIG ====================
ALTER TABLE restaurant_service_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant service config" ON restaurant_service_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their service config" ON restaurant_service_config;

CREATE POLICY "Anyone can view restaurant service config"
  ON restaurant_service_config FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their service config"
  ON restaurant_service_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_service_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_service_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 31. RESTAURANT_PAYMENT_CONFIG ====================
ALTER TABLE restaurant_payment_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view restaurant payment config" ON restaurant_payment_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their payment config" ON restaurant_payment_config;

CREATE POLICY "Anyone can view restaurant payment config"
  ON restaurant_payment_config FOR SELECT
  USING (true);

CREATE POLICY "Restaurant owners can manage their payment config"
  ON restaurant_payment_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_payment_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_payment_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 32. RESTAURANT_BILLING_CONFIG ====================
ALTER TABLE restaurant_billing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users to read billing config" ON restaurant_billing_config;
DROP POLICY IF EXISTS "Allow authenticated users to manage billing config" ON restaurant_billing_config;

CREATE POLICY "Restaurant owners can view their billing config"
  ON restaurant_billing_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_billing_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurant owners can manage their billing config"
  ON restaurant_billing_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_billing_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_billing_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 33. RESTAURANT_NOTIFICATION_CONFIG ====================
ALTER TABLE restaurant_notification_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant owners can view their notification config" ON restaurant_notification_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their notification config" ON restaurant_notification_config;

CREATE POLICY "Restaurant owners can view their notification config"
  ON restaurant_notification_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_notification_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

CREATE POLICY "Restaurant owners can manage their notification config"
  ON restaurant_notification_config FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_notification_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_notification_config.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 34. RESTAURANT_METRICS ====================
ALTER TABLE restaurant_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Restaurant owners can view their metrics" ON restaurant_metrics;

CREATE POLICY "Restaurant owners can view their metrics"
  ON restaurant_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = restaurant_metrics.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text
          OR rs.user_id::text = current_setting('app.user_id', true)
        )
    )
  );

-- ==================== 35. ORDER_HISTORY ====================
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own order history" ON order_history;
DROP POLICY IF EXISTS "Users can insert their own order history" ON order_history;

CREATE POLICY "Users can view their own order history"
  ON order_history FOR SELECT
  USING (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

CREATE POLICY "Users can insert their own order history"
  ON order_history FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text
    OR user_id::text = current_setting('app.user_id', true)
  );

-- ==================== VERIFICACIÓN FINAL ====================
-- Verificar que todas las políticas estén activas
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Mostrar resumen de políticas por tabla
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%current_setting%' OR with_check LIKE '%current_setting%' THEN '✅ Simple Auth'
    WHEN qual LIKE '%auth.uid%' OR with_check LIKE '%auth.uid%' THEN '⚠️ Supabase Auth Only'
    ELSE '✅ Permissive'
  END as auth_type
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
