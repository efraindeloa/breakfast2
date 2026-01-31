# 🎨 Design System

## Visión General

Este documento describe el sistema de diseño de **Breakfast App**, incluyendo colores, tipografías, componentes y estados visuales.

---

## 🎨 Colores

### Paleta Principal

#### Color Primario
- **Código**: `#EB9947` (Orange)
- **Uso**: Botones principales, enlaces activos, acentos
- **Variaciones**:
  - **Primary Dark**: `#D6892F` (Hover states)
  - **Primary Light**: `#F5C97A` (Backgrounds suaves)
  - **Primary/10**: `rgba(235, 153, 71, 0.1)` (Backgrounds sutiles)
  - **Primary/20**: `rgba(235, 153, 71, 0.2)` (Hover backgrounds)

#### Color de Fondo
- **Claro**: `#FFFFFF` (White)
- **Oscuro**: `#1A1614` (Background Dark)
- **Variaciones**:
  - **Gray 50**: `#F9FAFB` (Backgrounds muy claros)
  - **Gray 100**: `#F3F4F6` (Backgrounds claros)
  - **Gray 800**: `#1F2937` (Dark mode backgrounds)
  - **Gray 900**: `#111827` (Dark mode containers)

#### Texto
- **Claro**: `#181411` (Texto principal en modo claro)
- **Oscuro**: `#FFFFFF` (Texto principal en modo oscuro)
- **Secundario Claro**: `#897C61` (Texto secundario en modo claro)
- **Secundario Oscuro**: `#A8937D` (Texto secundario en modo oscuro)

#### Bordes
- **Claro**: `#E6E0DB` (Bordes en modo claro)
- **Oscuro**: `#3D3228` (Bordes en modo oscuro)
- **Hover**: `#D2B48C` (Bordes al hover)

### Estados

#### Éxito
- **Color**: `#10B981` (Green)
- **Uso**: Confirmaciones, estados exitosos

#### Error
- **Color**: `#EF4444` (Red)
- **Uso**: Errores, advertencias críticas

#### Advertencia
- **Color**: `#F59E0B` (Orange)
- **Uso**: Advertencias, alertas

#### Información
- **Color**: `#3B82F6` (Blue)
- **Uso**: Información, tips

---

## 📝 Tipografía

### Fuente Principal

#### Material Symbols
- **Uso**: Iconos
- **Tamaños**: 
  - Pequeño: `text-lg` (18px)
  - Mediano: `text-xl` (20px)
  - Grande: `text-2xl` (24px)
  - Extra Grande: `text-5xl` (48px)

### Sistema de Tamaños de Texto

#### Títulos
- **H1**: `text-2xl` (24px) - `font-bold`
- **H2**: `text-xl` (20px) - `font-bold`
- **H3**: `text-lg` (18px) - `font-bold`
- **H4**: `text-base` (16px) - `font-semibold`

#### Texto Regular
- **Grande**: `text-base` (16px) - `font-normal`
- **Mediano**: `text-sm` (14px) - `font-normal`
- **Pequeño**: `text-xs` (12px) - `font-normal`
- **Muy Pequeño**: `text-[10px]` (10px) - `font-normal`

#### Pesos de Fuente
- **Normal**: `font-normal` (400)
- **Medium**: `font-medium` (500)
- **Semibold**: `font-semibold` (600)
- **Bold**: `font-bold` (700)

### Leading (Altura de Línea)
- **Tight**: `leading-tight` (1.25)
- **Snug**: `leading-snug` (1.375)
- **Normal**: `leading-normal` (1.5)
- **Relaxed**: `leading-relaxed` (1.625)

### Tracking (Espaciado de Letras)
- **Tight**: `tracking-[-0.015em]` (Para títulos)

---

## 🧩 Componentes

### Botones

#### Botón Primario
```tsx
<button className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
  Texto
</button>
```
- **Color de fondo**: Primary
- **Color de texto**: White
- **Padding**: `px-4 py-2`
- **Border radius**: `rounded-xl` (12px)
- **Hover**: `bg-primary/90`

#### Botón Secundario
```tsx
<button className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#181511] dark:text-white px-4 py-2 rounded-xl font-medium hover:bg-primary/10 transition-colors">
  Texto
</button>
```
- **Color de fondo**: White (claro) / Gray 800 (oscuro)
- **Borde**: Gray 200/700
- **Hover**: Primary/10

