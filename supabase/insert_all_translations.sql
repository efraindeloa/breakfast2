-- ==================== INSERTAR TODAS LAS TRADUCCIONES DE PRODUCTOS ====================
-- Este script inserta traducciones en inglés, portugués y francés para todos los productos
-- Basado en los nombres de productos existentes

-- ==================== TRADUCCIONES EN INGLÉS (en) ====================
INSERT INTO product_translations (product_id, language_code, name, description)
SELECT 
  p.id,
  'en' as language_code,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Marinated Tuna Tacos'
    WHEN 'Ceviche de Maracuyá' THEN 'Passion Fruit Ceviche'
    WHEN 'Rib Eye a la Leña' THEN 'Rib Eye on the Wood'
    WHEN 'Carpaccio de Res' THEN 'Beef Carpaccio'
    WHEN 'Ensalada Mediterránea' THEN 'Mediterranean Salad'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Lemon & Herbs Chicken'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Quinoa & Avocado Bowl'
    WHEN 'Pasta al Pomodoro' THEN 'Pasta Pomodoro'
    WHEN 'Café Espresso' THEN 'Espresso Coffee'
    WHEN 'Jugo de Naranja Natural' THEN 'Natural Orange Juice'
    WHEN 'Tarta de Chocolate' THEN 'Chocolate Cake'
    WHEN 'Flan de Vainilla' THEN 'Vanilla Flan'
    WHEN 'Mojito Clásico' THEN 'Classic Mojito'
    WHEN 'Margarita Premium' THEN 'Premium Margarita'
    WHEN 'Americano' THEN 'Americano'
    WHEN 'Espresso' THEN 'Espresso'
    WHEN 'Capuchino' THEN 'Cappuccino'
    WHEN 'Frapuccino' THEN 'Frappuccino'
    WHEN 'Té' THEN 'Tea'
    WHEN 'Carajillo' THEN 'Carajillo'
    WHEN 'Coketillo' THEN 'Coketillo'
    WHEN 'Carajilla' THEN 'Carajilla'
    WHEN 'Licor 43' THEN 'Licor 43'
    WHEN 'Baileys' THEN 'Baileys'
    WHEN 'Frangelico' THEN 'Frangelico'
    WHEN 'Sambuca' THEN 'Sambuca'
    WHEN 'Chinchón Seco' THEN 'Dry Chinchón'
    WHEN 'Chinchón Dulce' THEN 'Sweet Chinchón'
    WHEN 'Volcán' THEN 'Volcano'
    WHEN 'Cheesecake Vasco' THEN 'Basque Cheesecake'
    WHEN 'Pan de Elote' THEN 'Corn Bread'
    WHEN 'Cheesecake Lotus' THEN 'Lotus Cheesecake'
    WHEN 'Pastel 3 Leches' THEN 'Three Milk Cake'
    WHEN 'Red Velvet' THEN 'Red Velvet'
    ELSE p.name -- Mantener el nombre original si no hay traducción
  END as name,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Fresh tuna with artisanal chipotle dressing, avocado and purple onion.'
    WHEN 'Ceviche de Maracuyá' THEN 'White fish marinated in passion fruit tiger''s milk and cilantro touches.'
    WHEN 'Rib Eye a la Leña' THEN 'Premium 400g cut cooked slow over oak wood.'
    WHEN 'Carpaccio de Res' THEN 'Thin slices of beef with parmesan, arugula and white truffle oil.'
    WHEN 'Ensalada Mediterránea' THEN 'Fresh, healthy and seasonal'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Signature dish of the day'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Nutritious and balanced'
    WHEN 'Pasta al Pomodoro' THEN 'Handcrafted preparation'
    WHEN 'Café Espresso' THEN 'Intense and aromatic Italian coffee'
    WHEN 'Jugo de Naranja Natural' THEN 'Freshly squeezed, rich in vitamin C'
    WHEN 'Tarta de Chocolate' THEN 'Delicious cake with Belgian chocolate topping'
    WHEN 'Flan de Vainilla' THEN 'Traditional homemade flan with caramel'
    WHEN 'Mojito Clásico' THEN 'Rum, fresh mint, lime and soda'
    WHEN 'Margarita Premium' THEN 'Reposado tequila, triple sec and lime juice'
    WHEN 'Americano' THEN '180 ml - NESPRESSO'
    WHEN 'Espresso' THEN '60 ml - NESPRESSO'
    WHEN 'Capuchino' THEN '180 ml - NESPRESSO. Options: Neapolitan, baileys, vanilla'
    WHEN 'Frapuccino' THEN '180 ml - NESPRESSO'
    WHEN 'Té' THEN 'Options: Mint / Chamomile'
    WHEN 'Carajillo' THEN 'Coffee with Licor 43'
    WHEN 'Coketillo' THEN 'Carajillo with chocomilk popsicle'
    WHEN 'Carajilla' THEN 'Coffee with Baileys'
    WHEN 'Licor 43' THEN '700 ml - Portion: $140.00 / Bottle: $1,400.00'
    WHEN 'Baileys' THEN '700 ml - Portion: $120.00 / Bottle: $1,200.00'
    WHEN 'Frangelico' THEN '700 ml - Portion: $120.00 / Bottle: $1,200.00'
    WHEN 'Sambuca' THEN '700 ml - Portion: $100.00 / Bottle: $1,000.00'
    WHEN 'Chinchón Seco' THEN '1000 ml - Portion: $95.00 / Bottle: $950.00'
    WHEN 'Chinchón Dulce' THEN '1000 ml - Portion: $95.00 / Bottle: $950.00'
    WHEN 'Volcán' THEN 'With a unique texture, firm on the outside, soft on the inside, served with ice cream. Options: Dulce de leche or chocolate'
    WHEN 'Cheesecake Vasco' THEN 'Creamy custard pie on a bed of baked cookie and topped with red fruit jam. (200 g.)'
    WHEN 'Pan de Elote' THEN 'Freshly baked, on a bed of jam, red fruits, vanilla ice cream, topped with cajeta and nuts. (200 g.)'
    WHEN 'Cheesecake Lotus' THEN 'Cheese pie with authentic "Lotus Biscoff" cookie, topped with milk mixture, served with red fruits.'
    WHEN 'Pastel 3 Leches' THEN 'Delicious vanilla cake, with peach pieces, topped with 3 milk mixture, with red fruits and nuts.'
    WHEN 'Red Velvet' THEN 'Red velvet cake with dark chocolate flavor and cream cheese frosting. Topped with fresh strawberry.'
    ELSE COALESCE(p.description, '') -- Mantener la descripción original si no hay traducción
  END as description
