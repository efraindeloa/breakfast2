-- ==================== INSERTAR RESERVACIONES DE EJEMPLO (VERSIÓN SIMPLE) ====================
-- Este script inserta reservaciones de muestra usando usuarios y restaurantes existentes

-- IMPORTANTE: Antes de ejecutar este script, asegúrate de tener:
-- 1. Al menos un usuario en la tabla 'users'
-- 2. Al menos un restaurante en la tabla 'restaurants'

-- Paso 1: Verificar que existan usuarios y restaurantes
DO $$
DECLARE
    user_count INTEGER;
    restaurant_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO restaurant_count FROM restaurants;
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'No hay usuarios en la base de datos. Crea al menos un usuario primero.';
    END IF;
    
    IF restaurant_count = 0 THEN
        RAISE EXCEPTION 'No hay restaurantes en la base de datos. Crea al menos un restaurante primero.';
    END IF;
    
    RAISE NOTICE '✓ Usuarios disponibles: %', user_count;
    RAISE NOTICE '✓ Restaurantes disponibles: %', restaurant_count;
END $$;

-- Paso 2: Insertar reservaciones de ejemplo
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
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE,
    '19:00:00',
    4,
    'Terraza',
    'Cumpleaños',
    'Mesa junto a la ventana, decoración especial',
    '[{"id": 1, "name": "Pastel de Chocolate", "price": 25.00, "quantity": 1}]'::jsonb,
    'pending',
    'EJEMPLO - Cumpleaños de niña, necesita decoración especial'
),

-- 2. CONFIRMADA - Aniversario hoy 8:30 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE,
    '20:30:00',
    2,
    'Zona VIP',
    'Aniversario',
    'Mesa romántica, velas, música suave',
    '[{"id": 2, "name": "Cena Romántica", "price": 85.00, "quantity": 1}, {"id": 3, "name": "Vino Tinto", "price": 45.00, "quantity": 1}]'::jsonb,
    'confirmed',
    'EJEMPLO - Aniversario de bodas, cliente VIP'
),

-- 3. COMPLETADA - Reunión de negocios ayer 1:00 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE - INTERVAL '1 day',
    '13:00:00',
    6,
    'Sala Principal',
    'Reunión de Negocios',
    'Mesa grande, ambiente silencioso',
    '[{"id": 4, "name": "Menú Ejecutivo", "price": 35.00, "quantity": 6}]'::jsonb,
    'completed',
    'EJEMPLO - Reunión completada exitosamente'
),

-- 4. CANCELADA - Despedida mañana 9:00 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE + INTERVAL '1 day',
    '21:00:00',
    8,
    'Terraza',
    'Despedida de Soltero',
    'Mesas juntas, música permitida',
    '[{"id": 5, "name": "Parrillada", "price": 120.00, "quantity": 2}]'::jsonb,
    'cancelled',
    'EJEMPLO - Cancelada por cambio de planes'
),

-- 5. NO SHOW - Cena familiar ayer 6:30 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE - INTERVAL '1 day',
    '18:30:00',
    3,
    'Zona Familiar',
    NULL,
    'Mesa cerca del área de juegos',
    '[]'::jsonb,
    'no_show',
    'EJEMPLO - Cliente no se presentó, se esperó 20 minutos'
),

-- 6. PENDIENTE ADICIONAL - Comida hoy 2:00 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE,
    '14:00:00',
    5,
    'Sala Principal',
    'Comida Familiar',
    'Mesa amplia, sillas para niños',
    '[{"id": 6, "name": "Menú Infantil", "price": 18.00, "quantity": 2}]'::jsonb,
    'pending',
    'EJEMPLO - Comida familiar con niños'
),

-- 7. CONFIRMADA ADICIONAL - Cita hoy 3:30 PM
(
    (SELECT id FROM users LIMIT 1),
    (SELECT id FROM restaurants LIMIT 1),
    CURRENT_DATE,
    '15:30:00',
    2,
    'Terraza',
    NULL,
    'Mesa con vista',
    '[]'::jsonb,
    'confirmed',
    'EJEMPLO - Cita casual de pareja'
);

-- Mostrar resumen
DO $$
DECLARE
    total_inserted INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_inserted 
    FROM reservations 
    WHERE notes LIKE 'EJEMPLO -%';
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 ¡Reservaciones de ejemplo insertadas exitosamente!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RESUMEN:';
    RAISE NOTICE '   Total insertadas: % reservaciones', total_inserted;
    RAISE NOTICE '';
    RAISE NOTICE '📅 POR FECHA:';
    RAISE NOTICE '   Ayer: 2 reservaciones (1 completada, 1 no show)';
    RAISE NOTICE '   Hoy: 4 reservaciones (2 pendientes, 2 confirmadas)';
    RAISE NOTICE '   Mañana: 1 reservación (1 cancelada)';
    RAISE NOTICE '';
    RAISE NOTICE '🏷️ POR ESTADO:';
    RAISE NOTICE '   ⏳ Pendientes: 2';
    RAISE NOTICE '   ✅ Confirmadas: 2';
    RAISE NOTICE '   🏁 Completadas: 1';
    RAISE NOTICE '   ❌ Canceladas: 1';
    RAISE NOTICE '   👻 No Show: 1';
    RAISE NOTICE '';
    RAISE NOTICE '🍽️ CARACTERÍSTICAS:';
    RAISE NOTICE '   - Incluyen pedidos anticipados';
    RAISE NOTICE '   - Diferentes zonas (Terraza, VIP, Sala Principal, Familiar)';
    RAISE NOTICE '   - Ocasiones especiales (Cumpleaños, Aniversario, Negocios)';
    RAISE NOTICE '   - Diferentes horarios y números de personas';
    RAISE NOTICE '';
    RAISE NOTICE '💡 PARA VER LAS RESERVACIONES:';
    RAISE NOTICE '   1. Ve a /gestionar-reservaciones';
    RAISE NOTICE '   2. Selecciona la fecha de hoy para ver las activas';
    RAISE NOTICE '   3. Cambia filtros para ver diferentes estados';
    RAISE NOTICE '';
    RAISE NOTICE '🗑️ PARA LIMPIAR LOS DATOS DE EJEMPLO:';
    RAISE NOTICE '   DELETE FROM reservations WHERE notes LIKE ''EJEMPLO -%%'';';
    
END $$;