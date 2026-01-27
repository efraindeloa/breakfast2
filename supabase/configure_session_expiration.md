# Configurar Expiración de Sesiones en Supabase

Para que las credenciales de autenticación nunca expiren o tengan un tiempo de expiración muy largo, necesitas configurar esto en el dashboard de Supabase.

## Pasos para Configurar

### 1. Acceder a la Configuración de Autenticación

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Authentication** en el menú lateral
4. Haz clic en **Settings** (Configuración)

### 2. Configurar Tiempo de Expiración de Tokens

En la sección **JWT Settings** o **Token Expiration**, encontrarás las siguientes opciones:

#### Opciones Disponibles:

- **JWT expiry**: Tiempo de expiración del token JWT (por defecto: 3600 segundos = 1 hora)
- **Refresh token expiry**: Tiempo de expiración del refresh token (por defecto: 30 días)

#### Recomendaciones:

Para que las sesiones prácticamente nunca expiren:

1. **JWT expiry**: Configura a un valor muy alto (ej: 31536000 segundos = 1 año)
   - O puedes configurarlo a 0 para que nunca expire (si está disponible)

2. **Refresh token expiry**: Configura a un valor muy alto (ej: 31536000 segundos = 1 año)
   - O puedes configurarlo a 0 para que nunca expire (si está disponible)

### 3. Configuración SQL (Alternativa)

Si prefieres configurarlo mediante SQL, puedes ejecutar el siguiente script en el **SQL Editor** de Supabase:

```sql
-- Configurar JWT expiry a 1 año (31536000 segundos)
-- Nota: Esto requiere acceso a la configuración del proyecto
-- Por defecto, Supabase limita esto por seguridad

-- Verificar configuración actual
SELECT * FROM auth.config;

-- Actualizar configuración (requiere permisos de administrador)
-- NOTA: Esta configuración generalmente se hace desde el dashboard
-- y no directamente desde SQL por razones de seguridad
```

### 4. Configuración en el Cliente (Ya Implementada)

El código ya está configurado para:

- ✅ **autoRefreshToken: true**: Los tokens se renuevan automáticamente
- ✅ **Renovación periódica**: Cada 30 minutos se renueva la sesión automáticamente
- ✅ **Persistencia de sesión**: La sesión se guarda en localStorage

### 5. Verificar Configuración

Para verificar que la configuración está funcionando:

1. Inicia sesión en la aplicación
2. Abre la consola del navegador (F12)
3. Busca mensajes como: `[AuthContext] Session refreshed successfully`
4. Verifica que no aparezcan errores de sesión expirada

### Notas Importantes

⚠️ **Seguridad**: Configurar tokens que nunca expiran puede ser un riesgo de seguridad. Considera:

- Usar tokens con expiración larga pero no infinita
- Implementar renovación automática (ya implementado)
- Considerar requerir re-autenticación para operaciones sensibles

✅ **Mejores Prácticas**:

- La aplicación ya implementa renovación automática de tokens cada 30 minutos
- Los tokens se renuevan automáticamente antes de expirar
- La sesión se persiste en localStorage para mantener al usuario autenticado

### Solución Implementada en el Código

El código ya incluye:

1. **Renovación automática**: Los tokens se renuevan cada 30 minutos
2. **Auto-refresh**: `autoRefreshToken: true` en la configuración de Supabase
3. **Persistencia**: La sesión se guarda en localStorage

Con estas configuraciones, incluso si los tokens tienen un tiempo de expiración, se renovarán automáticamente antes de expirar, manteniendo al usuario autenticado indefinidamente.
