-- =============================================================================
-- Configuración dinámica del Home por restaurante
-- El owner (o manager) define qué botones ven cada tipo de cuenta (diner, waiter, restaurant).
-- =============================================================================

-- Audiencia: quién ve estos botones
-- 'diner' = comensal
-- 'waiter' = mesero (staff con role waiter)
-- 'restaurant' = staff administrativo (owner, manager, etc.) en su home de restaurante

CREATE TABLE IF NOT EXISTS restaurant_home_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  audience TEXT NOT NULL CHECK (audience IN ('diner', 'waiter', 'restaurant')),
  button_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(restaurant_id, audience, button_id)
);

-- Índices para consultas por restaurante y audiencia
CREATE INDEX IF NOT EXISTS idx_restaurant_home_config_restaurant_audience
  ON restaurant_home_config(restaurant_id, audience);

CREATE INDEX IF NOT EXISTS idx_restaurant_home_config_position
  ON restaurant_home_config(restaurant_id, audience, position);

-- Comentarios
COMMENT ON TABLE restaurant_home_config IS 'Configuración de botones del home por restaurante y tipo de cuenta (audience). El owner define qué botones ven diner, waiter y restaurant.';
COMMENT ON COLUMN restaurant_home_config.audience IS 'diner | waiter | restaurant';
COMMENT ON COLUMN restaurant_home_config.button_id IS 'Identificador del botón/función (ej: menu, promotions, selectTable, assistanceRequests).';
COMMENT ON COLUMN restaurant_home_config.position IS 'Orden de aparición en el home (menor = más arriba/izquierda).';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION set_restaurant_home_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_restaurant_home_config_updated_at ON restaurant_home_config;
CREATE TRIGGER trigger_restaurant_home_config_updated_at
  BEFORE UPDATE ON restaurant_home_config
  FOR EACH ROW
  EXECUTE PROCEDURE set_restaurant_home_config_updated_at();

-- RLS
ALTER TABLE restaurant_home_config ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado puede leer la config de cualquier restaurante
-- (el comensal necesita leer la config del restaurante que eligió; el staff la de su restaurante)
CREATE POLICY "Allow read restaurant_home_config for authenticated"
  ON restaurant_home_config FOR SELECT
  TO authenticated
  USING (true);

-- Inserción/actualización/borrado: solo staff del restaurante con rol owner, manager o admin
CREATE POLICY "Allow manage restaurant_home_config for restaurant owner/manager"
  ON restaurant_home_config FOR ALL
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'manager', 'admin')
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'manager', 'admin')
    )
  );
