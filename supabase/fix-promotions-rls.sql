-- Políticas RLS para la tabla promotions
-- Permite que los restaurantes (owner, admin, manager) gestionen sus propias promociones

-- Habilitar RLS si no está habilitado
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Anyone can view active promotions" ON promotions;
DROP POLICY IF EXISTS "Restaurants can view their own promotions" ON promotions;
DROP POLICY IF EXISTS "Restaurants can insert their own promotions" ON promotions;
DROP POLICY IF EXISTS "Restaurants can update their own promotions" ON promotions;
DROP POLICY IF EXISTS "Restaurants can delete their own promotions" ON promotions;

-- Política SELECT: Todos pueden ver promociones activas y válidas
-- Los restaurantes también pueden ver sus propias promociones (incluso inactivas) para editarlas
CREATE POLICY "Anyone can view active promotions"
  ON promotions FOR SELECT
  USING (
    (is_active = true AND NOW() BETWEEN valid_from AND valid_until)
    OR
    -- Los restaurantes pueden ver sus propias promociones para editarlas
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
      AND rs.user_id = auth.uid()
      AND rs.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política INSERT: Solo los restaurantes pueden crear promociones
CREATE POLICY "Restaurants can insert their own promotions"
  ON promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
      AND rs.user_id = auth.uid()
      AND rs.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política UPDATE: Solo los restaurantes pueden actualizar sus promociones
CREATE POLICY "Restaurants can update their own promotions"
  ON promotions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
      AND rs.user_id = auth.uid()
      AND rs.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
      AND rs.user_id = auth.uid()
      AND rs.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política DELETE: Solo los restaurantes pueden eliminar (soft delete) sus promociones
-- Nota: En lugar de DELETE físico, se recomienda usar UPDATE para marcar is_active = false
CREATE POLICY "Restaurants can delete their own promotions"
  ON promotions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff rs
      WHERE rs.restaurant_id = promotions.restaurant_id
      AND rs.user_id = auth.uid()
      AND rs.role IN ('owner', 'admin', 'manager')
    )
  );
