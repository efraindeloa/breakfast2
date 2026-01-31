-- ==================== VERIFICAR ESTRUCTURA DE TABLA user_profiles ====================
-- Este script muestra la estructura real de la tabla user_profiles en la base de datos

-- 1. Mostrar todas las columnas de la tabla con sus tipos de datos
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'user_profiles'
ORDER BY 
    ordinal_position;

-- 2. Mostrar la clave primaria
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
WHERE
    tc.table_schema = 'public'
    AND tc.table_name = 'user_profiles'
    AND tc.constraint_type = 'PRIMARY KEY';

-- 3. Mostrar todas las restricciones (foreign keys, unique, etc.)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE
    tc.table_schema = 'public'
    AND tc.table_name = 'user_profiles'
ORDER BY
    tc.constraint_type, tc.constraint_name;

-- 4. Mostrar índices
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = 'user_profiles';

-- 5. Mostrar políticas RLS actuales
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

-- 6. Verificar estado de RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'user_profiles';

-- 7. Mostrar un registro de ejemplo (si existe)
SELECT * 
FROM user_profiles 
LIMIT 1;
