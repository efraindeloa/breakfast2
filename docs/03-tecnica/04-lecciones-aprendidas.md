# 📚 Lecciones Aprendidas y Patrones Reutilizables

> **Propósito**: Este documento captura el conocimiento técnico, decisiones arquitectónicas y patrones que pueden ser reutilizados en futuras aplicaciones.

**Última actualización**: 2025-01-30

---

## 🎯 Tabla de Contenidos

1. [Arquitectura de Base de Datos](#arquitectura-de-base-de-datos)
2. [Patrones de API](#patrones-de-api)
3. [Gestión de Estado](#gestión-de-estado)
4. [Autenticación y Seguridad](#autenticación-y-seguridad)
5. [Manejo de Errores](#manejo-de-errores)
6. [Internacionalización](#internacionalización)
7. [Optimizaciones de Rendimiento](#optimizaciones-de-rendimiento)
8. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)

---

## 🗄️ Arquitectura de Base de Datos

### Separación: `users` vs `user_profiles`

**Lección**: Separar datos esenciales de autenticación de datos extendidos del perfil.

#### Tabla `users` (Datos Esenciales)
```sql
-- Información requerida para autenticación y operaciones básicas
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT,
  is_active BOOLEAN,
  email_verified BOOLEAN,
  phone_verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login_at TIMESTAMP
);
```

**Cuándo usar `users`**:
- Verificar si un usuario existe
- Autenticación y autorización
- Datos básicos: email, phone, name
- Estado de verificación
- Último login

#### Tabla `user_profiles` (Datos Extendidos)
```sql
-- Información opcional del perfil
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
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
  date_of_birth DATE,  -- ⚠️ NO en users, solo aquí
  preferences JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Cuándo usar `user_profiles`**:
- Mostrar/editar perfil completo
- Información extendida opcional
- Preferencias del usuario
- Datos demográficos

**Razones de esta separación**:
- ✅ `users` es más ligera y rápida para consultas de autenticación
- ✅ `user_profiles` puede no existir (usuario nuevo)
- ✅ Separación clara de responsabilidades
- ✅ Mejor rendimiento en consultas frecuentes

### Row Level Security (RLS)

**Lección**: Configurar RLS correctamente desde el inicio evita muchos errores 403/406.

#### Patrón para RLS en `user_profiles`
```sql
-- Política SELECT: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política INSERT: Usuarios pueden crear su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política UPDATE: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );
```

**Errores comunes**:
- ❌ No usar `.maybeSingle()` cuando el perfil puede no existir → Error 406
- ❌ Políticas que no verifican `auth.uid() IS NOT NULL`
- ❌ Olvidar `WITH CHECK` en políticas UPDATE

**Solución**:
- Usar `.maybeSingle()` en lugar de `.single()` cuando el registro puede no existir
- Siempre verificar `auth.uid() IS NOT NULL` en políticas RLS

---

## 🔌 Patrones de API

### Capa de Abstracción API

**Lección**: Crear una capa de API que abstraiga las llamadas directas a Supabase facilita mantenimiento y migración futura.

#### Estructura
```
services/
  api/
    types.ts          # Tipos comunes (ApiResponse, ApiError)
    base.ts           # Funciones base (handleSupabaseError, requireAuth)
    products.ts       # API de productos
    promotions.ts     # API de promociones
    user.ts           # API de usuarios
    restaurant.ts     # API de restaurantes
    orders.ts         # API de órdenes
    menu-sections.ts  # API de secciones de menú
    index.ts          # Exportaciones centralizadas
```

#### Patrón de Respuesta
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

#### Manejo de Errores Centralizado
```typescript
export async function handleSupabaseError<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Error en la operación'
): Promise<ApiResponse<T>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`[API Error] ${errorMessage}:`, error);
    
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || errorMessage,
      details: error,
    };

    return {
      success: false,
      error: apiError.message,
    };
  }
}
```

**Beneficios**:
- ✅ Manejo consistente de errores
- ✅ Fácil cambiar de Supabase a otro backend
- ✅ Logging centralizado
- ✅ Validación de configuración

---

## 🔐 Autenticación y Seguridad

### Manejo de Sesión y Loading States

**Lección**: El estado de carga puede quedarse atascado si no se maneja correctamente.

#### Problema Común
```typescript
// ❌ MAL: Puede quedarse en loading=true
useEffect(() => {
  getSession().then(session => {
    setUser(session?.user);
    // Si hay error, loading nunca se pone en false
  });
}, []);
```

#### Solución
```typescript
// ✅ BIEN: Siempre actualizar loading
useEffect(() => {
  let mounted = true;
  
  getSession()
    .then(session => {
      if (!mounted) return;
      setUser(session?.user);
      setLoading(false);
    })
    .catch(error => {
      if (!mounted) return;
      console.error('Error loading session:', error);
      setLoading(false);
    });

  // Safety timeout para evitar loading infinito
  const safetyTimeout = setTimeout(() => {
    if (mounted) {
      setLoading(false);
    }
  }, 5000);

  return () => {
    mounted = false;
    clearTimeout(safetyTimeout);
  };
}, []);
```

**Patrones clave**:
- ✅ Siempre usar `finally` o `.catch()` para `setLoading(false)`
- ✅ Safety timeout para evitar loading infinito
- ✅ Flag `mounted` para evitar actualizaciones después de unmount
- ✅ Limpiar timeouts en cleanup

### Verificación de Usuario en Base de Datos

**Lección**: Verificar que el usuario existe en `users` antes de permitir operaciones.

```typescript
const ensureUserExists = async (userId: string): Promise<void> => {
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  
  if (error && error.code !== 'PGRST116') {
    throw new Error('Error verificando usuario');
  }
  
  if (!existingUser) {
    throw new Error('Usuario no registrado');
  }
};
```

---

## 🎨 Gestión de Estado

### Context API vs Estado Local

**Lección**: Usar Context solo para estado global compartido, no para todo.

#### Cuándo usar Context
- ✅ Estado compartido entre múltiples componentes
- ✅ Estado que persiste entre navegaciones
- ✅ Estado que necesita sincronizarse con backend

#### Cuándo usar Estado Local
- ✅ Estado específico de un componente
- ✅ Estado temporal (modales, formularios)
- ✅ Estado que no se comparte

#### Estructura de Contextos
```typescript
// contexts/AuthContext.tsx - Autenticación global
// contexts/CartContext.tsx - Carrito compartido
// contexts/LanguageContext.tsx - Idioma global
// contexts/RestaurantContext.tsx - Configuración del restaurante
```

---

## 🌍 Internacionalización

### Sistema de Traducciones

**Lección**: Centralizar todas las traducciones y evitar texto hardcodeado.

#### Estructura
```
locales/
  es.json    # Español (default)
  en.json    # Inglés
  pt.json    # Portugués
  fr.json    # Francés
