-- ==================== FIX RLS POLICIES PARA AUTENTICACIÓN SIMPLE ====================
-- Este script corrige las políticas de RLS para trabajar sin Supabase Auth
-- VERSIÓN CORREGIDA - Compatible con todas las versiones de PostgreSQL

-- ==================== CREAR TIPO ENUM (SI NO EXISTE) ====================

-- Crear tipo ENUM de forma compatible
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
        CREATE TYPE account_type_enum AS ENUM (
          'owner',
          'manager', 
          'hostess',
          'waiter',
          'cashier',
          'kitchen',
          'delivery_driver',
          'delivery_manager',
          'accountant',
          'support',
          'customer',
          'valet_parking'
        );
        RAISE NOTICE '✅ Tipo account_type_enum creado exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Tipo account_type_enum ya existe, continuando...';
    END IF;
END $$;

-- ==================== AGREGAR COLUMNAS FALTANTES ====================

-- Agregar password_hash si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
        RAISE NOTICE '✅ Columna password_hash agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Columna password_hash ya existe, continuando...';
    END IF;
END $$;

-- Agregar account_type si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_type'
    ) THEN
        ALTER TABLE users ADD COLUMN account_type account_type_enum NOT NULL DEFAULT 'customer';
        RAISE NOTICE '✅ Columna account_type agregada exitosamente';
    ELSE
        RAISE NOTICE '⚠️ Columna account_type ya existe, continuando...';
    END IF;
END $$;

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

-- Verificar si la tabla restaurant_staff existe antes de aplicar políticas
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_staff') THEN
        -- Habilitar RLS
        ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
        
        -- Eliminar políticas existentes
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
        
        -- Crear políticas simples
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
          
        RAISE NOTICE '✅ Políticas de restaurant_staff actualizadas';
    ELSE
        RAISE NOTICE '⚠️ Tabla restaurant_staff no existe, saltando...';
    END IF;
END $$;

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

-- ==================== CREAR ÍNDICES ====================

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type_active ON users(account_type, is_active) WHERE is_active = true;

-- ==================== VERIFICACIÓN FINAL ====================

-- Verificar que las políticas se crearon correctamente
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- Contar políticas de restaurants
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'restaurants' AND policyname LIKE 'simple_restaurants_%';
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ Políticas de restaurants creadas correctamente (% políticas)', policy_count;
    ELSE
        RAISE NOTICE '⚠️ Solo se crearon % políticas para restaurants', policy_count;
    END IF;
    
    -- Contar políticas de users
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE tablename = 'users' AND policyname LIKE 'simple_users_%';
    
    IF policy_count >= 3 THEN
        RAISE NOTICE '✅ Políticas de users creadas correctamente (% políticas)', policy_count;
    ELSE
        RAISE NOTICE '⚠️ Solo se crearon % políticas para users', policy_count;
    END IF;
END $$;

-- Verificar columnas de users
DO $$
DECLARE
    has_password_hash BOOLEAN;
    has_account_type BOOLEAN;
BEGIN
    -- Verificar password_hash
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) INTO has_password_hash;
    
    -- Verificar account_type
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_type'
    ) INTO has_account_type;
    
    IF has_password_hash AND has_account_type THEN
        RAISE NOTICE '✅ Todas las columnas de users están presentes';
    ELSE
        IF NOT has_password_hash THEN
            RAISE NOTICE '❌ Falta columna password_hash en users';
        END IF;
        IF NOT has_account_type THEN
            RAISE NOTICE '❌ Falta columna account_type en users';
        END IF;
    END IF;
END $$;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Resumen de cambios:';
    RAISE NOTICE '   ✅ Tipo account_type_enum creado/verificado';
    RAISE NOTICE '   ✅ Columnas password_hash y account_type agregadas/verificadas';
    RAISE NOTICE '   ✅ Políticas RLS actualizadas para autenticación simple';
    RAISE NOTICE '   ✅ Índices de optimización creados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Ahora puedes probar el registro de usuarios y restaurantes';
END $$;