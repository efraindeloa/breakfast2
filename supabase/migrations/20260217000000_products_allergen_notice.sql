-- Columna para que el restaurante pueda agregar avisos (ej. alérgenos) por producto
ALTER TABLE products
ADD COLUMN IF NOT EXISTS allergen_notice TEXT;

COMMENT ON COLUMN products.allergen_notice IS 'Aviso opcional por producto (ej. alérgenos). Se muestra en el detalle del producto al comensal.';
