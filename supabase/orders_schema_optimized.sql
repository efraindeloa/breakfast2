-- ==================== DISEÑO OPTIMIZADO DE ÓRDENES ====================
-- Este script implementa la separación de órdenes activas e historial
-- para mejor rendimiento y escalabilidad

-- ==================== TABLA DE ÓRDENES ACTIVAS ====================
-- Solo contiene órdenes en proceso (pending, en_preparacion, etc.)
DROP TABLE IF EXISTS orders CASCADE;
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  order_number TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 
    'orden_enviada', 
    'orden_recibida', 
    'en_preparacion', 
    'lista_para_entregar', 
    'en_entrega',
    'con_incidencias'
  )),
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL,
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  table_number TEXT,
  delivery_address JSONB,
  estimated_ready_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== TABLA DE HISTORIAL DE ÓRDENES ====================
-- Solo contiene órdenes completadas o canceladas
DROP TABLE IF EXISTS order_history CASCADE;
CREATE TABLE order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID, -- Referencia opcional a la orden original (si se migró)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  order_number TEXT,
  status TEXT NOT NULL CHECK (status IN ('entregada', 'cancelada')),
  total DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tip DECIMAL(10, 2) NOT NULL DEFAULT 0,
  items JSONB NOT NULL,
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'completed',
  table_number TEXT,
  delivery_address JSONB,
  -- Campos adicionales para historial
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE, -- Fecha original de creación
  -- Campos para estadísticas del restaurante
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_comment TEXT,
  -- Metadata adicional
  metadata JSONB -- Para datos adicionales como promociones aplicadas, etc.
);

-- ==================== ÍNDICES PARA ÓRDENES ACTIVAS ====================

-- Índices para consultas del comensal
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Índices para consultas del restaurante
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_status ON orders(restaurant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_created ON orders(restaurant_id, created_at DESC);

-- Índices generales
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number) WHERE order_number IS NOT NULL;

-- ==================== ÍNDICES PARA HISTORIAL ====================

-- Índices para consultas del comensal
CREATE INDEX IF NOT EXISTS idx_order_history_user_id ON order_history(user_id);
CREATE INDEX IF NOT EXISTS idx_order_history_user_completed ON order_history(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_user_status ON order_history(user_id, status);

-- Índices para consultas del restaurante
CREATE INDEX IF NOT EXISTS idx_order_history_restaurant_id ON order_history(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_order_history_restaurant_completed ON order_history(restaurant_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_restaurant_status ON order_history(restaurant_id, status);

-- Índices generales
CREATE INDEX IF NOT EXISTS idx_order_history_status ON order_history(status);
CREATE INDEX IF NOT EXISTS idx_order_history_completed_at ON order_history(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_order_number ON order_history(order_number) WHERE order_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_history_rating ON order_history(rating) WHERE rating IS NOT NULL;

-- Índice compuesto para reportes del restaurante
CREATE INDEX IF NOT EXISTS idx_order_history_restaurant_date ON order_history(restaurant_id, completed_at DESC, status);

-- ==================== FUNCIÓN PARA MIGRAR ORDEN A HISTORIAL ====================

CREATE OR REPLACE FUNCTION move_order_to_history(
  p_order_id UUID,
  p_new_status TEXT DEFAULT 'entregada'
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
  v_order_record RECORD;
BEGIN
  -- Validar que el status sea válido para historial
  IF p_new_status NOT IN ('entregada', 'cancelada') THEN
    RAISE EXCEPTION 'Status must be "entregada" or "cancelada"';
  END IF;

  -- Obtener la orden
  SELECT * INTO v_order_record
  FROM orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- Insertar en historial
  INSERT INTO order_history (
    order_id,
    user_id,
    restaurant_id,
    order_number,
    status,
    total,
    subtotal,
    tax,
    tip,
    items,
    notes,
    payment_method,
    payment_status,
    table_number,
    delivery_address,
    completed_at,
    created_at
  ) VALUES (
    v_order_record.id,
    v_order_record.user_id,
    v_order_record.restaurant_id,
    v_order_record.order_number,
    p_new_status,
    v_order_record.total,
    v_order_record.subtotal,
    v_order_record.tax,
    v_order_record.tip,
    v_order_record.items,
    v_order_record.notes,
    v_order_record.payment_method,
    'completed',
    v_order_record.table_number,
    v_order_record.delivery_address,
    NOW(),
    v_order_record.created_at
  ) RETURNING id INTO v_history_id;

  -- Eliminar de órdenes activas
  DELETE FROM orders WHERE id = p_order_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== TRIGGER PARA ACTUALIZAR updated_at ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== POLÍTICAS RLS ====================

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Políticas para orders (órdenes activas)
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Restaurants can view their orders" ON orders;
DROP POLICY IF EXISTS "Restaurants can update their orders" ON orders;

-- Políticas permisivas para desarrollo (permitir operaciones sin autenticación)
CREATE POLICY "Users can view their own orders" 
  ON orders FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own orders" 
  ON orders FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can update their own orders" 
  ON orders FOR UPDATE 
  USING (true);

-- Políticas para order_history (historial)
DROP POLICY IF EXISTS "Users can view their own order history" ON order_history;
DROP POLICY IF EXISTS "Users can insert their own order history" ON order_history;
DROP POLICY IF EXISTS "Restaurants can view their order history" ON order_history;

-- Políticas permisivas para desarrollo (permitir operaciones sin autenticación)
CREATE POLICY "Users can view their own order history" 
  ON order_history FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their own order history" 
  ON order_history FOR INSERT 
  WITH CHECK (true);

-- Nota: Las políticas para restaurantes se pueden agregar cuando se implemente autenticación de restaurantes

-- ==================== COMENTARIOS ====================

COMMENT ON TABLE orders IS 'Órdenes activas/en proceso. Se mueven a order_history cuando se completan o cancelan.';
COMMENT ON TABLE order_history IS 'Historial de órdenes completadas o canceladas. Principalmente solo lectura.';
COMMENT ON FUNCTION move_order_to_history IS 'Migra una orden de orders a order_history cuando se completa o cancela.';
