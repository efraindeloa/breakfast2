# Cómo Verificar tus Credenciales de Supabase

## Formato Correcto

### ✅ URL (Correcta)
```
VITE_SUPABASE_URL=https://tkwackqrnsqlmxtalvuw.supabase.co
```
Tu URL está **correcta** ✅

### ⚠️ Anon Key (Verificar)

La clave anon de Supabase tradicionalmente tiene este formato:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY5ODc2MDAsImV4cCI6MjAzMjU2MzYwMH0...
```

Es un **token JWT largo** que comienza con `eyJ`.

## Dónde Encontrar la Clave Correcta

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **Settings** (Configuración) en el menú lateral
4. Haz clic en **API** en el submenú
5. Busca la sección **Project API keys**
6. Deberías ver:
   - **anon** `public` - Esta es la que necesitas
   - **service_role** `secret` - NO uses esta (es privada)

## Formato Esperado

La clave **anon** debería verse así:
- Comienza con `eyJ` (es un token JWT)
- Es muy larga (varios cientos de caracteres)
- NO tiene el prefijo `sb_publishable_`

## Si tu clave tiene formato `sb_publishable_`

Esto podría ser:
1. Una clave de una versión diferente de Supabase
2. Una clave de otro servicio
3. Una clave incorrecta

**Solución**: Ve al dashboard de Supabase y copia la clave **anon** `public` que comienza con `eyJ`.

## Verificar que Funciona

Después de configurar las variables, puedes verificar en la consola del navegador:
- Si ves: `⚠️ Supabase URL o Anon Key no están configuradas` → Las variables no están cargadas
- Si no ves ese mensaje → La configuración está correcta

## Ejemplo Completo Correcto

```env
VITE_SUPABASE_URL=https://tkwackqrnsqlmxtalvuw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU3NzEsImV4cCI6MjA4NDY5MTc3MX0.1PG0x0ZdAAjhunyiPBRzpgpsr9nZGV5epHdUvalHqbA
```

**✅ Este es el formato correcto que debes usar en tu archivo `.env`**
