-- ==================== ASIGNAR SUBCATEGORÍA DESDE DESCRIPCIÓN ====================
-- Esta query extrae las dos primeras palabras de la descripción y las asigna como subcategoría
-- para los productos de vino especificados

-- Función helper para extraer las dos primeras palabras de un texto
-- Usa string_to_array para dividir por espacios, toma las primeras 2 palabras, y las une
-- Elimina el punto "." y convierte a Title Case
-- SOBRESCRIBE el array de subcategorías con solo las dos primeras palabras de la descripción
UPDATE public.products
SET 
  subcategories = ARRAY[
    INITCAP(
      REPLACE(
        TRIM(
          array_to_string(
            (string_to_array(description, ' '))[1:2],
            ' '
          )
        ),
        '.',
        ''
      )
    )
  ]::TEXT[]
WHERE 
  name IN (
    'Casillero del Diablo Merlot',
    'Chandon Brut 187 ml.',
    'Chandon Brut 750 ml.',
    'Chandon Garden Spritz 187 ml.',
    'Chandon Garden Spritz 750 ml.',
    'L.A. Cetto Blanc de Zinfandel 187 ml.',
    'L.A. Cetto Blanc de Zinfandel 750 ml.',
    'V Casa Madero',
    'Winemakers Secret Barrels',
    'XA 187 ml.',
    '2V Casa Madero',
    '3V Casa Madero',
    '3V Casa Madero Gran Reserva',
    'Casillero del Diablo Cabernet Sauvignon 375 ml.',
    'Casillero del Diablo Cabernet Sauvignon 750 ml.',
    'Las Nubes Kuiiy',
    'Moët & Chandon Ice Impérial',
    'Moët & Chandon Impérial Brut',
    'Oveja Negra',
    'Quattrocci',
    'Riunite Lambrusco 187 ml.',
    'Riunite Lambrusco 750 ml.',
    'Sangre de Toro 187 ml.',
    'Sangre de Toro 750 ml.',
    'Santo Tomás 31.8'
  )
  AND description IS NOT NULL
  AND description != '';

-- Verificar los cambios
SELECT 
  id,
  name,
  description,
  subcategories,
  -- Mostrar las dos primeras palabras extraídas para verificación (sin punto y en Title Case)
  INITCAP(
    REPLACE(
      TRIM(
        array_to_string(
          (string_to_array(description, ' '))[1:2],
          ' '
        )
      ),
      '.',
      ''
    )
  ) as extracted_subcategory
FROM public.products
WHERE name IN (
  'Casillero del Diablo Merlot',
  'Chandon Brut 187 ml.',
  'Chandon Brut 750 ml.',
  'Chandon Garden Spritz 187 ml.',
  'Chandon Garden Spritz 750 ml.',
  'L.A. Cetto Blanc de Zinfandel 187 ml.',
  'L.A. Cetto Blanc de Zinfandel 750 ml.',
  'V Casa Madero',
  'Winemakers Secret Barrels',
  'XA 187 ml.',
  '2V Casa Madero',
  '3V Casa Madero',
  '3V Casa Madero Gran Reserva',
  'Casillero del Diablo Cabernet Sauvignon 375 ml.',
  'Casillero del Diablo Cabernet Sauvignon 750 ml.',
  'Las Nubes Kuiiy',
  'Moët & Chandon Ice Impérial',
  'Moët & Chandon Impérial Brut',
  'Oveja Negra',
  'Quattrocci',
  'Riunite Lambrusco 187 ml.',
  'Riunite Lambrusco 750 ml.',
  'Sangre de Toro 187 ml.',
  'Sangre de Toro 750 ml.',
  'Santo Tomás 31.8'
)
ORDER BY name;

-- Mostrar estadísticas
SELECT 
  COUNT(*) as total_updated,
  COUNT(CASE WHEN subcategories IS NOT NULL AND array_length(subcategories, 1) > 0 THEN 1 END) as with_subcategories
FROM public.products
WHERE name IN (
  'Casillero del Diablo Merlot',
  'Chandon Brut 187 ml.',
  'Chandon Brut 750 ml.',
  'Chandon Garden Spritz 187 ml.',
  'Chandon Garden Spritz 750 ml.',
  'L.A. Cetto Blanc de Zinfandel 187 ml.',
  'L.A. Cetto Blanc de Zinfandel 750 ml.',
  'V Casa Madero',
  'Winemakers Secret Barrels',
  'XA 187 ml.',
  '2V Casa Madero',
  '3V Casa Madero',
  '3V Casa Madero Gran Reserva',
  'Casillero del Diablo Cabernet Sauvignon 375 ml.',
  'Casillero del Diablo Cabernet Sauvignon 750 ml.',
  'Las Nubes Kuiiy',
  'Moët & Chandon Ice Impérial',
  'Moët & Chandon Impérial Brut',
  'Oveja Negra',
  'Quattrocci',
  'Riunite Lambrusco 187 ml.',
  'Riunite Lambrusco 750 ml.',
  'Sangre de Toro 187 ml.',
  'Sangre de Toro 750 ml.',
  'Santo Tomás 31.8'
);
