# 🔧 Solución: Botón "Gestionar Promociones" para Restaurantes

## 📋 Problema Solicitado
Agregar un botón que diga "Gestionar Promociones" y que al hacer clic abra la página `/promotions-restaurant`.

## ✅ Solución Implementada

### 1. Traducciones Agregadas en Todos los Idiomas

**Español (`locales/es.json`):**
```json
"restaurant": {
  "home": {
    "managePromotions": "Gestionar Promociones",
    "managePromotionsDescription": "Administra tus ofertas y descuentos"
  }
}
```

**Inglés (`locales/en.json`):**
```json
"restaurant": {
  "home": {
    "managePromotions": "Manage Promotions",
    "managePromotionsDescription": "Manage your offers and discounts"
  }
}
```

**Portugués (`locales/pt.json`):**
```json
"restaurant": {
  "home": {
    "managePromotions": "Gerenciar Promoções",
    "managePromotionsDescription": "Gerencie suas ofertas e descontos"
  }
}
```

**Francés (`locales/fr.json`):**
```json
"restaurant": {
  "home": {
    "managePromotions": "Gérer les Promotions",
    "managePromotionsDescription": "Gérez vos offres et réductions"
  }
}
```

### 2. Botón Agregado al HomeScreen

Se agregó la configuración del nuevo botón en `screens/HomeScreen.tsx`:

```typescript
{ 
  id: 'promotions', 
  path: '/promotions-restaurant', 
  titleKey: 'restaurant.home.managePromotions', 
  descriptionKey: 'restaurant.home.managePromotionsDescription', 
  icon: 'local_offer',
  condition: (accountType) => accountType === 'restaurant'
}
```

### 3. Características del Botón

- **Texto**: "Gestionar Promociones"
- **Descripción**: "Administra tus ofertas y descuentos"
- **Icono**: `local_offer` (ícono de etiqueta/oferta)
- **Ruta**: `/promotions-restaurant`
- **Condición**: Solo visible para cuentas de tipo `restaurant`
- **Multiidioma**: Funciona en español, inglés, portugués y francés

### 4. Script de Verificación Actualizado

Se actualizó `scripts/verify-restaurant-translations.js` para incluir las nuevas traducciones:

```javascript
const requiredKeys = [
  // ... otras claves existentes ...
  'restaurant.home.managePromotions',           // ← Nuevo
  'restaurant.home.managePromotionsDescription' // ← Nuevo
];
```

## 🚀 Resultado

### ✅ Funcionalidad Implementada:
- **Botón visible**: Solo para cuentas de restaurante
- **Navegación correcta**: Lleva a `/promotions-restaurant`
- **Multiidioma**: Traducciones en 4 idiomas
- **Diseño consistente**: Sigue el mismo patrón que otros botones

### 📱 Ubicación del Botón:
El botón aparece en la pantalla de inicio (`HomeScreen`) junto con los otros botones de acciones rápidas, pero **solo para usuarios con `accountType === 'restaurant'`**.

## 🔍 Verificación Completa

El script de verificación confirma que todas las traducciones están presentes:

```bash
node scripts/verify-restaurant-translations.js
```

**Resultado para "Gestionar Promociones":**
- ✅ **Español**: "Gestionar Promociones" / "Administra tus ofertas y descuentos"
- ✅ **Inglés**: "Manage Promotions" / "Manage your offers and discounts"
- ✅ **Portugués**: "Gerenciar Promoções" / "Gerencie suas ofertas e descontos"
- ✅ **Francés**: "Gérer les Promotions" / "Gérez vos offres et réductions"

## 📋 Comportamiento por Tipo de Cuenta

| Tipo de Cuenta | Botón Visible | Texto | Ruta |
|----------------|---------------|-------|------|
| **Restaurant** | ✅ Sí | Gestionar Promociones | `/promotions-restaurant` |
| **Customer** | ❌ No | - | - |
| **Guest** | ❌ No | - | - |

## 🧪 Cómo Probar la Solución

1. **Usar cuenta de restaurante:**
   - Registrarse/iniciar sesión como restaurante
   - Ir a la pantalla de inicio (`/home-restaurant`)
   - Verificar que aparece el botón "Gestionar Promociones"
   - Hacer clic y verificar que navega a `/promotions-restaurant`

2. **Usar cuenta de cliente:**
   - Registrarse/iniciar sesión como cliente
   - Ir a la pantalla de inicio (`/home`)
   - Verificar que NO aparece el botón "Gestionar Promociones"

3. **Probar multiidioma:**
   - Cambiar idioma en la configuración
   - Verificar que el texto del botón se traduce correctamente

## 📁 Archivos Modificados

- ✅ `locales/es.json` - Agregadas traducciones en español
- ✅ `locales/en.json` - Agregadas traducciones en inglés  
- ✅ `locales/pt.json` - Agregadas traducciones en portugués
- ✅ `locales/fr.json` - Agregadas traducciones en francés
- ✅ `screens/HomeScreen.tsx` - Agregado botón con lógica condicional
- ✅ `scripts/verify-restaurant-translations.js` - Script actualizado

## 🎉 Beneficios de la Solución

- ✅ **Acceso directo**: Los restaurantes pueden acceder rápidamente a gestionar promociones
- ✅ **Experiencia específica**: Solo visible para el tipo de usuario correcto
- ✅ **Multiidioma completo**: Funciona en todos los idiomas soportados
- ✅ **Diseño consistente**: Sigue los patrones existentes de la aplicación
- ✅ **Fácil mantenimiento**: Estructura clara y bien documentada

---

**Nota**: El botón aparece inmediatamente para cuentas de restaurante existentes sin necesidad de reiniciar la aplicación.