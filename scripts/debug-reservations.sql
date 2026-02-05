-- ==================== DEBUG: VERIFICAR RESERVACIONES ====================
-- Este script ayuda a diagnosticar problemas con las reservaciones

-- Paso 1: Verificar si existen reservaciones
SELECT 
    'Total reservaciones' as tipo,
    COUNT(*) as cantidad
FROM reservations
UNION ALL
SELECT 
    'Reservaciones de ejemplo' as tipo,
    COUNT(*) as cantidad
FROM reservations 
WHERE notes LIKE 'EJEMPLO -%';

-- Paso 2: Ver todas las reservaciones con detalles básicos
SELECT 
    id,
    user_id,
    restaurant_id,
    reservation_date,
    reservation_time,
    number_of_people,
    zone,
    status,
    LEFT(notes, 50) as notes_preview,
    created_at
FROM reservations 
ORDER BY reservation_date DESC, reservation_time DESC
LIMIT 10;

-- Paso 3: Verificar reservaciones por fecha
SELECT 
    reservation_date,
    COUNT(*) as total_reservaciones,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendientes,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmadas,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completadas,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as canceladas,
    COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show
FROM reservations 
GROUP BY reservation_date 
ORDER BY reservation_date DESC;

-- Paso 4: Verificar usuarios y restaurantes
SELECT 
    'Usuarios' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN account_type = 'owner' THEN 1 END) as owners,
    COUNT(CASE WHEN account_type = 'customer' THEN 1 END) as customers
FROM users
UNION ALL
SELECT 
    'Restaurantes' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active = true THEN 1 END) as activos,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactivos
FROM restaurants;

-- Paso 5: Verificar relación usuario-restaurante (restaurant_staff)
SELECT 
    'Staff de restaurante' as info,
    COUNT(*) as total_relaciones,
    COUNT(DISTINCT user_id) as usuarios_unicos,
    COUNT(DISTINCT restaurant_id) as restaurantes_unicos
FROM restaurant_staff 
WHERE is_active = true;

-- Paso 6: Mostrar información detallada para debugging
DO $$
DECLARE
    reservation_count INTEGER;
    user_count INTEGER;
    restaurant_count INTEGER;
    staff_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO reservation_count FROM reservations;
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO restaurant_count FROM restaurants;
    SELECT COUNT(*) INTO staff_count FROM restaurant_staff WHERE is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO DE RESERVACIONES:';
    RAISE NOTICE '';
    RAISE NOTICE '📊 CONTEOS GENERALES:';
    RAISE NOTICE '   Reservaciones: %', reservation_count;
    RAISE NOTICE '   Usuarios: %', user_count;
    RAISE NOTICE '   Restaurantes: %', restaurant_count;
    RAISE NOTICE '   Staff activo: %', staff_count;
    RAISE NOTICE '';
    
    IF reservation_count = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: No hay reservaciones en la base de datos';
        RAISE NOTICE '   💡 Solución: Ejecuta scripts/insert-sample-reservations-simple.sql';
    ELSE
        RAISE NOTICE '✅ Hay reservaciones en la base de datos';
    END IF;
    
    IF user_count = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: No hay usuarios en la base de datos';
        RAISE NOTICE '   💡 Solución: Crea al menos un usuario primero';
    ELSE
        RAISE NOTICE '✅ Hay usuarios en la base de datos';
    END IF;
    
    IF restaurant_count = 0 THEN
        RAISE NOTICE '❌ PROBLEMA: No hay restaurantes en la base de datos';
        RAISE NOTICE '   💡 Solución: Crea al menos un restaurante primero';
    ELSE
        RAISE NOTICE '✅ Hay restaurantes en la base de datos';
    END IF;
    
    IF staff_count = 0 THEN
        RAISE NOTICE '⚠️  ADVERTENCIA: No hay relaciones usuario-restaurante activas';
        RAISE NOTICE '   💡 Esto puede causar que no se muestren las reservaciones';
        RAISE NOTICE '   💡 Verifica que el usuario actual esté asociado a un restaurante';
    ELSE
        RAISE NOTICE '✅ Hay relaciones usuario-restaurante activas';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PASOS PARA SOLUCIONAR:';
    RAISE NOTICE '   1. Si no hay reservaciones: ejecuta insert-sample-reservations-simple.sql';
    RAISE NOTICE '   2. Si no hay usuarios: crea una cuenta de restaurante';
    RAISE NOTICE '   3. Si no hay staff: verifica que el usuario esté asociado al restaurante';
    RAISE NOTICE '   4. Verifica que estés logueado con una cuenta de restaurante';
    RAISE NOTICE '   5. Revisa la consola del navegador por errores de API';
    
END $$;