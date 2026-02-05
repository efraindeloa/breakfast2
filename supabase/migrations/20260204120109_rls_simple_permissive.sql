-- ==================== POLÍTICAS RLS SIMPLES Y PERMISIVAS ====================
-- Para aplicaciones no bancarias - Seguridad básica pero funcional
-- Ejecutar en Supabase SQL Editor
-- 
-- NOTA: Estas políticas son más permisivas que las anteriores.
-- La validación de permisos se hace principalmente en el código de la aplicación.

-- ==================== 1. RESTAURANTS TABLE ====================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de restaurants
DROP POLICY IF EXISTS "Restaurant owners can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Restaurant owners can update their restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can check restaurant names" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can view all restaurants" ON restaurants;
DROP POLICY IF EXISTS "Authenticated users can update restaurants" ON restaurants;

-- Política SIMPLE: Cualquier usuario autenticado puede insertar restaurantes
CREATE POLICY "Authenticated users can insert restaurants"
  ON restaurants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política SIMPLE: Cualquiera puede ver restaurantes activos
CREATE POLICY "Anyone can view active restaurants"
  ON restaurants FOR SELECT
  USING (is_active = true);

-- Política SIMPLE: Usuarios autenticados pueden ver TODOS los restaurantes (para verificación)
CREATE POLICY "Authenticated users can view all restaurants"
  ON restaurants FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Política SIMPLE: Usuarios autenticados pueden actualizar restaurantes
-- (La validación de ownership se hace en el código de la app)
CREATE POLICY "Authenticated users can update restaurants"
  ON restaurants FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==================== 2. RESTAURANT_STAFF TABLE ====================
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de restaurant_staff
DROP POLICY IF EXISTS "Users can insert their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can update their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant staff can view their restaurant staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can view their restaurant staff" ON restaurant_staff;
DROP POLICY IF EXISTS "Users can view their own staff record" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can insert staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can view staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can update staff records" ON restaurant_staff;

-- Política SIMPLE: Usuarios autenticados pueden insertar registros de staff
-- (Solo pueden insertar su propio registro - validado en código)
CREATE POLICY "Authenticated users can insert staff records"
  ON restaurant_staff FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Política SIMPLE: Usuarios autenticados pueden ver TODOS los registros de staff
-- (La validación de qué pueden ver se hace en el código)
CREATE POLICY "Authenticated users can view staff records"
  ON restaurant_staff FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Política SIMPLE: Usuarios autenticados pueden actualizar registros de staff
-- (Solo pueden actualizar su propio registro - validado en código)
CREATE POLICY "Authenticated users can update staff records"
  ON restaurant_staff FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ==================== 3. USERS TABLE ====================
-- Si tiene RLS, simplificarlo también
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;

-- Política SIMPLE: Usuarios autenticados pueden ver todos los usuarios
CREATE POLICY "Authenticated users can view users"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Política SIMPLE: Usuarios autenticados pueden insertar su propio perfil (durante registro)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Política SIMPLE: Usuarios autenticados pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ==================== 4. VERIFICACIÓN ====================
-- Verificar que las políticas estén activas
SELECT 
  'restaurants' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'restaurants'
ORDER BY policyname;

SELECT 
  'restaurant_staff' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'restaurant_staff'
ORDER BY policyname;

SELECT 
  'users' as table_name,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- ==================== NOTAS IMPORTANTES ====================
-- 
-- 1. Estas políticas son PERMISIVAS - permiten más acceso del necesario
-- 2. La validación de permisos debe hacerse en el CÓDIGO de la aplicación
-- 3. NO hay verificaciones complejas de restaurant_staff que causen recursión
-- 4. Los usuarios autenticados pueden ver/actualizar más de lo estrictamente necesario
-- 5. Para mayor seguridad, valida permisos en el código antes de hacer operaciones
-- 
-- Ejemplo de validación en código:
--   - Antes de actualizar un restaurante, verifica que el usuario sea owner
--   - Antes de ver staff de un restaurante, verifica permisos en el código
--   - Las validaciones de negocio se hacen en el código de la aplicación
