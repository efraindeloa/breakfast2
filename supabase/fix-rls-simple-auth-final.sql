-- ==================== LIMPIAR Y RECREAR RLS PARA AUTENTICACIÓN SIMPLE ====================
-- Este script elimina TODAS las políticas existentes y crea nuevas políticas simples

-- ==================== 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES ====================

-- Restaurants - eliminar todas las políticas
DROP POLICY IF EXISTS "Users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can view all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can check restaurant names" ON restaurants;

-- Restaurant_staff - eliminar todas las políticas
DROP POLICY IF EXISTS "Users can insert staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Anyone can view staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can insert staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can view staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant staff can view their restaurant staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;

-- Users - eliminar todas las políticas
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON users;

-- ==================== 2. CREAR POLÍTICAS SIMPLES ====================

-- RESTAURANTS: Acceso completo sin restricciones
CREATE POLICY "simple_restaurants_insert"
  ON restaurants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_restaurants_select"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "simple_restaurants_update"
  ON restaurants FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RESTAURANT_STAFF: Acceso completo sin restricciones
CREATE POLICY "simple_staff_insert"
  ON restaurant_staff FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_staff_select"
  ON restaurant_staff FOR SELECT
  USING (true);

CREATE POLICY "simple_staff_update"
  ON restaurant_staff FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- USERS: Acceso completo sin restricciones
CREATE POLICY "simple_users_insert"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_users_select"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "simple_users_update"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==================== 3. VERIFICACIÓN SIMPLE ====================
-- Mostrar solo los nombres de las políticas
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('restaurants', 'restaurant_staff', 'users')
ORDER BY tablename, cmd, policyname;

-- Verificar que RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('restaurants', 'restaurant_staff', 'users')
ORDER BY tablename;