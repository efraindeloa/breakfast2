# Desactivar Confirmación de Email en Supabase

Para eliminar la necesidad de confirmación por email, sigue estos pasos:

## Pasos en el Dashboard de Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** > **Settings** (o **Configuración**)
3. En la sección **Email Auth**, busca la opción **"Enable email confirmations"** (Habilitar confirmaciones de email)
4. **Desactiva** esta opción
5. Guarda los cambios

## Resultado:

Después de desactivar esta opción:
- Los usuarios podrán iniciar sesión inmediatamente después de registrarse
- No recibirán un email de confirmación
- No necesitarán hacer clic en ningún enlace de confirmación

## Nota:

El código de la aplicación ya está actualizado para manejar usuarios sin confirmación de email. Solo necesitas hacer este cambio en el dashboard de Supabase.
