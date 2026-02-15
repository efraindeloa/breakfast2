-- Asegurar que assistance_requests tenga todas las columnas que usa la app.
-- Si la tabla se creó con otro esquema o migraciones antiguas, esto la corrige.
-- Ejecutar en SQL Editor si no usas migraciones: pega todo este archivo.

-- Crear tabla si no existe (mismo esquema que 20260213100000)
CREATE TABLE IF NOT EXISTS assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_number TEXT,
  request_type TEXT NOT NULL DEFAULT 'custom',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Añadir columnas que falten (por si la tabla ya existía con otro diseño)
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS restaurant_id UUID;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS request_type TEXT;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;
ALTER TABLE assistance_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Valores por defecto donde hagan falta
ALTER TABLE assistance_requests ALTER COLUMN request_type SET DEFAULT 'custom';
ALTER TABLE assistance_requests ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE assistance_requests ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE assistance_requests ALTER COLUMN updated_at SET DEFAULT now();

-- Rellenar NULLs en columnas que la app espera no nulas
UPDATE assistance_requests SET request_type = 'custom' WHERE request_type IS NULL;
UPDATE assistance_requests SET status = 'pending' WHERE status IS NULL;
UPDATE assistance_requests SET created_at = now() WHERE created_at IS NULL;
UPDATE assistance_requests SET updated_at = now() WHERE updated_at IS NULL;

ALTER TABLE assistance_requests ALTER COLUMN request_type SET NOT NULL;
ALTER TABLE assistance_requests ALTER COLUMN status SET NOT NULL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_assistance_requests_restaurant_status ON assistance_requests(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_assistance_requests_created_at ON assistance_requests(restaurant_id, created_at DESC);

-- Comentarios
COMMENT ON COLUMN assistance_requests.request_type IS 'Tipo: cutlery, napkins, waiter, coffeeRefill, custom, etc.';
COMMENT ON COLUMN assistance_requests.message IS 'Texto mostrado (ej. label traducido o mensaje personalizado).';
