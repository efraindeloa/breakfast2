-- ==================== DESACTIVAR CONFIRMACIÓN DE EMAIL ====================
-- Este script marca todos los usuarios como verificados para que puedan iniciar sesión
-- sin necesidad de confirmar su email
--
-- NOTA: En versiones recientes de Supabase, la confirmación de email puede estar
-- desactivada por defecto. Si los usuarios aún no pueden iniciar sesión, ejecuta este script.

-- Actualizar todos los usuarios existentes para marcarlos como email_verified = true
-- Esto permite que los usuarios existentes puedan iniciar sesión sin confirmar email
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- También actualizar el campo email_verified en user_metadata
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

-- Verificar configuración de auth (si es accesible)
-- Nota: Esta tabla puede no ser accesible dependiendo de los permisos
SELECT 
  key,
  value
FROM auth.config
WHERE key LIKE '%email%' OR key LIKE '%confirm%'
LIMIT 20;
