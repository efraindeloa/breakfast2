-- ==================== MIGRAR BADGES A SUBCATEGORY ====================
-- Este script mueve el contenido de la columna badges (array) a subcategory (texto)
-- 
-- Estrategia: Tomar el primer elemento del array badges como subcategory
-- Solo actualiza productos donde subcategory esté vacío o NULL

-- Opción 1: Usar el primer elemento del array badges
UPDATE public.products
SET subcategory = badges[1]
WHERE 
  badges IS NOT NULL 
  AND array_length(badges, 1) > 0 
  AND (subcategory IS NULL OR subcategory = '');

-- Opción 2: Si quieres concatenar todos los elementos del array con un separador
-- UPDATE public.products
-- SET subcategory = array_to_string(badges, ', ')
-- WHERE 
--   badges IS NOT NULL 
--   AND array_length(badges, 1) > 0 
--   AND (subcategory IS NULL OR subcategory = '');

-- Opción 3: Si quieres tomar el primer elemento que no sea una categoría principal
-- (útil si badges contiene tanto categorías como subcategorías)
-- UPDATE public.products
-- SET subcategory = (
--   SELECT badge 
--   FROM unnest(badges) AS badge 
--   WHERE badge NOT IN ('Alimentos', 'Bebidas', 'Postres', 'Vinos y Licores')
--   LIMIT 1
-- )
-- WHERE 
--   badges IS NOT NULL 
--   AND array_length(badges, 1) > 0 
--   AND (subcategory IS NULL OR subcategory = '');

-- Verificar resultados
SELECT 
  id,
  name,
  category,
  badges,
  subcategory
FROM public.products
WHERE badges IS NOT NULL
ORDER BY id
LIMIT 20;
