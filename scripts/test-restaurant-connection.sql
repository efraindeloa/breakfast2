-- ==================== TEST: CONEXIÓN USUARIO-RESTAURANTE ====================
-- Este script verifica la conexión entre usuarios y restaurantes

-- Mostrar todos los usuarios con su tipo de cuenta
SELECT 
    'USUARIOS' as seccion,
    id,
    email,
    name,
    account_type,
    is_active,
    created_at
FROM users 
ORDER BY created_at DESC;

-- Mostrar todos los restaurantes
SELECT 
    'RESTAURANTES' as seccion,
    id,
    name,
    email,
    is_active,
    created_at
FROM restaurants 
ORDER BY created_at DESC;

-- Mostrar relaciones usuario-restaurante
SELECT 
    'STAFF_RELATIONS' as seccion,
    rs.user_id,
    u.email as user_email,
    u.name as user_name,
    u.account_type,
    rs.restaurant_id,
    r.name as restaurant_name,
    rs.role,
    rs.is_active as staff_active,
    rs.created_at
FROM restaurant_staff rs
JOIN users u ON rs.user_id = u.id
JOIN restaurants r ON rs.restaurant_id = r.id
ORDER BY rs.created_at DESC;

-- Verificar si hay reservaciones y a qué restaurante pertenecen
SELECT 
    'RESERVATIONS_BY_RESTAURANT' as seccion,
    res.restaurant_id,
    r.name as restaurant_name,
    COUNT(*) as total_reservations,
    COUNT(CASE WHEN res.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN res.status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN res.status = 'completed' THEN 1 END) as completed,
    COUNT(CASE WHEN res.status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(CASE WHEN res.status = 'no_show' THEN 1 END) as no_show
FROM reservations res
LEFT JOIN restaurants r ON res.restaurant_id = r.id
GROUP BY res.restaurant_id, r.name
ORDER BY total_reservations DESC;

-- Diagnóstico completo
DO $$
DECLARE
    user_rec RECORD;
    restaurant_rec RECORD;
    staff_rec RECORD;
    reservation_rec RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 DIAGNÓSTICO COMPLETO DE CONEXIONES:';
    RAISE NOTICE '';
    
    -- Verificar usuarios
    RAISE NOTICE '👥 USUARIOS:';
    FOR user_rec IN 
        SELECT id, email, name, account_type, is_active 
        FROM users 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '   - % (%) - Tipo: % - Activo: %', 
            user_rec.name, user_rec.email, user_rec.account_type, user_rec.is_active;
    END LOOP;
    
    -- Verificar restaurantes
    RAISE NOTICE '';
    RAISE NOTICE '🏪 RESTAURANTES:';
    FOR restaurant_rec IN 
        SELECT id, name, email, is_active 
        FROM restaurants 
        ORDER BY created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '   - % (%) - Activo: %', 
            restaurant_rec.name, restaurant_rec.email, restaurant_rec.is_active;
    END LOOP;
    
    -- Verificar staff
    RAISE NOTICE '';
    RAISE NOTICE '👔 RELACIONES STAFF:';
    FOR staff_rec IN 
        SELECT 
            u.email as user_email, 
            r.name as restaurant_name, 
            rs.role, 
            rs.is_active 
        FROM restaurant_staff rs
        JOIN users u ON rs.user_id = u.id
        JOIN restaurants r ON rs.restaurant_id = r.id
        ORDER BY rs.created_at DESC 
        LIMIT 5
    LOOP
        RAISE NOTICE '   - % → % (%) - Activo: %', 
            staff_rec.user_email, staff_rec.restaurant_name, staff_rec.role, staff_rec.is_active;
    END LOOP;
    
    -- Verificar reservaciones
    RAISE NOTICE '';
    RAISE NOTICE '📅 RESERVACIONES POR RESTAURANTE:';
    FOR reservation_rec IN 
        SELECT 
            r.name as restaurant_name,
            COUNT(*) as total
        FROM reservations res
        JOIN restaurants r ON res.restaurant_id = r.id
        GROUP BY r.name
        ORDER BY total DESC
    LOOP
        RAISE NOTICE '   - %: % reservaciones', 
            reservation_rec.restaurant_name, reservation_rec.total;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '💡 PARA SOLUCIONAR PROBLEMAS:';
    RAISE NOTICE '';
    RAISE NOTICE '1. Si no ves usuarios tipo "owner":';
    RAISE NOTICE '   - Crea una cuenta de restaurante desde /register';
    RAISE NOTICE '   - O ejecuta: UPDATE users SET account_type = ''owner'' WHERE email = ''tu_email'';';
    RAISE NOTICE '';
    RAISE NOTICE '2. Si no hay relaciones staff:';
    RAISE NOTICE '   - El usuario debe estar asociado a un restaurante';
    RAISE NOTICE '   - Verifica que se creó la relación en restaurant_staff';
    RAISE NOTICE '';
    RAISE NOTICE '3. Si no hay reservaciones:';
    RAISE NOTICE '   - Ejecuta: scripts/insert-sample-reservations-simple.sql';
    RAISE NOTICE '';
    RAISE NOTICE '4. Si las reservaciones no aparecen:';
    RAISE NOTICE '   - Verifica que restaurant_id coincida entre reservations y restaurant_staff';
    RAISE NOTICE '   - Revisa la consola del navegador por errores de API';
    
END $$;