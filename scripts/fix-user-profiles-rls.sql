-- ==================== CORREGIR POLÍTICAS RLS PARA user_profiles ====================
-- Este script configura las políticas de Row Level Security para user_profiles

-- Paso 0: Crear función para establecer variables de sesión
CREATE OR REPLACE FUNCTION set_config(setting_name text, setting_value text)
RETURNS void AS $$
BEGIN
    PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Paso 1: Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Paso 2: Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Allow all operations on user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can view user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view their profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON user_profiles;
DROP POLICY IF EXISTS "Authenticated users can update their profile" ON user_profiles;

-- Paso 3: Crear políticas que funcionen tanto con Supabase Auth como con autenticación simple
-- Estas políticas permiten acceso si:
-- 1. El usuario está autenticado con Supabase Auth (auth.uid() = user_id)
-- 2. O si está usando autenticación simple (current_setting('app.user_id') = user_id)

CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (
        auth.uid()::text = user_id::text 
        OR user_id::text = current_setting('app.user_id', true)
    );

CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (
        auth.uid()::text = user_id::text 
        OR user_id::text = current_setting('app.user_id', true)
    );

CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (
        auth.uid()::text = user_id::text 
        OR user_id::text = current_setting('app.user_id', true)
    )
    WITH CHECK (
        auth.uid()::text = user_id::text 
        OR user_id::text = current_setting('app.user_id', true)
    );

-- Paso 4: Verificar las políticas creadas
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
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Paso 5: Mostrar mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS para user_profiles configuradas correctamente';
    RAISE NOTICE '   - Soporta autenticación Supabase (auth.uid())';
    RAISE NOTICE '   - Soporta autenticación simple (app.user_id)';
END $$;