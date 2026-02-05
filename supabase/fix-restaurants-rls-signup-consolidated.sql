-- ==================== POLÍTICAS RLS CONSOLIDADAS PARA REGISTRO DE RESTAURANTES ====================
-- Este script asegura que los usuarios autenticados puedan crear restaurantes y asociarse como staff durante el registro
-- Ejecutar en Supabase SQL Editor
-- IMPORTANTE: Ejecutar este script después de crear las tablas restaurants y restaurant_staff

-- ==================== 1. RESTAURANTS TABLE ====================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas de INSERT existentes para evitar conflictos
DROP POLICY IF EXISTS "Restaurant owners can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON restaurants;

-- Política: Cualquier usuario autenticado puede insertar restaurantes
-- Esto es CRÍTICO durante el registro cuando aún no existe restaurant_staff
CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Cualquiera puede ver restaurantes activos
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Política: Usuarios autenticados pueden ver nombres de restaurantes para verificación
-- Esta política permite verificar disponibilidad de nombres sin causar recursión
-- IMPORTANTE: Debe estar antes de la política que verifica restaurant_staff
DROP POLICY IF EXISTS "Authenticated users can check restaurant names" ON restaurants;
CREATE POLICY "Authenticated users can check restaurant names"
  ON restaurants FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Política: Los owners pueden ver sus restaurantes (incluso si no están activos)
-- Esta política se evalúa después, pero solo aplica si el usuario es owner
DROP POLICY IF EXISTS "Restaurant owners can view their restaurants" ON restaurants;
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
DROP POLICY IF EXISTS "Restaurant owners can update their restaurants" ON restaurants;
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

-- Eliminar todas las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can insert their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can update their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;

-- Política: Los usuarios pueden insertar su propio registro de staff
-- Esto es CRÍTICO durante el registro cuando el usuario se asocia como owner
CREATE POLICY "Users can insert their own staff record"
  ON restaurant_staff FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política: Los usuarios pueden ver su propio registro de staff
CREATE POLICY "Users can view staff of their restaurants"
  ON restaurant_staff FOR SELECT
  USING (user_id = auth.uid());

-- Política: Los usuarios pueden actualizar su propio registro de staff
CREATE POLICY "Users can update their own staff record"
  ON restaurant_staff FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTA: No creamos una política para que los owners vean otros staff porque causaría recursión infinita.
-- Los usuarios solo pueden ver su propio registro de staff (ya cubierto arriba).
-- Para ver otros staff de un restaurante, se debe hacer a través de la aplicación
-- usando consultas directas después de verificar permisos en el código.

-- ==================== 3. VERIFICACIÓN ====================
-- Verificar que las políticas estén activas
SELECT 
  'restaurants' as table_name,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'restaurants'
ORDER BY policyname;

SELECT 
  'restaurant_staff' as table_name,
  policyname,
  cmd,
  roles,
  with_check
FROM pg_policies
WHERE tablename = 'restaurant_staff'
ORDER BY policyname;
