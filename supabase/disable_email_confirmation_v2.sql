-- ==================== DESACTIVAR CONFIRMACIÓN DE EMAIL ====================
-- Este script desactiva la confirmación de email en Supabase
--
-- IMPORTANTE: La confirmación de email también se puede desactivar desde el Dashboard:
-- 1. Ve a Authentication > Sign In / Providers
-- 2. Busca la sección "Email" o "Email Auth"
-- 3. Desactiva "Enable email confirmations" o "Require email confirmation"
-- 4. Guarda los cambios
--
-- Este script SQL actualiza los usuarios existentes para marcarlos como verificados

-- Actualizar todos los usuarios existentes para marcarlos como email_verified = true
-- Esto permite que los usuarios existentes puedan iniciar sesión sin confirmar email
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- También actualizar el campo email_verified en user_metadata si existe
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{email_verified}',
  'true'::jsonb
)
WHERE raw_user_meta_data->>'email_verified' IS NULL 
   OR raw_user_meta_data->>'email_verified' = 'false';

-- Verificar que los usuarios tienen email_confirmed_at
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'email_verified' as email_verified_metadata,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
