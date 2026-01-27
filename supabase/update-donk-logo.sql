-- ==================== ACTUALIZAR LOGO DEL RESTAURANTE DONK ====================
-- Este script actualiza el logo del restaurante "donk-restaurant"
-- con la imagen que ya está en Supabase Storage: logos/logo-donk-restaurant.png

UPDATE restaurants
SET logo_url = 'logos/logo-donk-restaurant.png'
WHERE slug = 'donk-restaurant';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  name,
  slug,
  logo_url,
  cover_image_url,
  updated_at
FROM restaurants
WHERE slug = 'donk-restaurant';
