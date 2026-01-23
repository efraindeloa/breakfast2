-- ==================== INSERTAR PRODUCTOS ====================
-- Este script inserta todos los productos (platillos, bebidas, postres, coctelería) en la base de datos

-- Limpiar productos existentes (opcional, comentar si quieres mantener los existentes)
-- DELETE FROM products;

-- Insertar todos los productos
INSERT INTO products (id, name, description, price, image, badges, category, origin) VALUES
-- ENTRADAS
(1, 'Tacos de Atún Marinado', 'Atún fresco con aderezo de chipotle artesanal, aguacate y cebolla morada.', '$18.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxagxlshYO2auuogSyw7OhNdc7J8dbVtovgy1mx2QnTHrkMM2grGKiD5FOKoTvHJCxaf3o2IELhRAX9KuZmf3PSo_hZMFmXbeQpucwaZ41LUFYyamXCfCpGD8b3ysaoiUZmN_hQx3AB0zC0PVC5YeERx23oMBXNH-Bix9Tpdb9CNzdIliDef0s4xZn5I_BDf46Q_4zQliQOmvnxglHcpo1lGW6PGIGHletH7NmXDLi-rmVLzUYaOOr3OZJFOHTy4bsX4Sb8uyCMTC', ARRAY['vegano'], 'Entradas', 'mar'),
(2, 'Ceviche de Maracuyá', 'Pescado blanco marinado en leche de tigre de maracuyá y toques de cilantro.', '$22.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Entradas', 'mar'),
(4, 'Carpaccio de Res', 'Láminas finas de res con parmesano, arúgula y aceite de trufa blanca.', '$19.50', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1Y98JWSxq59D6xrh4JHhm4q072LDOHj17OoZ6LzLrjORuYwpo5U34TJPTXqOI4jEB93fhXcE0vO3VyiAMBLQBDC0E2mFh_aAgBjf5Lyg9-1kfvymXKbxsPQpneXX2TyNW61UnZ3Fo8BP8jz0wJ6ZExUHJGeGUJavA4TKiT4e6JNUG5AdgejiOFA7Gw_lR4o0Q4Fq2jKpNkLbfqTPwfs-rTcYvGMJayKZ0OdUtJDbwETkbjK0bd2ufND56laE10uZeDOX6vMLfJAf', NULL, 'Entradas', 'tierra'),
(5, 'Ensalada Mediterránea', 'Fresco, saludable y de temporada', '$12.50', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK', ARRAY['vegano'], 'Entradas', 'vegetariano'),

-- PLATOS FUERTES
(3, 'Rib Eye a la Leña', 'Corte premium de 400g cocinado a fuego lento con madera de encino.', '$45.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', ARRAY['especialidad'], 'Platos Fuertes', 'tierra'),
(6, 'Pollo al Limón & Hierbas', 'Plato insignia del día', '$15.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz', NULL, 'Platos Fuertes', 'aire'),
(7, 'Quinoa & Aguacate Bowl', 'Nutritivo y equilibrado', '$16.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g', ARRAY['vegano'], 'Platos Fuertes', 'vegetariano'),
(8, 'Pasta al Pomodoro', 'Elaboración artesanal', '$20.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL', NULL, 'Platos Fuertes', 'vegetariano'),

-- BEBIDAS
(9, 'Café Espresso', 'Café italiano intenso y aromático', '$4.50', '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', ''),
(10, 'Jugo de Naranja Natural', 'Recién exprimido, rico en vitamina C', '$6.00', '/jugo-naranja.avif', NULL, 'Bebidas', ''),
(15, 'Americano', '180 ml - NESPRESSO', '$48.00', '/cafe-americano-nespresso.webp', NULL, 'Bebidas', 'cafe'),
(16, 'Espresso', '60 ml - NESPRESSO', '$48.00', '/cafe-expresso-nespresso.webp', NULL, 'Bebidas', 'cafe'),
(17, 'Capuchino', '180 ml - NESPRESSO. Opciones: Napolitano, baileys, vainilla', '$60.00', '/capuchino-nespresso.webp', NULL, 'Bebidas', 'cafe'),
(18, 'Frapuccino', '180 ml - NESPRESSO', '$70.00', '/frappuccino.jpg', NULL, 'Bebidas', 'cafe'),
(19, 'Té', 'Opciones: Hierbabuena / Manzanilla', '$35.00', '/te.webp', NULL, 'Bebidas', 'cafe'),

-- POSTRES
(11, 'Tarta de Chocolate', 'Deliciosa tarta con cobertura de chocolate belga', '$8.50', '/tarta-chocolate.jpg', NULL, 'Postres', ''),
(12, 'Flan de Vainilla', 'Tradicional flan casero con caramelo', '$7.00', '/flan-vainilla.jpg', NULL, 'Postres', ''),
(29, 'Volcán', 'Con una textura única, firme por fuera, suave por dentro, acompañado de helado. Opciones: Dulce de leche o chocolate', '$140.00', '/volcan.jpg', ARRAY['favorito'], 'Postres', 'pastel'),
(30, 'Cheesecake Vasco', 'Cremoso pay de natilla montado sobre cama de galleta horneada y bañado con mermelada de frutos rojos. (200 g.)', '$190.00', '/cheesecake-vasco.jpg', NULL, 'Postres', 'pay_de_queso'),
(31, 'Pan de Elote', 'Recién horneado, sobre una cama de mermelada, frutos rojos, helado de vainilla, bañado con dulce de cajeta y nuez. (200 g.)', '$140.00', '/pan-elote.jpeg', NULL, 'Postres', 'pastel'),
(32, 'Cheesecake Lotus', 'Pay de queso con la autentica galleta "Lotus Biscoff", bañado con mezcla de leches, acompañado de frutos rojos.', '$140.00', '/cheesecake-lotus.png', NULL, 'Postres', 'pay_de_queso'),
(33, 'Pastel 3 Leches', 'Delicioso pan de vainilla, con trozos de durazno, bañado con mezcla de 3 leches, con frutos rojos y nuez.', '$140.00', '/pastel-3leches.jpg', NULL, 'Postres', 'pastel'),
(34, 'Red Velvet', 'Pan de red velvet con sabor a chocolate oscuro y betún de queso crema. Coronado con fresa natural.', '$140.00', '/red-velvet.jpg', NULL, 'Postres', 'pastel'),

-- COCTELERÍA
(13, 'Mojito Clásico', 'Ron, menta fresca, lima y soda', '$12.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0', NULL, 'Coctelería', ''),
(14, 'Margarita Premium', 'Tequila reposado, triple sec y jugo de lima', '$14.00', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D', NULL, 'Coctelería', ''),
(20, 'Carajillo', 'Café con licor 43', '$145.00', '/carajillo solo.webp', NULL, 'Coctelería', 'digestivos'),
(21, 'Coketillo', 'Carajillo con paleta de chocomilk', '$160.00', '/coketillo_donk.jpg', NULL, 'Coctelería', 'digestivos'),
(22, 'Carajilla', 'Café con Baileys', '$145.00', '/carajilla.jpg', NULL, 'Coctelería', 'digestivos'),
(23, 'Licor 43', '700 ml - Porción: $140.00 / Botella: $1,400.00', '$140.00', '/licor43.webp', NULL, 'Coctelería', 'digestivos'),
(24, 'Baileys', '700 ml - Porción: $120.00 / Botella: $1,200.00', '$120.00', '/baileys.webp', NULL, 'Coctelería', 'digestivos'),
(25, 'Frangelico', '700 ml - Porción: $120.00 / Botella: $1,200.00', '$120.00', '/frangelico.webp', NULL, 'Coctelería', 'digestivos'),
(26, 'Sambuca', '700 ml - Porción: $100.00 / Botella: $1,000.00', '$100.00', '/sambuca.webp', NULL, 'Coctelería', 'digestivos'),
(27, 'Chinchón Seco', '1000 ml - Porción: $95.00 / Botella: $950.00', '$95.00', '/chincho-seco.avif', NULL, 'Coctelería', 'digestivos'),
(28, 'Chinchón Dulce', '1000 ml - Porción: $95.00 / Botella: $950.00', '$95.00', '/chinchon-dulce.jpg', NULL, 'Coctelería', 'digestivos')

ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image = EXCLUDED.image,
  badges = EXCLUDED.badges,
  category = EXCLUDED.category,
  origin = EXCLUDED.origin,
  updated_at = NOW();
