-- ==================== CORREGIR COLUMNAS DE TABLA user_profiles ====================
-- Este script actualiza la estructura de user_profiles para que coincida con el código
-- Ejecuta este script directamente en Supabase SQL Editor

-- Paso 1: Verificar y renombrar display_name a name (si existe)
DO $$
BEGIN
  -- Verificar si existe la columna display_name
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'display_name'
  ) THEN
    -- Renombrar display_name a name
    ALTER TABLE user_profiles RENAME COLUMN display_name TO name;
    RAISE NOTICE 'Columna display_name renombrada a name';
  END IF;
END $$;

-- Paso 2: Agregar columna name si no existe (ni display_name ni name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN name TEXT;
    RAISE NOTICE 'Columna name agregada';
  END IF;
END $$;

-- Paso 3: Agregar columna phone si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Columna phone agregada';
  END IF;
END $$;

-- Paso 4: Agregar columna state si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'state'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN state TEXT;
    RAISE NOTICE 'Columna state agregada';
  END IF;
END $$;

-- Paso 5: Agregar columna address si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN address TEXT;
    RAISE NOTICE 'Columna address agregada';
  END IF;
END $$;

-- Paso 6: Agregar columna postal_code si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'postal_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN postal_code TEXT;
    RAISE NOTICE 'Columna postal_code agregada';
  END IF;
END $$;

-- Paso 7: Agregar columna date_of_birth si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN date_of_birth DATE;
    RAISE NOTICE 'Columna date_of_birth agregada';
  END IF;
END $$;

-- Paso 8: Agregar columna preferences si no existe (para datos JSONB)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles' 
    AND column_name = 'preferences'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN preferences JSONB;
    RAISE NOTICE 'Columna preferences agregada';
  END IF;
END $$;

-- Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY 
    ordinal_position;

-- Paso 9: Eliminar date_of_birth de users si existe (debe estar solo en user_profiles)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    -- Migrar datos a user_profiles antes de eliminar (si hay datos)
    UPDATE user_profiles up
    SET date_of_birth = u.date_of_birth
    FROM users u
    WHERE up.user_id = u.id
    AND u.date_of_birth IS NOT NULL
    AND up.date_of_birth IS NULL;
    
    -- Eliminar la columna de users
    ALTER TABLE users DROP COLUMN date_of_birth;
    RAISE NOTICE 'Columna date_of_birth eliminada de users (migrada a user_profiles si había datos)';
  END IF;
END $$;

-- Verificar la estructura final de users (sin date_of_birth)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- Nota: Si la tabla tiene datos en display_name, estos se conservarán en name después del renombrado
-- Si necesitas migrar datos de otras fuentes, puedes hacerlo manualmente después de ejecutar este script
