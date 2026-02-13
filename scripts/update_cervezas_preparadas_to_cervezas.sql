-- ==================== ACTUALIZAR PRODUCTOS "Cervezas Preparadas" A "Cervezas" ====================
-- Esta query actualiza los productos que tienen "Cervezas Preparadas" como categoría:
-- 1. Cambia la categoría de "Cervezas Preparadas" a "Cervezas"
-- 2. Agrega "Cervezas Preparadas" a la lista de subcategorías (subcategories array)

-- Paso 1: Actualizar productos con categoría "Cervezas Preparadas"
UPDATE public.products
SET 
  category = 'Cervezas',
  subcategories = CASE
    -- Si subcategories es NULL o vacío, crear un array con "Cervezas Preparadas"
    WHEN subcategories IS NULL OR array_length(subcategories, 1) IS NULL THEN
      ARRAY['Cervezas Preparadas']::TEXT[]
    -- Si "Cervezas Preparadas" ya existe en el array, no duplicar
    WHEN 'Cervezas Preparadas' = ANY(subcategories) THEN
      subcategories
    -- Si no existe "Cervezas Preparadas", agregarlo al principio del array
    ELSE
      ARRAY['Cervezas Preparadas']::TEXT[] || subcategories
  END
WHERE 
  category = 'Cervezas Preparadas';

-- Paso 2: Verificar los cambios
SELECT 
  id,
  name,
  category,
  subcategories,
  array_length(subcategories, 1) as subcategories_count
FROM public.products
WHERE category = 'Cervezas'
  AND 'Cervezas Preparadas' = ANY(subcategories)
ORDER BY id;

-- Paso 3: Mostrar estadísticas
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN 'Cervezas Preparadas' = ANY(subcategories) THEN 1 END) as with_cervezas_preparadas_subcategory
FROM public.products
WHERE category = 'Cervezas';

-- Paso 4: Verificar que no queden productos con la categoría antigua
SELECT 
  COUNT(*) as remaining_old_category
FROM public.products
WHERE category = 'Cervezas Preparadas';
