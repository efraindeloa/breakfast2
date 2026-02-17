-- Presencia Digital: redes sociales en restaurantes
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS facebook_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tiktok_url TEXT;

COMMENT ON COLUMN restaurants.facebook_url IS 'URL del perfil o página de Facebook';
COMMENT ON COLUMN restaurants.instagram_url IS 'URL del perfil de Instagram';
COMMENT ON COLUMN restaurants.tiktok_url IS 'URL del perfil de TikTok';
