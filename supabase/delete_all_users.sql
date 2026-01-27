-- ==================== ELIMINAR TODOS LOS USUARIOS ====================
-- Este script elimina todos los usuarios y sus datos relacionados
-- ⚠️ ADVERTENCIA: Esto eliminará TODOS los usuarios y sus datos
-- Ejecuta este script solo si estás seguro de querer empezar desde cero

-- Primero, eliminar todos los datos relacionados del usuario
-- (Aunque CASCADE debería hacerlo automáticamente, lo hacemos explícitamente para estar seguros)

-- Eliminar datos de carrito
DELETE FROM cart_items;

-- Eliminar pagos primero (tienen referencia a orders)
DELETE FROM payments;

-- Eliminar órdenes (los items están en JSONB dentro de orders, no hay tabla separada)
DELETE FROM orders;

-- Eliminar favoritos
DELETE FROM favorite_dishes;

-- Eliminar combinaciones guardadas
DELETE FROM saved_combinations;

-- Eliminar datos de lealtad
DELETE FROM loyalty_data;

-- Eliminar contactos
DELETE FROM contacts;

-- Eliminar entradas de lista de espera
DELETE FROM waitlist_entries;

-- Eliminar solicitudes de asistencia
DELETE FROM assistance_requests;

-- Eliminar reseñas
DELETE FROM reviews;

-- Eliminar cupones del usuario
DELETE FROM coupons WHERE user_id IS NOT NULL;

-- Eliminar datos de usuario extendidos
DELETE FROM user_profiles;
DELETE FROM user_settings;
DELETE FROM user_addresses;
DELETE FROM user_payment_methods;
DELETE FROM user_billing_profiles;
DELETE FROM user_transactions;

-- Finalmente, eliminar todos los usuarios de la tabla users
DELETE FROM users;

-- Verificar que se eliminaron todos los usuarios
SELECT 
  'Usuarios restantes en users:' as info,
  COUNT(*) as count
FROM users;

-- NOTA: Para eliminar usuarios de Supabase Auth (auth.users), 
-- debes hacerlo desde el Dashboard de Supabase:
-- 1. Ve a Authentication > Users
-- 2. Selecciona el usuario
-- 3. Haz clic en "Delete user"
-- 
-- O ejecuta este comando en el SQL Editor (solo si tienes permisos de superusuario):
-- DELETE FROM auth.users;
