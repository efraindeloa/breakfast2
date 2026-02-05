-- ==================== FIX RLS COMPLETO PARA AUTENTICACIÓN SIMPLE ====================
-- Este script permite que usuarios con sesión simple (sin Supabase Auth) puedan:
-- 1. Crear restaurantes (INSERT)
-- 2. Consultar restaurant_staff para determinar accountType (SELECT)

-- ==================== 1. RESTAURANTS TABLE ====================

-- Eliminar políticas que requieren auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can view all restaurants" ON restaurants;

-- Nueva política: Permite INSERT sin restricciones
CREATE POLICY "Users can insert restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (true);

-- Nueva política: Permite SELECT sin restricciones (para verificar nombres)
CREATE POLICY "Anyone can view restaurants"
  ON restaurants FOR SELECT
  USING (true);

-- ==================== 2. RESTAURANT_STAFF TABLE ====================

-- Eliminar políticas que requieren auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can view staff records" ON restaurant_staff;

-- Nueva política: Permite INSERT sin restricciones
CREATE POLICY "Users can insert staff records"
  ON restaurant_staff FOR INSERT
  WITH CHECK (true);

-- Nueva política: Permite SELECT sin restricciones (para determinar accountType)
CREATE POLICY "Anyone can view staff records"
  ON restaurant_staff FOR SELECT
  USING (true);

-- ==================== 3. USERS TABLE ====================

-- Eliminar políticas que requieren auth.uid()
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Nueva política: Permite INSERT sin restricciones
CREATE POLICY "Anyone can insert users"
  ON users FOR INSERT
  WITH CHECK (true);

-- Nueva política: Permite SELECT sin restricciones
CREATE POLICY "Anyone can view users"
  ON users FOR SELECT
  USING (true);

-- ==================== VERIFICACIÓN ====================
-- Verificar políticas de restaurants
SELECT 
  'restaurants' as table_name,
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check::text
    WHEN cmd = 'SELECT' THEN using_::text
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'restaurants'
ORDER BY cmd, policyname;

-- Verificar políticas de restaurant_staff
SELECT 
  'restaurant_staff' as table_name,
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check::text
    WHEN cmd = 'SELECT' THEN using_::text
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'restaurant_staff'
ORDER BY cmd, policyname;

-- Verificar políticas de users
SELECT 
  'users' as table_name,
  policyname, 
  cmd,
  CASE 
    WHEN cmd = 'INSERT' THEN with_check::text
    WHEN cmd = 'SELECT' THEN using_::text
    ELSE 'N/A'
  END as policy_condition
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;