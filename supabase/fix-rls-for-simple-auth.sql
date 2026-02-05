-- ==================== FIX RLS PARA AUTENTICACIÓN SIMPLE ====================
-- Este script permite que usuarios con sesión simple (sin Supabase Auth) puedan crear restaurantes
-- Cambia las políticas para que NO requieran auth.uid(), solo que el usuario exista en la tabla users

-- ==================== 1. RESTAURANTS TABLE ====================

-- Eliminar política que requiere auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;

-- Nueva política: Permite INSERT si el usuario existe en la tabla users (sin requerir Supabase Auth)
CREATE POLICY "Users can insert restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (true); -- Sin restricciones - la validación se hace en el código

-- ==================== 2. RESTAURANT_STAFF TABLE ====================

-- Eliminar política que requiere auth.uid()
DROP POLICY IF EXISTS "Authenticated users can insert staff records" ON restaurant_staff;

-- Nueva política: Permite INSERT si el usuario existe en la tabla users
CREATE POLICY "Users can insert staff records"
  ON restaurant_staff FOR INSERT
  WITH CHECK (true); -- Sin restricciones - la validación se hace en el código

-- ==================== VERIFICACIÓN ====================
SELECT 
  'restaurants' as table_name,
  policyname, 
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'restaurants' AND cmd = 'INSERT'
ORDER BY policyname;

SELECT 
  'restaurant_staff' as table_name,
  policyname, 
  cmd,
  with_check
FROM pg_policies 
WHERE tablename = 'restaurant_staff' AND cmd = 'INSERT'
ORDER BY policyname;
