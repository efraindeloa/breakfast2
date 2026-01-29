-- ==================== AGREGAR CAMPO DE COMPLEMENTOS A PRODUCTOS ====================
-- Agrega un campo JSONB para almacenar los complementos de cada producto
-- y un campo booleano para permitir complementos personalizados

-- Agregar columna complements si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'complements'
  ) THEN
    ALTER TABLE products ADD COLUMN complements JSONB DEFAULT '[]'::jsonb;
    COMMENT ON COLUMN products.complements IS 'Array de complementos disponibles para el producto. Formato: [{"id": "string", "name": "string", "price": number}]';
  END IF;
END $$;

-- Agregar columna allow_custom_complements si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'allow_custom_complements'
  ) THEN
    ALTER TABLE products ADD COLUMN allow_custom_complements BOOLEAN DEFAULT false;
    COMMENT ON COLUMN products.allow_custom_complements IS 'Indica si el comensal puede agregar complementos no listados en la lista de complementos';
  END IF;
END $$;

-- Agregar columna allow_special_instructions si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'allow_special_instructions'
  ) THEN
    ALTER TABLE products ADD COLUMN allow_special_instructions BOOLEAN DEFAULT true;
    COMMENT ON COLUMN products.allow_special_instructions IS 'Indica si el comensal puede agregar instrucciones especiales al producto';
  END IF;
END $$;
