-- ==================== QUERIES PARA OBTENER SUGERENCIAS DEL CHEF ====================
-- Estas queries muestran los productos que un restaurante tiene marcados como sugerencias del chef

-- ==================== QUERY 1: PRODUCTOS COMO SUGERENCIAS DEL CHEF (BÁSICA) ====================
-- Obtiene todos los productos marcados como sugerencias del chef para un restaurante específico
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
    rms.category AS menu_category,  -- Categoría en la que aparece como sugerencia
    rms.section_type
FROM 
    restaurant_menu_sections rms
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
INNER JOIN products p ON p.id = product_id
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
ORDER BY 
    rms.category,
    p.name;

-- ==================== QUERY 2: PRODUCTOS AGRUPADOS POR CATEGORÍA ====================
-- Muestra los productos organizados por la categoría en la que aparecen como sugerencia

SELECT 
    rms.category AS menu_category,
    json_agg(
        json_build_object(
            'id', p.id,
            'name', p.name,
            'description', p.description,
            'price', p.price,
            'image_url', p.image_url,
            'category', p.category,
            'origin', p.origin,
            'badges', p.badges
        ) ORDER BY p.name
    ) AS products
FROM 
    restaurant_menu_sections rms
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
INNER JOIN products p ON p.id = product_id
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
GROUP BY 
    rms.category
ORDER BY 
    rms.category;

-- ==================== QUERY 3: CON INFORMACIÓN DEL RESTAURANTE ====================
-- Incluye información del restaurante junto con los productos

SELECT 
    r.id AS restaurant_id,
    r.name AS restaurant_name,
    rms.category AS menu_category,
    p.id AS product_id,
    p.name AS product_name,
    p.description AS product_description,
    p.price,
    p.image_url,
    p.category AS product_category,
    p.origin,
    p.badges
FROM 
    restaurants r
INNER JOIN restaurant_menu_sections rms ON rms.restaurant_id = r.id
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
INNER JOIN products p ON p.id = product_id
WHERE 
    r.id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
    AND r.is_active = true
ORDER BY 
    rms.category,
    p.name;

-- ==================== QUERY 4: CONTEO DE PRODUCTOS POR CATEGORÍA ====================
-- Muestra cuántos productos tiene el restaurante como sugerencias del chef en cada categoría

SELECT 
    rms.category AS menu_category,
    COUNT(DISTINCT p.id) AS total_products,
    array_agg(DISTINCT p.id ORDER BY p.id) AS product_ids,
    array_agg(DISTINCT p.name ORDER BY p.name) AS product_names
FROM 
    restaurant_menu_sections rms
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
INNER JOIN products p ON p.id = product_id
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
    AND p.is_active = true
GROUP BY 
    rms.category
ORDER BY 
    rms.category;

-- ==================== QUERY 5: PRODUCTOS CON VERIFICACIÓN DE EXISTENCIA ====================
-- Incluye solo productos que realmente existen y están activos
-- Útil para detectar productos eliminados que aún están referenciados

SELECT 
    rms.category AS menu_category,
    p.id AS product_id,
    p.name AS product_name,
    p.price,
    p.is_active AS product_is_active,
    CASE 
        WHEN p.id IS NULL THEN 'Producto no encontrado'
        WHEN p.is_active = false THEN 'Producto inactivo'
        ELSE 'OK'
    END AS status
FROM 
    restaurant_menu_sections rms
CROSS JOIN LATERAL unnest(rms.product_ids) AS product_id
LEFT JOIN products p ON p.id = product_id
WHERE 
    rms.restaurant_id = '050671c2-f1e0-4455-b1cc-ed0774a3e0f4'  -- ID del restaurante
    AND rms.section_type = 'chef_suggestions'
ORDER BY 
    rms.category,
    CASE 
        WHEN p.id IS NULL THEN 1
        WHEN p.is_active = false THEN 2
        ELSE 3
    END,
    p.name;

-- ==================== QUERY 6: PARA CUALQUIER RESTAURANTE (FUNCIÓN) ====================
-- Crea una función reutilizable para obtener sugerencias del chef de cualquier restaurante

CREATE OR REPLACE FUNCTION get_chef_suggestions(p_restaurant_id UUID)
RETURNS TABLE (
    product_id INTEGER,
    product_name TEXT,
    product_description TEXT,
    product_price NUMERIC,
    product_image_url TEXT,
    product_category TEXT,
    menu_category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.image_url,
        p.category,
        rms.category
    FROM 
        restaurant_menu_sections rms
    CROSS JOIN LATERAL unnest(rms.product_ids) AS pid
    INNER JOIN products p ON p.id = pid
    WHERE 
        rms.restaurant_id = p_restaurant_id
        AND rms.section_type = 'chef_suggestions'
        AND p.is_active = true
    ORDER BY 
        rms.category,
        p.name;
END;
$$ LANGUAGE plpgsql;

-- Uso de la función:
-- SELECT * FROM get_chef_suggestions('050671c2-f1e0-4455-b1cc-ed0774a3e0f4'::UUID);
