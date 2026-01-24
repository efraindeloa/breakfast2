-- ==================== MIGRACIÓN DE PRODUCTOS EXISTENTES A TRADUCCIONES ====================
-- Este script migra los nombres y descripciones existentes de productos a la tabla de traducciones
-- Asume que los datos actuales están en español

-- Insertar traducciones en español para todos los productos existentes
INSERT INTO product_translations (product_id, language_code, name, description)
SELECT 
  id,
  'es' as language_code,
  name,
  COALESCE(description, '') as description
FROM products
WHERE is_active = true
ON CONFLICT (product_id, language_code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Verificar que se insertaron las traducciones
SELECT 
  COUNT(*) as total_products,
  COUNT(DISTINCT pt.product_id) as products_with_translations
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id AND pt.language_code = 'es'
WHERE p.is_active = true;
