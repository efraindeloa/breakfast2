-- ==================== CREAR CUENTA DE RESTAURANTE ====================
-- Script SQL para crear una cuenta de restaurante directamente en Supabase
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza los valores entre < > con tus datos reales
-- 2. Para generar el password_hash, usa SHA-256 del password en texto plano
--    Puedes usar: SELECT encode(digest('tu_password_aqui', 'sha256'), 'hex');
-- 3. Ejecuta este script en el SQL Editor de Supabase

-- ==================== 1. CREAR USUARIO ====================
-- Genera un UUID para el usuario
DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_restaurant_id UUID := gen_random_uuid();
  v_password_hash TEXT;
  v_slug TEXT;
  v_slug_counter INTEGER := 1;
  v_final_slug TEXT;
BEGIN
  -- Hash de la contraseña (SHA-256)
  -- IMPORTANTE: Cambia 'password123' por la contraseña que quieras usar
  v_password_hash := encode(digest('password123', 'sha256'), 'hex');
  
  -- Generar slug único para el restaurante
  -- IMPORTANTE: Cambia 'Mi Restaurante' por el nombre de tu restaurante
  v_slug := lower(regexp_replace('Mi Restaurante', '[^a-z0-9]+', '-', 'g'));
  v_slug := trim(both '-' from v_slug);
  v_final_slug := v_slug;
  
  -- Verificar que el slug sea único
  WHILE EXISTS (SELECT 1 FROM restaurants WHERE slug = v_final_slug) LOOP
    v_final_slug := v_slug || '-' || v_slug_counter;
    v_slug_counter := v_slug_counter + 1;
  END LOOP;
  
  -- ==================== INSERTAR USUARIO ====================
  INSERT INTO users (
    id,
    email,
    name,
    phone,
    password_hash,
    is_active,
    email_verified,
    phone_verified,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'restaurante@ejemplo.com',  -- CAMBIAR: Email del restaurante
    'Propietario Restaurante',  -- CAMBIAR: Nombre del propietario
    '+521234567890',            -- CAMBIAR: Teléfono (opcional, puede ser NULL)
    v_password_hash,
    true,
    true,
    false,
    NOW(),
    NOW()
  );
  
  -- ==================== CREAR RESTAURANTE ====================
  INSERT INTO restaurants (
    id,
    name,
    slug,
    city,
    country,
    is_active,
    is_verified,
    rating,
    total_reviews,
    timezone,
    created_at,
    updated_at
  ) VALUES (
    v_restaurant_id,
    'Mi Restaurante',           -- CAMBIAR: Nombre del restaurante
    v_final_slug,
    'Ciudad',                   -- CAMBIAR: Ciudad
    'México',                   -- CAMBIAR: País
    true,
    false,
    0.0,
    0,
    'America/Mexico_City',      -- CAMBIAR: Zona horaria
    NOW(),
    NOW()
  );
  
  -- ==================== ASOCIAR USUARIO COMO OWNER ====================
  INSERT INTO restaurant_staff (
    id,
    restaurant_id,
    user_id,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    v_restaurant_id,
    v_user_id,
    'owner',
    true,
    NOW(),
    NOW()
  );
  
  -- ==================== MOSTRAR RESULTADOS ====================
  RAISE NOTICE '✅ Cuenta de restaurante creada exitosamente!';
  RAISE NOTICE 'Usuario ID: %', v_user_id;
  RAISE NOTICE 'Email: restaurante@ejemplo.com';
  RAISE NOTICE 'Password: password123';
  RAISE NOTICE 'Restaurante ID: %', v_restaurant_id;
  RAISE NOTICE 'Nombre del restaurante: Mi Restaurante';
  RAISE NOTICE 'Slug: %', v_final_slug;
  
END $$;

-- ==================== VERIFICAR CREACIÓN ====================
-- Descomenta las siguientes líneas para verificar que todo se creó correctamente
/*
SELECT 
  u.id as user_id,
  u.email,
  u.name as user_name,
  r.id as restaurant_id,
  r.name as restaurant_name,
  r.slug,
  rs.role,
  rs.is_active as staff_active
FROM users u
JOIN restaurant_staff rs ON rs.user_id = u.id
JOIN restaurants r ON r.id = rs.restaurant_id
WHERE u.email = 'restaurante@ejemplo.com'
ORDER BY r.created_at DESC
LIMIT 1;
*/
