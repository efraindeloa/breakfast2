-- ==================== TABLA DE PRODUCTOS ====================

-- Tabla de Productos (Platillos, Bebidas, Postres, Coctelería)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL, -- Formato: "$XX.XX"
  image TEXT NOT NULL,
  badges TEXT[], -- Array de badges: ['vegano', 'especialidad', 'favorito']
  category TEXT NOT NULL, -- 'Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Coctelería'
  origin TEXT NOT NULL DEFAULT '', -- 'mar', 'tierra', 'aire', 'vegetariano', 'vegano', 'cafe', 'digestivos', 'pastel', 'pay_de_queso', ''
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_origin ON products(origin);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

-- Función para actualizar updated_at automáticamente
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer productos activos
CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Política: Solo administradores pueden insertar/actualizar (por ahora permitimos todo para desarrollo)
CREATE POLICY "Anyone can manage products"
  ON products FOR ALL
  USING (true)
  WITH CHECK (true);
