-- Agregar columna badges a la tabla promotions
-- Esta columna almacenará las etiquetas que se usarán como filtros dinámicos

ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Comentario para documentar la columna
COMMENT ON COLUMN promotions.badges IS 'Array de etiquetas para filtros dinámicos en la interfaz de promociones';
