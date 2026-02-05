-- ==================== CREAR CUENTA DE RESTAURANTE (VERSIÓN SIMPLE) ====================
-- Script SQL simplificado para crear una cuenta de restaurante
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza los valores marcados con -- CAMBIAR
-- 2. Para generar el password_hash, ejecuta primero:
--    SELECT encode(digest('tu_password_aqui', 'sha256'), 'hex');
-- 3. Copia el resultado y úsalo en el INSERT de users
-- 4. Ejecuta este script completo en el SQL Editor de Supabase

-- ==================== VARIABLES (CAMBIAR AQUÍ) ====================
-- Genera el hash de tu contraseña primero:
-- SELECT encode(digest('mi_password_seguro', 'sha256'), 'hex');

-- ==================== 1. CREAR USUARIO ====================
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
  gen_random_uuid(),                                    -- ID único generado automáticamente
  'restaurante@ejemplo.com',                            -- CAMBIAR: Email del restaurante
  'Propietario Restaurante',                            -- CAMBIAR: Nombre del propietario
  '+521234567890',                                      -- CAMBIAR: Teléfono (o NULL)
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- CAMBIAR: Hash SHA-256 de tu contraseña
  true,
  true,
  false,
  NOW(),
  NOW()
) RETURNING id as user_id;

-- ==================== 2. CREAR RESTAURANTE ====================
-- NOTA: Necesitas el user_id del INSERT anterior. Si ejecutas todo junto, usa:
WITH new_user AS (
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
    gen_random_uuid(),
    'restaurante@ejemplo.com',                            -- CAMBIAR: Email
    'Propietario Restaurante',                            -- CAMBIAR: Nombre
    '+521234567890',                                      -- CAMBIAR: Teléfono (o NULL)
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', -- CAMBIAR: Hash SHA-256
    true,
    true,
    false,
    NOW(),
    NOW()
  ) RETURNING id as user_id
),
new_restaurant AS (
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
    gen_random_uuid(),
    'Mi Restaurante',                                     -- CAMBIAR: Nombre del restaurante
    lower(regexp_replace('Mi Restaurante', '[^a-z0-9]+', '-', 'g')), -- Slug generado del nombre
    'Ciudad',                                             -- CAMBIAR: Ciudad
    'México',                                             -- CAMBIAR: País
    true,
    false,
    0.0,
    0,
    'America/Mexico_City',                                -- CAMBIAR: Zona horaria
    NOW(),
    NOW()
  ) RETURNING id as restaurant_id, name as restaurant_name, slug
)
-- ==================== 3. ASOCIAR USUARIO COMO OWNER ====================
INSERT INTO restaurant_staff (
  id,
  restaurant_id,
  user_id,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  nr.restaurant_id,
  nu.user_id,
  'owner',
  true,
  NOW(),
  NOW()
FROM new_user nu, new_restaurant nr
RETURNING 
  (SELECT user_id FROM new_user) as user_id,
  (SELECT restaurant_id FROM new_restaurant) as restaurant_id,
  (SELECT restaurant_name FROM new_restaurant) as restaurant_name,
  (SELECT slug FROM new_restaurant) as slug;

-- ==================== VERIFICAR ====================
-- Después de ejecutar, verifica con:
-- SELECT u.email, u.name, r.name as restaurant_name, rs.role 
-- FROM users u 
-- JOIN restaurant_staff rs ON rs.user_id = u.id 
-- JOIN restaurants r ON r.id = rs.restaurant_id 
-- WHERE u.email = 'restaurante@ejemplo.com';
