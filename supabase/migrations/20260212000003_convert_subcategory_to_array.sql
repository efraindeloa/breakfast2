-- ==================== CONVERTIR subcategory A subcategories (ARRAY) ====================
-- Esta migración convierte la columna subcategory (TEXT) a subcategories (TEXT[])
-- para permitir múltiples subcategorías por producto

-- Paso 1: Agregar nueva columna subcategories como array
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS subcategories TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Paso 2: Migrar datos de subcategory a subcategories
-- Si un producto tiene subcategory, convertirla a array con un solo elemento
UPDATE public.products
SET subcategories = ARRAY[subcategory]::TEXT[]
WHERE subcategory IS NOT NULL 
  AND subcategory != ''
  AND (subcategories IS NULL OR array_length(subcategories, 1) IS NULL);

-- Paso 3: Eliminar la columna subcategory
ALTER TABLE public.products
DROP COLUMN IF EXISTS subcategory;

-- Paso 4: Crear índice para búsquedas eficientes
CREATE INDEX IF NOT EXISTS idx_products_subcategories ON public.products USING GIN (subcategories);

-- Paso 5: Verificar que la migración fue exitosa
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'subcategory'
  ) THEN
    RAISE EXCEPTION 'La columna subcategory aún existe';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'subcategories'
  ) THEN
    RAISE EXCEPTION 'La columna subcategories no existe';
  END IF;
  
  RAISE NOTICE 'Migración completada: subcategory convertida a subcategories (array)';
END $$;
