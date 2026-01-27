# Desactivar Confirmación de Email en Supabase

En versiones recientes de Supabase, **la confirmación de email puede estar desactivada por defecto**. Si los usuarios aún no pueden iniciar sesión después de registrarse, sigue estos pasos:

## Solución: Ejecutar Script SQL

La forma más confiable de asegurar que no se requiera confirmación de email es ejecutar este script SQL:

```sql
-- Marcar todos los usuarios existentes y futuros como verificados automáticamente
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- También actualizar user_metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{email_verified}',
  'true'::jsonb
)
WHERE raw_user_meta_data->>'email_verified' IS NULL 
   OR raw_user_meta_data->>'email_verified' = 'false';
```

**Ejecuta este script en el SQL Editor de Supabase:**
1. Ve a **SQL Editor** en tu proyecto
2. Pega el script SQL de arriba
3. Ejecuta el script
4. Esto marcará todos los usuarios existentes como verificados

## Crear Trigger para Usuarios Futuros (Opcional)

Para asegurar que los usuarios futuros también se marquen automáticamente como verificados, puedes crear un trigger:

```sql
-- Función para marcar email como confirmado automáticamente
CREATE OR REPLACE FUNCTION auto_confirm_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario no tiene email_confirmed_at, marcarlo como confirmado
  IF NEW.email_confirmed_at IS NULL THEN
    NEW.email_confirmed_at = NOW();
  END IF;
  
  -- Asegurar que email_verified esté en los metadatos
  IF NEW.raw_user_meta_data->>'email_verified' IS NULL OR 
     NEW.raw_user_meta_data->>'email_verified' = 'false' THEN
    NEW.raw_user_meta_data = jsonb_set(
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{email_verified}',
      'true'::jsonb
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger que se ejecuta antes de insertar un nuevo usuario
DROP TRIGGER IF EXISTS trigger_auto_confirm_email ON auth.users;
CREATE TRIGGER trigger_auto_confirm_email
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_email();
```

## El Código Ya Está Configurado

El código de la aplicación ya incluye:
- `email_verified: true` en los metadatos al registrarse
- Manejo correcto de usuarios sin confirmación

## Verificar que Funciona

1. Ejecuta el script SQL de arriba
2. Intenta registrar un nuevo usuario
3. Después del registro, deberías poder iniciar sesión inmediatamente
4. Los usuarios existentes también podrán iniciar sesión sin problemas

## Nota

En Supabase, la confirmación de email se controla principalmente desde la base de datos (`email_confirmed_at`). El código ya está configurado correctamente, pero necesitas ejecutar el script SQL para marcar los usuarios como verificados.
