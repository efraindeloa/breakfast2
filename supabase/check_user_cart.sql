-- Consulta para verificar cuántos productos tiene en el carrito el usuario efraindeloa@hotmail.com

-- Primero, encontrar el user_id del usuario
SELECT 
  u.id as user_id,
  u.email,
  COUNT(ci.id) as total_items_en_carrito,
  SUM(ci.quantity) as total_cantidad_productos
FROM users u
LEFT JOIN cart_items ci ON ci.user_id = u.id
WHERE u.email = 'efraindeloa@hotmail.com'
GROUP BY u.id, u.email;

-- Si quieres ver los detalles de cada item en el carrito:
SELECT 
  u.email,
  ci.id as cart_item_id,
  ci.product_id,
  p.name as producto_nombre,
  ci.quantity,
  ci.notes,
  ci.created_at
FROM users u
INNER JOIN cart_items ci ON ci.user_id = u.id
LEFT JOIN products p ON p.id = ci.product_id
WHERE u.email = 'efraindeloa@hotmail.com'
ORDER BY ci.created_at DESC;
