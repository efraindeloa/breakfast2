-- ==================== ACTUALIZAR CATEGORY POR SUBCATEGORY ====================
-- Este script actualiza la columna category basándose en un valor de subcategory
-- 
-- INSTRUCCIONES:
-- 1. Reemplaza 'VALOR_SUBCATEGORIA' con el valor de subcategory que quieres buscar
-- 2. Reemplaza 'NUEVA_CATEGORIA' con el valor de category que quieres asignar
-- 3. Ejecuta la query

-- Ejemplo 1: Actualizar todos los productos con subcategory = 'Aguachiles' a category = 'Alimentos'
UPDATE public.products
SET category = 'Alimentos'
WHERE subcategory = 'Aguachiles';

-- Ejemplo 2: Actualizar todos los productos con subcategory = 'Camarones' a category = 'Alimentos'
-- UPDATE public.products
-- SET category = 'Alimentos'
-- WHERE subcategory = 'Camarones';

-- Ejemplo 3: Actualizar múltiples subcategorías a la misma categoría
-- UPDATE public.products
-- SET category = 'Alimentos'
-- WHERE subcategory IN ('Aguachiles', 'Camarones', 'Pescados', 'Tostadas', 'Tacos');

-- Ejemplo 4: Actualizar usando ILIKE para búsqueda case-insensitive
-- UPDATE public.products
-- SET category = 'Alimentos'
-- WHERE subcategory ILIKE '%aguachiles%';

-- ==================== QUERY PERSONALIZABLE ====================
-- Usa esta query y reemplaza los valores según necesites:

-- UPDATE public.products
-- SET category = 'NUEVA_CATEGORIA'  -- Reemplaza con el valor deseado (ej: 'Alimentos', 'Bebidas', etc.)
-- WHERE subcategory = 'VALOR_SUBCATEGORIA';  -- Reemplaza con el valor a buscar (ej: 'Aguachiles', 'Camarones', etc.)

-- ==================== VERIFICAR RESULTADOS ====================
-- Ejecuta esta query después del UPDATE para verificar los cambios:

SELECT 
  id,
  name,
  category,
  subcategory
FROM public.products
WHERE subcategory = 'VALOR_SUBCATEGORIA'  -- Reemplaza con el valor que buscaste
ORDER BY id;

-- ==================== ESTADÍSTICAS ====================
-- Ver cuántos productos se actualizaron por subcategoría:

SELECT 
  subcategory,
  category,
  COUNT(*) as cantidad
FROM public.products
WHERE subcategory IS NOT NULL
GROUP BY subcategory, category
ORDER BY subcategory, category;
