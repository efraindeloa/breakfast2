-- ==================== FIX: CONFIGURACIÓN DE RESERVACIONES ====================
-- Este script corrige los problemas más comunes para que aparezcan las reservaciones

DO $$
DECLARE
    user_count INTEGER;
    restaurant_count INTEGER;
    staff_count INTEGER;
    reservation_count INTEGER;
    sample_user_id UUID;
    sample_restaurant_id UUID;
BEGIN
    -- Contar elementos existentes
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO restaurant_count FROM restaurants;
    SELECT COUNT(*) INTO staff_count FROM restaurant_staff WHERE is_active = true;
    SELECT COUNT(*) INTO reservation_count FROM reservations;
    
    RAISE NOTICE '🔧 INICIANDO CORRECCIÓN DE CONFIGURACIÓN...';
    RAISE NOTICE '';
    RAISE NOTICE '📊 ESTADO ACTUAL:';
    RAISE NOTICE '   Usuarios: %', user_count;
    RAISE NOTICE '   Restaurantes: %', restaurant_count;
    RAISE NOTICE '   Staff activo: %', staff_count;
    RAISE NOTICE '   Reservaciones: %', reservation_count;
    RAISE NOTICE '';
    
    -- PASO 1: Crear usuario de ejemplo si no existe ninguno
    IF user_count = 0 THEN
        INSERT INTO users (id, email, name, phone, account_type, is_active, password_hash)
        VALUES (
            uuid_generate_v4(),
            'admin@restaurante.com',
            'Administrador Restaurante',
            '+52 555 000 0000',
            'owner',
            true,
            'hash_ejemplo_admin'
        ) RETURNING id INTO sample_user_id;
        
        RAISE NOTICE '✅ Usuario administrador creado: %', sample_user_id;
    ELSE
        -- Obtener un usuario existente y asegurar que sea owner
        SELECT id INTO sample_user_id FROM users LIMIT 1;
        
        UPDATE users 
        SET account_type = 'owner' 
        WHERE id = sample_user_id AND account_type != 'owner';
        
        RAISE NOTICE '✅ Usuario existente configurado como owner: %', sample_user_id;
    END IF;
    
    -- PASO 2: Crear restaurante de ejemplo si no existe ninguno
    IF restaurant_count = 0 THEN
        INSERT INTO restaurants (id, name, description, address, phone, email, is_active)
        VALUES (
            uuid_generate_v4(),
            'Restaurante Demo',
            'Restaurante de demostración para pruebas',
            'Av. Principal 123, Centro, Ciudad',
            '+52 555 111 2222',
            'demo@restaurante.com',
            true
        ) RETURNING id INTO sample_restaurant_id;
        
        RAISE NOTICE '✅ Restaurante demo creado: %', sample_restaurant_id;
    ELSE
        SELECT id INTO sample_restaurant_id FROM restaurants WHERE is_active = true LIMIT 1;
        RAISE NOTICE '✅ Usando restaurante existente: %', sample_restaurant_id;
    END IF;
    
    -- PASO 3: Crear relación staff si no existe
    IF staff_count = 0 THEN
        INSERT INTO restaurant_staff (user_id, restaurant_id, role, is_active)
        VALUES (sample_user_id, sample_restaurant_id, 'owner', true)
        ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
            role = 'owner',
            is_active = true;
        
        RAISE NOTICE '✅ Relación staff creada: usuario % → restaurante %', sample_user_id, sample_restaurant_id;
    ELSE
        RAISE NOTICE '✅ Ya existen relaciones staff activas';
    END IF;
    
    -- PASO 4: Crear reservaciones de ejemplo si no existen
    IF reservation_count = 0 THEN
        -- Insertar algunas reservaciones básicas
        INSERT INTO reservations (
            user_id, restaurant_id, reservation_date, reservation_time,
            number_of_people, zone, status, notes
        ) VALUES 
        (sample_user_id, sample_restaurant_id, CURRENT_DATE, '19:00:00', 4, 'Terraza', 'pending', 'DEMO - Reservación pendiente'),
        (sample_user_id, sample_restaurant_id, CURRENT_DATE, '20:30:00', 2, 'Zona VIP', 'confirmed', 'DEMO - Reservación confirmada'),
        (sample_user_id, sample_restaurant_id, CURRENT_DATE - INTERVAL '1 day', '13:00:00', 6, 'Sala Principal', 'completed', 'DEMO - Reservación completada');
        
        RAISE NOTICE '✅ Reservaciones demo creadas (3 reservaciones básicas)';
    ELSE
        RAISE NOTICE '✅ Ya existen reservaciones en la base de datos';
    END IF;
    
    -- PASO 5: Verificar que todo esté conectado correctamente
    SELECT COUNT(*) INTO staff_count 
    FROM restaurant_staff rs
    JOIN users u ON rs.user_id = u.id
    JOIN restaurants r ON rs.restaurant_id = r.id
    WHERE rs.is_active = true AND u.is_active = true AND r.is_active = true;
    
    SELECT COUNT(*) INTO reservation_count
    FROM reservations res
    JOIN restaurants r ON res.restaurant_id = r.id
    WHERE r.is_active = true;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎯 VERIFICACIÓN FINAL:';
    RAISE NOTICE '   Staff activo conectado: %', staff_count;
    RAISE NOTICE '   Reservaciones válidas: %', reservation_count;
    
    IF staff_count > 0 AND reservation_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 PRÓXIMOS PASOS:';
        RAISE NOTICE '   1. Inicia sesión con: admin@restaurante.com';
        RAISE NOTICE '   2. Ve a /gestionar-reservaciones';
        RAISE NOTICE '   3. Deberías ver las reservaciones demo';
        RAISE NOTICE '';
        RAISE NOTICE '💡 Si aún no aparecen:';
        RAISE NOTICE '   - Verifica que estés logueado como owner';
        RAISE NOTICE '   - Revisa la consola del navegador por errores';
        RAISE NOTICE '   - Ejecuta scripts/debug-reservations.sql para más detalles';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '❌ AÚN HAY PROBLEMAS DE CONFIGURACIÓN';
        RAISE NOTICE '   Ejecuta scripts/debug-reservations.sql para más información';
    END IF;
    
END $$;