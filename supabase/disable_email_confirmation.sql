-- ==================== DESACTIVAR CONFIRMACIÓN DE EMAIL ====================
-- Este script actualiza los usuarios existentes para marcarlos como verificados
-- 
-- IMPORTANTE: Este cambio también debe hacerse en el Dashboard de Supabase:
-- 1. Ve a tu proyecto en Supabase Dashboard
-- 2. Navega a Authentication > Settings
-- 3. En la sección "Email Auth", busca "Enable email confirmations"
-- 4. DESACTIVA esta opción
-- 5. Guarda los cambios
--
-- Este script SQL actualiza los usuarios existentes para marcarlos como verificados

-- Actualizar todos los usuarios existentes para marcarlos como email_verified = true
-- Esto permite que los usuarios existentes puedan iniciar sesión sin confirmar email
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Verificar que los usuarios tienen email_confirmed_at
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
