-- ==================== TABLA DE RESERVACIONES ====================
-- Tabla para almacenar las reservaciones de los comensales

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  number_of_people INTEGER NOT NULL CHECK (number_of_people > 0),
  zone TEXT NOT NULL,
  special_occasion TEXT,
  table_preferences TEXT,
  advance_order_items JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_date ON reservations(restaurant_id, reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_user_date ON reservations(user_id, reservation_date);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_reservations_updated_at();

-- ==================== POLÍTICAS RLS ====================

-- Habilitar RLS
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propias reservaciones
CREATE POLICY "Users can view their own reservations"
  ON reservations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden crear sus propias reservaciones
CREATE POLICY "Users can create their own reservations"
  ON reservations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propias reservaciones (solo si están pendientes o confirmadas)
CREATE POLICY "Users can update their own pending or confirmed reservations"
  ON reservations
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('pending', 'confirmed'))
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden cancelar sus propias reservaciones
CREATE POLICY "Users can cancel their own reservations"
  ON reservations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status = 'cancelled');

-- Política: Los restaurantes pueden ver todas las reservaciones de su restaurante
CREATE POLICY "Restaurants can view their restaurant reservations"
  ON reservations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.restaurant_id = reservations.restaurant_id
      AND restaurant_staff.is_active = true
    )
  );

-- Política: Los restaurantes pueden actualizar el estado de las reservaciones de su restaurante
CREATE POLICY "Restaurants can update their restaurant reservations status"
  ON reservations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.restaurant_id = reservations.restaurant_id
      AND restaurant_staff.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.restaurant_id = reservations.restaurant_id
      AND restaurant_staff.is_active = true
    )
  );
