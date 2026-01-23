-- ==================== ACTUALIZAR POLÍTICAS DE STORAGE ====================
-- Este script actualiza las políticas RLS de Storage para permitir subidas anónimas
-- (Útil para desarrollo y scripts de migración)

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Restaurants can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurants can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurants can delete their product images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurants can upload restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurants can update their restaurant images" ON storage.objects;
DROP POLICY IF EXISTS "Restaurants can delete their restaurant images" ON storage.objects;

-- Crear políticas permisivas para desarrollo
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can update restaurant images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images');

-- Actualizar bucket para permitir AVIF
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
WHERE id = 'product-images';
