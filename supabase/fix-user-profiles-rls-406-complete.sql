-- ==================== CORREGIR ERROR 406 EN TABLA user_profiles (VERSIÓN COMPLETA) ====================
-- Este script corrige el error 406 (Not Acceptable) al acceder a la tabla user_profiles
-- Ejecuta este script directamente en Supabase SQL Editor

-- Paso 1: Eliminar TODAS las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view their profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update their profile" ON user_profiles;

-- Paso 2: Asegurar que RLS esté habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Paso 3: Crear políticas que funcionen correctamente con auth.uid()
-- IMPORTANTE: Estas políticas permiten que los usuarios autenticados accedan a su propio perfil
-- incluso si el perfil no existe todavía (para permitir INSERT)

-- Política para SELECT: Los usuarios autenticados pueden ver su propio perfil
-- Si no existe, la consulta retornará null (no error 406)
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política para INSERT: Los usuarios autenticados pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política para UPDATE: Los usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

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

-- Verificar si existe un perfil para el usuario específico
-- Reemplaza '7840bbd6-a028-4755-b11f-1ff1e227fb75' con el user_id real si es necesario
SELECT 
  id,
  user_id,
  name,
  email,
  phone,
  avatar_url,
  created_at
FROM user_profiles
WHERE user_id = '7840bbd6-a028-4755-b11f-1ff1e227fb75';

-- Si no existe un perfil, puedes crearlo manualmente con:
-- INSERT INTO user_profiles (user_id, name, email) VALUES ('7840bbd6-a028-4755-b11f-1ff1e227fb75', 'efraindeloa', 'efraindeloa@hotmail.com');
