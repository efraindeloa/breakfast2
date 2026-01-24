-- ==================== CORREGIR TODOS LOS POSTRES ====================
-- Este script corrige TODOS los postres que están mal categorizados como "Bebidas"
-- y les asigna la categoría correcta "Postres" y sus imágenes correspondientes

-- ==================== PASO 1: CORREGIR CATEGORÍAS DE POSTRES ====================

-- Primero, identificar todos los postres que están mal categorizados
-- y moverlos a la categoría correcta "Postres"

UPDATE products
SET category = 'Postres'
WHERE name IN (
  'Tarta de Chocolate',
  'Flan de Vainilla',
  'Volcán',
  'Cheesecake Vasco',
  'Pan de Elote',
  'Cheesecake Lotus',
  'Pastel 3 Leches',
  'Red Velvet'
);

-- También corregir cualquier producto que tenga "postre", "tarta", "flan", "cheesecake", "pastel", "volcán" en el nombre
-- pero que esté en una categoría incorrecta
UPDATE products
SET category = 'Postres'
WHERE (
  LOWER(name) LIKE '%tarta%' OR
  LOWER(name) LIKE '%flan%' OR
  LOWER(name) LIKE '%cheesecake%' OR
  LOWER(name) LIKE '%pastel%' OR
  LOWER(name) LIKE '%volcán%' OR
  LOWER(name) LIKE '%volcan%' OR
  LOWER(name) LIKE '%red velvet%' OR
  LOWER(name) LIKE '%pan de elote%'
)
AND category != 'Postres';

-- ==================== PASO 2: ASEGURAR QUE SOLO BEBIDAS ESTÉN EN BEBIDAS ====================

-- Corregir categoría de bebidas (asegurar que solo bebidas estén aquí)
UPDATE products
SET category = 'Bebidas'
WHERE name IN (
  'Café Espresso',
  'Jugo de Naranja Natural',
  'Americano',
  'Espresso',
  'Capuchino',
  'Frapuccino',
  'Té'
)
AND category != 'Bebidas';

-- ==================== PASO 3: CORREGIR IMÁGENES DE POSTRES ====================

-- Asignar las imágenes correctas a cada postre
UPDATE products
SET image_url = 'products/tarta-chocolate.jpg'
WHERE name = 'Tarta de Chocolate';

UPDATE products
SET image_url = 'products/flan-vainilla.jpg'
WHERE name = 'Flan de Vainilla';

UPDATE products
SET image_url = 'products/volcan.jpg'
WHERE name = 'Volcán';

UPDATE products
SET image_url = 'products/cheesecake-vasco.jpg'
WHERE name = 'Cheesecake Vasco';

UPDATE products
SET image_url = 'products/pan-elote.jpeg'
WHERE name = 'Pan de Elote';

UPDATE products
SET image_url = 'products/cheesecake-lotus.png'
WHERE name = 'Cheesecake Lotus';

UPDATE products
SET image_url = 'products/pastel-3leches.jpg'
WHERE name = 'Pastel 3 Leches';

UPDATE products
SET image_url = 'products/red-velvet.jpg'
WHERE name = 'Red Velvet';

-- ==================== PASO 4: VERIFICACIÓN COMPLETA ====================

-- Ver TODOS los productos por categoría
SELECT 
  category,
  COUNT(*) as cantidad,
  STRING_AGG(name, ', ' ORDER BY name) as productos
FROM products
GROUP BY category
ORDER BY category;

-- Ver específicamente los postres
SELECT 
  id,
  name,
  category,
  image_url,
  CASE 
    WHEN category = 'Postres' THEN '✅ Categoría correcta'
    ELSE '❌ Categoría incorrecta: ' || category
  END as estado_categoria,
  CASE 
    WHEN image_url LIKE '%tarta%' OR image_url LIKE '%flan%' OR image_url LIKE '%cheesecake%' OR image_url LIKE '%pastel%' OR image_url LIKE '%volcan%' OR image_url LIKE '%red-velvet%' OR image_url LIKE '%pan-elote%' THEN '✅ Imagen correcta'
    WHEN image_url LIKE '%cafe%' OR image_url LIKE '%jugo%' OR image_url LIKE '%te%' OR image_url LIKE '%frappuccino%' OR image_url LIKE '%capuchino%' THEN '❌ Imagen de bebida (incorrecta)'
    ELSE '⚠️ Verificar imagen'
  END as estado_imagen
FROM products
WHERE name IN (
  'Tarta de Chocolate',
  'Flan de Vainilla',
  'Volcán',
  'Cheesecake Vasco',
  'Pan de Elote',
  'Cheesecake Lotus',
  'Pastel 3 Leches',
  'Red Velvet'
)
ORDER BY name;

-- Ver productos que deberían ser postres pero están en otra categoría
SELECT 
  id,
  name,
  category,
  image_url,
  '❌ DEBE SER POSTRE' as problema
FROM products
WHERE name IN (
  'Tarta de Chocolate',
  'Flan de Vainilla',
  'Volcán',
  'Cheesecake Vasco',
  'Pan de Elote',
  'Cheesecake Lotus',
  'Pastel 3 Leches',
  'Red Velvet'
)
AND category != 'Postres'
ORDER BY name;

-- Ver productos que están en "Postres" pero NO deberían estar
SELECT 
  id,
  name,
  category,
  image_url,
  '❌ NO DEBE SER POSTRE' as problema
FROM products
WHERE category = 'Postres'
AND name NOT IN (
  'Tarta de Chocolate',
  'Flan de Vainilla',
  'Volcán',
  'Cheesecake Vasco',
  'Pan de Elote',
  'Cheesecake Lotus',
  'Pastel 3 Leches',
  'Red Velvet'
)
ORDER BY name;

-- Ver productos que están en "Bebidas" para verificar que solo hay bebidas
SELECT 
  id,
  name,
  category,
  image_url
FROM products
WHERE category = 'Bebidas'
ORDER BY name;
