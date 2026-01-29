-- ==================== POLÍTICAS RLS PARA PRODUCTOS (RESTAURANTES) ====================
-- Este script permite que los usuarios restaurantes puedan crear y actualizar productos
-- de su propio restaurante

-- Eliminar políticas existentes de INSERT/UPDATE si existen
DROP POLICY IF EXISTS "Restaurants can insert their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can insert their own products" ON products;
DROP POLICY IF EXISTS "Restaurants can update their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can update their own products" ON products;
DROP POLICY IF EXISTS "Restaurants can delete their own products" ON products;
DROP POLICY IF EXISTS "Restaurant owners can delete their own products" ON products;
DROP POLICY IF EXISTS "Anyone can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;

-- Política: Solo el OWNER puede insertar productos en su restaurante
-- Verifica que el usuario sea owner del restaurante
CREATE POLICY "Restaurant owners can insert their own products"
  ON products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role = 'owner'
        AND rs.is_active = true
    )
  );

-- Política: Solo el OWNER puede actualizar productos de su restaurante
CREATE POLICY "Restaurant owners can update their own products"
  ON products FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role = 'owner'
        AND rs.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role = 'owner'
        AND rs.is_active = true
    )
  );

-- Política: Solo el OWNER puede eliminar (soft delete) productos de su restaurante
CREATE POLICY "Restaurant owners can delete their own products"
  ON products FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM restaurant_staff rs
      WHERE rs.user_id = auth.uid()
        AND rs.restaurant_id = products.restaurant_id
        AND rs.role = 'owner'
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
