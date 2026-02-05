-- ==================== INSERTAR RESERVACIONES DE EJEMPLO ====================
-- Este script inserta reservaciones de muestra con todos los estados posibles

-- Nota: Este script asume que ya existen usuarios y restaurantes en la base de datos
-- Si no existen, primero ejecuta los scripts de creación de usuarios y restaurantes

DO $$
DECLARE
    sample_user_id UUID;
    sample_restaurant_id UUID;
    today_date DATE := CURRENT_DATE;
BEGIN
    -- Intentar obtener un usuario existente (o crear uno de ejemplo)
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    IF sample_user_id IS NULL THEN
        -- Crear usuario de ejemplo si no existe ninguno
        INSERT INTO users (id, email, name, phone, account_type, is_active, password_hash)
        VALUES (
            uuid_generate_v4(),
            'cliente.ejemplo@email.com',
            'Cliente Ejemplo',
            '+52 555 123 4567',
            'customer',
            true,
            'hash_ejemplo_123'
        ) RETURNING id INTO sample_user_id;
        
        RAISE NOTICE '✓ Usuario de ejemplo creado: %', sample_user_id;
    ELSE
        RAISE NOTICE '✓ Usando usuario existente: %', sample_user_id;
    END IF;
    
    -- Intentar obtener un restaurante existente (o crear uno de ejemplo)
    SELECT id INTO sample_restaurant_id FROM restaurants LIMIT 1;
    
    IF sample_restaurant_id IS NULL THEN
        -- Crear restaurante de ejemplo si no existe ninguno
        INSERT INTO restaurants (id, name, description, address, phone, email, is_active)
        VALUES (
            uuid_generate_v4(),
            'Restaurante Ejemplo',
            'Restaurante de ejemplo para pruebas de reservaciones',
            'Calle Ejemplo 123, Ciudad Ejemplo',
            '+52 555 987 6543',
            'restaurante.ejemplo@email.com',
            true
        ) RETURNING id INTO sample_restaurant_id;
        
        RAISE NOTICE '✓ Restaurante de ejemplo creado: %', sample_restaurant_id;
    ELSE
        RAISE NOTICE '✓ Usando restaurante existente: %', sample_restaurant_id;
    END IF;
    
    -- Limpiar reservaciones existentes de ejemplo (opcional)
    DELETE FROM reservations WHERE notes LIKE '%EJEMPLO%' OR notes LIKE '%MUESTRA%';
    
    -- 1. RESERVACIÓN PENDIENTE
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date,
        '19:00:00',
        4,
        'Terraza',
        'Cumpleaños',
        'Mesa junto a la ventana, decoración especial',
        '[
            {"id": 1, "name": "Pastel de Chocolate", "price": 25.00, "quantity": 1},
            {"id": 2, "name": "Velas de Cumpleaños", "price": 5.00, "quantity": 1}
        ]'::jsonb,
        'pending',
        'EJEMPLO - Reservación pendiente de confirmación. Cumpleaños de la hija del cliente.'
    );
    
    -- 2. RESERVACIÓN CONFIRMADA
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date,
        '20:30:00',
        2,
        'Zona VIP',
        'Aniversario',
        'Mesa romántica, ambiente íntimo',
        '[
            {"id": 3, "name": "Cena para Dos", "price": 85.00, "quantity": 1},
            {"id": 4, "name": "Vino Tinto Reserva", "price": 45.00, "quantity": 1},
            {"id": 5, "name": "Postre Especial", "price": 18.00, "quantity": 2}
        ]'::jsonb,
        'confirmed',
        'EJEMPLO - Reservación confirmada. Aniversario de bodas, cliente VIP.'
    );
    
    -- 3. RESERVACIÓN COMPLETADA
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date - INTERVAL '1 day',
        '13:00:00',
        6,
        'Sala Principal',
        'Reunión de Negocios',
        'Mesa grande, ambiente silencioso, proyector disponible',
        '[
            {"id": 6, "name": "Menú Ejecutivo", "price": 35.00, "quantity": 6},
            {"id": 7, "name": "Agua Natural", "price": 8.00, "quantity": 3},
            {"id": 8, "name": "Café Americano", "price": 12.00, "quantity": 6}
        ]'::jsonb,
        'completed',
        'EJEMPLO - Reservación completada exitosamente. Reunión de negocios de empresa ABC.'
    );
    
    -- 4. RESERVACIÓN CANCELADA
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date + INTERVAL '2 days',
        '21:00:00',
        8,
        'Terraza',
        'Despedida de Soltero',
        'Mesas juntas, música permitida',
        '[
            {"id": 9, "name": "Parrillada Grupal", "price": 120.00, "quantity": 2},
            {"id": 10, "name": "Cerveza Nacional", "price": 15.00, "quantity": 12}
        ]'::jsonb,
        'cancelled',
        'EJEMPLO - Reservación cancelada por el cliente. Cambio de planes de último momento.'
    );
    
    -- 5. RESERVACIÓN NO SHOW
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date - INTERVAL '2 days',
        '18:30:00',
        3,
        'Zona Familiar',
        NULL,
        'Mesa cerca del área de juegos para niños',
        '[]'::jsonb,
        'no_show',
        'EJEMPLO - Cliente no se presentó. Se esperó 20 minutos, no respondió llamadas.'
    );
    
    -- 6. RESERVACIÓN PENDIENTE ADICIONAL (para hoy, diferente hora)
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date,
        '14:00:00',
        5,
        'Sala Principal',
        'Comida Familiar',
        'Mesa amplia, sillas altas para niños',
        '[
            {"id": 11, "name": "Menú Infantil", "price": 18.00, "quantity": 2},
            {"id": 12, "name": "Plato del Día", "price": 28.00, "quantity": 3}
        ]'::jsonb,
        'pending',
        'EJEMPLO - Comida familiar dominical. Incluye 2 niños pequeños.'
    );
    
    -- 7. RESERVACIÓN CONFIRMADA ADICIONAL (para hoy, diferente hora)
    INSERT INTO reservations (
        user_id,
        restaurant_id,
        reservation_date,
        reservation_time,
        number_of_people,
        zone,
        special_occasion,
        table_preferences,
        advance_order_items,
        status,
        notes
    ) VALUES (
        sample_user_id,
        sample_restaurant_id,
        today_date,
        '15:30:00',
        2,
        'Terraza',
        NULL,
        'Mesa con vista, ambiente relajado',
        '[]'::jsonb,
        'confirmed',
        'EJEMPLO - Cita casual de pareja. Sin ocasión especial.'
    );
    
    RAISE NOTICE '✅ Se insertaron 7 reservaciones de ejemplo con todos los estados:';
    RAISE NOTICE '   - 2 Pendientes (pending)';
    RAISE NOTICE '   - 2 Confirmadas (confirmed)';
    RAISE NOTICE '   - 1 Completada (completed)';
    RAISE NOTICE '   - 1 Cancelada (cancelled)';
    RAISE NOTICE '   - 1 No Show (no_show)';
    RAISE NOTICE '';
    RAISE NOTICE '📅 Fechas de las reservaciones:';
    RAISE NOTICE '   - Ayer: 1 completada, 1 no show';
    RAISE NOTICE '   - Hoy: 4 reservaciones (2 pendientes, 2 confirmadas)';
    RAISE NOTICE '   - Pasado mañana: 1 cancelada';
    RAISE NOTICE '';
    RAISE NOTICE '🍽️ Algunas incluyen pedidos anticipados para probar esa funcionalidad';
    RAISE NOTICE '🎉 Varias incluyen ocasiones especiales (cumpleaños, aniversario, etc.)';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Para ver las reservaciones, ve a /gestionar-reservaciones';
    
END $$;