```

#### Uso
```typescript
const { t } = useTranslation();

// ✅ BIEN
<h1>{t('common.welcome')}</h1>

// ❌ MAL
<h1>Bienvenido</h1>
```

**Reglas**:
- ✅ Nunca hardcodear texto visible al usuario
- ✅ Usar claves descriptivas: `restaurant.menu.addProduct`
- ✅ Agregar traducciones a todos los idiomas simultáneamente

---

## ⚡ Optimizaciones de Rendimiento

### Debouncing en Guardado Automático

**Lección**: Usar debouncing para operaciones costosas que se ejecutan frecuentemente.

```typescript
const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

const handleChange = (value: string) => {
  setValue(value);
  
  // Cancelar timeout anterior
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  // Crear nuevo timeout
  const newTimeout = setTimeout(() => {
    saveToDatabase(value);
  }, 1000); // Esperar 1 segundo sin cambios
  
  setSaveTimeout(newTimeout);
};
```

### Validación de UUID

**Lección**: Validar UUIDs antes de hacer consultas a la base de datos.

```typescript
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Antes de consultar
if (!isValidUUID(id)) {
  console.warn(`ID "${id}" is not a valid UUID`);
  return;
}
```

---

## 🐛 Errores Comunes y Soluciones

### Error 406 (Not Acceptable)

**Causa**: RLS bloqueando acceso o usando `.single()` cuando el registro puede no existir.

**Solución**:
```typescript
// ❌ MAL
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .single(); // Error 406 si no existe

// ✅ BIEN
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle(); // Retorna null si no existe
```

### Error 409 (Conflict) - Unique Constraint

**Causa**: Intentar crear/actualizar con un valor que viola una restricción única.

**Solución para cambios de capitalización**:
```typescript
// Si solo cambia la capitalización, usar estrategia de dos pasos
if (oldName.toLowerCase() === newName.toLowerCase() && oldName !== newName) {
  // Paso 1: Cambiar a un nombre temporal único
  await updateProduct(id, { name: `${newName}_temp_${Date.now()}` });
  
  // Paso 2: Cambiar al nombre final
  await updateProduct(id, { name: newName });
}
```

### Nested Buttons en React

**Causa**: HTML no permite `<button>` dentro de `<button>`.

**Solución**:
```typescript
// ❌ MAL
<button onClick={handleClick}>
  <button onClick={handleFavorite}>⭐</button>
</button>

// ✅ BIEN
<button onClick={handleClick}>
  <div 
    onClick={(e) => {
      e.stopPropagation();
      handleFavorite();
    }}
    className="cursor-pointer"
  >
    ⭐
  </div>
</button>
```

---

## 📋 Checklist para Nuevas Aplicaciones

### Setup Inicial
- [ ] Configurar estructura de carpetas (`services/api/`, `contexts/`, `screens/`)
- [ ] Configurar sistema de traducciones
- [ ] Configurar RLS en todas las tablas
- [ ] Crear capa de API con `ApiResponse<T>`
- [ ] Configurar manejo centralizado de errores

### Base de Datos
- [ ] Separar `users` (esencial) de `user_profiles` (extendido)
- [ ] Configurar políticas RLS correctamente
- [ ] Usar `.maybeSingle()` cuando el registro puede no existir
- [ ] Agregar índices para consultas frecuentes

### Autenticación
- [ ] Manejar loading states correctamente
- [ ] Agregar safety timeout para evitar loading infinito
- [ ] Verificar usuario en BD antes de operaciones
- [ ] Manejar race conditions en registro

### UI/UX
- [ ] Evitar texto hardcodeado (usar traducciones)
- [ ] Validar UUIDs antes de consultas
- [ ] Evitar nested buttons
- [ ] Implementar debouncing para guardado automático

---

## 🔗 Referencias

- [Arquitectura del Sistema](./01-arquitectura.md)
- [Modelo de Datos](./02-modelo-datos.md)
- [Sistema de Traducciones](./03-sistema-traducciones.md)

---

**Nota**: Este documento debe actualizarse cuando se descubran nuevos patrones o se resuelvan nuevos problemas.
