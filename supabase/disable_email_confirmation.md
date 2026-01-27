# Desactivar Confirmación de Email en Supabase

Para eliminar la necesidad de confirmación por email, sigue estos pasos:

## Pasos en el Dashboard de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** > **Sign In / Providers** (o **Proveedores de inicio de sesión**)
3. Busca la sección **"Email"** en la lista de proveedores
4. Haz clic en **"Email"** para expandir la configuración
5. Busca la opción **"Enable email confirmations"** o **"Confirm email"** (Habilitar confirmaciones de email)
6. **Desactiva** esta opción (toggle OFF)
7. Guarda los cambios

**Alternativa:** Si no encuentras la opción en "Sign In / Providers", también puedes:
- Ir a **Authentication** > **URL Configuration**
- Buscar configuraciones relacionadas con confirmación de email

## Script SQL (Para usuarios existentes):

Ejecuta el script `disable_email_confirmation_v2.sql` para marcar todos los usuarios existentes como verificados:

```sql
-- Actualizar usuarios existentes
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
```

## Resultado:

Después de desactivar esta opción:
- Los usuarios podrán iniciar sesión inmediatamente después de registrarse
- No recibirán un email de confirmación
- No necesitarán hacer clic en ningún enlace de confirmación

## Nota:

El código de la aplicación ya está actualizado para manejar usuarios sin confirmación de email. Solo necesitas hacer este cambio en el dashboard de Supabase.
