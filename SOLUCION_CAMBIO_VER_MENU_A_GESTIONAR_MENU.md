# 🔧 Solución: Cambio de "Ver Menú" a "Gestionar Menú" para Restaurantes

## 📋 Problema Identificado
En la interfaz de restaurante, el botón mostraba "Ver Menú" cuando debería mostrar "Gestionar Menú" para reflejar mejor la funcionalidad de administración del menú.

**HTML Original:**
```html
<h2 class="font-bold leading-tight line-clamp-2 transition-all duration-500 ease-out text-lg text-[#111813] dark:text-white">Ver Menú</h2>
```

## 🎯 Objetivo
Cambiar el texto a "Gestionar Menú" específicamente para cuentas de restaurante, manteniendo "Ver Menú" para clientes regulares.

## ✅ Solución Implementada

### 1. Nuevas Traducciones Agregadas
Se agregó una nueva sección `restaurant.home` en todos los archivos de idioma:

**Español (`locales/es.json`):**
```json
"restaurant": {
  "home": {
    "manageMenu": "Gestionar Menú",
    "manageMenuDescription": "Administra tu menú y productos"
  }
}
```

**Inglés (`locales/en.json`):**
```json
"restaurant": {
  "home": {
    "manageMenu": "Manage Menu",
    "manageMenuDescription": "Manage your menu and products"
  }
}
```

**Portugués (`locales/pt.json`):**
```json
"restaurant": {
  "home": {
    "manageMenu": "Gerenciar Cardápio",
    "manageMenuDescription": "Gerencie seu cardápio e produtos"
  }
}
```

**Francés (`locales/fr.json`):**
```json
"restaurant": {
  "home": {
    "manageMenu": "Gérer le Menu",
    "manageMenuDescription": "Gérez votre menu et vos produits"
  }
}
```

### 2. Lógica Condicional en HomeScreen
Se modificó `screens/HomeScreen.tsx` para usar diferentes traducciones según el tipo de cuenta:

```typescript
{ 
  id: 'menu', 
  path: accountType === 'restaurant' ? '/menu-restaurant' : '/menu', 
  titleKey: accountType === 'restaurant' ? 'restaurant.home.manageMenu' : 'home.viewMenu', 
  descriptionKey: accountType === 'restaurant' ? 'restaurant.home.manageMenuDescription' : 'home.viewMenuDescription', 
  icon: 'restaurant_menu' 
}
```

### 3. Script de Verificación Actualizado
Se actualizó `scripts/verify-restaurant-translations.js` para incluir las nuevas traducciones:

```javascript
const requiredKeys = [
  'restaurant.navigation.home',
  'restaurant.navigation.promotions', 
  'restaurant.navigation.menu',
  'restaurant.navigation.reservations',
  'restaurant.navigation.statistics',
  'restaurant.home.manageMenu',           // ← Nuevo
  'restaurant.home.manageMenuDescription' // ← Nuevo
];
```

## 🚀 Resultado

### ✅ Antes del Fix:
- **Restaurantes**: "Ver Menú"
- **Clientes**: "Ver Menú"

### ✅ Después del Fix:
- **Restaurantes**: "Gestionar Menú"
- **Clientes**: "Ver Menú" (sin cambios)

## 🔍 Verificación Completa

El script de verificación confirma que todas las traducciones están presentes en los 4 idiomas:

```bash
node scripts/verify-restaurant-translations.js
```

**Resultado:**
- ✅ **Español**: "Gestionar Menú" / "Administra tu menú y productos"
- ✅ **Inglés**: "Manage Menu" / "Manage your menu and products"
- ✅ **Portugués**: "Gerenciar Cardápio" / "Gerencie seu cardápio e produtos"
- ✅ **Francés**: "Gérer le Menu" / "Gérez votre menu et vos produits"

## 📋 Comportamiento por Tipo de Cuenta

| Tipo de Cuenta | Texto del Botón | Descripción | Ruta |
|----------------|-----------------|-------------|------|
| **Restaurant** | Gestionar Menú | Administra tu menú y productos | `/menu-restaurant` |
| **Customer** | Ver Menú | Explora nuestro menú completo | `/menu` |
| **Guest** | Ver Menú | Explora nuestro menú completo | `/menu` |

## 🧪 Cómo Probar la Solución

1. **Crear/Usar cuenta de restaurante:**
   - Registrarse como restaurante
   - Ir a la pantalla de inicio
   - Verificar que el botón muestre "Gestionar Menú"

2. **Usar cuenta de cliente:**
   - Registrarse como cliente regular
   - Ir a la pantalla de inicio
   - Verificar que el botón muestre "Ver Menú"

3. **Cambiar idiomas:**
   - Probar en español, inglés, portugués y francés
   - Verificar que las traducciones sean correctas

## 📁 Archivos Modificados

- ✅ `locales/es.json` - Agregadas traducciones en español
- ✅ `locales/en.json` - Agregadas traducciones en inglés
- ✅ `locales/pt.json` - Agregadas traducciones en portugués
- ✅ `locales/fr.json` - Agregadas traducciones en francés
- ✅ `screens/HomeScreen.tsx` - Lógica condicional implementada
- ✅ `scripts/verify-restaurant-translations.js` - Script actualizado

## 🎉 Beneficios de la Solución

- ✅ **Claridad de funcionalidad**: Los restaurantes ven "Gestionar" en lugar de "Ver"
- ✅ **Experiencia diferenciada**: Cada tipo de usuario ve el texto apropiado
- ✅ **Multiidioma completo**: Funciona en todos los idiomas soportados
- ✅ **Mantenible**: Fácil agregar más traducciones específicas de restaurante
- ✅ **Retrocompatible**: No afecta la experiencia de clientes existentes

---

**Nota**: Los cambios son inmediatos y no requieren reiniciar la aplicación. El texto se actualiza automáticamente según el tipo de cuenta del usuario.