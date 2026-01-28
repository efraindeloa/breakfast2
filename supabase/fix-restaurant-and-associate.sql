-- ==================== CORREGIR RESTAURANTE Y ASOCIAR USUARIO ====================
-- Este script corrige el restaurante existente y lo asocia al usuario actual
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  v_user_id UUID;
  v_restaurant_id UUID;
  v_existing_restaurant_id UUID;
BEGIN
  -- 1. Obtener el primer usuario activo
  SELECT id INTO v_user_id 
  FROM users 
  WHERE is_active = true 
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario activo en la tabla users';
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_user_id;

  -- 2. Verificar si existe el restaurante con UUID de ejemplo
  SELECT id INTO v_existing_restaurant_id
  FROM restaurants
  WHERE id = '00000000-0000-0000-0000-000000000001'
  LIMIT 1;

  -- 3. Si existe el restaurante de ejemplo, eliminarlo y crear uno nuevo
  IF v_existing_restaurant_id IS NOT NULL THEN
    RAISE NOTICE 'Eliminando restaurante de ejemplo...';
    
    -- Eliminar asociaciones existentes
    DELETE FROM restaurant_staff WHERE restaurant_id = v_existing_restaurant_id;
    
    -- Eliminar configuraciones
    DELETE FROM restaurant_service_config WHERE restaurant_id = v_existing_restaurant_id;
    DELETE FROM restaurant_payment_config WHERE restaurant_id = v_existing_restaurant_id;
    DELETE FROM restaurant_billing_config WHERE restaurant_id = v_existing_restaurant_id;
    DELETE FROM restaurant_notification_config WHERE restaurant_id = v_existing_restaurant_id;
    DELETE FROM restaurant_metrics WHERE restaurant_id = v_existing_restaurant_id;
    
    -- Eliminar el restaurante
    DELETE FROM restaurants WHERE id = v_existing_restaurant_id;
    
    RAISE NOTICE 'Restaurante de ejemplo eliminado';
  END IF;

  -- 4. Crear nuevo restaurante con UUID real
  INSERT INTO restaurants (
    name, slug, description, address, city, state, country, postal_code,
    latitude, longitude, phone, email, website,
    logo_url, cover_image_url,
    rating, total_reviews, is_active, is_verified, timezone,
    nombre_comercial, razon_social, descripcion_corta, descripcion_larga,
    tipo_cocina, tags, direccion_completa, email_contacto, sitio_web
  ) VALUES (
    'Donk Restaurant',
    'donk-restaurant',
    'Restaurante de comida mexicana e internacional',
    'Av. Reforma 123',
    'Ciudad de México',
    'CDMX',
    'México',
    '06600',
    19.4326,
    -99.1332,
    '+52 55 1234 5678',
    'contacto@donkrestaurant.com',
    'https://www.donkrestaurant.com',
    'restaurant-images/logos/logo-donk-restaurant.png',
    NULL,
    4.5,
    120,
    true,
    true,
    'America/Mexico_City',
    'Donk Restaurant',
    'Donk Restaurant S.A. de C.V.',
    'Deliciosa comida mexicana e internacional en el corazón de la ciudad',
    'Donk Restaurant es un lugar acogedor donde la tradición mexicana se encuentra con sabores internacionales. Ofrecemos platillos preparados con ingredientes frescos y de la más alta calidad, en un ambiente cálido y familiar.',
    'Mexicana e Internacional',
    ARRAY['familiar', 'romántico', 'gourmet'],
    'Av. Reforma 123, Col. Juárez, Del. Cuauhtémoc, Ciudad de México, CDMX, 06600',
    'contacto@donkrestaurant.com',
    'https://www.donkrestaurant.com'
  )
  ON CONFLICT (slug) DO UPDATE SET
    nombre_comercial = EXCLUDED.nombre_comercial,
    razon_social = EXCLUDED.razon_social,
    descripcion_corta = EXCLUDED.descripcion_corta,
    descripcion_larga = EXCLUDED.descripcion_larga,
    tipo_cocina = EXCLUDED.tipo_cocina,
    tags = EXCLUDED.tags,
    direccion_completa = EXCLUDED.direccion_completa,
    email_contacto = EXCLUDED.email_contacto,
    sitio_web = EXCLUDED.sitio_web
  RETURNING id INTO v_restaurant_id;

  RAISE NOTICE 'Restaurante creado/actualizado: %', v_restaurant_id;

  -- 5. Asociar el usuario al restaurante como owner
  INSERT INTO restaurant_staff (restaurant_id, user_id, role, is_active)
  VALUES (v_restaurant_id, v_user_id, 'owner', true)
  ON CONFLICT (restaurant_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    is_active = true;

  RAISE NOTICE 'Usuario asociado al restaurante como owner';

  -- 6. Crear configuraciones de ejemplo
  INSERT INTO restaurant_service_config (
    restaurant_id, consumo_en_mesa, para_llevar, servicio_domicilio,
    acepta_reservaciones, acepta_lista_espera, tiempo_promedio_preparacion,
    numero_mesas, capacidad_total
  ) VALUES (
    v_restaurant_id, true, true, false, true, true, 30, 20, 80
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    consumo_en_mesa = EXCLUDED.consumo_en_mesa,
    para_llevar = EXCLUDED.para_llevar,
    servicio_domicilio = EXCLUDED.servicio_domicilio,
    acepta_reservaciones = EXCLUDED.acepta_reservaciones,
    acepta_lista_espera = EXCLUDED.acepta_lista_espera,
    tiempo_promedio_preparacion = EXCLUDED.tiempo_promedio_preparacion,
    numero_mesas = EXCLUDED.numero_mesas,
    capacidad_total = EXCLUDED.capacidad_total;

  INSERT INTO restaurant_payment_config (
    restaurant_id, acepta_efectivo, acepta_tarjeta, acepta_app,
    propina_sugerida, divide_cuenta, moneda
  ) VALUES (
    v_restaurant_id, true, true, true, ARRAY[10, 15, 18, 20], true, 'MXN'
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    acepta_efectivo = EXCLUDED.acepta_efectivo,
    acepta_tarjeta = EXCLUDED.acepta_tarjeta,
    acepta_app = EXCLUDED.acepta_app,
    propina_sugerida = EXCLUDED.propina_sugerida,
    divide_cuenta = EXCLUDED.divide_cuenta,
    moneda = EXCLUDED.moneda;

  INSERT INTO restaurant_notification_config (
    restaurant_id, notificaciones_app, notificaciones_whatsapp,
    notificaciones_email, plantillas_mensajes, idioma_mensajes,
    horario_envio_notificaciones
  ) VALUES (
    v_restaurant_id, true, false, true, '{}', 'es', '{"inicio": "09:00", "fin": "22:00"}'::jsonb
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    notificaciones_app = EXCLUDED.notificaciones_app,
    notificaciones_whatsapp = EXCLUDED.notificaciones_whatsapp,
    notificaciones_email = EXCLUDED.notificaciones_email,
    plantillas_mensajes = EXCLUDED.plantillas_mensajes,
    idioma_mensajes = EXCLUDED.idioma_mensajes,
    horario_envio_notificaciones = EXCLUDED.horario_envio_notificaciones;

  INSERT INTO restaurant_metrics (
    restaurant_id, fecha_alta, estatus, plan, uso_app,
    ordenes_mes, clientes_unicos, rating_promedio, total_opiniones
  ) VALUES (
    v_restaurant_id, NOW(), 'activo', 'basico', true, 150, 85, 4.5, 120
  )
  ON CONFLICT (restaurant_id) DO UPDATE SET
    estatus = EXCLUDED.estatus,
    plan = EXCLUDED.plan,
    uso_app = EXCLUDED.uso_app,
    ordenes_mes = EXCLUDED.ordenes_mes,
    clientes_unicos = EXCLUDED.clientes_unicos,
    rating_promedio = EXCLUDED.rating_promedio,
    total_opiniones = EXCLUDED.total_opiniones;

  RAISE NOTICE 'Configuraciones creadas exitosamente';
  RAISE NOTICE '✅ Restaurante corregido y asociado!';
  RAISE NOTICE '   ID del restaurante: %', v_restaurant_id;
  RAISE NOTICE '   Usuario asociado: %', v_user_id;
  RAISE NOTICE '   Accede a /restaurant-profile en la aplicación';

END $$;

-- Verificar que se creó correctamente
SELECT 
  r.id,
  r.name,
  r.slug,
  r.nombre_comercial,
  rs.user_id,
  rs.role,
  u.email
FROM restaurants r
JOIN restaurant_staff rs ON r.id = rs.restaurant_id
JOIN users u ON rs.user_id = u.id
WHERE r.slug = 'donk-restaurant'
AND rs.is_active = true;
