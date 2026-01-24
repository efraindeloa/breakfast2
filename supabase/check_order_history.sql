-- ==================== VERIFICAR HISTORIAL DE ÓRDENES ====================
-- Este script verifica si hay órdenes en order_history

-- 1. Ver todas las órdenes en order_history
SELECT 
  id,
  user_id,
  restaurant_id,
  status,
  total,
  order_number,
  completed_at,
  created_at,
  jsonb_array_length(items) as items_count
FROM order_history
ORDER BY created_at DESC
LIMIT 20;

-- 2. Contar órdenes por user_id
SELECT 
  user_id,
  COUNT(*) as order_count,
  MIN(created_at) as first_order,
  MAX(created_at) as last_order
FROM order_history
GROUP BY user_id
ORDER BY last_order DESC;

-- 3. Verificar si hay órdenes con status 'entregada' o 'cancelada'
SELECT 
  status,
  COUNT(*) as count
FROM order_history
GROUP BY status;

-- 4. Verificar las políticas RLS para order_history
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