#### Botón de Icono
```tsx
<button className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95">
  <span className="material-symbols-outlined text-lg">icon_name</span>
</button>
```
- **Tamaño**: 32x32px (w-8 h-8)
- **Forma**: Circular (rounded-full)
- **Hover**: Primary/20
- **Active**: Scale 0.95

### Cards

#### Card de Producto
```tsx
<div className="rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform active:scale-98 cursor-pointer">
  {/* Contenido */}
</div>
```
- **Border radius**: `rounded-xl` (12px)
- **Sombra**: `shadow-[0_2px_15px_rgba(0,0,0,0.05)]`
- **Borde**: `border` con color específico
- **Hover/Active**: `active:scale-98` (ligeña reducción al hacer click)

#### Card de Sección
```tsx
<div className="bg-white dark:bg-[#2d241c] rounded-xl border border-solid border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm">
  {/* Contenido */}
</div>
```
- Similar al card de producto pero con `shadow-sm`

### Inputs

#### Input de Texto
```tsx
<input 
  type="text"
  className="w-full h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
  placeholder="Placeholder"
/>
```
- **Altura**: 40px (h-10)
- **Padding**: `px-4`
- **Border radius**: `rounded-xl`
- **Focus**: Ring de 2px en color primary
- **Placeholder**: Gray 400/500

#### Textarea
```tsx
<textarea 
  className="w-full h-32 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
  placeholder="Placeholder"
/>
```
- Similar al input pero con altura fija (`h-32`)
- `resize-none` para no permitir redimensionar

### Chips / Tags

#### Chip Seleccionado
```tsx
<button className="flex h-9 items-center justify-center gap-x-2 rounded-xl px-4 cursor-pointer transition-colors bg-primary text-white shadow-sm">
  <p className="text-sm font-semibold">Texto</p>
</button>
```
- **Altura**: 36px (h-9)
- **Background**: Primary
- **Texto**: White, semibold

#### Chip No Seleccionado
```tsx
<button className="flex h-9 items-center justify-center gap-x-2 rounded-xl px-4 cursor-pointer transition-colors bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-primary/10">
  <p className="text-sm font-medium">Texto</p>
</button>
```
- **Background**: White/Gray 800
- **Borde**: Gray 200/700
- **Hover**: Primary/10

### Navegación Inferior

#### Item de Navegación
```tsx
<button className="flex flex-col items-center justify-center gap-1 min-w-[60px] h-full">
  <span className="material-symbols-outlined text-2xl text-gray-500 dark:text-gray-400">icon</span>
  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Texto</span>
</button>
```
- **Activo**: Color primary en lugar de gray
- **Inactivo**: Gray 500/400

### Badges

#### Badge de Contador
```tsx
<span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold">
  3
</span>
```
- **Posición**: Absolute, top-right
- **Tamaño mínimo**: 18px
- **Forma**: Circular (rounded-full)
- **Background**: Primary
- **Texto**: White, bold, 10px

### Toggles / Switches

#### Toggle
```tsx
<label className="relative inline-flex items-center cursor-pointer">
  <input type="checkbox" className="sr-only peer" />
  <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
</label>
```
- **Tamaño**: 56x32px (w-14 h-8)
- **Estado desactivado**: Gray 200/700
- **Estado activado**: Primary
- **Círculo interior**: 24px (h-6 w-6)

---

## 🌓 Modo Oscuro / Claro

### Implementación

#### Clases de Tailwind
- **Claro**: Clases base (sin prefijo)
- **Oscuro**: Prefijo `dark:`

#### Ejemplo
```tsx
<div className="bg-white dark:bg-[#2d241c] text-[#181511] dark:text-white">
  Contenido
</div>
```

### Colores Adaptativos

| Elemento | Modo Claro | Modo Oscuro |
|----------|------------|-------------|
| Background | White | `#1A1614` |
| Card Background | White | `#2d241c` / `#2d2516` |
| Texto Principal | `#181411` | White |
| Texto Secundario | `#897C61` | `#A8937D` |
| Borde | `#E6E0DB` | `#3D3228` |

---

## 📐 Espaciado

### Sistema de Espaciado (Tailwind)

- **0**: 0px
- **1**: 4px
- **2**: 8px
- **3**: 12px
- **4**: 16px
- **5**: 20px
- **6**: 24px
- **8**: 32px
- **10**: 40px
- **12**: 48px
- **16**: 64px
- **20**: 80px
- **32**: 128px

