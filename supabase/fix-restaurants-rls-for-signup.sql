-- ==================== POLÍTICAS RLS PARA RESTAURANTS (REGISTRO) ====================
-- Este script asegura que los usuarios autenticados puedan crear restaurantes durante el registro
-- Ejecutar en Supabase SQL Editor

-- Habilitar RLS si no está habilitado
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de INSERT si existen
DROP POLICY IF EXISTS "Restaurant owners can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON restaurants;

-- Política: Cualquier usuario autenticado puede insertar restaurantes
-- Esto es necesario durante el registro cuando aún no existe restaurant_staff
CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

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
WHERE tablename = 'restaurants'
ORDER BY policyname;
