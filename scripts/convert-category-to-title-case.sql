-- ==================== CONVERTIR CATEGORY A TITLE CASE ====================
-- Este script convierte el contenido de la columna category a Title Case
-- (primera letra de cada palabra en mayúscula, resto en minúscula)

-- Opción 1: Usar initcap() de PostgreSQL (recomendado)
-- initcap() convierte a Title Case automáticamente
UPDATE public.products
SET category = initcap(category)
WHERE category IS NOT NULL 
  AND category != initcap(category);  -- Solo actualizar si hay cambios

-- Opción 2: Si necesitas más control (preservar ciertas palabras en mayúsculas)
-- Puedes usar una función personalizada o CASE statements
-- UPDATE public.products
-- SET category = CASE
--   WHEN category ILIKE 'alimentos' THEN 'Alimentos'
--   WHEN category ILIKE 'bebidas' THEN 'Bebidas'
--   WHEN category ILIKE 'postres' THEN 'Postres'
--   WHEN category ILIKE 'vinos y licores' THEN 'Vinos y Licores'
--   ELSE initcap(category)
-- END
-- WHERE category IS NOT NULL;

-- Verificar resultados
SELECT 
  id,
  name,
  category,
  subcategory
FROM public.products
WHERE category IS NOT NULL
ORDER BY category, id
LIMIT 30;

-- Ver estadísticas de categorías
SELECT 
  category,
  COUNT(*) as cantidad
FROM public.products
WHERE category IS NOT NULL
GROUP BY category
ORDER BY category;
