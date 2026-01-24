-- ==================== ACTUALIZAR USER_ID DE ÓRDENES ====================
-- Este script actualiza el user_id de las órdenes para que coincida con el user_id actual
-- Úsalo cuando el user_id en localStorage no coincide con el de las órdenes en la BD

-- Reemplaza 'TU_USER_ID_ACTUAL' con el user_id que aparece en los logs de la consola
-- Ejemplo: 'cde1008a-f9f0-4529-8530-cc156fd83390'

-- Opción 1: Actualizar todas las órdenes de un user_id antiguo a uno nuevo
UPDATE orders
SET user_id = 'cde1008a-f9f0-4529-8530-cc156fd83390'  -- Nuevo user_id (del localStorage actual)
WHERE user_id = '509a8cd6-8add-4bd9-9745-b6850a7ac08e';  -- user_id antiguo (de la orden en BD)

-- Opción 2: Actualizar una orden específica por su ID
-- UPDATE orders
-- SET user_id = 'cde1008a-f9f0-4529-8530-cc156fd83390'
-- WHERE id = '03e615c4-bf3f-46a3-962f-e17c0215b063';

-- Verificar que se actualizó correctamente
SELECT 
  id,
  user_id,
  status,
  total,
  created_at
FROM orders
WHERE user_id = 'cde1008a-f9f0-4529-8530-cc156fd83390';
