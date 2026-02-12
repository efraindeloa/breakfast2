-- ==================== UNIFICAR image_url E image_urls ====================
-- Esta migración unifica las columnas image_url e image_urls en una sola columna image_urls
-- Migra los datos de image_url a image_urls si es necesario y luego elimina image_url

-- Paso 1: Migrar datos de image_url a image_urls
-- Si un producto tiene image_url pero image_urls está vacío o NULL, mover image_url a image_urls[0]
UPDATE public.products
SET image_urls = ARRAY[image_url]::text[]
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND (image_urls IS NULL OR array_length(image_urls, 1) IS NULL OR array_length(image_urls, 1) = 0);

-- Paso 2: Si un producto tiene ambos (image_url e image_urls con contenido),
-- asegurar que image_url esté en image_urls[0] si no está ya presente
UPDATE public.products
SET image_urls = ARRAY[image_url]::text[] || image_urls
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND image_urls IS NOT NULL
  AND array_length(image_urls, 1) > 0
  AND (image_urls[1] IS NULL OR image_urls[1] != image_url);

-- Paso 3: Eliminar la columna image_url
ALTER TABLE public.products
DROP COLUMN IF EXISTS image_url;

-- Paso 4: Verificar que la columna fue eliminada
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'products' 
    AND column_name = 'image_url'
  ) THEN
    RAISE EXCEPTION 'La columna image_url aún existe';
  END IF;
  
  RAISE NOTICE 'Migración completada: image_url eliminada, datos migrados a image_urls';
END $$;
