-- ==================== LIMPIAR COLUMNA BADGES ====================
-- Este script borra todo el contenido de la columna badges en la tabla products
-- 
-- OPCIÓN 1: Establecer badges como array vacío (recomendado)
-- Esto mantiene el tipo de dato como array pero sin elementos
UPDATE public.products
SET badges = ARRAY[]::text[]
WHERE badges IS NOT NULL;

-- OPCIÓN 2: Establecer badges como NULL
-- UPDATE public.products
-- SET badges = NULL
-- WHERE badges IS NOT NULL;

-- ==================== VERIFICAR RESULTADOS ====================
-- Ver cuántos productos tenían badges antes de limpiar
-- (Ejecutar ANTES del UPDATE para tener referencia)

-- SELECT 
--   COUNT(*) as total_productos,
--   COUNT(badges) FILTER (WHERE badges IS NOT NULL AND array_length(badges, 1) > 0) as productos_con_badges,
--   COUNT(badges) FILTER (WHERE badges IS NULL OR array_length(badges, 1) = 0) as productos_sin_badges
-- FROM public.products;

-- Ver algunos productos después del UPDATE para verificar
SELECT 
  id,
  name,
  category,
  badges,
  array_length(badges, 1) as badges_count
FROM public.products
ORDER BY id
LIMIT 20;

-- Verificar que todos los badges estén vacíos
SELECT 
  COUNT(*) as total_productos,
  COUNT(*) FILTER (WHERE badges IS NULL OR array_length(badges, 1) = 0) as productos_sin_badges,
  COUNT(*) FILTER (WHERE badges IS NOT NULL AND array_length(badges, 1) > 0) as productos_con_badges
FROM public.products;
