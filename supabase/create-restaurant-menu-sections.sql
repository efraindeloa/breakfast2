-- ==================== TABLA DE CONFIGURACIÓN DE SECCIONES DEL MENÚ ====================
-- Almacena las configuraciones de "Sugerencias del chef", "Destacados" y "Menú" por restaurante

CREATE TABLE IF NOT EXISTS restaurant_menu_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN ('chef_suggestions', 'highlights', 'menu_items')),
  category TEXT NOT NULL, -- 'Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Coctelería'
  product_ids INTEGER[] NOT NULL DEFAULT '{}', -- Array de IDs de productos
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, section_type, category)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_sections_restaurant_id ON restaurant_menu_sections(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_sections_section_type ON restaurant_menu_sections(section_type);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_sections_category ON restaurant_menu_sections(category);
CREATE INDEX IF NOT EXISTS idx_restaurant_menu_sections_restaurant_section ON restaurant_menu_sections(restaurant_id, section_type);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_restaurant_menu_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_restaurant_menu_sections_updated_at ON restaurant_menu_sections;
CREATE TRIGGER update_restaurant_menu_sections_updated_at
  BEFORE UPDATE ON restaurant_menu_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_menu_sections_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE restaurant_menu_sections ENABLE ROW LEVEL SECURITY;

-- Política: Los restaurantes pueden ver sus propias configuraciones
CREATE POLICY "Restaurants can view their own menu sections"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
    )
  );

-- Política: Los restaurantes pueden insertar sus propias configuraciones
CREATE POLICY "Restaurants can insert their own menu sections"
  ON restaurant_menu_sections FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los restaurantes pueden actualizar sus propias configuraciones
CREATE POLICY "Restaurants can update their own menu sections"
  ON restaurant_menu_sections FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los restaurantes pueden eliminar sus propias configuraciones
CREATE POLICY "Restaurants can delete their own menu sections"
  ON restaurant_menu_sections FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_staff
      WHERE restaurant_staff.restaurant_id = restaurant_menu_sections.restaurant_id
      AND restaurant_staff.user_id = auth.uid()
      AND restaurant_staff.is_active = true
      AND restaurant_staff.role IN ('owner', 'admin', 'manager')
    )
  );

-- Política: Los comensales pueden ver las configuraciones de restaurantes activos
CREATE POLICY "Diners can view active restaurant menu sections"
  ON restaurant_menu_sections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = restaurant_menu_sections.restaurant_id
      AND restaurants.is_active = true
    )
  );
