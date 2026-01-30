-- Agregar columnas adicionales para promociones
-- Estas columnas almacenan información de segmentación de clientes y contador flash

-- Columna para segmentación de clientes (all, new, vip)
ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS client_segmentation TEXT DEFAULT 'all';

-- Columna para activar contador flash
ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS flash_counter BOOLEAN DEFAULT false;

-- Comentarios para documentar las columnas
COMMENT ON COLUMN promotions.client_segmentation IS 'Segmentación de clientes: all, new, vip';
COMMENT ON COLUMN promotions.flash_counter IS 'Indica si se debe mostrar un contador flash para la promoción';
