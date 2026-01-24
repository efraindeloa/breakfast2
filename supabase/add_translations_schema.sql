-- ==================== SISTEMA DE TRADUCCIONES PARA PRODUCTOS ====================
-- Este script agrega soporte multiidioma escalable para productos
-- Permite agregar nuevos idiomas sin modificar el esquema

-- Tabla de traducciones de productos
DROP TABLE IF EXISTS product_translations CASCADE;
CREATE TABLE product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('es', 'en', 'pt', 'fr')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_translations_unique UNIQUE (product_id, language_code)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_product_translations_product_id ON product_translations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_translations_language ON product_translations(language_code);
CREATE INDEX IF NOT EXISTS idx_product_translations_composite ON product_translations(product_id, language_code);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_product_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_translations_updated_at
  BEFORE UPDATE ON product_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_product_translations_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE product_translations ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer traducciones
CREATE POLICY "Anyone can view product translations"
  ON product_translations FOR SELECT
  USING (true);

-- Política: Solo administradores pueden insertar/actualizar (por ahora permitimos todo para desarrollo)
CREATE POLICY "Anyone can manage product translations"
  ON product_translations FOR ALL
  USING (true)
  WITH CHECK (true);

-- Función helper para obtener traducción con fallback
-- Si no existe traducción en el idioma solicitado, devuelve la traducción en español
CREATE OR REPLACE FUNCTION get_product_translation(
  p_product_id INTEGER,
  p_language_code TEXT
)
RETURNS TABLE (
  name TEXT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(
      (SELECT pt.name FROM product_translations pt 
       WHERE pt.product_id = p_product_id AND pt.language_code = p_language_code),
      (SELECT pt.name FROM product_translations pt 
       WHERE pt.product_id = p_product_id AND pt.language_code = 'es'),
      (SELECT p.name FROM products p WHERE p.id = p_product_id)
    ) AS name,
    COALESCE(
      (SELECT pt.description FROM product_translations pt 
       WHERE pt.product_id = p_product_id AND pt.language_code = p_language_code),
      (SELECT pt.description FROM product_translations pt 
       WHERE pt.product_id = p_product_id AND pt.language_code = 'es'),
      (SELECT p.description FROM products p WHERE p.id = p_product_id)
    ) AS description;
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentación
COMMENT ON TABLE product_translations IS 'Almacena traducciones de nombres y descripciones de productos en múltiples idiomas';
COMMENT ON COLUMN product_translations.language_code IS 'Código ISO 639-1 del idioma: es, en, pt, fr';
COMMENT ON FUNCTION get_product_translation IS 'Obtiene la traducción de un producto en el idioma especificado, con fallback a español y luego al nombre original';
