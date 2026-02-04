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

-- Bucket para documentos fiscales (PDFs de constancias)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'fiscal-documents',
  'fiscal-documents',
  false, -- Privado: solo el usuario puede ver sus documentos
  5242880, -- 5MB máximo por archivo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ==================== POLÍTICAS RLS PARA STORAGE ====================

-- Políticas para product-images: Todos pueden leer, todos pueden escribir (para desarrollo)
-- En producción, cambiar a solo usuarios autenticados
DROP POLICY IF EXISTS "Product images are publicly readable" ON storage.objects;
CREATE POLICY "Product images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can upload product images" ON storage.objects;
CREATE POLICY "Anyone can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can update product images" ON storage.objects;
CREATE POLICY "Anyone can update product images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Anyone can delete product images" ON storage.objects;
CREATE POLICY "Anyone can delete product images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-images');

-- Políticas para restaurant-images: Todos pueden leer, todos pueden escribir (para desarrollo)
DROP POLICY IF EXISTS "Restaurant images are publicly readable" ON storage.objects;
CREATE POLICY "Restaurant images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Anyone can upload restaurant images" ON storage.objects;
CREATE POLICY "Anyone can upload restaurant images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Anyone can update restaurant images" ON storage.objects;
CREATE POLICY "Anyone can update restaurant images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'restaurant-images');

DROP POLICY IF EXISTS "Anyone can delete restaurant images" ON storage.objects;
CREATE POLICY "Anyone can delete restaurant images"
ON storage.objects FOR DELETE
USING (bucket_id = 'restaurant-images');

-- Políticas para user-avatars: Todos pueden leer, usuarios pueden escribir sus propios avatares
DROP POLICY IF EXISTS "User avatars are publicly readable" ON storage.objects;
CREATE POLICY "User avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Solo en su propia carpeta
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'user-avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Políticas para promotion-images: Todos pueden leer, solo restaurantes pueden escribir
DROP POLICY IF EXISTS "Promotion images are publicly readable" ON storage.objects;
CREATE POLICY "Promotion images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'promotion-images');

DROP POLICY IF EXISTS "Restaurants can upload promotion images" ON storage.objects;
CREATE POLICY "Restaurants can upload promotion images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurants can update their promotion images" ON storage.objects;
CREATE POLICY "Restaurants can update their promotion images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurants can delete their promotion images" ON storage.objects;
CREATE POLICY "Restaurants can delete their promotion images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'promotion-images' AND
  auth.role() = 'authenticated'
);

-- Políticas para coupon-images: Todos pueden leer, solo restaurantes pueden escribir
DROP POLICY IF EXISTS "Coupon images are publicly readable" ON storage.objects;
CREATE POLICY "Coupon images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'coupon-images');

DROP POLICY IF EXISTS "Restaurants can upload coupon images" ON storage.objects;
CREATE POLICY "Restaurants can upload coupon images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurants can update their coupon images" ON storage.objects;
CREATE POLICY "Restaurants can update their coupon images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Restaurants can delete their coupon images" ON storage.objects;
CREATE POLICY "Restaurants can delete their coupon images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'coupon-images' AND
  auth.role() = 'authenticated'
);

-- Políticas para fiscal-documents: Solo el usuario puede leer/escribir sus propios documentos
DROP POLICY IF EXISTS "Users can view their own fiscal documents" ON storage.objects;
CREATE POLICY "Users can view their own fiscal documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'fiscal-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text -- Solo en su propia carpeta
);

DROP POLICY IF EXISTS "Users can upload their own fiscal documents" ON storage.objects;
CREATE POLICY "Users can upload their own fiscal documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'fiscal-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can update their own fiscal documents" ON storage.objects;
CREATE POLICY "Users can update their own fiscal documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'fiscal-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own fiscal documents" ON storage.objects;
CREATE POLICY "Users can delete their own fiscal documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'fiscal-documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==================== NOTAS IMPORTANTES ====================
-- 1. Los buckets son públicos, por lo que cualquier persona puede ver las imágenes
-- 2. Solo usuarios autenticados pueden subir/modificar/eliminar imágenes
-- 3. Las URLs públicas de las imágenes serán:
--    https://[PROJECT_REF].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[FILE_PATH]
-- 4. Para desarrollo sin autenticación real, puedes ajustar las políticas para permitir
--    operaciones anónimas temporalmente (NO recomendado para producción)
