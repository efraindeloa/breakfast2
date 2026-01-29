-- ==================== POLÍTICAS RLS PARA RESTAURANT_STAFF (REGISTRO) ====================
-- Este script asegura que los usuarios autenticados puedan insertar en restaurant_staff durante el registro
-- Ejecutar en Supabase SQL Editor

-- Habilitar RLS si no está habilitado
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes de INSERT/ALL si existen
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can insert their own staff record" ON restaurant_staff;

-- Política: Los usuarios pueden insertar su propio registro de staff
-- Esto es necesario durante el registro cuando el usuario se asocia como owner
CREATE POLICY "Users can insert their own staff record"
  ON restaurant_staff FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política: Los usuarios pueden ver su propio registro de staff
DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
CREATE POLICY "Users can view staff of their restaurants"
  ON restaurant_staff FOR SELECT
  USING (user_id = auth.uid());

-- Política: Los usuarios pueden actualizar su propio registro de staff
CREATE POLICY "Users can update their own staff record"
  ON restaurant_staff FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

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
WHERE tablename = 'restaurant_staff'
ORDER BY policyname;
