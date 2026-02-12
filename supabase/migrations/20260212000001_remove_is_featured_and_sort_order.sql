-- ==================== ELIMINAR COLUMNAS is_featured Y sort_order ====================
-- Esta migración elimina las columnas is_featured y sort_order de la tabla products
-- ya que no se utilizan en la aplicación.

-- Eliminar columna is_featured
ALTER TABLE public.products
DROP COLUMN IF EXISTS is_featured;

-- Eliminar columna sort_order
ALTER TABLE public.products
DROP COLUMN IF EXISTS sort_order;

-- Verificar que las columnas fueron eliminadas
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'is_featured'
  ) THEN
    RAISE EXCEPTION 'La columna is_featured aún existe';
  END IF;
  
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'sort_order'
  ) THEN
    RAISE EXCEPTION 'La columna sort_order aún existe';
  END IF;
  
  RAISE NOTICE 'Columnas is_featured y sort_order eliminadas exitosamente';
END $$;