FROM products p
WHERE p.is_active = true
ON CONFLICT (product_id, language_code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ==================== TRADUCCIONES EN PORTUGUÉS (pt) ====================
INSERT INTO product_translations (product_id, language_code, name, description)
SELECT 
  p.id,
  'pt' as language_code,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Tacos de Atum Marinado'
    WHEN 'Ceviche de Maracuyá' THEN 'Ceviche de Maracujá'
    WHEN 'Rib Eye a la Leña' THEN 'Rib Eye na Lenha'
    WHEN 'Carpaccio de Res' THEN 'Carpaccio de Carne'
    WHEN 'Ensalada Mediterránea' THEN 'Salada Mediterrânea'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Frango ao Limão & Ervas'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Tigela de Quinoa & Abacate'
    WHEN 'Pasta al Pomodoro' THEN 'Macarrão ao Pomodoro'
    WHEN 'Café Espresso' THEN 'Café Expresso'
    WHEN 'Jugo de Naranja Natural' THEN 'Suco de Laranja Natural'
    WHEN 'Tarta de Chocolate' THEN 'Torta de Chocolate'
    WHEN 'Flan de Vainilla' THEN 'Pudim de Baunilha'
    WHEN 'Mojito Clásico' THEN 'Mojito Clássico'
    WHEN 'Margarita Premium' THEN 'Margarita Premium'
    WHEN 'Americano' THEN 'Americano'
    WHEN 'Espresso' THEN 'Expresso'
    WHEN 'Capuchino' THEN 'Cappuccino'
    WHEN 'Frapuccino' THEN 'Frappuccino'
    WHEN 'Té' THEN 'Chá'
    WHEN 'Carajillo' THEN 'Carajillo'
    WHEN 'Coketillo' THEN 'Coketillo'
    WHEN 'Carajilla' THEN 'Carajilla'
    WHEN 'Licor 43' THEN 'Licor 43'
    WHEN 'Baileys' THEN 'Baileys'
    WHEN 'Frangelico' THEN 'Frangelico'
    WHEN 'Sambuca' THEN 'Sambuca'
    WHEN 'Chinchón Seco' THEN 'Chinchón Seco'
    WHEN 'Chinchón Dulce' THEN 'Chinchón Doce'
    WHEN 'Volcán' THEN 'Vulcão'
    WHEN 'Cheesecake Vasco' THEN 'Cheesecake Basco'
    WHEN 'Pan de Elote' THEN 'Pão de Milho'
    WHEN 'Cheesecake Lotus' THEN 'Cheesecake Lotus'
    WHEN 'Pastel 3 Leches' THEN 'Bolo 3 Leites'
    WHEN 'Red Velvet' THEN 'Red Velvet'
    ELSE p.name
  END as name,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Atum fresco com molho de chipotle artesanal, abacate e cebola roxa.'
    WHEN 'Ceviche de Maracuyá' THEN 'Peixe branco marinado em leite de tigre de maracujá e toques de coentro.'
    WHEN 'Rib Eye a la Leña' THEN 'Corte premium de 400g cozido lentamente com madeira de carvalho.'
    WHEN 'Carpaccio de Res' THEN 'Fatias finas de carne com parmesão, rúcula e óleo de trufa branca.'
    WHEN 'Ensalada Mediterránea' THEN 'Fresco, saudável e sazonal'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Prato carro-chefe do dia'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Nutritivo e equilibrado'
    WHEN 'Pasta al Pomodoro' THEN 'Preparação artesanal'
    WHEN 'Café Espresso' THEN 'Café italiano intenso e aromático'
    WHEN 'Jugo de Naranja Natural' THEN 'Recém espremido, rico em vitamina C'
    WHEN 'Tarta de Chocolate' THEN 'Deliciosa torta com cobertura de chocolate belga'
    WHEN 'Flan de Vainilla' THEN 'Pudim caseiro tradicional com caramelo'
    WHEN 'Mojito Clásico' THEN 'Rum, hortelã fresca, limão e refrigerante'
    WHEN 'Margarita Premium' THEN 'Tequila reposado, triple sec e suco de limão'
    WHEN 'Americano' THEN '180 ml - NESPRESSO'
    WHEN 'Espresso' THEN '60 ml - NESPRESSO'
    WHEN 'Capuchino' THEN '180 ml - NESPRESSO. Opções: Napolitano, baileys, baunilha'
    WHEN 'Frapuccino' THEN '180 ml - NESPRESSO'
    WHEN 'Té' THEN 'Opções: Hortelã / Camomila'
    WHEN 'Carajillo' THEN 'Café com Licor 43'
    WHEN 'Coketillo' THEN 'Carajillo com paleta de chocomilk'
    WHEN 'Carajilla' THEN 'Café com Baileys'
    WHEN 'Licor 43' THEN '700 ml - Porção: $140.00 / Garrafa: $1,400.00'
    WHEN 'Baileys' THEN '700 ml - Porção: $120.00 / Garrafa: $1,200.00'
    WHEN 'Frangelico' THEN '700 ml - Porção: $120.00 / Garrafa: $1,200.00'
    WHEN 'Sambuca' THEN '700 ml - Porção: $100.00 / Garrafa: $1,000.00'
    WHEN 'Chinchón Seco' THEN '1000 ml - Porção: $95.00 / Garrafa: $950.00'
    WHEN 'Chinchón Dulce' THEN '1000 ml - Porção: $95.00 / Garrafa: $950.00'
    WHEN 'Volcán' THEN 'Com uma textura única, firme por fora, suave por dentro, acompanhado de sorvete. Opções: Doce de leite ou chocolate'
    WHEN 'Cheesecake Vasco' THEN 'Torta cremosa de natas sobre cama de biscoito assado e coberto com geleia de frutas vermelhas. (200 g.)'
    WHEN 'Pan de Elote' THEN 'Recém assado, sobre uma cama de geleia, frutas vermelhas, sorvete de baunilha, coberto com doce de cajeta e nozes. (200 g.)'
    WHEN 'Cheesecake Lotus' THEN 'Torta de queijo com o autêntico biscoito "Lotus Biscoff", coberto com mistura de leites, acompanhado de frutas vermelhas.'
    WHEN 'Pastel 3 Leches' THEN 'Delicioso bolo de baunilha, com pedaços de pêssego, coberto com mistura de 3 leites, com frutas vermelhas e nozes.'
    WHEN 'Red Velvet' THEN 'Bolo red velvet com sabor de chocolate escuro e cobertura de cream cheese. Coroado com morango natural.'
    ELSE COALESCE(p.description, '')
  END as description
FROM products p
WHERE p.is_active = true
ON CONFLICT (product_id, language_code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ==================== TRADUCCIONES EN FRANCÉS (fr) ====================
INSERT INTO product_translations (product_id, language_code, name, description)
SELECT 
  p.id,
  'fr' as language_code,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Tacos au Thon Mariné'
    WHEN 'Ceviche de Maracuyá' THEN 'Ceviche à la Passion'
    WHEN 'Rib Eye a la Leña' THEN 'Entrecôte au Bois'
    WHEN 'Carpaccio de Res' THEN 'Carpaccio de Bœuf'
    WHEN 'Ensalada Mediterránea' THEN 'Salade Méditerranéenne'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Poulet au Citron & Herbes'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Bol Quinoa & Avocat'
    WHEN 'Pasta al Pomodoro' THEN 'Pâtes Pomodoro'
    WHEN 'Café Espresso' THEN 'Café Expresso'
    WHEN 'Jugo de Naranja Natural' THEN 'Jus d''Orange Naturel'
    WHEN 'Tarta de Chocolate' THEN 'Tarte au Chocolat'
    WHEN 'Flan de Vainilla' THEN 'Flan à la Vanille'
    WHEN 'Mojito Clásico' THEN 'Mojito Classique'
    WHEN 'Margarita Premium' THEN 'Margarita Premium'
    WHEN 'Americano' THEN 'Americano'
    WHEN 'Espresso' THEN 'Expresso'
    WHEN 'Capuchino' THEN 'Cappuccino'
    WHEN 'Frapuccino' THEN 'Frappuccino'
    WHEN 'Té' THEN 'Thé'
    WHEN 'Carajillo' THEN 'Carajillo'
    WHEN 'Coketillo' THEN 'Coketillo'
    WHEN 'Carajilla' THEN 'Carajilla'
    WHEN 'Licor 43' THEN 'Licor 43'
    WHEN 'Baileys' THEN 'Baileys'
    WHEN 'Frangelico' THEN 'Frangelico'
    WHEN 'Sambuca' THEN 'Sambuca'
    WHEN 'Chinchón Seco' THEN 'Chinchón Sec'
    WHEN 'Chinchón Dulce' THEN 'Chinchón Doux'
    WHEN 'Volcán' THEN 'Volcan'
    WHEN 'Cheesecake Vasco' THEN 'Cheesecake Basque'
    WHEN 'Pan de Elote' THEN 'Pain de Maïs'
    WHEN 'Cheesecake Lotus' THEN 'Cheesecake Lotus'
    WHEN 'Pastel 3 Leches' THEN 'Gâteau 3 Lait'
    WHEN 'Red Velvet' THEN 'Red Velvet'
    ELSE p.name
  END as name,
  CASE p.name
    WHEN 'Tacos de Atún Marinado' THEN 'Thon frais avec sauce chipotle artisanale, avocat et oignon violet.'
    WHEN 'Ceviche de Maracuyá' THEN 'Poisson blanc mariné dans le lait de tigre de fruit de la passion et touches de coriandre.'
    WHEN 'Rib Eye a la Leña' THEN 'Coupe premium de 400g cuite lentement sur du bois de chêne.'
    WHEN 'Carpaccio de Res' THEN 'Tranches fines de bœuf avec parmesan, roquette et huile de truffe blanche.'
    WHEN 'Ensalada Mediterránea' THEN 'Frais, sain et de saison'
    WHEN 'Pollo al Limón & Hierbas' THEN 'Plat signature du jour'
    WHEN 'Quinoa & Aguacate Bowl' THEN 'Nutritif et équilibré'
    WHEN 'Pasta al Pomodoro' THEN 'Préparation artisanale'
    WHEN 'Café Espresso' THEN 'Café italien intense et aromatique'
    WHEN 'Jugo de Naranja Natural' THEN 'Fraîchement pressé, riche en vitamine C'
    WHEN 'Tarta de Chocolate' THEN 'Délicieuse tarte avec nappage au chocolat belge'
    WHEN 'Flan de Vainilla' THEN 'Flan maison traditionnel au caramel'
    WHEN 'Mojito Clásico' THEN 'Rhum, menthe fraîche, citron vert et soda'
    WHEN 'Margarita Premium' THEN 'Tequila reposado, triple sec et jus de citron vert'
    WHEN 'Americano' THEN '180 ml - NESPRESSO'
    WHEN 'Espresso' THEN '60 ml - NESPRESSO'
    WHEN 'Capuchino' THEN '180 ml - NESPRESSO. Options: Napolitain, baileys, vanille'
    WHEN 'Frapuccino' THEN '180 ml - NESPRESSO'
    WHEN 'Té' THEN 'Options: Menthe / Camomille'
    WHEN 'Carajillo' THEN 'Café avec Licor 43'
    WHEN 'Coketillo' THEN 'Carajillo avec esquimau au chocolat'
    WHEN 'Carajilla' THEN 'Café avec Baileys'
    WHEN 'Licor 43' THEN '700 ml - Portion: $140.00 / Bouteille: $1,400.00'
    WHEN 'Baileys' THEN '700 ml - Portion: $120.00 / Bouteille: $1,200.00'
    WHEN 'Frangelico' THEN '700 ml - Portion: $120.00 / Bouteille: $1,200.00'
    WHEN 'Sambuca' THEN '700 ml - Portion: $100.00 / Bouteille: $1,000.00'
    WHEN 'Chinchón Seco' THEN '1000 ml - Portion: $95.00 / Bouteille: $950.00'
    WHEN 'Chinchón Dulce' THEN '1000 ml - Portion: $95.00 / Bouteille: $950.00'
    WHEN 'Volcán' THEN 'Avec une texture unique, ferme à l''extérieur, doux à l''intérieur, servi avec de la glace. Options: Dulce de leche ou chocolat'
    WHEN 'Cheesecake Vasco' THEN 'Tarte crémeuse à la crème sur un lit de biscuit cuit au four et nappée de confiture de fruits rouges. (200 g.)'
    WHEN 'Pan de Elote' THEN 'Fraîchement cuit au four, sur un lit de confiture, fruits rouges, glace à la vanille, nappé de cajeta et noix. (200 g.)'
    WHEN 'Cheesecake Lotus' THEN 'Tarte au fromage avec le biscuit authentique "Lotus Biscoff", nappée de mélange de laits, servie avec des fruits rouges.'
    WHEN 'Pastel 3 Leches' THEN 'Délicieux gâteau à la vanille, avec des morceaux de pêche, nappé de mélange de 3 laits, avec des fruits rouges et des noix.'
    WHEN 'Red Velvet' THEN 'Gâteau red velvet avec saveur de chocolat noir et glaçage au cream cheese. Couronné de fraise naturelle.'
    ELSE COALESCE(p.description, '')
  END as description
FROM products p
WHERE p.is_active = true
ON CONFLICT (product_id, language_code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ==================== VERIFICACIÓN ====================
-- Verificar que se insertaron todas las traducciones
SELECT 
  p.name as producto_espanol,
  COUNT(DISTINCT pt.language_code) as idiomas_disponibles,
  STRING_AGG(DISTINCT pt.language_code, ', ' ORDER BY pt.language_code) as idiomas
FROM products p
LEFT JOIN product_translations pt ON p.id = pt.product_id
WHERE p.is_active = true
GROUP BY p.id, p.name
ORDER BY p.id;

-- Resumen por idioma
SELECT 
  pt.language_code,
  COUNT(*) as total_traducciones
FROM product_translations pt
GROUP BY pt.language_code
ORDER BY pt.language_code;
