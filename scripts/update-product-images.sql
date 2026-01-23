-- ==================== ACTUALIZAR REFERENCIAS DE IMÁGENES EN PRODUCTOS ====================
-- Este script actualiza las referencias de image_url en la tabla products
-- para que apunten a Supabase Storage en lugar de rutas locales

-- Obtener la URL base de Supabase Storage (reemplaza con tu URL)
-- Ejemplo: https://tkwackqrnsqlmxtalvuw.supabase.co/storage/v1/object/public/product-images/products/

-- Mapeo de rutas locales a rutas en Storage
UPDATE products
SET image_url = 'products/baileys.webp'
WHERE image_url = '/baileys.webp' OR image_url LIKE '%baileys.webp';

UPDATE products
SET image_url = 'products/cafe-americano-nespresso.webp'
WHERE image_url = '/cafe-americano-nespresso.webp' OR image_url LIKE '%cafe-americano-nespresso.webp';

UPDATE products
SET image_url = 'products/cafe-expresso-nespresso.webp'
WHERE image_url = '/cafe-expresso-nespresso.webp' OR image_url LIKE '%cafe-expresso-nespresso.webp';

UPDATE products
SET image_url = 'products/capuchino-nespresso.webp'
WHERE image_url = '/capuchino-nespresso.webp' OR image_url LIKE '%capuchino-nespresso.webp';

UPDATE products
SET image_url = 'products/carajilla.jpg'
WHERE image_url = '/carajilla.jpg' OR image_url LIKE '%carajilla.jpg';

UPDATE products
SET image_url = 'products/carajillo-solo.webp'
WHERE image_url = '/carajillo solo.webp' OR image_url LIKE '%carajillo solo.webp' OR image_url LIKE '%carajillo-solo.webp';

UPDATE products
SET image_url = 'products/carajillo.jpeg'
WHERE image_url = '/carajillo.jpeg' OR image_url LIKE '%carajillo.jpeg';

UPDATE products
SET image_url = 'products/cheesecake-lotus.png'
WHERE image_url = '/cheesecake-lotus.png' OR image_url LIKE '%cheesecake-lotus.png';

UPDATE products
SET image_url = 'products/cheesecake-vasco.jpg'
WHERE image_url = '/cheesecake-vasco.jpg' OR image_url LIKE '%cheesecake-vasco.jpg';

UPDATE products
SET image_url = 'products/chincho-seco.avif'
WHERE image_url = '/chincho-seco.avif' OR image_url LIKE '%chincho-seco.avif';

UPDATE products
SET image_url = 'products/chinchon-dulce.jpg'
WHERE image_url = '/chinchon-dulce.jpg' OR image_url LIKE '%chinchon-dulce.jpg';

UPDATE products
SET image_url = 'products/coketillo-donk.jpg'
WHERE image_url = '/coketillo_donk.jpg' OR image_url LIKE '%coketillo_donk.jpg' OR image_url LIKE '%coketillo-donk.jpg';

UPDATE products
SET image_url = 'products/flan-vainilla.jpg'
WHERE image_url = '/flan-vainilla.jpg' OR image_url LIKE '%flan-vainilla.jpg';

UPDATE products
SET image_url = 'products/frangelico.webp'
WHERE image_url = '/frangelico.webp' OR image_url LIKE '%frangelico.webp';

UPDATE products
SET image_url = 'products/frappuccino.jpg'
WHERE image_url = '/frappuccino.jpg' OR image_url LIKE '%frappuccino.jpg';

UPDATE products
SET image_url = 'products/jugo-naranja.avif'
WHERE image_url = '/jugo-naranja.avif' OR image_url LIKE '%jugo-naranja.avif';

UPDATE products
SET image_url = 'products/licor43.webp'
WHERE image_url = '/licor43.webp' OR image_url LIKE '%licor43.webp';

UPDATE products
SET image_url = 'products/pan-elote.jpeg'
WHERE image_url = '/pan-elote.jpeg' OR image_url LIKE '%pan-elote.jpeg';

UPDATE products
SET image_url = 'products/pastel-3leches.jpg'
WHERE image_url = '/pastel-3leches.jpg' OR image_url LIKE '%pastel-3leches.jpg';

UPDATE products
SET image_url = 'products/red-velvet.jpg'
WHERE image_url = '/red-velvet.jpg' OR image_url LIKE '%red-velvet.jpg';

UPDATE products
SET image_url = 'products/sambuca.webp'
WHERE image_url = '/sambuca.webp' OR image_url LIKE '%sambuca.webp';

UPDATE products
SET image_url = 'products/tarta-chocolate.jpg'
WHERE image_url = '/tarta-chocolate.jpg' OR image_url LIKE '%tarta-chocolate.jpg';

UPDATE products
SET image_url = 'products/te.webp'
WHERE image_url = '/te.webp' OR image_url LIKE '%te.webp';

UPDATE products
SET image_url = 'products/volcan.jpg'
WHERE image_url = '/volcan.jpg' OR image_url LIKE '%volcan.jpg';

-- Verificar actualizaciones
SELECT 
  id,
  name,
  image_url,
  category
FROM products
WHERE image_url LIKE 'products/%'
ORDER BY category, name;
