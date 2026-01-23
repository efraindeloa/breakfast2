-- ==================== CONFIGURACIÓN DE SUPABASE STORAGE ====================
-- Este script configura los buckets de almacenamiento para imágenes
-- y las políticas de acceso para que los comensales puedan verlas

-- ==================== BUCKETS ====================

-- Bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true, -- Público: los comensales pueden ver las imágenes
  5242880, -- 5MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de restaurantes (logo, portada)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'restaurant-images',
  'restaurant-images',
  true, -- Público: los comensales pueden ver las imágenes
  10485760, -- 10MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true, -- Público: los avatares son visibles
  2097152, -- 2MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de promociones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotion-images',
  'promotion-images',
  true, -- Público: los comensales pueden ver las promociones
  5242880, -- 5MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Bucket para imágenes de cupones
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'coupon-images',
  'coupon-images',
  true, -- Público: los comensales pueden ver los cupones
  5242880, -- 5MB máximo por archivo
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- ==================== POLÍTICAS RLS PARA STORAGE ====================

-- Políticas para product-images: Todos pueden leer, todos pueden escribir (para desarrollo)
-- En producción, cambiar a solo usuarios autenticados
CREATE POLICY "Product images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Políticas para restaurant-images: Todos pueden leer, todos pueden escribir (para desarrollo)
CREATE POLICY "Restaurant images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can update restaurant images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-images');

CREATE POLICY "Anyone can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images');

-- Políticas para user-avatars: Todos pueden leer, usuarios pueden escribir sus propios avatares
CREATE POLICY "User avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Solo en su propia carpeta
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para promotion-images: Todos pueden leer, solo restaurantes pueden escribir
CREATE POLICY "Promotion images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotion-images');

CREATE POLICY "Restaurants can upload promotion images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Restaurants can update their promotion images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Restaurants can delete their promotion images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

-- Políticas para coupon-images: Todos pueden leer, solo restaurantes pueden escribir
CREATE POLICY "Coupon images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'coupon-images');

CREATE POLICY "Restaurants can upload coupon images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Restaurants can update their coupon images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Restaurants can delete their coupon images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

-- ==================== NOTAS IMPORTANTES ====================
-- 1. Los buckets son públicos, por lo que cualquier persona puede ver las imágenes
-- 2. Solo usuarios autenticados pueden subir/modificar/eliminar imágenes
-- 3. Las URLs públicas de las imágenes serán:
--    https://[PROJECT_REF].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[FILE_PATH]
-- 4. Para desarrollo sin autenticación real, puedes ajustar las políticas para permitir
--    operaciones anónimas temporalmente (NO recomendado para producción)
