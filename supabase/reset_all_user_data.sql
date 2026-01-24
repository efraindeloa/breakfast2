-- ==================== RESET COMPLETO DE DATOS DE USUARIO ====================
-- ⚠️ ADVERTENCIA: Este script elimina TODOS los datos de usuario
-- Mantiene: productos, restaurantes, traducciones, y estructura de tablas
-- 
-- Ejecuta este script si quieres empezar completamente de cero

-- Eliminar datos de carrito
DELETE FROM cart_items;

-- Eliminar órdenes activas
DELETE FROM orders;

-- Eliminar historial de órdenes
DELETE FROM order_history;

-- Eliminar favoritos
DELETE FROM favorite_dishes;

-- Eliminar combinaciones guardadas
DELETE FROM saved_combinations;

-- Eliminar lista de espera
DELETE FROM waitlist_entries;

-- Eliminar usuarios
DELETE FROM users;

-- Eliminar solicitudes de asistencia
DELETE FROM assistance_requests;

-- Eliminar contactos
DELETE FROM contacts;

-- Eliminar reseñas
DELETE FROM reviews;

-- Eliminar datos de lealtad
DELETE FROM loyalty_data;

-- Verificar que todas las tablas estén vacías
SELECT 
  'cart_items' as tabla,
  COUNT(*) as registros
FROM cart_items
UNION ALL
SELECT 
  'orders' as tabla,
  COUNT(*) as registros
FROM orders
UNION ALL
SELECT 
  'order_history' as tabla,
  COUNT(*) as registros
FROM order_history
UNION ALL
SELECT 
  'favorite_dishes' as tabla,
  COUNT(*) as registros
FROM favorite_dishes
UNION ALL
SELECT 
  'saved_combinations' as tabla,
  COUNT(*) as registros
FROM saved_combinations
UNION ALL
SELECT 
  'waitlist_entries' as tabla,
  COUNT(*) as registros
FROM waitlist_entries
UNION ALL
SELECT 
  'users' as tabla,
  COUNT(*) as registros
FROM users
UNION ALL
SELECT 
  'assistance_requests' as tabla,
  COUNT(*) as registros
FROM assistance_requests
UNION ALL
SELECT 
  'contacts' as tabla,
  COUNT(*) as registros
FROM contacts
UNION ALL
SELECT 
  'reviews' as tabla,
  COUNT(*) as registros
FROM reviews
UNION ALL
SELECT 
  'loyalty_data' as tabla,
  COUNT(*) as registros
FROM loyalty_data;

-- Verificar que los datos maestros se mantienen
SELECT 
  'products' as tabla,
  COUNT(*) as registros
FROM products
UNION ALL
SELECT 
  'restaurants' as tabla,
  COUNT(*) as registros
FROM restaurants
UNION ALL
SELECT 
  'product_translations' as tabla,
  COUNT(*) as registros
FROM product_translations;

-- Mensaje de confirmación
DO $$
BEGIN
  RAISE NOTICE '✅ Limpieza completa realizada. Todas las tablas de usuario están vacías.';
  RAISE NOTICE '✅ Productos, restaurantes y traducciones se mantienen intactos.';
END $$;
