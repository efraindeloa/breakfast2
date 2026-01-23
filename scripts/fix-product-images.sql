-- ==================== CORREGIR IMÁGENES DE PRODUCTOS ====================
-- Este script actualiza las imágenes basándose en el NOMBRE del producto
-- para asegurar que cada producto tenga la imagen correcta

-- Mapeo de nombres de productos a rutas en Supabase Storage
UPDATE products
SET image_url = 'products/cafe-expresso-nespresso.webp'
WHERE name = 'Café Espresso';

UPDATE products
SET image_url = 'products/jugo-naranja.avif'
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

-- POSTRES
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

-- Verificar actualizaciones
SELECT 
  id,
  name,
  image_url,
  category
FROM products
WHERE image_url LIKE 'products/%' OR image_url LIKE '/%'
ORDER BY category, name;
