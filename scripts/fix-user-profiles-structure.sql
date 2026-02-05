-- ==================== CORREGIR ESTRUCTURA DE TABLA user_profiles ====================
-- Este script verifica y corrige la estructura de la tabla user_profiles

-- Verificar si la tabla existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'user_profiles'
    ) THEN
        RAISE NOTICE 'Tabla user_profiles no existe. Creándola...';
        
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

-- Verificar que no tenga una columna 'id' incorrecta
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'id'
    ) THEN
        RAISE NOTICE '⚠️  ADVERTENCIA: Tabla user_profiles tiene columna "id" incorrecta';
        RAISE NOTICE '   La clave primaria debe ser "user_id", no "id"';
        RAISE NOTICE '   Por favor, revise la estructura de la tabla manualmente';
    ELSE
        RAISE NOTICE '✓ Estructura de user_profiles es correcta (no tiene columna "id")';
    END IF;
END $$;

-- Verificar que tenga la columna user_id como clave primaria
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE '✓ Columna user_id existe y es NOT NULL';
    ELSE
        RAISE NOTICE '❌ ERROR: Columna user_id no existe o no es NOT NULL';
    END IF;
END $$;

-- Crear índice si no existe
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Configurar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Crear políticas para autenticación simple
CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can update their own profile" 
    ON user_profiles FOR UPDATE 
    USING (user_id = current_setting('app.user_id', true)::uuid);

CREATE POLICY "Users can insert their own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (user_id = current_setting('app.user_id', true)::uuid);

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Mostrar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Verificación y corrección de user_profiles completada';
END $$;