-- ==================== CORREGIR TIPOS DE CUENTA EXISTENTES ====================
-- Este script actualiza los usuarios que son dueños de restaurantes 
-- pero tienen account_type = 'customer' a account_type = 'owner'

-- Verificar usuarios que son owners pero están marcados como customer
SELECT 
    u.id,
    u.email,
    u.name,
    u.account_type as current_account_type,
    rs.role as restaurant_role,
    r.name as restaurant_name
FROM users u
JOIN restaurant_staff rs ON u.id = rs.user_id
JOIN restaurants r ON rs.restaurant_id = r.id
WHERE u.account_type = 'customer' 
  AND rs.role = 'owner'
  AND rs.is_active = true
  AND u.is_active = true;

-- Actualizar usuarios que son owners de restaurantes
UPDATE users 
SET 
    account_type = 'owner',
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT u.id
    FROM users u
    JOIN restaurant_staff rs ON u.id = rs.user_id
    WHERE u.account_type = 'customer' 
      AND rs.role = 'owner'
      AND rs.is_active = true
      AND u.is_active = true
);

-- Verificar el resultado
SELECT 
    COUNT(*) as total_owners_updated,
    'Usuarios actualizados a account_type = owner' as description
FROM users u
JOIN restaurant_staff rs ON u.id = rs.user_id
WHERE u.account_type = 'owner' 
  AND rs.role = 'owner'
  AND rs.is_active = true
  AND u.is_active = true;

-- Mostrar resumen final
SELECT 
    account_type,
    COUNT(*) as total_users
FROM users 
WHERE is_active = true
GROUP BY account_type
ORDER BY account_type;