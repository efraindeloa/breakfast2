-- ==================== SOLUCIÓN DEFINITIVA PARA RECURSIÓN INFINITA ====================
-- Este script elimina TODAS las políticas problemáticas y crea políticas simples sin recursión
-- Ejecutar en Supabase SQL Editor

-- ==================== 1. RESTAURANTS TABLE ====================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Restaurant owners can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can check restaurant names" ON restaurants;

-- Política SIMPLE: Cualquier usuario autenticado puede insertar restaurantes
CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política SIMPLE: Cualquiera puede ver restaurantes activos (sin verificar restaurant_staff)
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Política SIMPLE: Usuarios autenticados pueden ver TODOS los restaurantes (para verificación de nombres)
-- Esta política NO verifica restaurant_staff, evitando recursión
CREATE POLICY "Authenticated users can check restaurant names"
  ON restaurants FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Política: Los owners pueden ver sus restaurantes (solo si ya son owners)
-- Esta política se evalúa DESPUÉS, pero solo si el usuario ya es owner
CREATE POLICY "Restaurant owners can view their restaurants"
  ON restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff 
      WHERE restaurant_staff.restaurant_id = restaurants.id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
    )
  );

-- Política: Los owners pueden actualizar sus restaurantes
CREATE POLICY "Restaurant owners can update their restaurants"
  ON restaurants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff 
      WHERE restaurant_staff.restaurant_id = restaurants.id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
      AND restaurant_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff 
      WHERE restaurant_staff.restaurant_id = restaurants.id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
      AND restaurant_staff.is_active = true
    )
  );

-- ==================== 2. RESTAURANT_STAFF TABLE ====================
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can insert their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can update their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant staff can view their restaurant staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurant staff" ON restaurant_staff;

-- Política SIMPLE: Los usuarios pueden insertar su propio registro de staff
-- NO verifica restaurant_staff, evitando recursión
CREATE POLICY "Users can insert their own staff record"
  ON restaurant_staff FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política SIMPLE: Los usuarios pueden ver su propio registro de staff
-- NO verifica restaurant_staff, evitando recursión
CREATE POLICY "Users can view their own staff record"
  ON restaurant_staff FOR SELECT
  USING (user_id = auth.uid());

-- Política SIMPLE: Los usuarios pueden actualizar su propio registro de staff
-- NO verifica restaurant_staff, evitando recursión
CREATE POLICY "Users can update their own staff record"
  ON restaurant_staff FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTA IMPORTANTE: 
-- Estas políticas son SIMPLES y NO verifican restaurant_staff para evitar recursión.
-- Para operaciones más complejas (ver otros staff, etc.), se debe hacer desde la aplicación
-- usando el Service Role Key o verificando permisos en el código.

-- ==================== 3. VERIFICACIÓN ====================
SELECT 
  'restaurants' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'restaurants'
ORDER BY policyname;

SELECT 
  'restaurant_staff' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'restaurant_staff'
ORDER BY policyname;
