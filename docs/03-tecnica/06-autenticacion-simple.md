# Autenticación Simple

## Descripción

El sistema usa autenticación simple basada en la tabla `users` con contraseñas hasheadas. **NO usa Supabase Auth** para simplificar el proceso.

## Arquitectura

### Tabla `users`
- `id` (UUID) - ID único del usuario
- `email` (TEXT) - Email único
- `name` (TEXT) - Nombre de usuario
- `phone` (TEXT) - Teléfono opcional
- `password_hash` (TEXT) - Contraseña hasheada con SHA-256
- `is_active` (BOOLEAN) - Estado activo

### Flujo de Registro

1. Usuario ingresa: email/phone/username, password, nombre restaurante (opcional)
2. `simpleSignUp()` verifica si el usuario existe
3. Hashea la contraseña con SHA-256
4. Inserta directamente en la tabla `users`
5. Si es restaurante, crea el restaurante y asocia al usuario como owner
6. Guarda sesión en `localStorage` como `simpleAuthUser`

### Flujo de Login

1. Usuario ingresa: email/phone/username, password
2. `simpleSignIn()` busca el usuario por email, phone o name
3. Verifica la contraseña comparando hashes
4. Si es correcta, guarda sesión en `localStorage`
5. `AuthContext` detecta la sesión y actualiza el estado

## Archivos Clave

- `utils/password.ts` - Funciones de hash/verificación
- `services/simple-auth.ts` - Funciones de registro/login
- `contexts/AuthContext.tsx` - Maneja sesión simple desde localStorage
- `screens/RegisterScreen.tsx` - Usa `simpleSignUp`
- `screens/WelcomeScreen.tsx` - Usa `simpleSignIn`

## Políticas RLS

Las políticas RLS están simplificadas para permitir operaciones sin requerir Supabase Auth:

- **restaurants**: Permite INSERT sin restricciones (validación en código)
- **restaurant_staff**: Permite INSERT sin restricciones (validación en código)
- **users**: Permite INSERT/UPDATE/SELECT para usuarios autenticados

Ver: `supabase/fix-rls-for-simple-auth.sql`

## Seguridad

⚠️ **Nota**: SHA-256 no es lo más seguro para contraseñas. Para producción, considera:
- Usar bcrypt o argon2 en el servidor
- Implementar rate limiting
- Agregar 2FA si es necesario

## Mensajes de Error

- "El usuario no existe" - Cuando el usuario no se encuentra
- "La contraseña es incorrecta" - Cuando la contraseña no coincide
