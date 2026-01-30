-- ==================== ACTUALIZAR POLÍTICAS RLS PARA RESTAURANT_MENU_SECTIONS ====================
-- Este script actualiza las políticas RLS para permitir que admin y manager también puedan gestionar secciones del menú

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Restaurants can view their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can insert their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can update their own menu sections" ON restaurant_menu_sections;
DROP POLICY IF EXISTS "Restaurants can delete their own menu sections" ON restaurant_menu_sections;

-- Política: Los restaurantes pueden ver sus propias configuraciones
CREATE POLICY "Restaurants can view their own menu sections"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los restaurantes pueden insertar sus propias configuraciones
CREATE POLICY "Restaurants can insert their own menu sections"
  ON restaurant_menu_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los restaurantes pueden actualizar sus propias configuraciones
CREATE POLICY "Restaurants can update their own menu sections"
  ON restaurant_menu_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los restaurantes pueden eliminar sus propias configuraciones
CREATE POLICY "Restaurants can delete their own menu sections"
  ON restaurant_menu_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );
