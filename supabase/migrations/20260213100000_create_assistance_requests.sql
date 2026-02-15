-- =============================================================================
-- Solicitudes de asistencia (comensal → mesero/restaurante)
-- Cuando un comensal solicita asistencia (cuchara, mesero, etc.) se guarda aquí
-- y los meseros pueden verlas en tiempo real y marcarlas como atendidas.
-- =============================================================================

CREATE TABLE IF NOT EXISTS assistance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_number TEXT,
  request_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'attended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assistance_requests_restaurant_status
  ON assistance_requests(restaurant_id, status);

CREATE INDEX IF NOT EXISTS idx_assistance_requests_created_at
  ON assistance_requests(restaurant_id, created_at DESC);

COMMENT ON TABLE assistance_requests IS 'Solicitudes de asistencia de comensales (cuchara, mesero, etc.) para que el personal del restaurante las atienda.';
COMMENT ON COLUMN assistance_requests.request_type IS 'Tipo: cutlery, napkins, waiter, coffeeRefill, custom, etc.';
COMMENT ON COLUMN assistance_requests.message IS 'Texto mostrado (ej. label traducido o mensaje personalizado).';

-- Trigger updated_at
CREATE OR REPLACE FUNCTION set_assistance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_assistance_requests_updated_at ON assistance_requests;
CREATE TRIGGER trigger_assistance_requests_updated_at
  BEFORE UPDATE ON assistance_requests
  FOR EACH ROW
  EXECUTE PROCEDURE set_assistance_requests_updated_at();

-- RLS
ALTER TABLE assistance_requests ENABLE ROW LEVEL SECURITY;

-- Comensales (y invitados vía anon si aplica): pueden insertar para el restaurante que tengan seleccionado
-- En la app el comensal envía restaurant_id; permitimos insert si está autenticado o anon
CREATE POLICY "Allow insert assistance_requests for authenticated"
  ON assistance_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Invitados: permitir insertar (la app enviará restaurant_id del restaurante seleccionado)
CREATE POLICY "Allow insert assistance_requests for anon"
  ON assistance_requests FOR INSERT
  TO anon
  WITH CHECK (true);

-- Staff del restaurante: puede leer todas las solicitudes de su restaurante y actualizarlas
CREATE POLICY "Allow read assistance_requests for restaurant staff"
  ON assistance_requests FOR SELECT
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Allow update assistance_requests for restaurant staff"
  ON assistance_requests FOR UPDATE
  TO authenticated
  USING (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    restaurant_id IN (
      SELECT restaurant_id FROM restaurant_staff
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Realtime: habilitar en Dashboard de Supabase (Database → assistance_requests → Realtime)
-- para que los meseros reciban nuevas solicitudes al instante.
