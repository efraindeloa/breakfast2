-- Agregar columna subcategory a la tabla products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS subcategory TEXT NULL;

-- Crear índice para búsquedas por subcategoría
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON public.products (subcategory);
