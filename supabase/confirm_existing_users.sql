-- ==================== CONFIRMAR USUARIOS EXISTENTES ====================
-- Este script marca todos los usuarios existentes como verificados
-- Ejecuta este script en el SQL Editor de Supabase después de desactivar
-- la confirmación de email en el Dashboard

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
