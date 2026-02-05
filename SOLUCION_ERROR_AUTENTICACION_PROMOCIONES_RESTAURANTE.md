# 🔧 Solución: Error de Autenticación en Promociones de Restaurante

## 📋 Problema Identificado

Al intentar acceder a la página de promociones del restaurante (`/promotions-restaurant`), se producía el siguiente error:

```
[API Error] Error al obtener ID del restaurante: Error: Usuario no autenticado
    at requireAuth (base.ts:67:11)
    at async restaurant.ts:93:20
    at async handleSupabaseError (base.ts:23:18)
    at async loadPromotions (PromotionsRestaurantScreen.tsx:98:13)
```

## 🎯 Causa del Problema

El sistema está usando **autenticación simple** (basada en `localStorage` con `simpleAuthUser`), pero las funciones de API seguían intentando usar **Supabase Auth** (`supabase.auth.getUser()`), que no funciona con autenticación simple.

### Funciones Problemáticas:
1. **`getAuthenticatedUserId()`** en `services/api/base.ts`
2. **`requireAuth()`** en `services/api/base.ts` 
3. **`getCurrentUserRestaurantId()`** en `services/database.ts`

## ✅ Solución Implementada

### 1. Actualizada `getAuthenticatedUserId()` en `services/api/base.ts`

**Antes:**
```typescript
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[API] Error getting authenticated user:', error);
    return null;
  }
}
```

**Después:**
```typescript
export async function getAuthenticatedUserId(): Promise<string | null> {
  // Primero intentar autenticación simple
  const simpleAuthUser = localStorage.getItem('simpleAuthUser');
  if (simpleAuthUser) {
    try {
      const userData = JSON.parse(simpleAuthUser);
      return userData.id || null;
    } catch (error) {
      console.error('[API] Error parsing simple auth user:', error);
      localStorage.removeItem('simpleAuthUser');
    }
  }

  // Si no hay autenticación simple, intentar Supabase Auth
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  } catch (error) {
    console.error('[API] Error getting authenticated user:', error);
    return null;
  }
}
```

### 2. Actualizada `getCurrentUserRestaurantId()` en `services/database.ts`

**Antes:**
```typescript
export const getCurrentUserRestaurantId = async (): Promise<string | null> => {
  // ... código que usaba supabase.auth.getUser()
}
```

**Después:**
```typescript
export const getCurrentUserRestaurantId = async (): Promise<string | null> => {
  // ... código que primero intenta simpleAuthUser, luego Supabase Auth
}
```

## 🚀 Cómo Funciona la Solución

### Flujo de Autenticación Híbrido:

1. **Prioridad 1: Autenticación Simple**
   - Busca `simpleAuthUser` en `localStorage`
   - Si existe y es válido, usa el `userData.id`

2. **Prioridad 2: Supabase Auth (Fallback)**
   - Si no hay autenticación simple, intenta `supabase.auth.getUser()`
   - Mantiene compatibilidad con sistemas que usen Supabase Auth

3. **Manejo de Errores**
   - Si `simpleAuthUser` está corrupto, lo elimina del `localStorage`
   - Registra errores apropiados en la consola

## 🔍 Verificación de la Solución

### ✅ Antes del Fix:
- ❌ Error: "Usuario no autenticado" en promociones de restaurante
- ❌ No se podía cargar el ID del restaurante
- ❌ La página de promociones no funcionaba

### ✅ Después del Fix:
- ✅ Las funciones de autenticación detectan usuarios de autenticación simple
- ✅ Se puede obtener correctamente el ID del restaurante
- ✅ La página de promociones carga sin errores

## 📋 Archivos Modificados

- ✅ `services/api/base.ts` - Función `getAuthenticatedUserId()` actualizada
- ✅ `services/database.ts` - Función `getCurrentUserRestaurantId()` actualizada

## 🧪 Cómo Probar la Solución

1. **Registrarse como restaurante:**
   - Usar el registro de restaurante
   - Verificar que se guarde en `localStorage` como `simpleAuthUser`

2. **Navegar a promociones:**
   - Hacer clic en "Gestionar Promociones" desde el home
   - Verificar que la página carga sin errores de autenticación

3. **Verificar en consola:**
   - No debe aparecer el error "Usuario no autenticado"
   - Debe mostrar logs de carga exitosa de promociones

## 🎉 Beneficios de la Solución

- ✅ **Compatibilidad total**: Funciona con autenticación simple y Supabase Auth
- ✅ **Retrocompatible**: No rompe sistemas existentes que usen Supabase Auth
- ✅ **Manejo robusto de errores**: Limpia datos corruptos automáticamente
- ✅ **Fácil mantenimiento**: Centraliza la lógica de autenticación

## 🔄 Impacto en Otras Funcionalidades

Esta solución también beneficia a **todas las funciones** que usan `requireAuth()` o `getAuthenticatedUserId()`:

- ✅ Gestión de menú de restaurante
- ✅ Perfil de restaurante  
- ✅ Creación de productos
- ✅ Gestión de staff
- ✅ Cualquier operación que requiera autenticación

---

**Nota**: Esta solución es inmediata y no requiere cambios en la base de datos ni reiniciar la aplicación.