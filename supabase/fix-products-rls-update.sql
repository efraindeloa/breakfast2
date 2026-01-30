-- ==================== CORRECCIÓN DE POLÍTICAS RLS PARA ACTUALIZAR PRODUCTOS ====================
-- Este script corrige las políticas RLS para permitir que los restaurantes actualicen sus productos
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
-- Esto es necesario para poder actualizar productos
CREATE POLICY "Restaurants can view their own products"
  ON products FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
    )
  );

-- Política: Los restaurantes pueden insertar productos en su restaurante
-- Verifica que el usuario sea owner, admin o manager del restaurante
CREATE POLICY "Restaurant owners can insert their own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
    )
  );

-- Política: Los restaurantes pueden actualizar productos de su restaurante
-- IMPORTANTE: Esta política permite UPDATE (incluyendo soft delete con is_active = false)
-- USING: verifica que el usuario puede leer la fila existente (debe ser staff del restaurante)
-- WITH CHECK: verifica que después del UPDATE, el producto sigue perteneciendo al restaurante del usuario
CREATE POLICY "Restaurant owners can update their own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
    )
  )
  WITH CHECK (
    -- Permitir el UPDATE si el producto sigue perteneciendo al restaurante del usuario
    -- Esto permite cambiar is_active a false (soft delete)
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
    )
  );

-- Política: Los restaurantes pueden eliminar (soft delete) productos de su restaurante
CREATE POLICY "Restaurant owners can delete their own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role IN ('owner', 'admin', 'manager')
        AND rs.is_active = true
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
