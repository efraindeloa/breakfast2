-- ==================== DESHABILITAR RLS TEMPORALMENTE ====================
-- Este script deshabilita RLS en restaurant_billing_config para diagnóstico
-- ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

ALTER TABLE restaurant_billing_config DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'restaurant_billing_config';
