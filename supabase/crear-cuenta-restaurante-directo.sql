-- ==================== CREAR CUENTA RESTAURANTE (DIRECTO) ====================
-- Script SQL para crear una cuenta de restaurante directamente en Supabase
-- 
-- INSTRUCCIONES:
-- 1. Primero genera el hash de tu contraseña ejecutando:
--    SELECT encode(digest('tu_password_aqui', 'sha256'), 'hex');
-- 2. Copia el resultado y reemplaza 'HASH_AQUI' abajo
-- 3. Cambia los valores marcados con -- CAMBIAR
-- 4. Ejecuta todo el script completo

-- ==================== PASO 1: Generar hash de contraseña ====================
-- Ejecuta esto primero y copia el resultado:
SELECT encode(digest('password123', 'sha256'), 'hex') as password_hash;
-- Resultado ejemplo: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'

-- ==================== PASO 2: Crear cuenta completa ====================
-- Reemplaza los valores y ejecuta:

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
    'restaurante@ejemplo.com',  -- CAMBIAR: Tu email
    'Propietario Restaurante',  -- CAMBIAR: Tu nombre
    '+521234567890',            -- CAMBIAR: Tu teléfono (o NULL)
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- CAMBIAR: Hash del PASO 1
    true,
    true,
    false,
    NOW(),
    NOW()
  ) RETURNING id as user_id, email, name
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
    'Mi Restaurante',           -- CAMBIAR: Nombre de tu restaurante
    'mi-restaurante',           -- CAMBIAR: Slug único (sin espacios, minúsculas, sin caracteres especiales)
    'Ciudad',                   -- CAMBIAR: Tu ciudad
    'México',                   -- CAMBIAR: Tu país
    true,
    false,
    0.0,
    0,
    'America/Mexico_City',      -- CAMBIAR: Tu zona horaria
    NOW(),
    NOW()
  ) RETURNING id as restaurant_id, name as restaurant_name, slug
)
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
  (SELECT email FROM new_user) as email,
  (SELECT name FROM new_user) as user_name,
  (SELECT restaurant_id FROM new_restaurant) as restaurant_id,
  (SELECT restaurant_name FROM new_restaurant) as restaurant_name,
  (SELECT slug FROM new_restaurant) as slug;

-- ==================== VERIFICAR ====================
-- Después de ejecutar, verifica con:
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
WHERE u.email = 'restaurante@ejemplo.com'  -- CAMBIAR: Tu email
ORDER BY r.created_at DESC
LIMIT 1;
