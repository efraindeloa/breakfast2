-- ==================== CORRECCIÓN DE POLÍTICAS RLS PARA ÓRDENES ====================
-- Este script corrige las políticas RLS para permitir operaciones sin autenticación
-- (necesario para desarrollo con usuarios anónimos)

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
