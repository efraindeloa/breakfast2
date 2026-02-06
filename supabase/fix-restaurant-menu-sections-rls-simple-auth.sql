-- ==================== CORRECCIÓN DE POLÍTICAS RLS PARA RESTAURANT_MENU_SECTIONS (AUTENTICACIÓN SIMPLE) ====================
-- Este script corrige las políticas RLS para permitir que los restaurantes gestionen sus secciones de menú
-- Compatible con autenticación simple (usa current_setting('app.user_id') además de auth.uid())
-- Ejecutar en Supabase SQL Editor

-- Asegurar que RLS esté habilitado
ALTER TABLE restaurant_menu_sections ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Restaurants can view their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can insert their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can update their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can delete their own menu sections" ON restaurant_menu_sections;

-- Política: Los restaurantes pueden ver sus propias configuraciones
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurants can view their own menu sections"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
        AND restaurant_staff.is_active = true
        AND restaurant_staff.role IN ('owner', 'admin', 'manager')
        AND (
          restaurant_staff.user_id::text = auth.uid()::text  -- Supabase Auth
          OR restaurant_staff.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden insertar sus propias configuraciones
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurants can insert their own menu sections"
  ON restaurant_menu_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
        AND restaurant_staff.is_active = true
        AND restaurant_staff.role IN ('owner', 'admin', 'manager')
        AND (
          restaurant_staff.user_id::text = auth.uid()::text  -- Supabase Auth
          OR restaurant_staff.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden actualizar sus propias configuraciones
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurants can update their own menu sections"
  ON restaurant_menu_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
        AND restaurant_staff.is_active = true
        AND restaurant_staff.role IN ('owner', 'admin', 'manager')
        AND (
          restaurant_staff.user_id::text = auth.uid()::text  -- Supabase Auth
          OR restaurant_staff.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
        AND restaurant_staff.is_active = true
        AND restaurant_staff.role IN ('owner', 'admin', 'manager')
        AND (
          restaurant_staff.user_id::text = auth.uid()::text  -- Supabase Auth
          OR restaurant_staff.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden eliminar sus propias configuraciones
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurants can delete their own menu sections"
  ON restaurant_menu_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
        AND restaurant_staff.is_active = true
        AND restaurant_staff.role IN ('owner', 'admin', 'manager')
        AND (
          restaurant_staff.user_id::text = auth.uid()::text  -- Supabase Auth
          OR restaurant_staff.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Verificar que las políticas estén activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurant_menu_sections'
ORDER BY policyname;
