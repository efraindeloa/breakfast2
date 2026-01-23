-- ==================== CORREGIR CATEGORÍAS DE PRODUCTOS ====================
-- Este script actualiza las categorías basándose en el NOMBRE del producto
-- para asegurar que cada producto esté en la categoría correcta

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

-- BEBIDAS
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
);

-- POSTRES
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

-- Verificar actualizaciones
SELECT 
  id,
  name,
  category,
  image_url
FROM products
ORDER BY category, name;

-- Mostrar productos con categorías incorrectas (si los hay)
SELECT 
  id,
  name,
  category,
  CASE 
    WHEN name IN ('Tacos de Atún Marinado', 'Ceviche de Maracuyá', 'Carpaccio de Res', 'Ensalada Mediterránea') 
      AND category != 'Entradas' THEN '❌ Categoría incorrecta'
    WHEN name IN ('Rib Eye a la Leña', 'Pollo al Limón & Hierbas', 'Quinoa & Aguacate Bowl', 'Pasta al Pomodoro') 
      AND category != 'Platos Fuertes' THEN '❌ Categoría incorrecta'
    WHEN name IN ('Café Espresso', 'Jugo de Naranja Natural', 'Americano', 'Espresso', 'Capuchino', 'Frapuccino', 'Té') 
      AND category != 'Bebidas' THEN '❌ Categoría incorrecta'
    WHEN name IN ('Tarta de Chocolate', 'Flan de Vainilla', 'Volcán', 'Cheesecake Vasco', 'Pan de Elote', 'Cheesecake Lotus', 'Pastel 3 Leches', 'Red Velvet') 
      AND category != 'Postres' THEN '❌ Categoría incorrecta'
    WHEN name IN ('Mojito Clásico', 'Margarita Premium', 'Carajillo', 'Coketillo', 'Carajilla', 'Licor 43', 'Baileys', 'Frangelico', 'Sambuca', 'Chinchón Seco', 'Chinchón Dulce') 
      AND category != 'Coctelería' THEN '❌ Categoría incorrecta'
    ELSE '✅ OK'
  END as estado
FROM products
ORDER BY category, name;
