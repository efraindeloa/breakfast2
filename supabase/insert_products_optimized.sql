-- ==================== INSERTAR PRODUCTOS (VERSIÓN OPTIMIZADA) ====================
-- Este script inserta productos asociados a un restaurante específico
-- IMPORTANTE: Primero debes crear un restaurante y obtener su ID

-- Ejemplo: Crear un restaurante de prueba (ejecutar primero)
-- INSERT INTO restaurants (id, name, slug, city, country, is_active) 
-- VALUES ('00000000-0000-0000-0000-000000000001', 'Restaurante Demo', 'restaurante-demo', 'Ciudad de México', 'México', true)
-- ON CONFLICT (id) DO NOTHING;

-- Obtener el ID del restaurante (reemplaza con el ID real de tu restaurante)
-- Para este ejemplo, usaremos un UUID de ejemplo
DO $$
DECLARE
  restaurant_uuid UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Si el restaurante no existe, créalo
  INSERT INTO restaurants (id, name, slug, city, country, is_active) 
  VALUES (restaurant_uuid, 'Restaurante Demo', 'restaurante-demo', 'Ciudad de México', 'México', true)
  ON CONFLICT (id) DO NOTHING;

  -- Insertar todos los productos asociados al restaurante
  INSERT INTO products (restaurant_id, name, description, price, image_url, badges, category, origin) VALUES
  -- ENTRADAS
  (restaurant_uuid, 'Tacos de Atún Marinado', 'Atún fresco con aderezo de chipotle artesanal, aguacate y cebolla morada.', 18.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxagxlshYO2auuogSyw7OhNdc7J8dbVtovgy1mx2QnTHrkMM2grGKiD5FOKoTvHJCxaf3o2IELhRAX9KuZmf3PSo_hZMFmXbeQpucwaZ41LUFYyamXCfCpGD8b3ysaoiUZmN_hQx3AB0zC0PVC5YeERx23oMBXNH-Bix9Tpdb9CNzdIliDef0s4xZn5I_BDf46Q_4zQliQOmvnxglHcpo1lGW6PGIGHletH7NmXDLi-rmVLzUYaOOr3OZJFOHTy4bsX4Sb8uyCMTC', ARRAY['vegano'], 'Entradas', 'mar'),
  (restaurant_uuid, 'Ceviche de Maracuyá', 'Pescado blanco marinado en leche de tigre de maracuyá y toques de cilantro.', 22.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Entradas', 'mar'),
  (restaurant_uuid, 'Carpaccio de Res', 'Láminas finas de res con parmesano, arúgula y aceite de trufa blanca.', 19.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1Y98JWSxq59D6xrh4JHhm4q072LDOHj17OoZ6LzLrjORuYwpo5U34TJPTXqOI4jEB93fhXcE0vO3VyiAMBLQBDC0E2mFh_aAgBjf5Lyg9-1kfvymXKbxsPQpneXX2TyNW61UnZ3Fo8BP8jz0wJ6ZExUHJGeGUJavA4TKiT4e6JNUG5AdgejiOFA7Gw_lR4o0Q4Fq2jKpNkLbfqTPwfs-rTcYvGMJayKZ0OdUtJDbwETkbjK0bd2ufND56laE10uZeDOX6vMLfJAf', NULL, 'Entradas', 'tierra'),
  (restaurant_uuid, 'Ensalada Mediterránea', 'Fresco, saludable y de temporada', 12.50, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK', ARRAY['vegano'], 'Entradas', 'vegetariano'),

  -- PLATOS FUERTES
  (restaurant_uuid, 'Rib Eye a la Leña', 'Corte premium de 400g cocinado a fuego lento con madera de encino.', 45.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', ARRAY['especialidad'], 'Platos Fuertes', 'tierra'),
  (restaurant_uuid, 'Pollo al Limón & Hierbas', 'Plato insignia del día', 15.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz', NULL, 'Platos Fuertes', 'aire'),
  (restaurant_uuid, 'Quinoa & Aguacate Bowl', 'Nutritivo y equilibrado', 16.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g', ARRAY['vegano'], 'Platos Fuertes', 'vegetariano'),
  (restaurant_uuid, 'Pasta al Pomodoro', 'Elaboración artesanal', 20.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL', NULL, 'Platos Fuertes', 'vegetariano'),

  -- BEBIDAS
  (restaurant_uuid, 'Café Espresso', 'Café italiano intenso y aromático', 4.50, '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', ''),
  (restaurant_uuid, 'Jugo de Naranja Natural', 'Recién exprimido, rico en vitamina C', 6.00, '/jugo-naranja.avif', NULL, 'Bebidas', ''),
  (restaurant_uuid, 'Americano', '180 ml - NESPRESSO', 48.00, '/cafe-americano-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Espresso', '60 ml - NESPRESSO', 48.00, '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Capuchino', '180 ml - NESPRESSO. Opciones: Napolitano, baileys, vainilla', 60.00, '/capuchino-nespresso.webp', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Frapuccino', '180 ml - NESPRESSO', 70.00, '/frappuccino.jpg', NULL, 'Bebidas', 'cafe'),
  (restaurant_uuid, 'Té', 'Opciones: Hierbabuena / Manzanilla', 35.00, '/te.webp', NULL, 'Bebidas', 'cafe'),

  -- POSTRES
  (restaurant_uuid, 'Tarta de Chocolate', 'Deliciosa tarta con cobertura de chocolate belga', 8.50, '/tarta-chocolate.jpg', NULL, 'Postres', ''),
  (restaurant_uuid, 'Flan de Vainilla', 'Tradicional flan casero con caramelo', 7.00, '/flan-vainilla.jpg', NULL, 'Postres', ''),
  (restaurant_uuid, 'Volcán', 'Con una textura única, firme por fuera, suave por dentro, acompañado de helado. Opciones: Dulce de leche o chocolate', 140.00, '/volcan.jpg', ARRAY['favorito'], 'Postres', 'pastel'),
  (restaurant_uuid, 'Cheesecake Vasco', 'Cremoso pay de natilla montado sobre cama de galleta horneada y bañado con mermelada de frutos rojos. (200 g.)', 190.00, '/cheesecake-vasco.jpg', NULL, 'Postres', 'pay_de_queso'),
  (restaurant_uuid, 'Pan de Elote', 'Recién horneado, sobre una cama de mermelada, frutos rojos, helado de vainilla, bañado con dulce de cajeta y nuez. (200 g.)', 140.00, '/pan-elote.jpeg', NULL, 'Postres', 'pastel'),
  (restaurant_uuid, 'Cheesecake Lotus', 'Pay de queso con la autentica galleta "Lotus Biscoff", bañado con mezcla de leches, acompañado de frutos rojos.', 140.00, '/cheesecake-lotus.png', NULL, 'Postres', 'pay_de_queso'),
  (restaurant_uuid, 'Pastel 3 Leches', 'Delicioso pan de vainilla, con trozos de durazno, bañado con mezcla de 3 leches, con frutos rojos y nuez.', 140.00, '/pastel-3leches.jpg', NULL, 'Postres', 'pastel'),
  (restaurant_uuid, 'Red Velvet', 'Pan de red velvet con sabor a chocolate oscuro y betún de queso crema. Coronado con fresa natural.', 140.00, '/red-velvet.jpg', NULL, 'Postres', 'pastel'),

  -- COCTELERÍA
  (restaurant_uuid, 'Mojito Clásico', 'Ron, menta fresca, lima y soda', 12.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Coctelería', ''),
  (restaurant_uuid, 'Margarita Premium', 'Tequila reposado, triple sec y jugo de lima', 14.00, 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', NULL, 'Coctelería', ''),
  (restaurant_uuid, 'Carajillo', 'Café con licor 43', 145.00, '/carajillo solo.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Coketillo', 'Carajillo con paleta de chocomilk', 160.00, '/coketillo_donk.jpg', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Carajilla', 'Café con Baileys', 145.00, '/carajilla.jpg', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Licor 43', '700 ml - Porción: $140.00 / Botella: $1,400.00', 140.00, '/licor43.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Baileys', '700 ml - Porción: $120.00 / Botella: $1,200.00', 120.00, '/baileys.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Frangelico', '700 ml - Porción: $120.00 / Botella: $1,200.00', 120.00, '/frangelico.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Sambuca', '700 ml - Porción: $100.00 / Botella: $1,000.00', 100.00, '/sambuca.webp', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Chinchón Seco', '1000 ml - Porción: $95.00 / Botella: $950.00', 95.00, '/chincho-seco.avif', NULL, 'Coctelería', 'digestivos'),
  (restaurant_uuid, 'Chinchón Dulce', '1000 ml - Porción: $95.00 / Botella: $950.00', 95.00, '/chinchon-dulce.jpg', NULL, 'Coctelería', 'digestivos')

  ON CONFLICT (restaurant_id, name) DO UPDATE SET
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    badges = EXCLUDED.badges,
    category = EXCLUDED.category,
    origin = EXCLUDED.origin,
    updated_at = NOW();
END $$;
