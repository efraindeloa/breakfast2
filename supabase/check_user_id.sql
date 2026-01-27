-- Verificar el user_id del usuario efraindeloa@hotmail.com y sus items del carrito

-- 1. Verificar el user_id del usuario en la tabla users
SELECT 
  id as user_id,
  email,
  created_at
FROM users
WHERE email = 'efraindeloa@hotmail.com';

-- 2. Verificar los items del carrito para ese user_id
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.notes,
  ci.restaurant_id,
  ci.created_at,
  p.name as product_name
FROM cart_items ci
LEFT JOIN products p ON p.id = ci.product_id
WHERE ci.user_id = (
  SELECT id FROM users WHERE email = 'efraindeloa@hotmail.com'
);

-- 3. Verificar si hay items del carrito con el user_id que aparece en los logs (8dfd76b4-70a1-4bb9-a56f-9fb12f9be523)
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.notes,
  ci.restaurant_id,
  ci.created_at,
  p.name as product_name
FROM cart_items ci
LEFT JOIN products p ON p.id = ci.product_id
WHERE ci.user_id = '8dfd76b4-70a1-4bb9-a56f-9fb12f9be523';
