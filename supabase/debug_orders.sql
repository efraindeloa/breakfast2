-- ==================== SCRIPT DE DEBUG PARA ÓRDENES ====================
-- Este script ayuda a diagnosticar problemas con las órdenes

-- 1. Verificar si hay órdenes en la tabla orders
SELECT 
  id,
  user_id,
  restaurant_id,
  status,
  total,
  created_at,
  jsonb_array_length(items) as items_count
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 2. Verificar si hay órdenes en order_history
SELECT 
  id,
  user_id,
  restaurant_id,
  status,
  total,
  created_at,
  completed_at,
  jsonb_array_length(items) as items_count
FROM order_history
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar las políticas RLS actuales para orders
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
WHERE tablename = 'orders'
ORDER BY policyname;

-- 4. Verificar las políticas RLS actuales para order_history
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
WHERE tablename = 'order_history'
ORDER BY policyname;

-- 5. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_history');

-- 6. Contar órdenes por user_id
SELECT 
  user_id,
  COUNT(*) as order_count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM orders
GROUP BY user_id
ORDER BY last_order DESC;
