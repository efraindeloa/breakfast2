-- ==================== QUERY DIRECTA PARA OBTENER SUGERENCIAS DEL CHEF ====================
-- Esta query funciona directamente sin necesidad de crear funciones
-- Reemplaza '050671c2-f1e0-4455-b1cc-ed0774a3e0f4' con el ID del restaurante que necesites

SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    p.origin,
    p.badges,
    p.is_active,
    rms.category AS menu_category,
    rms.section_type
FROM 
    restaurant_menu_sections rms
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
INNER JOIN products p ON p.id = product_id
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'::UUID  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
ORDER BY 
    rms.category,
    p.name;

-- ==================== ALTERNATIVA: USANDO ANY() EN LUGAR DE UNNEST ====================
-- Esta versión es más simple pero puede ser menos eficiente con muchos productos

SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.image_url,
    p.category,
    p.origin,
    p.badges,
    p.is_active,
    rms.category AS menu_category
FROM 
    restaurant_menu_sections rms
INNER JOIN products p ON p.id = ANY(rms.product_ids)
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'::UUID
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
ORDER BY 
    rms.category,
    p.name;
