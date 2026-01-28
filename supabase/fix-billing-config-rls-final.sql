-- ==================== CORRECCIÓN FINAL DE RLS PARA restaurant_billing_config ====================
-- Este script aplica una solución más agresiva para resolver el error 406
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Deshabilitar RLS temporalmente para verificar si ese es el problema
-- (Comentar esta línea si quieres mantener RLS habilitado)
-- ALTER TABLE restaurant_billing_config DISABLE ROW LEVEL SECURITY;

-- Paso 2: Si prefieres mantener RLS, eliminar TODAS las políticas y crear nuevas
ALTER TABLE restaurant_billing_config ENABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas existentes de forma más agresiva
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Eliminar todas las políticas
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'restaurant_billing_config'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON restaurant_billing_config', r.policyname);
    END LOOP;
END $$;

-- Paso 3: Crear políticas usando FOR ALL con USING y WITH CHECK explícitos
-- Política para SELECT
CREATE POLICY "billing_config_select_policy" ON restaurant_billing_config 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Política para INSERT
CREATE POLICY "billing_config_insert_policy" ON restaurant_billing_config 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Política para UPDATE
CREATE POLICY "billing_config_update_policy" ON restaurant_billing_config 
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política para DELETE
CREATE POLICY "billing_config_delete_policy" ON restaurant_billing_config 
  FOR DELETE 
  TO authenticated
  USING (true);

-- Paso 4: Verificar que las políticas se crearon
SELECT 
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'restaurant_billing_config'
ORDER BY policyname;
