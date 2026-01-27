-- ==================== CORREGIR ERROR 406 EN TABLA USERS ====================
-- Este script corrige el error 406 (Not Acceptable) al acceder a la tabla users
-- Ejecuta este script directamente en Supabase SQL Editor

-- Paso 1: Eliminar TODAS las políticas existentes
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Allow all SELECT on users" ON users;
DROP POLICY IF EXISTS "Allow all INSERT on users" ON users;
DROP POLICY IF EXISTS "Allow all UPDATE on users" ON users;

-- Paso 2: Deshabilitar RLS temporalmente (para desarrollo)
-- Esto permite que todas las consultas funcionen sin restricciones
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Si prefieres mantener RLS habilitado, descomenta las siguientes líneas
-- y comenta la línea anterior:

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Allow all SELECT on users" 
--   ON users FOR SELECT 
--   USING (true);
-- 
-- CREATE POLICY "Allow all INSERT on users" 
--   ON users FOR INSERT 
--   WITH CHECK (true);
-- 
-- CREATE POLICY "Allow all UPDATE on users" 
--   ON users FOR UPDATE 
--   USING (true)
--   WITH CHECK (true);

-- Verificar el estado de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- Verificar políticas (si RLS está habilitado)
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
