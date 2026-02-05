-- ==================== FIX: RESERVACIONES PARA DON K RESTAURANT ====================
-- Este script asocia las reservaciones de ejemplo con el restaurante Don K Restaurant

DO $$
DECLARE
    don_k_restaurant_id UUID := '3de5a7bc-362a-4613-838c-188cf8ff760d';
    current_user_id UUID;
    reservation_count INTEGER;
    staff_relation_exists BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE '🏪 CONFIGURANDO RESERVACIONES PARA DON K RESTAURANT';
    RAISE NOTICE '   Restaurant ID: %', don_k_restaurant_id;
    RAISE NOTICE '';
    
    -- Paso 1: Verificar que el restaurante existe
    IF NOT EXISTS (SELECT 1 FROM restaurants WHERE id = don_k_restaurant_id) THEN
        RAISE EXCEPTION 'El restaurante Don K Restaurant no existe en la base de datos';
    END IF;
    
    RAISE NOTICE '✅ Restaurante Don K Restaurant encontrado';
    
    -- Paso 2: Obtener o crear usuario actual
    SELECT id INTO current_user_id FROM users WHERE account_type = 'owner' LIMIT 1;
    
    IF current_user_id IS NULL THEN
        -- Crear usuario de ejemplo si no hay ningún owner
        INSERT INTO users (id, email, name, phone, account_type, is_active, password_hash)
        VALUES (
            uuid_generate_v4(),
            'admin@donkrestaurant.com',
            'Admin Don K Restaurant',
            '+52 555 123 4567',
            'owner',
            true,
            'hash_ejemplo_donk'
        ) RETURNING id INTO current_user_id;
        
        RAISE NOTICE '✅ Usuario administrador creado: %', current_user_id;
    ELSE
        RAISE NOTICE '✅ Usuario owner encontrado: %', current_user_id;
    END IF;
    
    -- Paso 3: Verificar/crear relación staff
    SELECT EXISTS (
        SELECT 1 FROM restaurant_staff 
        WHERE user_id = current_user_id 
        AND restaurant_id = don_k_restaurant_id 
        AND is_active = true
    ) INTO staff_relation_exists;
    
    IF NOT staff_relation_exists THEN
        INSERT INTO restaurant_staff (user_id, restaurant_id, role, is_active)
        VALUES (current_user_id, don_k_restaurant_id, 'owner', true)
        ON CONFLICT (user_id, restaurant_id) DO UPDATE SET
            role = 'owner',
            is_active = true;
        
        RAISE NOTICE '✅ Relación staff creada: usuario → Don K Restaurant';
    ELSE
        RAISE NOTICE '✅ Relación staff ya existe';
    END IF;
    
    -- Paso 4: Limpiar reservaciones de ejemplo anteriores
    DELETE FROM reservations WHERE notes LIKE 'EJEMPLO -%' OR notes LIKE 'DEMO -%';
    RAISE NOTICE '🗑️  Reservaciones de ejemplo anteriores eliminadas';
    
    -- Paso 5: Crear reservaciones específicas para Don K Restaurant
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
    ) VALUES 
    -- 1. PENDIENTE - Cumpleaños hoy 7:00 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE,
        '19:00:00',
        4,
        'Terraza',
        'Cumpleaños',
        'Mesa junto a la ventana, decoración especial para niña de 8 años',
        '[{"id": 1, "name": "Pastel de Chocolate Don K", "price": 280.00, "quantity": 1}, {"id": 2, "name": "Velas Especiales", "price": 50.00, "quantity": 1}]'::jsonb,
        'pending',
        'EJEMPLO DON K - Cumpleaños infantil, requiere decoración especial y mesa familiar'
    ),
    
    -- 2. CONFIRMADA - Cena romántica hoy 8:30 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE,
        '20:30:00',
        2,
        'Zona VIP',
        'Aniversario',
        'Mesa romántica, velas, música suave, vista panorámica',
        '[{"id": 3, "name": "Cena Romántica Don K", "price": 850.00, "quantity": 1}, {"id": 4, "name": "Vino Tinto Reserva", "price": 450.00, "quantity": 1}, {"id": 5, "name": "Postre Especial Pareja", "price": 180.00, "quantity": 1}]'::jsonb,
        'confirmed',
        'EJEMPLO DON K - Aniversario de bodas, cliente VIP, mesa con vista especial'
    ),
    
    -- 3. COMPLETADA - Almuerzo de negocios ayer 1:00 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE - INTERVAL '1 day',
        '13:00:00',
        6,
        'Sala Ejecutiva',
        'Reunión de Negocios',
        'Mesa amplia, ambiente silencioso, proyector disponible, WiFi premium',
        '[{"id": 6, "name": "Menú Ejecutivo Don K", "price": 380.00, "quantity": 6}, {"id": 7, "name": "Agua Premium", "price": 45.00, "quantity": 3}, {"id": 8, "name": "Café Gourmet", "price": 65.00, "quantity": 6}]'::jsonb,
        'completed',
        'EJEMPLO DON K - Reunión ejecutiva completada exitosamente, cliente corporativo recurrente'
    ),
    
    -- 4. CANCELADA - Despedida mañana 9:00 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE + INTERVAL '1 day',
        '21:00:00',
        10,
        'Terraza Grande',
        'Despedida de Soltero',
        'Mesas juntas, música permitida hasta 11 PM, área reservada',
        '[{"id": 9, "name": "Parrillada Don K Grupal", "price": 1200.00, "quantity": 2}, {"id": 10, "name": "Cerveza Nacional", "price": 55.00, "quantity": 15}, {"id": 11, "name": "Botana Especial", "price": 180.00, "quantity": 3}]'::jsonb,
        'cancelled',
        'EJEMPLO DON K - Cancelada por cambio de fecha, cliente reagendará para próxima semana'
    ),
    
    -- 5. NO SHOW - Cena familiar ayer 6:30 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE - INTERVAL '1 day',
        '18:30:00',
        5,
        'Zona Familiar',
        NULL,
        'Mesa cerca del área de juegos, sillas altas para niños',
        '[]'::jsonb,
        'no_show',
        'EJEMPLO DON K - Cliente no se presentó, se esperó 25 minutos, no respondió llamadas'
    ),
    
    -- 6. PENDIENTE ADICIONAL - Comida hoy 2:00 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE,
        '14:00:00',
        7,
        'Sala Principal',
        'Comida Familiar Dominical',
        'Mesa amplia, sillas para niños, área tranquila',
        '[{"id": 12, "name": "Menú Infantil Don K", "price": 150.00, "quantity": 3}, {"id": 13, "name": "Plato del Día Adulto", "price": 280.00, "quantity": 4}]'::jsonb,
        'pending',
        'EJEMPLO DON K - Comida familiar dominical, incluye 3 niños y 4 adultos'
    ),
    
    -- 7. CONFIRMADA ADICIONAL - Cita hoy 3:30 PM
    (
        current_user_id,
        don_k_restaurant_id,
        CURRENT_DATE,
        '15:30:00',
        2,
        'Terraza Íntima',
        NULL,
        'Mesa con vista, ambiente relajado, música ambiental',
        '[{"id": 14, "name": "Café Don K Especial", "price": 85.00, "quantity": 2}, {"id": 15, "name": "Postre Compartir", "price": 120.00, "quantity": 1}]'::jsonb,
        'confirmed',
        'EJEMPLO DON K - Cita casual de pareja joven, primera visita al restaurante'
    );
    
    -- Verificar reservaciones creadas
    SELECT COUNT(*) INTO reservation_count 
    FROM reservations 
    WHERE restaurant_id = don_k_restaurant_id;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡RESERVACIONES PARA DON K RESTAURANT CREADAS!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN:';
    RAISE NOTICE '   🏪 Restaurante: Don K Restaurant';
    RAISE NOTICE '   📅 Total reservaciones: %', reservation_count;
    RAISE NOTICE '   👤 Usuario asociado: %', current_user_id;
    RAISE NOTICE '';
    RAISE NOTICE '📅 DISTRIBUCIÓN POR FECHA:';
    RAISE NOTICE '   Ayer: 2 reservaciones (1 completada, 1 no show)';
    RAISE NOTICE '   Hoy: 4 reservaciones (2 pendientes, 2 confirmadas)';
    RAISE NOTICE '   Mañana: 1 reservación (1 cancelada)';
    RAISE NOTICE '';
    RAISE NOTICE '🏷️ DISTRIBUCIÓN POR ESTADO:';
    RAISE NOTICE '   ⏳ Pendientes: 2 (requieren confirmación)';
    RAISE NOTICE '   ✅ Confirmadas: 2 (listas para el servicio)';
    RAISE NOTICE '   🏁 Completadas: 1 (servicio exitoso)';
    RAISE NOTICE '   ❌ Canceladas: 1 (reagendará cliente)';
    RAISE NOTICE '   👻 No Show: 1 (cliente no se presentó)';
    RAISE NOTICE '';
    RAISE NOTICE '🍽️ CARACTERÍSTICAS ESPECIALES:';
    RAISE NOTICE '   - Pedidos anticipados con precios reales de Don K';
    RAISE NOTICE '   - Zonas específicas: Terraza, VIP, Ejecutiva, Familiar';
    RAISE NOTICE '   - Ocasiones: Cumpleaños, Aniversario, Negocios, Despedida';
    RAISE NOTICE '   - Diferentes horarios: 2:00 PM a 9:00 PM';
    RAISE NOTICE '   - Grupos variados: 2 a 10 personas';
    RAISE NOTICE '';
    RAISE NOTICE '💡 PARA VER LAS RESERVACIONES:';
    RAISE NOTICE '   1. Inicia sesión como owner de Don K Restaurant';
    RAISE NOTICE '   2. Ve a /gestionar-reservaciones';
    RAISE NOTICE '   3. Selecciona la fecha de hoy para ver las activas';
    RAISE NOTICE '   4. Prueba los filtros y acciones disponibles';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ PARA LIMPIAR DESPUÉS:';
    RAISE NOTICE '   DELETE FROM reservations WHERE notes LIKE ''EJEMPLO DON K -%%'';';
    
END $$;