### Uso Común

#### Padding de Cards
- **Pequeño**: `p-4` (16px)
- **Mediano**: `p-5` (20px)
- **Grande**: `p-6` (24px)

#### Gaps (Espaciado entre elementos)
- **Pequeño**: `gap-1` (4px), `gap-2` (8px)
- **Mediano**: `gap-3` (12px), `gap-4` (16px)
- **Grande**: `gap-6` (24px)

#### Márgenes
- **Secciones**: `mb-4` (16px), `mb-6` (24px)
- **Contenedores**: `mx-4` (16px horizontal)

---

## 🎭 Estados Visuales

### Estados de Interacción

#### Hover
- **Botones**: Cambio de opacidad o color (`hover:bg-primary/90`)
- **Cards**: Ligeramente más oscuro o con sombra más pronunciada
- **Enlaces**: Color primary

#### Active / Pressed
- **Botones**: `active:scale-95` (reducción del 5%)
- **Cards**: `active:scale-98` (reducción del 2%)

#### Focus
- **Inputs**: Ring de 2px en color primary
- **Botones**: Outline con color primary

#### Disabled
- **Opacidad**: `opacity-50` (50%)
- **Cursor**: `cursor-not-allowed`

### Estados de Carga

#### Loading Spinner
```tsx
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
```
- **Animación**: `animate-spin`
- **Color**: Primary

### Estados Vacíos

#### Empty State
```tsx
<div className="flex flex-col items-center justify-center py-12">
  <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">
    inventory_2
  </span>
  <p className="text-gray-500 dark:text-gray-400 text-sm">No hay items</p>
</div>
```
- **Icono**: 48px, gray
- **Texto**: Gray, small

---

## 📱 Responsive Design

### Breakpoints (Tailwind)

- **sm**: 640px
- **md**: 768px
- **lg**: 1024px
- **xl**: 1280px
- **2xl**: 1536px

### Uso en la App

#### Contenedor Principal
```tsx
<div className="w-full max-w-full md:max-w-2xl md:mx-auto md:shadow-2xl">
```
- **Móvil**: Ancho completo
- **Tablet/Desktop**: Máximo 672px, centrado

#### Grids
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```
- **Móvil**: 1 columna
- **Tablet+**: 2 columnas

---

## 🎨 Sombras

### Sistema de Sombras

- **sm**: `shadow-sm` - Sombra muy sutil
- **default**: `shadow` - Sombra estándar
- **md**: `shadow-md` - Sombra mediana
- **lg**: `shadow-lg` - Sombra grande
- **xl**: `shadow-xl` - Sombra extra grande
- **2xl**: `shadow-2xl` - Sombra muy grande

### Sombras Personalizadas

#### Card de Producto
```css
shadow-[0_2px_15px_rgba(0,0,0,0.05)]
```
- **Sombra sutil**: 2px de blur, 15px de spread, 5% de opacidad

---

## ✨ Animaciones

### Transiciones

#### Transiciones Comunes
- **Colores**: `transition-colors` (duración estándar)
- **Transformaciones**: `transition-transform`
- **Todo**: `transition-all`

#### Duración (Implícito en Tailwind)
- **Fast**: 150ms
- **Default**: 300ms
- **Slow**: 500ms

### Transformaciones

#### Scale
- **Hover**: `hover:scale-105` (aumento del 5%)
- **Active**: `active:scale-95` (reducción del 5%)

#### Rotate
- **Spinner**: `animate-spin` (rotación continua)

---

## 📋 Checklist de Diseño

### Al Crear un Nuevo Componente

- ✅ Usa las clases de color definidas
- ✅ Implementa modo oscuro con `dark:`
- ✅ Añade estados hover/active/focus
- ✅ Usa espaciado consistente
- ✅ Respeta los border radius establecidos
- ✅ Implementa responsive si es necesario
- ✅ Añade transiciones apropiadas

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.2

### Cambios Recientes (Enero 2025)
- ✅ Agregado estilo breakfast-gradient para pantallas especiales
- ✅ Documentados nuevos componentes (LoyaltyScreen, CouponsScreen, PromotionsScreen, TableReadyScreen, SplitPaymentScreen)
- ✅ Agregado componente `TopNavbar` con avatar, notificaciones, favoritos y perfil
- ✅ Documentados estilos de navegación superior reutilizable
**Responsable**: Equipo de diseño
