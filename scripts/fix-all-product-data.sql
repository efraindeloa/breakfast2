-- ==================== CORREGIR TODOS LOS DATOS DE PRODUCTOS ====================
-- Este script corrige categorías E imágenes basándose en el NOMBRE del producto
-- Ejecuta este script para corregir todos los problemas de una vez

-- ==================== PASO 1: CORREGIR CATEGORÍAS ====================

-- ENTRADAS
UPDATE products
SET category = 'Entradas'
WHERE name IN (
  'Tacos de Atún Marinado',
  'Ceviche de Maracuyá',
  'Carpaccio de Res',
  'Ensalada Mediterránea'
);

-- PLATOS FUERTES
UPDATE products
SET category = 'Platos Fuertes'
WHERE name IN (
  'Rib Eye a la Leña',
  'Pollo al Limón & Hierbas',
  'Quinoa & Aguacate Bowl',
  'Pasta al Pomodoro'
);

-- BEBIDAS (asegurar que solo bebidas estén aquí, NO postres)
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
AND category != 'Bebidas'
-- Asegurar que no movamos postres a bebidas
AND name NOT IN (
  'Tarta de Chocolate',
  'Flan de Vainilla',
  'Volcán',
  'Cheesecake Vasco',
  'Pan de Elote',
  'Cheesecake Lotus',
  'Pastel 3 Leches',
  'Red Velvet'
);

-- POSTRES (CORREGIR: TODOS los postres deben estar aquí, no en Bebidas)
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

-- También corregir cualquier producto que tenga palabras clave de postres pero esté mal categorizado
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

-- COCTELERÍA
UPDATE products
SET category = 'Coctelería'
WHERE name IN (
  'Mojito Clásico',
  'Margarita Premium',
  'Carajillo',
  'Coketillo',
  'Carajilla',
  'Licor 43',
  'Baileys',
  'Frangelico',
  'Sambuca',
  'Chinchón Seco',
  'Chinchón Dulce'
);

-- ==================== PASO 2: CORREGIR IMÁGENES ====================

-- BEBIDAS
UPDATE products
SET image_url = 'products/cafe-expresso-nespresso.webp'
WHERE name = 'Café Espresso';

UPDATE products
SET image_url = 'products/jugo-naranja.jpg'
WHERE name = 'Jugo de Naranja Natural';

UPDATE products
SET image_url = 'products/cafe-americano-nespresso.webp'
WHERE name = 'Americano';

UPDATE products
SET image_url = 'products/cafe-expresso-nespresso.webp'
WHERE name = 'Espresso';

UPDATE products
SET image_url = 'products/capuchino-nespresso.webp'
WHERE name = 'Capuchino';

UPDATE products
SET image_url = 'products/frappuccino.jpg'
WHERE name = 'Frapuccino';

UPDATE products
SET image_url = 'products/te.webp'
WHERE name = 'Té';

-- POSTRES (CORREGIR: Tarta de Chocolate y Flan de Vainilla deben tener imágenes de postres)
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

-- COCTELERÍA
UPDATE products
SET image_url = 'products/carajillo-solo.webp'
WHERE name = 'Carajillo';

UPDATE products
SET image_url = 'products/coketillo-donk.jpg'
WHERE name = 'Coketillo';

UPDATE products
SET image_url = 'products/carajilla.jpg'
WHERE name = 'Carajilla';

UPDATE products
SET image_url = 'products/licor43.webp'
WHERE name = 'Licor 43';

UPDATE products
SET image_url = 'products/baileys.webp'
WHERE name = 'Baileys';

UPDATE products
SET image_url = 'products/frangelico.webp'
WHERE name = 'Frangelico';

UPDATE products
SET image_url = 'products/sambuca.webp'
WHERE name = 'Sambuca';

UPDATE products
SET image_url = 'products/chincho-seco.avif'
WHERE name = 'Chinchón Seco';

UPDATE products
SET image_url = 'products/chinchon-dulce.jpg'
WHERE name = 'Chinchón Dulce';

-- ==================== PASO 3: VERIFICAR RESULTADOS ====================

-- Ver todos los productos con sus categorías e imágenes
SELECT 
  id,
  name,
  category,
  image_url,
  CASE 
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla') AND category = 'Postres' THEN '✅ OK'
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla') AND category != 'Postres' THEN '❌ Categoría incorrecta'
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla') AND image_url LIKE '%cafe%' THEN '❌ Imagen incorrecta'
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla') AND image_url LIKE '%tarta%' OR image_url LIKE '%flan%' THEN '✅ OK'
    ELSE '✅ OK'
  END as estado
FROM products
WHERE name IN ('Tarta de Chocolate', 'Flan de Vainilla')
ORDER BY name;

-- Mostrar todos los productos por categoría
SELECT 
  category,
  COUNT(*) as cantidad,
  STRING_AGG(name, ', ' ORDER BY name) as productos
FROM products
GROUP BY category
ORDER BY category;

-- Mostrar productos problemáticos (postres en categoría incorrecta)
SELECT 
  id,
  name,
  category,
  image_url,
  '❌ DEBE SER POSTRE' as problema
FROM products
WHERE name IN ('Tarta de Chocolate', 'Flan de Vainilla', 'Volcán', 'Cheesecake Vasco', 'Pan de Elote', 'Cheesecake Lotus', 'Pastel 3 Leches', 'Red Velvet')
  AND category != 'Postres'
ORDER BY name;

-- Ver TODOS los productos en la categoría "Postres" para verificar
SELECT 
  id,
  name,
  category,
  image_url
FROM products
WHERE category = 'Postres'
ORDER BY name;

-- Ver TODOS los productos en la categoría "Bebidas" para verificar que no hay postres
SELECT 
  id,
  name,
  category,
  image_url,
  CASE 
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla', 'Volcán', 'Cheesecake Vasco', 'Pan de Elote', 'Cheesecake Lotus', 'Pastel 3 Leches', 'Red Velvet') 
    THEN '❌ ESTE ES UN POSTRE, NO UNA BEBIDA'
    ELSE '✅ OK'
  END as estado
FROM products
WHERE category = 'Bebidas'
ORDER BY name;
