-- FIX: Agregar politica INSERT para tabla users
-- Este script agrega la politica RLS faltante para permitir que usuarios autenticados
-- inserten su propio perfil durante el registro

-- Verificar politicas actuales
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY cmd, policyname;

-- Eliminar politica si existe
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Crear politica de INSERT
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Verificar que se creo correctamente
SELECT 
  policyname, 
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'users' 
  AND cmd = 'INSERT'
ORDER BY policyname;
