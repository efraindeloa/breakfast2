-- ==================== CORREGIR ERROR 406 EN TABLA user_profiles (VERSIÓN FINAL) ====================
-- Este script corrige el error 406 (Not Acceptable) al acceder a la tabla user_profiles
-- Ejecuta este script directamente en Supabase SQL Editor

-- Paso 1: Eliminar TODAS las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;

-- Paso 2: Asegurar que RLS esté habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Paso 3: Crear políticas que funcionen correctamente con auth.uid()
-- Política para SELECT: Los usuarios autenticados pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Política para INSERT: Los usuarios autenticados pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE: Los usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Verificar el estado de RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- Nota: Si el error persiste, verifica que:
-- 1. El usuario esté autenticado correctamente (auth.uid() no sea NULL)
-- 2. El user_id en la tabla coincida con auth.uid()
-- 3. Las políticas estén activas (verificar con la consulta anterior)
