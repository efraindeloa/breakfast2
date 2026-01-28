-- ==================== CORRECCIÓN DE POLÍTICAS RLS PARA RESTAURANTS ====================
-- Este script agrega políticas RLS para permitir que los owners actualicen sus restaurantes
-- Ejecutar en Supabase SQL Editor

-- Verificar si RLS está habilitado
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurants" ON restaurants;

-- Política para ver restaurantes (cualquiera puede ver restaurantes activos)
CREATE POLICY "Anyone can view active restaurants" ON restaurants 
  FOR SELECT USING (is_active = true);

-- Política para que los owners puedan actualizar sus restaurantes
-- Verifica que el usuario esté en restaurant_staff como owner/admin/manager
CREATE POLICY "Restaurant owners can update their restaurants" ON restaurants 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff 
      WHERE restaurant_staff.restaurant_id = restaurants.id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
      AND restaurant_staff.is_active = true
    )
  );

-- Política para que los owners puedan insertar restaurantes (si es necesario)
CREATE POLICY "Restaurant owners can insert restaurants" ON restaurants 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- También permitir que los owners puedan ver sus restaurantes incluso si no están activos
CREATE POLICY "Restaurant owners can view their restaurants" ON restaurants 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff 
      WHERE restaurant_staff.restaurant_id = restaurants.id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
    )
  );
