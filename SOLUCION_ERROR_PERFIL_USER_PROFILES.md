# 🔧 Solución: Error al Guardar Cambios del Perfil - user_profiles.id no existe

## 📋 Problema Identificado

Al intentar guardar cambios en el perfil de usuario, se producía el siguiente error:

```
[API Error] Error al actualizar perfil de usuario: {
  code: '42703', 
  details: null, 
  hint: null, 
  message: 'column user_profiles.id does not exist'
}
```

**Stack trace del error:**
```
GET https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/user_profiles?select=id&user_id=eq.dc678b91-1be7-477e-9f0b-3c7854084f68 400 (Bad Request)
```

## 🎯 Causa Raíz

El código en `services/api/user.ts` estaba intentando hacer un `select('id')` en la tabla `user_profiles`, pero esta tabla **no tiene una columna `id`**. La clave primaria de `user_profiles` es `user_id`, no `id`.

### Estructura Correcta de user_profiles:

```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,  -- ✅ Clave primaria
  name TEXT,
  phone TEXT,
  bio TEXT,
  gender TEXT,
  country TEXT,
  city TEXT,
  state TEXT,
  address TEXT,
  postal_code TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ✅ Solución Implementada

### 1. Corrección en services/api/user.ts

**Problema en línea 192:**
```typescript
// ❌ ANTES (Incorrecto)
const { data: existing, error: checkError } = await supabase
  .from('user_profiles')
  .select('id')  // ❌ Columna 'id' no existe
  .eq('user_id', targetUserId)
  .maybeSingle();
```

**Solución aplicada:**
```typescript
// ✅ DESPUÉS (Correcto)
const { data: existing, error: checkError } = await supabase
  .from('user_profiles')
  .select('user_id')  // ✅ Usar 'user_id' que sí existe
  .eq('user_id', targetUserId)
  .maybeSingle();
```

**Problema en línea 203:**
```typescript
// ❌ ANTES (Incorrecto)
if (existing && existing.id) {  // ❌ Propiedad 'id' no existe
```

**Solución aplicada:**
```typescript
// ✅ DESPUÉS (Correcto)
if (existing && existing.user_id) {  // ✅ Usar 'user_id'
```

### 2. Script de Verificación y Corrección

Se creó `scripts/fix-user-profiles-structure.sql` para:

- ✅ Verificar que la tabla `user_profiles` existe
- ✅ Confirmar que **NO** tiene una columna `id` incorrecta
- ✅ Verificar que tiene `user_id` como clave primaria
- ✅ Configurar RLS correctamente para autenticación simple
- ✅ Crear índices necesarios
- ✅ Mostrar estructura final de la tabla

## 🚀 Resultado

### ✅ Antes del Fix:
```sql
-- Error 400: Bad Request
SELECT id FROM user_profiles WHERE user_id = 'xxx'
-- ❌ column "id" does not exist
```

### ✅ Después del Fix:
```sql
-- Consulta exitosa
SELECT user_id FROM user_profiles WHERE user_id = 'xxx'
-- ✅ Funciona correctamente
```

## 🔍 Verificación de la Solución

### 1. Código Corregido:

**Función updateUserProfile en user.ts:**
```typescript
// Verificar si existe el perfil
const { data: existing, error: checkError } = await supabase
  .from('user_profiles')
  .select('user_id')  // ✅ Correcto
  .eq('user_id', targetUserId)
  .maybeSingle();

// Verificar existencia
if (existing && existing.user_id) {  // ✅ Correcto
  // Actualizar perfil existente
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', targetUserId)
    .select()
    .single();
} else {
  // Crear nuevo perfil
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: targetUserId,
      ...updateData,
    })
    .select()
    .single();
}
```

### 2. Estructura de Tabla Verificada:

| Columna | Tipo | Restricciones |
|---------|------|---------------|
| **user_id** | UUID | PRIMARY KEY, REFERENCES users(id) |
| name | TEXT | NULL |
| phone | TEXT | NULL |
| bio | TEXT | NULL |
| avatar_url | TEXT | NULL |
| ... | ... | ... |

## 🧪 Cómo Probar la Solución

### 1. Verificar Estructura de BD:
```sql
-- Ejecutar el script de verificación
\i scripts/fix-user-profiles-structure.sql
```

### 2. Probar Actualización de Perfil:
1. **Ir al perfil de usuario:**
   - Navegar a `/profile`
   - Hacer clic en "Editar perfil"

2. **Modificar datos:**
   - Cambiar nombre, teléfono, etc.
   - Hacer clic en "Guardar"

3. **Verificar resultado:**
   - ✅ No debe aparecer error 400
   - ✅ Debe mostrar mensaje de éxito
   - ✅ Los cambios deben persistir

### 3. Verificar en Consola:
```javascript
// En DevTools, verificar que no hay errores:
// ❌ ANTES: Error 42703 "column user_profiles.id does not exist"
// ✅ DESPUÉS: Sin errores, operación exitosa
```

## 📁 Archivos Modificados

- ✅ `services/api/user.ts` - Corregidas referencias a columna inexistente
- ✅ `scripts/fix-user-profiles-structure.sql` - Script de verificación y corrección

## 🔄 Impacto en Funcionalidad

### ✅ Funciones Afectadas (Ahora Funcionan):
- **Actualizar perfil de usuario**: Nombre, teléfono, avatar, etc.
- **Crear perfil nuevo**: Para usuarios que no tienen perfil extendido
- **Verificar existencia de perfil**: Antes de actualizar o crear

### ✅ Operaciones Restauradas:
- **Edición de perfil**: Formulario de edición funciona correctamente
- **Guardado de cambios**: Sin errores 400
- **Sincronización de datos**: Entre `users` y `user_profiles`

## 🎯 Diferencias Clave: users vs user_profiles

### Tabla `users` (Datos Esenciales):
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,  -- ✅ Tiene columna 'id'
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  password_hash TEXT,
  account_type account_type_enum DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla `user_profiles` (Datos Extendidos):
```sql
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY,  -- ✅ NO tiene 'id', usa 'user_id'
  name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferences JSONB,
  -- ... más campos opcionales
);
```

## 🚨 Lecciones Aprendidas

### ✅ Buenas Prácticas:
1. **Verificar estructura de BD**: Antes de escribir consultas
2. **Usar nombres consistentes**: `id` vs `user_id` puede causar confusión
3. **Probar con datos reales**: Los errores aparecen en uso real
4. **Documentar estructura**: Evita malentendidos futuros

### ✅ Patrones de Código:
```typescript
// ✅ CORRECTO: Verificar qué columnas existen
const { data } = await supabase
  .from('user_profiles')
  .select('user_id')  // Usar la columna que realmente existe
  .eq('user_id', userId);

// ❌ INCORRECTO: Asumir estructura sin verificar
const { data } = await supabase
  .from('user_profiles')
  .select('id')  // Puede no existir
  .eq('user_id', userId);
```

---

**Nota**: Esta solución corrige el error específico de la columna inexistente y restaura la funcionalidad completa de edición de perfiles de usuario.