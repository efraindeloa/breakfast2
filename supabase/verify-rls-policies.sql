-- ==================== VERIFICAR POLÍTICAS RLS ====================
-- Este script verifica las políticas RLS existentes para restaurant_billing_config

-- Ver políticas existentes
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
WHERE tablename = 'restaurant_billing_config'
ORDER BY policyname;

-- Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'restaurant_billing_config';
