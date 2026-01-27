-- Script para depurar problemas de RLS con cart_items
-- Verifica el user_id del usuario y sus items del carrito

-- 1. Verificar el user_id del usuario efraindeloa@hotmail.com
SELECT 
  id as user_id,
  email,
  created_at
FROM users
WHERE email = 'efraindeloa@hotmail.com';

-- 2. Verificar los items del carrito para ese usuario
SELECT 
  ci.id,
  ci.user_id,
  ci.product_id,
  ci.quantity,
  ci.notes,
  ci.restaurant_id,
  ci.created_at,
  p.name as product_name,
  p.is_active as product_is_active
FROM cart_items ci
LEFT JOIN products p ON p.id = ci.product_id
WHERE ci.user_id = (
  SELECT id FROM users WHERE email = 'efraindeloa@hotmail.com'
);

-- 3. Verificar las políticas RLS actuales
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('cart_items', 'products')
ORDER BY tablename, policyname;

-- 4. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('cart_items', 'products');
