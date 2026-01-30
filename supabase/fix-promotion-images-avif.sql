-- Actualizar bucket promotion-images para permitir archivos AVIF
-- Primero intentar actualizar si existe
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
WHERE id = 'promotion-images';

-- Si el bucket no existe, crearlo con AVIF incluido
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotion-images',
  'promotion-images',
  true,
  5242880, -- 5MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- Verificar que se actualizó correctamente
DO $$
DECLARE
  bucket_exists BOOLEAN;
  has_avif BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'promotion-images') INTO bucket_exists;
  
  IF bucket_exists THEN
    SELECT 'image/avif' = ANY(allowed_mime_types) INTO has_avif
    FROM storage.buckets
    WHERE id = 'promotion-images';
    
    IF NOT has_avif THEN
      RAISE EXCEPTION 'El bucket promotion-images existe pero no tiene image/avif en allowed_mime_types';
    END IF;
  ELSE
    RAISE EXCEPTION 'El bucket promotion-images no existe después de intentar crearlo';
  END IF;
END $$;
