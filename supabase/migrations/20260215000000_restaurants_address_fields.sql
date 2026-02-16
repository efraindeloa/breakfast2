-- Campos de domicilio completo para restaurantes
-- Seguro con IF NOT EXISTS por si la tabla ya tiene algunas columnas
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS country TEXT;

COMMENT ON COLUMN restaurants.address IS 'Domicilio completo (calle, número, colonia)';
COMMENT ON COLUMN restaurants.website IS 'Sitio web del restaurante';
COMMENT ON COLUMN restaurants.postal_code IS 'Código postal';
COMMENT ON COLUMN restaurants.state IS 'Estado o provincia';
COMMENT ON COLUMN restaurants.city IS 'Ciudad';
COMMENT ON COLUMN restaurants.country IS 'País';
