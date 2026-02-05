-- ==================== CORREGIR ESTRUCTURA DE TABLA user_profiles (VERSIÓN SIMPLE) ====================
-- Este script verifica y corrige la estructura de la tabla user_profiles

-- Paso 1: Verificar si la tabla existe y crearla si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        CREATE TABLE user_profiles (
            user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            name TEXT,
            phone TEXT,
            bio TEXT,
            gender TEXT,
            country TEXT,
            city TEXT,
            state TEXT,
            address TEXT,
            postal_code TEXT,
            avatar_url TEXT,
            date_of_birth DATE,
            preferences JSONB,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE '✓ Tabla user_profiles creada exitosamente';
    ELSE
        RAISE NOTICE '✓ Tabla user_profiles ya existe';
    END IF;
END $$;

-- Paso 2: Verificar estructura
DO $$
BEGIN
    -- Verificar que NO tenga columna 'id' incorrecta
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'id'
    ) THEN
        RAISE NOTICE '⚠️  ADVERTENCIA: Tabla user_profiles tiene columna "id" incorrecta';
        RAISE NOTICE '   La clave primaria debe ser "user_id", no "id"';
    ELSE
        RAISE NOTICE '✓ Estructura correcta: no tiene columna "id"';
    END IF;

    -- Verificar que tenga columna user_id
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE '✓ Columna user_id existe correctamente';
    ELSE
        RAISE NOTICE '❌ ERROR: Columna user_id no existe';
    END IF;
END $$;

-- Paso 3: Crear índice
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Paso 4: Configurar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Paso 5: Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Paso 6: Crear políticas para autenticación simple
CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

-- Paso 7: Crear trigger para updated_at si la función existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
        CREATE TRIGGER update_user_profiles_updated_at 
            BEFORE UPDATE ON user_profiles 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE '✓ Trigger para updated_at creado';
    ELSE
        RAISE NOTICE '⚠️  Función update_updated_at_column no existe, trigger no creado';
    END IF;
END $$;

-- Paso 8: Mostrar estructura final
SELECT 
    'user_profiles' as tabla,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Paso 9: Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Verificación y corrección de user_profiles completada';
END $$;