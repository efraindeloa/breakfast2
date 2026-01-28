-- ==================== DIAGNÓSTICO DE restaurant_billing_config ====================
-- Este script diagnostica problemas con restaurant_billing_config

-- 1. Verificar si la tabla existe
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'restaurant_billing_config'
) AS table_exists;

-- 2. Verificar si RLS está habilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'restaurant_billing_config';

-- 3. Ver todas las políticas RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurant_billing_config'
ORDER BY policyname;

-- 4. Verificar si hay registros en la tabla
SELECT COUNT(*) as total_records
FROM restaurant_billing_config;

-- 5. Verificar registros específicos del restaurante
SELECT *
FROM restaurant_billing_config
WHERE restaurant_id = '768e2221-d392-4fc1-a803-53d8f0762746';

-- 6. Verificar si el usuario actual está autenticado (ejecutar como el usuario autenticado)
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role;

-- 7. Probar la política manualmente (esto debe ejecutarse con el usuario autenticado)
-- Si esto falla, el problema es con la autenticación
SELECT *
FROM restaurant_billing_config
WHERE restaurant_id = '768e2221-d392-4fc1-a803-53d8f0762746'
AND auth.uid() IS NOT NULL;
