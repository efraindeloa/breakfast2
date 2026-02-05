-- ==================== CREAR CUENTA RESTAURANTE (PASO A PASO) ====================
-- Ejecuta cada paso por separado y copia los IDs generados

-- ==================== PASO 1: Generar hash de contraseña ====================
-- Ejecuta esto primero y copia el resultado para usarlo en el PASO 2
-- Cambia 'mi_password_seguro' por la contraseña que quieras usar
SELECT encode(digest('mi_password_seguro', 'sha256'), 'hex') as password_hash;

-- ==================== PASO 2: Crear usuario ====================
-- Reemplaza 'HASH_AQUI' con el resultado del PASO 1
-- Reemplaza los otros valores según tus necesidades
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
  'HASH_AQUI',                -- CAMBIAR: Hash del PASO 1
  true,
  true,
  false,
  NOW(),
  NOW()
) RETURNING id as user_id, email, name;

-- ==================== PASO 3: Crear restaurante ====================
-- Copia el user_id del PASO 2 y úsalo en el PASO 4
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
  'mi-restaurante',           -- CAMBIAR: Slug único (sin espacios, minúsculas)
  'Ciudad',                   -- CAMBIAR: Tu ciudad
  'México',                   -- CAMBIAR: Tu país
  true,
  false,
  0.0,
  0,
  'America/Mexico_City',      -- CAMBIAR: Tu zona horaria
  NOW(),
  NOW()
) RETURNING id as restaurant_id, name, slug;

-- ==================== PASO 4: Asociar usuario como owner ====================
-- Reemplaza USER_ID_AQUI con el user_id del PASO 2
-- Reemplaza RESTAURANT_ID_AQUI con el restaurant_id del PASO 3
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
  'RESTAURANT_ID_AQUI'::uuid,  -- CAMBIAR: restaurant_id del PASO 3
  'USER_ID_AQUI'::uuid,        -- CAMBIAR: user_id del PASO 2
  'owner',
  true,
  NOW(),
  NOW()
) RETURNING id as staff_id, restaurant_id, user_id, role;

-- ==================== VERIFICACIÓN FINAL ====================
-- Ejecuta esto al final para verificar que todo se creó correctamente
-- Reemplaza 'restaurante@ejemplo.com' con el email que usaste
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
