-- ==================== ACTUALIZAR CATEGORÍAS DE LICORES A "Licores" ====================
-- Esta query actualiza los productos que tienen categorías de licores:
-- 1. Cambia la categoría a "Licores"
-- 2. Mueve el valor anterior de la categoría a la lista de subcategorías (subcategories array)
--
-- Categorías afectadas: Brandy, Cognac, Ginebra, Mezcal, Ron, Tequila, Vodka, Whisky

-- Paso 1: Actualizar productos con categorías de licores
-- Convierte arrays de subcategorías en estructura jerárquica (usando " > " como separador)
-- El primer valor es la subcategoría principal, el segundo es subcategoría del primero, etc.
UPDATE public.products
SET 
  category = 'Licores',
  subcategories = CASE
    -- Si subcategories es NULL o vacío, crear un array con solo la categoría anterior
    WHEN subcategories IS NULL OR array_length(subcategories, 1) IS NULL THEN
      ARRAY[category]::TEXT[]
    -- Si tiene un solo elemento
    WHEN array_length(subcategories, 1) = 1 THEN
      CASE
        -- Si la categoría anterior ya es el único elemento, mantenerlo
        WHEN category = subcategories[1] THEN
          subcategories
        -- Si no, crear jerarquía: categoría anterior > elemento existente
        ELSE
          ARRAY[category || ' > ' || subcategories[1]]::TEXT[]
      END
    -- Si tiene 2 o más elementos, crear estructura jerárquica
    WHEN array_length(subcategories, 1) >= 2 THEN
      CASE
        -- Si el primer elemento ya es la categoría anterior, no duplicar
        WHEN category = subcategories[1] THEN
          -- Construir jerarquía con los elementos existentes: "elem1 > elem2 > elem3 > ..."
          ARRAY[array_to_string(subcategories, ' > ')]::TEXT[]
        -- Si no, agregar la categoría anterior al principio
        ELSE
          -- Construir: "categoría_anterior > elem1 > elem2 > elem3 > ..."
          ARRAY[category || ' > ' || array_to_string(subcategories, ' > ')]::TEXT[]
      END
    ELSE
      subcategories
  END
WHERE 
  category IN ('Brandy', 'Cognac', 'Ginebra', 'Mezcal', 'Ron', 'Tequila', 'Vodka', 'Whisky');

-- Paso 2: Verificar los cambios por cada tipo de licor
SELECT 
  subcategories[1] as liquor_type,
  COUNT(*) as product_count
FROM public.products
WHERE category = 'Licores'
  AND subcategories IS NOT NULL
  AND array_length(subcategories, 1) > 0
GROUP BY subcategories[1]
ORDER BY subcategories[1];

-- Paso 3: Mostrar algunos ejemplos de productos actualizados
SELECT 
  id,
  name,
  category,
  subcategories,
  array_length(subcategories, 1) as subcategories_count
FROM public.products
WHERE category = 'Licores'
ORDER BY subcategories[1], name
LIMIT 20;

-- Paso 4: Mostrar estadísticas generales
SELECT 
  COUNT(*) as total_updated,
  COUNT(DISTINCT subcategories[1]) as distinct_liquor_types
FROM public.products
WHERE category = 'Licores';

-- Paso 5: Verificar que no queden productos con las categorías antiguas
SELECT 
  category,
  COUNT(*) as remaining_count
FROM public.products
WHERE category IN ('Brandy', 'Cognac', 'Ginebra', 'Mezcal', 'Ron', 'Tequila', 'Vodka', 'Whisky')
GROUP BY category
ORDER BY category;
