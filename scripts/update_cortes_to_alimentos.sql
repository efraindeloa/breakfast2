-- ==================== ACTUALIZAR PRODUCTOS "Cortes" A "Alimentos" ====================
-- Esta query actualiza los productos que tienen "Cortes" como categoría:
-- 1. Cambia la categoría de "Cortes" a "Alimentos"
-- 2. Agrega "Cortes" a la lista de subcategorías (subcategories array)

-- Paso 1: Actualizar productos con categoría "Cortes"
UPDATE public.products
SET 
  category = 'Alimentos',
  subcategories = CASE
    -- Si subcategories es NULL o vacío, crear un array con "Cortes"
    WHEN subcategories IS NULL OR array_length(subcategories, 1) IS NULL THEN
      ARRAY['Cortes']::TEXT[]
    -- Si "Cortes" ya existe en el array, no duplicar
    WHEN 'Cortes' = ANY(subcategories) THEN
      subcategories
    -- Si no existe "Cortes", agregarlo al principio del array
    ELSE
      ARRAY['Cortes']::TEXT[] || subcategories
  END
WHERE 
  category = 'Cortes';

-- Paso 2: Verificar los cambios
SELECT 
  id,
  name,
  category,
  subcategories,
  array_length(subcategories, 1) as subcategories_count
FROM public.products
WHERE category = 'Alimentos'
  AND 'Cortes' = ANY(subcategories)
ORDER BY id;

-- Paso 3: Mostrar estadísticas
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN 'Cortes' = ANY(subcategories) THEN 1 END) as with_cortes_subcategory
FROM public.products
WHERE category = 'Alimentos';
