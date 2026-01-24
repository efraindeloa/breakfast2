-- ==================== CORREGIR POLÍTICAS RLS PARA USUARIOS ANÓNIMOS ====================
-- Este script asegura que los usuarios anónimos puedan ser creados y usados

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Crear políticas más permisivas para desarrollo
-- Permitir que cualquier usuario (incluidos anónimos) pueda:
-- 1. Ver cualquier usuario (para verificar existencia)
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);

-- 2. Insertar cualquier usuario (para crear usuarios anónimos)
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);

-- 3. Actualizar cualquier usuario (para actualizar datos)
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);

-- Verificar que las políticas se crearon correctamente
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
WHERE tablename = 'users'
ORDER BY policyname;
