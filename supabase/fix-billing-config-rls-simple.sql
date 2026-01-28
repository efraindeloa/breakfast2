-- ==================== CORRECCIÓN SIMPLE DE RLS PARA restaurant_billing_config ====================
-- Este script simplifica las políticas RLS para permitir acceso completo a usuarios autenticados
-- Ejecutar en Supabase SQL Editor

-- Deshabilitar RLS temporalmente para diagnóstico (NO RECOMENDADO EN PRODUCCIÓN)
-- ALTER TABLE restaurant_billing_config DISABLE ROW LEVEL SECURITY;

-- O mejor: crear políticas muy permisivas
ALTER TABLE restaurant_billing_config ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurant_billing_config') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON restaurant_billing_config';
    END LOOP;
END $$;

-- Crear política muy permisiva para SELECT (cualquier usuario autenticado puede leer)
-- IMPORTANTE: Usar auth.uid() IS NOT NULL (con paréntesis y IS NOT NULL)
DROP POLICY IF EXISTS "Allow authenticated users to read billing config" ON restaurant_billing_config;
CREATE POLICY "Allow authenticated users to read billing config" ON restaurant_billing_config 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Crear política muy permisiva para INSERT/UPDATE/DELETE (cualquier usuario autenticado puede modificar)
DROP POLICY IF EXISTS "Allow authenticated users to manage billing config" ON restaurant_billing_config;
CREATE POLICY "Allow authenticated users to manage billing config" ON restaurant_billing_config 
  FOR ALL 
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Verificar que las políticas se crearon
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'restaurant_billing_config';
