-- Agregar columna image_urls a la tabla products para soportar múltiples imágenes
ALTER TABLE public.products 
ADD COLUMN image_urls text[] null;

-- Crear índice para búsquedas por image_urls (opcional pero recomendado)
CREATE INDEX IF NOT EXISTS idx_products_image_urls ON public.products USING GIN (image_urls);
