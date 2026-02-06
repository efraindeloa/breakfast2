-- ==================== CORRECCIÓN DE POLÍTICAS RLS PARA PRODUCTOS (AUTENTICACIÓN SIMPLE) ====================
-- Este script corrige las políticas RLS para permitir que los restaurantes creen y actualicen productos
-- Compatible con autenticación simple (usa current_setting('app.user_id') además de auth.uid())
-- Ejecutar en Supabase SQL Editor

-- Asegurar que RLS esté habilitado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de products para empezar limpio
DROP POLICY IF EXISTS "Restaurants can insert their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can insert their own products" ON products;
DROP POLICY IF EXISTS "Restaurants can update their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can update their own products" ON products;
DROP POLICY IF EXISTS "Restaurants can delete their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can delete their own products" ON products;
DROP POLICY IF EXISTS "Anyone can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Restaurants can view their own products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;

-- Política SELECT: Todos pueden ver productos activos
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Política SELECT: Los restaurantes pueden ver sus propios productos (incluso inactivos)
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurants can view their own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text  -- Supabase Auth
          OR rs.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden insertar productos en su restaurante
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurant owners can insert their own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text  -- Supabase Auth
          OR rs.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden actualizar productos de su restaurante
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurant owners can update their own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text  -- Supabase Auth
          OR rs.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text  -- Supabase Auth
          OR rs.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
        )
    )
  );

-- Política: Los restaurantes pueden eliminar (soft delete) productos de su restaurante
-- Compatible con autenticación simple y Supabase Auth
CREATE POLICY "Restaurant owners can delete their own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
        AND (
          rs.user_id::text = auth.uid()::text  -- Supabase Auth
          OR rs.user_id::text = current_setting('app.user_id', true)  -- Simple Auth
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
WHERE tablename = 'products'
ORDER BY policyname;
