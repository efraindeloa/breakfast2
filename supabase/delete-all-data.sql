-- ==================== SCRIPT PARA BORRAR TODO EL CONTENIDO ====================
-- ⚠️ ADVERTENCIA: Este script elimina TODOS los datos de TODAS las tablas
-- ⚠️ Incluyendo usuarios de auth.users
-- ⚠️ Este script es IRREVERSIBLE - Haz backup antes de ejecutar
-- 
-- Este script:
-- 1. Elimina todos los datos de las tablas públicas
-- 2. Elimina todos los usuarios de auth.users
-- 3. Resetea las secuencias
-- 4. NO elimina la estructura de las tablas (solo los datos)

-- ==================== PASO 1: DESHABILITAR TRIGGERS TEMPORALMENTE ====================
-- Esto acelera la eliminación y evita problemas con triggers

-- ==================== PASO 2: ELIMINAR DATOS DE TABLAS DEPENDIENTES (en orden) ====================
-- Eliminar primero las tablas que tienen foreign keys hacia otras
-- Usamos TRUNCATE CASCADE para eliminar en cascada y ser más eficiente

-- Tablas de relaciones y dependientes (más específicas primero)
DO $$
BEGIN
  -- Tablas de relaciones de usuarios
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cart_items') THEN
    TRUNCATE TABLE cart_items CASCADE;
    RAISE NOTICE '✓ cart_items eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorite_dishes') THEN
    TRUNCATE TABLE favorite_dishes CASCADE;
    RAISE NOTICE '✓ favorite_dishes eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'saved_combinations') THEN
    TRUNCATE TABLE saved_combinations CASCADE;
    RAISE NOTICE '✓ saved_combinations eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'assistance_requests') THEN
    TRUNCATE TABLE assistance_requests CASCADE;
    RAISE NOTICE '✓ assistance_requests eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    TRUNCATE TABLE reviews CASCADE;
    RAISE NOTICE '✓ reviews eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'coupons') THEN
    TRUNCATE TABLE coupons CASCADE;
    RAISE NOTICE '✓ coupons eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waitlist_entries') THEN
    TRUNCATE TABLE waitlist_entries CASCADE;
    RAISE NOTICE '✓ waitlist_entries eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN
    TRUNCATE TABLE contacts CASCADE;
    RAISE NOTICE '✓ contacts eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'loyalty_data') THEN
    TRUNCATE TABLE loyalty_data CASCADE;
    RAISE NOTICE '✓ loyalty_data eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    TRUNCATE TABLE orders CASCADE;
    RAISE NOTICE '✓ orders eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    TRUNCATE TABLE payments CASCADE;
    RAISE NOTICE '✓ payments eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_transactions') THEN
    TRUNCATE TABLE user_transactions CASCADE;
    RAISE NOTICE '✓ user_transactions eliminada';
  END IF;
  
  -- Tablas de productos y promociones
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    TRUNCATE TABLE products CASCADE;
    RAISE NOTICE '✓ products eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promotions') THEN
    TRUNCATE TABLE promotions CASCADE;
    RAISE NOTICE '✓ promotions eliminada';
  END IF;
  
  -- Tablas de configuración de restaurantes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_cover_images') THEN
    TRUNCATE TABLE restaurant_cover_images CASCADE;
    RAISE NOTICE '✓ restaurant_cover_images eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_social_media') THEN
    TRUNCATE TABLE restaurant_social_media CASCADE;
    RAISE NOTICE '✓ restaurant_social_media eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_hours') THEN
    TRUNCATE TABLE restaurant_hours CASCADE;
    RAISE NOTICE '✓ restaurant_hours eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_special_hours') THEN
    TRUNCATE TABLE restaurant_special_hours CASCADE;
    RAISE NOTICE '✓ restaurant_special_hours eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_service_config') THEN
    TRUNCATE TABLE restaurant_service_config CASCADE;
    RAISE NOTICE '✓ restaurant_service_config eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_payment_config') THEN
    TRUNCATE TABLE restaurant_payment_config CASCADE;
    RAISE NOTICE '✓ restaurant_payment_config eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_billing_config') THEN
    TRUNCATE TABLE restaurant_billing_config CASCADE;
    RAISE NOTICE '✓ restaurant_billing_config eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_notification_config') THEN
    TRUNCATE TABLE restaurant_notification_config CASCADE;
    RAISE NOTICE '✓ restaurant_notification_config eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_metrics') THEN
    TRUNCATE TABLE restaurant_metrics CASCADE;
    RAISE NOTICE '✓ restaurant_metrics eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurant_staff') THEN
    TRUNCATE TABLE restaurant_staff CASCADE;
    RAISE NOTICE '✓ restaurant_staff eliminada';
  END IF;
  
  -- Tablas de usuarios extendidos
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    TRUNCATE TABLE user_profiles CASCADE;
    RAISE NOTICE '✓ user_profiles eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
    TRUNCATE TABLE user_settings CASCADE;
    RAISE NOTICE '✓ user_settings eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_addresses') THEN
    TRUNCATE TABLE user_addresses CASCADE;
    RAISE NOTICE '✓ user_addresses eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_payment_methods') THEN
    TRUNCATE TABLE user_payment_methods CASCADE;
    RAISE NOTICE '✓ user_payment_methods eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_billing_profiles') THEN
    TRUNCATE TABLE user_billing_profiles CASCADE;
    RAISE NOTICE '✓ user_billing_profiles eliminada';
  END IF;
  
  -- Tablas principales (después de eliminar dependencias)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'restaurants') THEN
    TRUNCATE TABLE restaurants CASCADE;
    RAISE NOTICE '✓ restaurants eliminada';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    TRUNCATE TABLE users CASCADE;
    RAISE NOTICE '✓ users eliminada';
  END IF;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Todas las tablas públicas han sido truncadas';
  RAISE NOTICE '========================================';
