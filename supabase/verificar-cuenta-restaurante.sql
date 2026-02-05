-- ==================== VERIFICAR CUENTA DE RESTAURANTE ====================
-- Script para verificar si una cuenta está correctamente configurada como restaurante

-- ==================== 1. VERIFICAR USUARIO ====================
SELECT 
  'USUARIO' as tipo,
  u.id,
  u.email,
  u.name,
  u.is_active,
  u.created_at
FROM users u 
WHERE u.email = 'restaurante@ejemplo.com';  -- CAMBIAR: Tu email

-- ==================== 2. VERIFICAR RESTAURANTE ====================
SELECT 
  'RESTAURANTE' as tipo,
  r.id,
  r.name,
  r.slug,
  r.is_active,
  r.created_at
FROM restaurants r
JOIN restaurant_staff rs ON rs.restaurant_id = r.id
JOIN users u ON u.id = rs.user_id
WHERE u.email = 'restaurante@ejemplo.com';  -- CAMBIAR: Tu email

-- ==================== 3. VERIFICAR ASOCIACIÓN RESTAURANT_STAFF ====================
SELECT 
  'STAFF' as tipo,
  rs.id as staff_id,
  rs.user_id,
  rs.restaurant_id,
  rs.role,
  rs.is_active,
  u.email,
  r.name as restaurant_name
FROM restaurant_staff rs
JOIN users u ON u.id = rs.user_id
JOIN restaurants r ON r.id = rs.restaurant_id
WHERE u.email = 'restaurante@ejemplo.com';  -- CAMBIAR: Tu email

-- ==================== 4. VERIFICAR QUERY QUE USA LA APP ====================
-- Esta es la query exacta que usa AuthContext.refreshAccountType()
SELECT 
  'QUERY_APP' as tipo,
  rs.id,
  rs.role,
  rs.is_active,
  u.email,
  u.id as user_id
FROM restaurant_staff rs
JOIN users u ON u.id = rs.user_id
WHERE u.email = 'restaurante@ejemplo.com'  -- CAMBIAR: Tu email
  AND rs.is_active = true;

-- ==================== 5. CONTAR REGISTROS ====================
SELECT 
  'CONTEOS' as tipo,
  (SELECT COUNT(*) FROM users WHERE email = 'restaurante@ejemplo.com') as usuarios,
  (SELECT COUNT(*) FROM restaurants r JOIN restaurant_staff rs ON rs.restaurant_id = r.id JOIN users u ON u.id = rs.user_id WHERE u.email = 'restaurante@ejemplo.com') as restaurantes,
  (SELECT COUNT(*) FROM restaurant_staff rs JOIN users u ON u.id = rs.user_id WHERE u.email = 'restaurante@ejemplo.com' AND rs.is_active = true) as staff_activo;

-- ==================== DIAGNÓSTICO ====================
-- Si los conteos muestran:
-- usuarios: 1, restaurantes: 1, staff_activo: 1 → Todo está bien, problema en la app
-- usuarios: 1, restaurantes: 0, staff_activo: 0 → No se creó el restaurante o la asociación
-- usuarios: 0 → No se creó el usuario