# 🔧 Solución: Cambio de "Agregar Promoción" a "Agregar Especial" en Especiales de Temporada

## 📋 Problema Identificado

En la sección "Especiales de Temporada" de la página de promociones del restaurante, el botón mostraba "Agregar Promoción" cuando debería mostrar "Agregar Especial" para ser más específico al contexto:

```html
<div class="px-4 grid grid-cols-2 gap-4 pb-24">
  <button type="button" class="bg-white dark:bg-[#32281d] p-3 rounded-2xl shadow-sm border-2 border-dashed border-primary/40 text-primary bg-primary/5">
    <div class="flex flex-col items-center justify-center h-full">
      <span class="material-symbols-outlined text-3xl">add</span>
      <span class="text-sm font-bold">Agregar Promoción</span>
    </div>
  </button>
</div>
```

## 🎯 Objetivo

Cambiar específicamente el botón de la sección "Especiales de Temporada" de "Agregar Promoción" a "Agregar Especial", manteniendo "Agregar Promoción" en otras secciones.

## ✅ Solución Implementada

### 1. Nuevas Traducciones Agregadas

Se agregó `restaurant.promotions.addSpecial` en todos los archivos de idioma:

**Español (`locales/es.json`):**
```json
"restaurant": {
  "promotions": {
    "addSpecial": "Agregar Especial"
  }
}
```

**Inglés (`locales/en.json`):**
```json
"restaurant": {
  "promotions": {
    "addSpecial": "Add Special"
  }
}
```

**Portugués (`locales/pt.json`):**
```json
"restaurant": {
  "promotions": {
    "addSpecial": "Adicionar Especial"
  }
}
```

**Francés (`locales/fr.json`):**
```json
"restaurant": {
  "promotions": {
    "addSpecial": "Ajouter un Spécial"
  }
}
```

### 2. Componente Actualizado

Se modificó `screens/PromotionsRestaurantScreen.tsx` específicamente en la sección "Especiales de Temporada":

**Antes:**
```typescript
<span className="text-sm font-bold">
  {t('restaurant.promotions.addPromotion') || 'Agregar Promoción'}
</span>
```

**Después:**
```typescript
<span className="text-sm font-bold">
  {t('restaurant.promotions.addSpecial') || 'Agregar Especial'}
</span>
```

### 3. Ubicación Específica del Cambio

El cambio se realizó únicamente en el botón que aparece dentro de la sección "Especiales de Temporada" (línea ~792), identificada por:

```typescript
// SectionHeader: Seasonal
<h2 className="text-[#181411] dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">
  {t('promotions.seasonalSpecials')}  // "Especiales de Temporada"
</h2>

// Simple Grid for more items
<div className="px-4 grid grid-cols-2 gap-4 pb-24">
  {/* Botón modificado aquí */}
</div>
```

### 4. Corrección de Duplicados

Durante la implementación se corrigieron claves duplicadas en `locales/es.json`:
- Eliminada sección duplicada de `register`
- Eliminada sección duplicada de `welcome`

### 5. Script de Verificación Actualizado

Se actualizó `scripts/verify-restaurant-translations.js` para incluir la nueva clave:

```javascript
const requiredKeys = [
  // ... claves existentes ...
  'restaurant.promotions.addSpecial'
];
```

## 🚀 Resultado

### ✅ Antes del Fix:
```html
<span class="text-sm font-bold">Agregar Promoción</span>
```

### ✅ Después del Fix:
```html
<span class="text-sm font-bold">Agregar Especial</span>
```

## 🔍 Verificación Completa

El script de verificación confirma que todas las traducciones están presentes en los 4 idiomas:

```bash
node scripts/verify-restaurant-translations.js
```

**Resultado para la nueva traducción:**
- ✅ **Español**: "Agregar Especial"
- ✅ **Inglés**: "Add Special"
- ✅ **Portugués**: "Adicionar Especial"
- ✅ **Francés**: "Ajouter un Spécial"

## 📋 Comportamiento por Sección

| Sección | Botón | Texto Mostrado |
|---------|-------|----------------|
| **Especiales de Temporada** | Agregar | "Agregar Especial" ✅ |
| **Otras secciones** | Agregar | "Agregar Promoción" |

## 🧪 Cómo Probar la Solución

1. **Navegar a promociones de restaurante:**
   - Usar cuenta de restaurante
   - Ir a `/promotions-restaurant`

2. **Activar modo de edición:**
   - Hacer clic en "Cambiar a modo de edición"

3. **Verificar sección "Especiales de Temporada":**
   - Desplazarse hasta la sección "Especiales de Temporada"
   - Verificar que el botón muestre "Agregar Especial"

4. **Verificar otras secciones:**
   - Confirmar que otros botones sigan mostrando "Agregar Promoción"

5. **Probar multiidioma:**
   - Cambiar idioma en configuración
   - Verificar que las traducciones sean correctas

## 📁 Archivos Modificados

- ✅ `locales/es.json` - Agregada traducción + limpieza de duplicados
- ✅ `locales/en.json` - Agregada traducción en inglés
- ✅ `locales/pt.json` - Agregada traducción en portugués
- ✅ `locales/fr.json` - Agregada traducción en francés
- ✅ `screens/PromotionsRestaurantScreen.tsx` - Botón específico actualizado
- ✅ `scripts/verify-restaurant-translations.js` - Script actualizado

## 🎉 Beneficios de la Solución

- ✅ **Contexto específico**: El botón refleja mejor su función en "Especiales de Temporada"
- ✅ **Precisión semántica**: "Agregar Especial" es más específico que "Agregar Promoción"
- ✅ **Cambio localizado**: Solo afecta el botón específico solicitado
- ✅ **Multiidioma completo**: Funciona en todos los idiomas soportados
- ✅ **Consistencia**: Mantiene "Agregar Promoción" en otras secciones donde es apropiado

## 🔄 Impacto en la Experiencia de Usuario

- **Claridad mejorada**: Los usuarios entienden mejor que están agregando un "especial" de temporada
- **Contexto apropiado**: El texto coincide con el título de la sección
- **Experiencia consistente**: Otros botones mantienen su funcionalidad y texto original

---

**Nota**: Los cambios son inmediatos y específicos a la sección "Especiales de Temporada". El resto de la funcionalidad permanece sin cambios.