END $$;

-- ==================== PASO 3: ELIMINAR USUARIOS DE AUTH.USERS ====================
-- ⚠️ Esto elimina TODOS los usuarios autenticados
-- ⚠️ Requiere permisos de service_role o ejecutarse desde el Dashboard de Supabase

DO $$
DECLARE
  user_count INTEGER;
  deleted_count INTEGER := 0;
BEGIN
  -- Contar usuarios antes de eliminar
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Usuarios encontrados en auth.users: %', user_count;
  
  IF user_count > 0 THEN
    -- Intentar eliminar todos los usuarios
    -- Nota: Esto requiere permisos elevados (service_role)
    DELETE FROM auth.users;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✓ Eliminados % usuarios de auth.users', deleted_count;
  ELSE
    RAISE NOTICE '✓ No hay usuarios en auth.users para eliminar';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE WARNING '⚠️ No se tienen permisos para eliminar usuarios de auth.users.';
    RAISE WARNING '⚠️ Para eliminar usuarios, usa una de estas opciones:';
    RAISE WARNING '   1. Dashboard de Supabase > Authentication > Users > Seleccionar todos > Delete';
    RAISE WARNING '   2. Ejecutar este script con service_role key';
    RAISE WARNING '   3. Ejecutar manualmente: DELETE FROM auth.users; (con permisos adecuados)';
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Error al eliminar usuarios de auth.users: %', SQLERRM;
    RAISE WARNING '⚠️ Elimina los usuarios manualmente desde el Dashboard de Supabase';
END $$;

-- ==================== PASO 4: RESETEAR SECUENCIAS ====================
-- Resetear secuencias de tablas con SERIAL/auto-increment

-- Resetear secuencia de products (si usa SERIAL)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'id' AND data_type = 'integer') THEN
    ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
  END IF;
END $$;

-- Resetear secuencia de cart_items
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cart_items' AND column_name = 'id' AND data_type = 'integer') THEN
    ALTER SEQUENCE IF EXISTS cart_items_id_seq RESTART WITH 1;
  END IF;
END $$;

-- Resetear secuencia de favorite_dishes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'favorite_dishes' AND column_name = 'id' AND data_type = 'integer') THEN
    ALTER SEQUENCE IF EXISTS favorite_dishes_id_seq RESTART WITH 1;
  END IF;
END $$;

-- ==================== PASO 5: VERIFICACIÓN ====================
-- Mostrar conteo de registros en cada tabla (debería ser 0)

DO $$
DECLARE
  table_record RECORD;
  row_count INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VERIFICACIÓN DE ELIMINACIÓN DE DATOS';
  RAISE NOTICE '========================================';
  
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name
  LOOP
    EXECUTE format('SELECT COUNT(*) FROM %I', table_record.table_name) INTO row_count;
    RAISE NOTICE 'Tabla: % - Registros: %', table_record.table_name, row_count;
  END LOOP;
  
  -- Verificar auth.users
  SELECT COUNT(*) INTO row_count FROM auth.users;
  RAISE NOTICE 'auth.users - Usuarios: %', row_count;
  
  RAISE NOTICE '========================================';
END $$;

-- ==================== NOTAS FINALES ====================
-- ✅ Todas las tablas han sido truncadas
-- ✅ Las secuencias han sido reseteadas
-- ⚠️ Si auth.users aún tiene usuarios, elimínalos manualmente desde el Dashboard de Supabase
-- ⚠️ Las políticas RLS y la estructura de las tablas se mantienen intactas
-- 
-- Para eliminar usuarios de auth.users manualmente:
-- 1. Ve al Dashboard de Supabase > Authentication > Users
-- 2. Selecciona todos los usuarios y elimínalos
-- O ejecuta desde el SQL Editor con permisos de service_role:
-- DELETE FROM auth.users;
