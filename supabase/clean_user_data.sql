-- ==================== LIMPIEZA DE DATOS DE USUARIO ====================
-- Este script elimina todos los datos de usuario (órdenes, carrito, etc.)
-- pero mantiene los productos, restaurantes y traducciones

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

-- Eliminar usuarios (opcional - descomentar si también quieres limpiar usuarios)
-- DELETE FROM users;

-- Verificar que las tablas estén vacías
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
FROM waitlist_entries;

-- Verificar que los productos se mantienen
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
