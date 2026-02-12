-- ==================== LIMPIAR DATOS PARA EMPEZAR DESDE CERO CON SUPABASE AUTH ====================
-- ADVERTENCIA: Este script eliminará TODOS los datos de usuarios y sus relaciones
-- Ejecutar solo en desarrollo o con backup completo

-- ==================== 1. ELIMINAR DATOS DEPENDIENTES DE USUARIOS ====================

-- Favoritos
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.favorite_dishes;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de favorite_dishes', deleted_count;
END $$;

-- Carrito
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.cart_items;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de cart_items', deleted_count;
END $$;

-- Órdenes activas
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.orders;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de orders', deleted_count;
END $$;

-- Historial de órdenes
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.order_history;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de order_history', deleted_count;
END $$;

-- Reseñas
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.reviews;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de reviews', deleted_count;
END $$;

-- Contactos
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.contacts;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de contacts', deleted_count;
END $$;

-- Lista de espera
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.waitlist_entries;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de waitlist_entries', deleted_count;
END $$;

-- Solicitudes de asistencia
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.assistance_requests;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de assistance_requests', deleted_count;
END $$;

-- Métodos de pago
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_payment_methods;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de user_payment_methods', deleted_count;
END $$;

-- Transacciones
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_transactions;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de user_transactions', deleted_count;
END $$;

-- Datos de lealtad
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.loyalty_data;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de loyalty_data', deleted_count;
END $$;

-- Perfiles extendidos
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_profiles;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de user_profiles', deleted_count;
END $$;

-- ==================== 2. ELIMINAR STAFF DE RESTAURANTES ====================
-- Nota: Esto eliminará las asociaciones usuario-restaurante pero mantendrá los restaurantes

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.restaurant_staff;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de restaurant_staff', deleted_count;
END $$;

-- ==================== 3. ELIMINAR USUARIOS ====================

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.users;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Eliminados % registros de users', deleted_count;
END $$;

-- ==================== 4. LIMPIAR DATOS DE AUTH (OPCIONAL) ====================
-- ADVERTENCIA: Esto eliminará TODOS los usuarios de Supabase Auth
-- Solo ejecutar si quieres eliminar también las cuentas de Auth

-- Para eliminar usuarios de auth.users, necesitas usar el dashboard de Supabase
-- o la función admin.deleteUser() desde el código

-- ==================== 5. RESETEAR SECUENCIAS (OPCIONAL) ====================
-- Si quieres que los IDs empiecen desde 1 nuevamente

-- Resetear secuencia de products (si la usas)
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- ==================== 6. VERIFICACIÓN ====================

SELECT 
  'users' as tabla,
  COUNT(*) as registros_restantes
FROM public.users
UNION ALL
SELECT 
  'restaurant_staff' as tabla,
  COUNT(*) as registros_restantes
FROM public.restaurant_staff
UNION ALL
SELECT 
  'favorite_dishes' as tabla,
  COUNT(*) as registros_restantes
FROM public.favorite_dishes
UNION ALL
SELECT 
  'cart_items' as tabla,
  COUNT(*) as registros_restantes
FROM public.cart_items
UNION ALL
SELECT 
  'orders' as tabla,
  COUNT(*) as registros_restantes
FROM public.orders
UNION ALL
SELECT 
  'order_history' as tabla,
  COUNT(*) as registros_restantes
FROM public.order_history;

-- ==================== RESUMEN ====================
-- 
-- TABLAS LIMPIADAS:
-- ✅ favorite_dishes - Favoritos de usuarios
-- ✅ cart_items - Carritos de compras
-- ✅ orders - Órdenes activas
-- ✅ order_history - Historial de órdenes
-- ✅ reviews - Reseñas de usuarios
-- ✅ contacts - Contactos de usuarios
-- ✅ waitlist_entries - Lista de espera
-- ✅ assistance_requests - Solicitudes de asistencia
-- ✅ user_payment_methods - Métodos de pago
-- ✅ user_transactions - Transacciones
-- ✅ loyalty_data - Datos de lealtad
-- ✅ user_profiles - Perfiles extendidos
-- ✅ restaurant_staff - Asociaciones usuario-restaurante
-- ✅ users - Usuarios principales
-- 
-- TABLAS MANTENIDAS:
-- ✅ restaurants - Restaurantes (solo se eliminan las asociaciones)
-- ✅ products - Productos (no dependen de usuarios específicos)
-- ✅ promotions - Promociones
-- ✅ restaurant_* - Configuraciones de restaurantes
-- 
-- PRÓXIMOS PASOS:
-- 1. Ejecutar migración SQL: 20260211000000_migrate_to_supabase_auth.sql
-- 2. Configurar Supabase Auth en el dashboard
-- 3. Crear nuevos usuarios con el sistema migrado
-- 4. Verificar que todo funciona correctamente