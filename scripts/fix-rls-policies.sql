-- ==================== FIX RLS POLICIES PARA AUTENTICACIÓN SIMPLE ====================
-- Este script corrige las políticas de RLS para trabajar sin Supabase Auth

-- ==================== TABLA RESTAURANTS ====================

-- Habilitar RLS en la tabla restaurants
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
DROP POLICY IF EXISTS "Users can insert restaurants" ON restaurants;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_insert" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_select" ON restaurants;
DROP POLICY IF EXISTS "simple_restaurants_update" ON restaurants;

-- Crear políticas SIMPLES sin restricciones de auth.uid()
CREATE POLICY "simple_restaurants_insert"
  ON restaurants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_restaurants_select"
  ON restaurants FOR SELECT
  USING (true);

CREATE POLICY "simple_restaurants_update"
  ON restaurants FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==================== TABLA RESTAURANT_STAFF ====================

-- Habilitar RLS en la tabla restaurant_staff
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
DROP POLICY IF EXISTS "Users can insert staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "Anyone can view staff records" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_restaurant_staff_insert" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_restaurant_staff_select" ON restaurant_staff;
DROP POLICY IF EXISTS "simple_restaurant_staff_update" ON restaurant_staff;

-- Crear políticas SIMPLES sin restricciones
CREATE POLICY "simple_restaurant_staff_insert"
  ON restaurant_staff FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_restaurant_staff_select"
  ON restaurant_staff FOR SELECT
  USING (true);

CREATE POLICY "simple_restaurant_staff_update"
  ON restaurant_staff FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==================== TABLA USERS ====================

-- Habilitar RLS en la tabla users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Authenticated users can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "simple_users_insert" ON users;
DROP POLICY IF EXISTS "simple_users_select" ON users;
DROP POLICY IF EXISTS "simple_users_update" ON users;

-- Crear políticas SIMPLES para users
CREATE POLICY "simple_users_insert"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "simple_users_select"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "simple_users_update"
  ON users FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ==================== VERIFICACIÓN ====================

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
WHERE tablename IN ('restaurants', 'restaurant_staff', 'users')
ORDER BY tablename, policyname;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS actualizadas exitosamente';
    RAISE NOTICE '📋 Tablas configuradas: restaurants, restaurant_staff, users';
    RAISE NOTICE '🔓 Todas las operaciones permitidas sin restricciones de auth.uid()';
END $$;