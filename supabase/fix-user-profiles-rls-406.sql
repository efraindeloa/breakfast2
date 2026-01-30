-- ==================== CORREGIR ERROR 406 EN TABLA USER_PROFILES ====================
-- Este script corrige el error 406 (Not Acceptable) al acceder a la tabla user_profiles
-- Ejecuta este script directamente en Supabase SQL Editor

-- Asegurar que RLS esté habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Política: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

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
WHERE tablename = 'user_profiles'
ORDER BY policyname;
