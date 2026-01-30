-- ==================== AGREGAR SOPORTE PARA MÚLTIPLES IMÁGENES A PRODUCTOS ====================
-- Agrega un campo TEXT[] para almacenar múltiples URLs de imágenes

-- Agregar columna image_urls si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE products ADD COLUMN image_urls TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN products.image_urls IS 'Array de URLs de imágenes del producto. La primera imagen también se guarda en image_url para compatibilidad.';
  END IF;
END $$;
