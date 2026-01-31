# 🏗️ Arquitectura del Sistema

## Visión General

**Breakfast App** es una aplicación móvil y web desarrollada con React, TypeScript y Capacitor, que permite a los comensales interactuar con restaurantes de manera digital.

---

## Stack Tecnológico

### Frontend

#### Tecnologías Principales
- **React 19.2.3**: Framework principal
- **TypeScript 5.8.2**: Lenguaje de programación
- **Vite 6.2.0**: Build tool y servidor de desarrollo
- **React Router DOM 7.12.0**: Navegación y enrutamiento

#### Estilos
- **Tailwind CSS**: Framework de CSS utility-first
- **Material Symbols**: Iconos de Google Material Design

#### Estado y Contexto
- **React Context API**: Gestión de estado global
  - `AuthContext`: Autenticación y sesión de usuario
  - `CartContext`: Estado del carrito
  - `RestaurantContext`: Configuración del restaurante
  - `ProductsContext`: Productos del menú
  - `GroupOrderContext`: Estado de pedidos grupales
  - `LanguageContext`: Internacionalización
  - `FavoritesContext`: Gestión de favoritos
  - `LoyaltyContext`: Programa de lealtad

#### Almacenamiento
- **Supabase PostgreSQL**: Datos persistentes (usuarios, productos, promociones, órdenes, etc.)
- **Supabase Storage**: Imágenes y archivos multimedia
- **localStorage**: Solo para preferencias de UI
  - Configuración del usuario (idioma, tema)
  - Caché temporal de sesión

### Backend

#### Supabase (Backend-as-a-Service)
- **Base de datos**: PostgreSQL en Supabase
- **Autenticación**: Supabase Auth con email/contraseña y OAuth
- **Storage**: Supabase Storage para imágenes de productos y promociones
- **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
- **API REST**: PostgREST API automática generada desde PostgreSQL

#### Capa de API (`services/api/`)
- **Abstracción**: Capa que encapsula llamadas directas a Supabase
- **Estructura**:
  - `types.ts`: Tipos comunes (`ApiResponse<T>`, `ApiError`)
  - `base.ts`: Funciones base (`handleSupabaseError`, `requireAuth`)
  - `products.ts`: API de productos
  - `promotions.ts`: API de promociones
  - `user.ts`: API de usuarios
  - `restaurant.ts`: API de restaurantes
  - `orders.ts`: API de órdenes
  - `menu-sections.ts`: API de secciones de menú
  - `index.ts`: Exportaciones centralizadas

#### Almacenamiento
- **Base de datos**: Todos los datos persistentes en Supabase PostgreSQL
- **Storage**: Imágenes en Supabase Storage buckets:
  - `product-images`: Imágenes de productos
  - `promotion-images`: Imágenes de promociones
  - `restaurant-images`: Logos y portadas de restaurantes
- **localStorage**: Solo para preferencias de UI (idioma, tema) y caché temporal

### Mobile (Capacitor)

#### Plataforma
- **Capacitor 8.1.0**: Framework para aplicaciones nativas
- **Android**: Plataforma móvil soportada actualmente

#### Plugins de Capacitor
- **@capacitor/camera**: Acceso a la cámara para escáner QR
- **@capacitor/android**: Plataforma Android
- **@capacitor/app**: Manejo del botón de retroceso de Android
- **@capacitor/geolocation**: Geolocalización para mapas y ubicación
- **@capacitor-community/contacts**: Acceso a contactos del dispositivo
- **@capacitor-community/speech-recognition**: Reconocimiento de voz nativo

#### Bibliotecas Externas
- **html5-qrcode 2.3.8**: Escaneo de códigos QR
- **tesseract.js**: OCR (Optical Character Recognition) para escaneo de tarjetas bancarias
- **leaflet 1.9.4**: Biblioteca de mapas interactivos
- **react-leaflet 5.0.0**: Componentes React para Leaflet

---

## Estructura del Proyecto

```
breakfast2/
├── android/                 # Proyecto Android nativo
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── java/
│   │   └── build.gradle
│   ├── gradle/
│   └── build.gradle
├── components/              # Componentes reutilizables
│   ├── AssistantButton.tsx
│   ├── AssistantModal.tsx
│   ├── BottomNav.tsx
│   └── TopNavbar.tsx
├── config/                  # Configuración
│   ├── restaurantConfig.ts
│   └── supabase.ts         # Configuración de Supabase
├── services/                # Servicios y API
│   ├── api/                # Capa de API
│   │   ├── types.ts        # Tipos comunes
│   │   ├── base.ts         # Funciones base
│   │   ├── products.ts     # API de productos
│   │   ├── promotions.ts   # API de promociones
│   │   ├── user.ts         # API de usuarios
│   │   ├── restaurant.ts   # API de restaurantes
│   │   ├── orders.ts       # API de órdenes
│   │   ├── menu-sections.ts # API de secciones
│   │   └── index.ts        # Exportaciones
│   └── database.ts         # Funciones legacy (en migración)
├── contexts/                # Contextos de React
│   ├── CartContext.tsx
│   ├── FavoritesContext.tsx
│   ├── GroupOrderContext.tsx
│   ├── LanguageContext.tsx
│   └── RestaurantContext.tsx
├── content/                 # Contenido estático
│   └── languages.ts
├── dist/                    # Build de producción
├── locales/                 # Archivos de traducción
│   ├── en.json
│   ├── es.json
│   ├── fr.json
│   └── pt.json
├── screens/                 # Pantallas principales
│   ├── AddCardScreen.tsx
│   ├── AdminControlPanelScreen.tsx
│   ├── BillingDataScreen.tsx
│   ├── ConfirmationScreen.tsx
│   ├── ContactsScreen.tsx
│   ├── CouponDetailScreen.tsx
│   ├── CouponsScreen.tsx
│   ├── DiscoverRestaurantsScreen.tsx
│   ├── DishDetailScreen.tsx
│   ├── EditOrderScreen.tsx
│   ├── EmailConfigScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── ForgotPasswordScreen.tsx
│   ├── GroupOrderManagementScreen.tsx
│   ├── HomeRestaurantScreen.tsx
│   ├── HomeScreen.tsx
│   ├── InviteUsersScreen.tsx
│   ├── JoinTableScreen.tsx
│   ├── LoyaltyScreen.tsx
│   ├── MenuRestaurantScreen.tsx
│   ├── MenuScreen.tsx
│   ├── MeetUpScreen.tsx
│   ├── OrderConfirmedScreen.tsx
│   ├── OrderDetailScreen.tsx
│   ├── OrderHistoryScreen.tsx
│   ├── OrderScreen.tsx
│   ├── PaymentMethodsScreen.tsx
│   ├── PaymentSuccessScreen.tsx
│   ├── ProductReviewsScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── PromotionDetailScreen.tsx
│   ├── PromotionsRestaurantScreen.tsx
│   ├── PromotionsScreen.tsx
│   ├── QRScannerScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── RequestAssistanceScreen.tsx
│   ├── ReservationsRestaurantScreen.tsx
│   ├── ResetPasswordScreen.tsx
│   ├── RestaurantDetailsScreen.tsx
│   ├── RestaurantProfileScreen.tsx
│   ├── ReviewScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── SplitPaymentSelectionScreen.tsx
│   ├── SplitPaymentSummaryScreen.tsx
│   ├── StatisticsRestaurantScreen.tsx
│   ├── TableReadyScreen.tsx
│   ├── TransactionDetailScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── UpdateRestaurantImageScreen.tsx
│   ├── UploadConstanciaScreen.tsx
│   ├── WaitlistScreen.tsx
│   └── WelcomeScreen.tsx
├── public/                  # Archivos estáticos (imágenes de productos)
│   ├── baileys.webp
│   ├── cafe-americano-nespresso.webp
│   ├── cafe-expresso-nespresso.webp
│   ├── capuchino-nespresso.webp
│   ├── carajilla.jpg
│   ├── carajillo solo.webp
│   ├── carajillo.jpeg
│   ├── cheesecake-lotus.png
│   ├── cheesecake-vasco.jpg
│   ├── chincho-seco.avif
│   ├── chinchon-dulce.jpg
│   ├── coketillo_donk.jpg
│   ├── flan-vainilla.jpg
│   ├── frangelico.webp
│   ├── frappuccino.jpg
│   ├── jugo-naranja.avif
│   ├── licor43.webp
│   ├── pan-elote.jpeg
│   ├── pastel-3leches.jpg
│   ├── red-velvet.jpg
│   ├── sambuca.webp
│   ├── tarta-chocolate.jpg
│   ├── te.webp
│   └── volcan.jpg
├── supabase/                  # Scripts SQL y migraciones
│   ├── MASTER_SETUP.sql
│   ├── schema_optimized.sql
│   ├── fix-*.sql
│   └── ...
├── types/                   # Definiciones de tipos TypeScript
│   └── order.ts
├── App.tsx                  # Componente raíz
├── index.tsx                # Punto de entrada
├── index.html               # HTML principal
├── package.json             # Dependencias y scripts
├── tsconfig.json            # Configuración de TypeScript
├── vite.config.ts           # Configuración de Vite
└── capacitor.config.ts      # Configuración de Capacitor
```

---

## Arquitectura de Componentes

### Componentes de Alto Nivel

#### `App.tsx`
- **Responsabilidad**: Componente raíz que configura el enrutamiento y proveedores
- **Dependencias**:
  - React Router DOM para navegación
  - Todos los Context Providers
  - Todas las pantallas

#### Pantallas (`screens/`)
- **Responsabilidad**: Pantallas completas de la aplicación
- **Estructura**:
  - Cada pantalla es un componente funcional
  - Usa hooks de React Router (`useNavigate`, `useParams`, `useLocation`)
  - Usa contextos para estado global
  - Usa `useTranslation` para internacionalización

#### Componentes Reutilizables (`components/`)
- **`BottomNav`**: Navegación inferior
- **`TopNavbar`**: Navegación superior reutilizable con avatar, notificaciones, favoritos y perfil
- **`AssistantButton`**: Botón flotante del asistente
- **`AssistantModal`**: Modal del asistente con IA

---

## Gestión de Estado

### Contextos de React

#### CartContext
```typescript
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, quantity: number, notes?: string) => void;
  updateCartItemNotes: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  setCartItems: (items: CartItem[]) => void;
}
```

**Almacenamiento**: Estado en memoria (durante sesión)

**Mejoras**:
- `updateCartItemQuantity` ahora acepta un parámetro opcional `notes` para manejar items con el mismo ID pero notas diferentes
- `setCartItems` permite establecer directamente los items del carrito (útil para cargar órdenes para edición)

#### RestaurantContext
```typescript
interface RestaurantContextType {
  config: RestaurantConfig;
}
```

**Almacenamiento**: Configuración estática desde `restaurantConfig.ts`

#### GroupOrderContext
```typescript
interface GroupOrderContextType {
  groupOrder: GroupOrder | null;
  joinGroupOrder: (tableCode: string) => void;
  leaveGroupOrder: () => void;
  // ... más métodos
}
```

**Almacenamiento**: Estado en memoria y localStorage

#### LanguageContext
```typescript
interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}
```

**Almacenamiento**: localStorage y archivos JSON

#### FavoritesContext
```typescript
interface FavoritePromotion {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
}

interface FavoritesContextType {
  favorites: number[];
  addToFavorites: (dishId: number) => void;
  removeFromFavorites: (dishId: number) => void;
  isFavorite: (dishId: number) => boolean;
  getFavorites: () => number[];
  favoritePromotions: FavoritePromotion[];
  addFavoritePromotion: (promotion: FavoritePromotion) => void;
  removeFavoritePromotion: (promotionId: string) => void;
  isPromotionFavorite: (promotionId: string) => boolean;
}
```

**Almacenamiento**: localStorage
- **Platillos favoritos**: Clave `favorites` (array de IDs)
- **Promociones favoritas**: Clave `favoritePromotions` (array de objetos `FavoritePromotion`)

---

## Navegación

### React Router DOM

#### Configuración
- **Router**: `HashRouter` (para compatibilidad con Capacitor)
- **Rutas**: Definidas en `App.tsx`

#### Rutas Principales

```
/                           → WelcomeScreen
/register                   → RegisterScreen
/home                       → HomeScreen (autenticado)
/menu                       → MenuScreen (autenticado)
/dish/:id                   → DishDetailScreen (autenticado)
/orders                     → OrderScreen (autenticado)
/profile                    → ProfileScreen (autenticado)
/favorites                  → FavoritesScreen (autenticado)
/settings                   → SettingsScreen
/join-table                 → JoinTableScreen (autenticado)
/qr-scanner                 → QRScannerScreen (autenticado)
/review                     → ReviewScreen (autenticado)
/product-reviews/:dishId    → ProductReviewsScreen (autenticado)
/request-assistance         → RequestAssistanceScreen (autenticado)
/payments                   → PaymentMethodsScreen
/add-card                   → AddCardScreen
/transactions               → TransactionsScreen
/transaction-detail/:id     → TransactionDetailScreen
/order-history              → OrderHistoryScreen
/order-detail               → OrderDetailScreen
/edit-order                 → EditOrderScreen (autenticado)
/waitlist                   → WaitlistScreen (autenticado)
/invite-users               → InviteUsersScreen (autenticado)
/group-order-management     → GroupOrderManagementScreen (autenticado)
/discover                   → DiscoverRestaurantsScreen (autenticado)
/meetup                     → MeetUpScreen (autenticado)
/contacts                   → ContactsScreen (autenticado)
/loyalty                    → LoyaltyScreen (autenticado)
/coupons                    → CouponsScreen (autenticado)
/coupon-detail/:id          → CouponDetailScreen (autenticado)
/order-confirmed            → OrderConfirmedScreen (autenticado)
/billing-step-1             → BillingDataScreen
/billing-step-2             → UploadConstanciaScreen
/billing-step-3             → EmailConfigScreen
/billing-step-4             → ConfirmationScreen
/payment-success            → PaymentSuccessScreen
```

#### Protección de Rutas
- Rutas autenticadas verifican `isAuthenticated === true`
- Si no está autenticado, redirige a `/`

---

## Internacionalización (i18n)

### Implementación

#### Archivos de Traducción
- **Formato**: JSON
- **Ubicación**: `locales/`
- **Idiomas soportados**:
  - Español (`es.json`)
  - Inglés (`en.json`)
  - Portugués (`pt.json`)
  - Francés (`fr.json`)

#### Estructura de Traducciones
```json
{
  "common": {
    "welcome": "Bienvenido",
    "save": "Guardar",
    ...
  },
  "menu": {
    "categories": {
      "appetizers": "Entradas",
      ...
    }
  },
  ...
}
```

#### Uso en Componentes
```typescript
import { useTranslation } from '../contexts/LanguageContext';

const MyComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('common.welcome')}</h1>;
};
```

#### Persistencia
- Idioma seleccionado se guarda en `localStorage`
- Al cargar la app, se recupera el idioma guardado
- Si no hay idioma guardado, se usa el predeterminado (Español)

---

## Solicitud de Asistencia

### Implementación

#### Pantalla (`RequestAssistanceScreen.tsx`)
- **Ruta**: `/request-assistance`
- **Funcionalidades**:
  - Historial de solicitudes realizadas
  - Campo de búsqueda con filtrado en tiempo real
  - Grid de botones de solicitudes predefinidas
  - Creación dinámica de solicitudes personalizadas
  - Botón destacado para solicitar asistencia personalizada

#### Almacenamiento
- **Clave localStorage**: `assistance_history`
- **Estructura**: Array de `AssistanceHistoryItem`
- **Persistencia**: Durante la sesión hasta completar el pago
- **Limpieza**: Automática al completar el pago en `PaymentSuccessScreen`

#### Búsqueda Fuzzy (Difusa)
- **Algoritmo de búsqueda difusa** implementado con múltiples estrategias:
  - **Normalización**: Elimina acentos y convierte a minúsculas
  - **Coincidencia exacta**: Busca texto exacto
  - **Coincidencia de subcadena**: Busca coincidencias parciales
  - **Coincidencia por palabras**: Todas las palabras del query deben aparecer
  - **Coincidencia parcial de caracteres**: Permite errores menores (≥70% de caracteres)
  - **Coincidencia de caracteres consecutivos**: Busca secuencias de caracteres
- **Ordenamiento por relevancia**: Los resultados se ordenan por score de relevancia
- **Score de relevancia**:
  - Coincidencia exacta en label: 100 puntos
  - Coincidencia al inicio del label: 80 puntos
  - Coincidencia en label: 50 puntos
  - Coincidencia exacta en keyword: 60 puntos
  - Coincidencia en keyword: 30 puntos
- Filtrado en tiempo real basado en:
  - Nombre del botón
  - Palabras clave asociadas a cada solicitud
- Cada solicitud tiene un array de `searchKeywords` para búsqueda optimizada

---

## Integraciones Externas

### Escáner QR

#### Biblioteca
- **html5-qrcode**: Biblioteca para escaneo de QR en web y móvil

#### Implementación
```typescript
// QRScannerScreen.tsx
import { Html5Qrcode } from 'html5-qrcode';

const qrCode = new Html5Qrcode('qr-reader');
await qrCode.start(
  { facingMode: 'environment' },
  config,
  onScanSuccess,
  onScanError
);
```

#### Permisos Android
```xml
<!-- AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
```

### Escaneo de Tarjetas con OCR

#### Biblioteca
- **tesseract.js**: Biblioteca de OCR (Optical Character Recognition) basada en JavaScript que funciona en el navegador

#### Implementación
```typescript
// AddCardScreen.tsx
import { createWorker } from 'tesseract.js';

const worker = await createWorker('eng', 1);
await worker.setParameters({
  tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ /',
  tessedit_pageseg_mode: '6'
});

const { data: { text } } = await worker.recognize(imageData);
await worker.terminate();
```

#### Funcionalidad
- Captura imagen de la tarjeta bancaria usando la cámara del dispositivo
- Procesa la imagen con OCR usando Tesseract.js
- Extrae datos de la tarjeta:
  - Número de tarjeta (16 dígitos)
  - Nombre del titular (texto en mayúsculas)
  - Fecha de vencimiento (MM/YY)
- Llena automáticamente los campos del formulario
- Maneja errores y muestra mensajes apropiados si no se pueden extraer datos

#### Reglas
- Solo reconoce caracteres alfanuméricos y espacios
- Funciona mejor con buena iluminación y tarjeta enfocada
- Si el OCR falla, el usuario puede ingresar los datos manualmente

---

## Sistema de Opiniones

### Implementación

#### Pantalla de Opiniones (`ReviewScreen.tsx`)
- **Ruta**: `/review`
- **Funcionalidades**:
  - Selección de tipo de opinión (Experiencia General o Producto Específico)
  - Calificación por estrellas (1-5)
  - Chips de selección rápida
  - Campo de comentarios
  - Subida de fotos/videos (hasta 5)
  - Toggle para vincular fotos a producto específico
  - Edición de opiniones existentes

#### Pantalla de Opiniones Verificadas (`ProductReviewsScreen.tsx`)
- **Ruta**: `/product-reviews/:dishId`
- **Funcionalidades**:
  - Estadísticas del producto (promedio, total de reseñas, distribución)
  - Filtros (Más Recientes, Con Foto, Modificados)
  - Lista de opiniones verificadas
  - Información detallada de cada opinión

#### Calificación en Detalle de Producto (`DishDetailScreen.tsx`)
- Muestra calificación promedio con estrellas
- Muestra promedio numérico y número de reseñas
- Número de reseñas es clickeable y navega a `/product-reviews/:id`

#### Almacenamiento
- **Clave localStorage**: `user_reviews`
- **Estructura**: Array de objetos `Review`
- **Persistencia**: Las opiniones persisten entre sesiones

#### Estructura de Datos Review
```typescript
interface Review {
  id: string;
  orderId: string;
  type: 'experience' | 'dish';
  itemId?: number;
  itemName?: string;
  rating: number;
  chips: string[];
  comment: string;
  media: string[]; // URLs de archivos
  timestamp: string;
  updatedAt?: string;
}
```

#### Reglas
- Solo se pueden calificar productos que se ordenaron y pagaron
- Cada producto puede tener su propia calificación independiente
- Las opiniones se pueden editar después de publicarlas
- Al cambiar de producto seleccionado, se limpian todos los campos
- Si un producto ya tiene calificación, se cargan los datos al seleccionarlo

### Geolocalización (Capacitor)

#### Implementación
- **Plugin**: `@capacitor/geolocation`
- **Funcionalidad**: Obtener ubicación GPS del usuario
- **Uso**: Descubrir restaurantes cercanos, mostrar ubicación en mapas

#### Permisos
- **Android**: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- Se solicitan automáticamente al usar la funcionalidad
- Si se deniegan, se usa ubicación por defecto

#### Funciones Principales
```typescript
// Verificar permisos
const permissions = await Geolocation.checkPermissions();

// Solicitar permisos
const requestResult = await Geolocation.requestPermissions();

// Obtener ubicación actual
const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0
});
```

---

### Contactos del Dispositivo (Capacitor)

#### Implementación
- **Plugin**: `@capacitor-community/contacts`
- **Funcionalidad**: Acceder a contactos del dispositivo móvil
- **Uso**: Importar contactos para compartir puntos de encuentro

#### Permisos
- **Android**: `READ_CONTACTS`, `WRITE_CONTACTS`
- Se solicitan al intentar importar contactos
- Solo funciona en plataformas nativas (Android/iOS)

#### Funciones Principales
```typescript
// Verificar permisos
const permissions = await Contacts.checkPermissions();

// Solicitar permisos
const result = await Contacts.requestPermissions();

// Obtener contactos
const result = await Contacts.getContacts({
  projection: {
    name: true,
    phones: true,
    emails: true
  }
});
```

---

### Mapas Interactivos (Leaflet)

#### Implementación
- **Biblioteca**: `leaflet`, `react-leaflet`
- **Funcionalidad**: Mostrar mapas interactivos con restaurantes y ubicaciones
- **Uso**: Descubrir restaurantes, punto de encuentro

#### Características
- Mapas de OpenStreetMap
- Marcadores personalizados para restaurantes y usuario
- Controles de zoom y centrado
- Cálculo de distancias

#### Componentes Principales
```typescript
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
```

---

### Cámara (Capacitor)

#### Plugin
- **@capacitor/camera**: Acceso a la cámara del dispositivo

#### Uso (Futuro)
- Actualmente no se usa directamente
- El escáner QR usa html5-qrcode que maneja la cámara internamente

---

## Persistencia de Datos

### Base de Datos Supabase

#### Tablas Principales
- **`users`**: Información esencial de usuarios (autenticación)
- **`user_profiles`**: Información extendida de perfiles
- **`restaurants`**: Información de restaurantes
- **`restaurant_staff`**: Asociación usuarios-restaurantes con roles
- **`products`**: Productos del menú
- **`promotions`**: Promociones activas
- **`orders`**: Órdenes de usuarios
- **`order_items`**: Items de cada orden
- **`restaurant_menu_sections`**: Secciones del menú (Sugerencias, Destacados, Menú)
- **`cart_items`**: Items en carrito (sincronizado con BD)
- **`reviews`**: Opiniones de productos
- **`user_payment_methods`**: Métodos de pago guardados
- **`user_addresses`**: Direcciones de usuarios
- **`user_settings`**: Configuración de usuarios

#### Storage Buckets
- **`product-images`**: Imágenes de productos
- **`promotion-images`**: Imágenes de promociones
- **`restaurant-images`**: Logos y portadas de restaurantes

### localStorage (Solo UI)

#### Datos Persistidos
1. **Configuración del usuario**:
   - `selectedLanguage`: Idioma seleccionado
   - `theme`: Modo oscuro/claro

2. **Caché temporal**:
   - Datos de sesión de Supabase Auth
   - Caché de preferencias de UI

### Estructura de Datos

#### Órdenes (Base de Datos)
```typescript
interface Order {
  id: string; // UUID
  user_id: string; // UUID
  restaurant_id: string; // UUID
  order_number: string;
  status: OrderStatus;
  total: number;
  subtotal: number;
  tax: number;
  tip: number;
  items: OrderItem[]; // JSONB
  notes?: string;
  payment_method?: string;
  payment_status: string;
  table_number?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_active: boolean;
}
```

#### Productos (Base de Datos)
```typescript
interface Product {
  id: number;
  restaurant_id: string; // UUID
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_urls?: string[]; // Array de URLs para múltiples imágenes
  badges?: string[]; // Array de etiquetas
  category: string;
  origin?: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
```

#### Promociones (Base de Datos)
```typescript
interface Promotion {
  id: string; // UUID
  restaurant_id: string; // UUID
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  discount_type: 'percentage' | 'fixed' | '2x1' | 'combo' | 'final';
  discount_value?: number;
  original_price?: number;
  final_price?: number;
  valid_from: string;
  valid_until: string;
  applicable_hours?: { start: string; end: string };
  applicable_days?: string[];
  included_items?: any[];
  badges?: string[];
  client_segmentation?: string[];
  flash_counter?: boolean;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}
```

---

## Seguridad

### Autenticación

#### Supabase Auth
- **Email/Contraseña**: Autenticación con Supabase Auth
- **OAuth**: Soporte para Google y otros proveedores (futuro)
- **Tokens JWT**: Tokens automáticos gestionados por Supabase
- **Refresh Tokens**: Renovación automática de tokens
- **Verificación de Email**: Verificación automática de emails
- **Persistencia de Sesión**: Sesiones persisten entre recargas

#### Row Level Security (RLS)
- **Políticas de Seguridad**: Cada tabla tiene políticas RLS configuradas
- **Acceso por Usuario**: Los usuarios solo pueden acceder a sus propios datos
- **Acceso por Rol**: Restaurantes solo pueden gestionar sus propios productos/promociones
- **Políticas por Operación**: SELECT, INSERT, UPDATE, DELETE tienen políticas separadas

### Datos Sensibles

#### Tarjetas de Crédito
- **Estado Actual**: Se guardan en localStorage (no seguro)
- **Futuro**: Integración con pasarelas de pago (Stripe, PayPal)
- Solo se guardan los últimos 4 dígitos para visualización

#### Datos Personales
- **Almacenamiento**: Base de datos Supabase con RLS
- **Encriptación**: Encriptación en tránsito (HTTPS) y reposo (Supabase)
- **Acceso**: Solo el usuario autenticado puede acceder a sus datos

---

## Flujo de Datos

### Agregar Item al Carrito

```
Usuario hace click en "Agregar a Orden"
  ↓
DishDetailScreen maneja el evento
  ↓
Llama a CartContext.addToCart()
  ↓
CartContext actualiza estado
  ↓
Componentes que usan CartContext se re-renderizan
  ↓
BottomNav actualiza badge con cantidad
```

### Confirmar Orden

```
Usuario hace click en "Confirmar Orden"
  ↓
OrderScreen valida que haya items
  ↓
Crea objeto Order
  ↓
Guarda en localStorage (orders_list)
  ↓
CartContext.clearCart()
  ↓
Navega a OrderConfirmedScreen
```

### Solicitar Asistencia

```
Usuario hace click en "Solicitar asistencia"
  ↓
Navega a RequestAssistanceScreen
  ↓
Usuario escribe en campo de búsqueda (opcional)
  ↓
Botones se filtran en tiempo real
  ↓
Usuario hace click en botón de solicitud
  ↓
handleRequest() procesa la solicitud
  ↓
Se crea AssistanceHistoryItem
  ↓
Se guarda en localStorage (assistance_history)
  ↓
Se actualiza historial en pantalla
  ↓
Botón se marca como "Solicitado" (3 segundos)
  ↓
Al completar pago, historial se limpia
```

### Escanear QR

```
Usuario hace click en "Escanear QR"
  ↓
Navega a QRScannerScreen
  ↓
Solicita permisos de cámara
  ↓
Html5Qrcode inicia escaneo
  ↓
Detecta código QR
  ↓
Navega a JoinTableScreen con código
  ↓
JoinTableScreen procesa código
  ↓
Usuario se une a orden grupal
```

---

## Build y Deployment

### Desarrollo

#### Scripts Disponibles
```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "cap:add": "npx cap add",
  "cap:sync": "npx cap sync",
  "cap:open": "npx cap open",
  "android:build": "npm run build && npx cap sync && cd android && gradlew.bat assembleDebug",
  "android:release": "npm run build && npx cap sync && cd android && gradlew.bat assembleRelease"
}
```

#### Proceso de Desarrollo
1. `npm run dev`: Inicia servidor de desarrollo
2. Edita archivos en `src/`
3. Vite recarga automáticamente (HMR)

### Producción

#### Build Web
```bash
npm run build
```
- Genera archivos estáticos en `dist/`
- Optimiza y minifica código
- Listo para deployment en servidor web

#### Build Android
```bash
npm run android:build
```
1. Ejecuta `vite build`
2. Sincroniza con Capacitor (`npx cap sync`)
3. Compila APK de debug en `android/app/build/outputs/apk/debug/`

---

## Gestión de Recursos Estáticos

### Imágenes de Productos

#### Ubicación
- **Carpeta**: `/public`
- **Acceso**: Las imágenes se referencian con rutas absolutas desde la raíz (ej: `/imagen.jpg`)
- **Build**: Vite copia automáticamente los archivos de `public/` al directorio de salida durante el build

#### Formato de Rutas
Las imágenes de productos se referencian con rutas absolutas que comienzan con `/`:
```typescript
{
  id: 20,
  name: 'Carajillo',
  image: '/carajillo solo.webp',  // Ruta desde public/
  // ...
}
```

#### Categorías de Imágenes

**Coctelería**:
- `/carajillo solo.webp` - Carajillo
- `/coketillo_donk.jpg` - Coketillo
- `/carajilla.jpg` - Carajilla
- `/licor43.webp` - Licor 43
- `/baileys.webp` - Baileys
- `/frangelico.webp` - Frangelico
- `/sambuca.webp` - Sambuca
- `/chincho-seco.avif` - Chinchón Seco
- `/chinchon-dulce.jpg` - Chinchón Dulce

**Postres**:
- `/volcan.jpg` - Volcán
- `/cheesecake-vasco.jpg` - Cheesecake Vasco
- `/pan-elote.jpeg` - Pan de Elote
- `/cheesecake-lotus.png` - Cheesecake Lotus
- `/pastel-3leches.jpg` - Pastel 3 Leches
- `/red-velvet.jpg` - Red Velvet
- `/tarta-chocolate.jpg` - Tarta de Chocolate
- `/flan-vainilla.jpg` - Flan de Vainilla

**Bebidas**:
- `/cafe-americano-nespresso.webp` - Americano
- `/cafe-expresso-nespresso.webp` - Espresso
- `/capuchino-nespresso.webp` - Capuchino
- `/frappuccino.jpg` - Frapuccino
- `/te.webp` - Té
- `/jugo-naranja.avif` - Jugo de Naranja Natural

#### Ventajas de Usar Archivos Locales
- **Rendimiento**: Carga más rápida al no depender de URLs externas
- **Confiabilidad**: No hay dependencia de servicios externos
- **Control**: Gestión completa de los recursos
- **Optimización**: Posibilidad de optimizar imágenes antes del build

#### Formatos Soportados
- `.webp` - Formato moderno con buena compresión
- `.jpg` / `.jpeg` - Formato tradicional
- `.png` - Para imágenes con transparencia
- `.avif` - Formato moderno con excelente compresión

#### Build Android Release
```bash
npm run android:release
```
- Similar al build de debug
- Genera APK firmado para distribución

---

## Escalabilidad y Futuro

### Mejoras Planificadas

#### Backend
- API REST con Node.js o Python
- Base de datos PostgreSQL o MongoDB
- Autenticación real con JWT
- WebSockets para actualizaciones en tiempo real

#### Notificaciones
- Push notifications para cambios de estado de órdenes
- Notificaciones de promociones y ofertas

#### Integraciones
- Pasarelas de pago reales (Stripe, PayPal, Mercado Pago)
- Sistemas POS existentes
- Servicios de delivery (Uber Eats, Rappi)

#### Funcionalidades
- Reservas de mesas
- Programa de lealtad
- Chat en vivo con soporte
- Análiticas avanzadas para restaurantes

---

---

## Edición de Órdenes

### Implementación

#### Pantalla (`EditOrderScreen.tsx`)
- **Ruta**: `/edit-order?orderId={id}`
- **Funcionalidades**:
  - Carga items de la orden en el carrito con cantidades exactas
  - Modificación de cantidades de items
  - Eliminación de items
  - Agregar notas de último minuto
  - Actualización automática del total
  - Guardar cambios y actualizar la orden

#### Flujo de Datos
```
Usuario hace click en "Modificar mi orden"
  ↓
Navega a /edit-order?orderId={orderId}
  ↓
EditOrderScreen carga la orden desde localStorage
  ↓
Agrupa items por ID y notas, suma cantidades
  ↓
Usa setCartItems() para cargar items en el carrito
  ↓
Usuario puede:
  - Modificar cantidades o eliminar items
  - Agregar más items (navega a /menu)
  - Agregar notas de último minuto
  ↓
Total se actualiza automáticamente
  ↓
Usuario hace click en "Guardar Cambios"
  ↓
Actualiza la orden en localStorage (incluye items nuevos si se agregaron)
  ↓
Actualiza timestamp de la orden
  ↓
Navega de vuelta a /order-detail
```

#### Funcionalidades Adicionales
- **Agregar más items**: Botón que navega a `/menu` permitiendo agregar productos adicionales
- **Carga de imágenes**: Usa `allDishes` exportado de `DishDetailScreen.tsx` para obtener imágenes correctas
- **Estado vacío**: Muestra mensaje y botón para agregar items si la orden está vacía

#### Almacenamiento
- **Fuente**: `localStorage` con clave `orders_list`
- **Actualización**: La orden se actualiza directamente en el array de órdenes
- **Validación**: Solo se puede editar si `status === 'orden_enviada' || status === 'orden_recibida'`

---

## Lista de Espera (Waitlist)

### Implementación

#### Pantalla (`WaitlistScreen.tsx`)
- **Ruta**: `/waitlist`
- **Funcionalidades**:
  - Escaneo QR para agregarse a lista de espera
  - Selección de zona (interior, terraza, jardín, patio, rooftop)
  - Selección de número de personas
  - Visualización de posición en la fila
  - Tiempo estimado de espera
  - Opción para cambiar de zona
  - Opción para cancelar solicitud
  - Dos diseños: inicial (10 segundos) y progreso (después)

#### Flujo de Datos
```
Usuario escanea QR desde /home
  ↓
Navega a /waitlist
  ↓
Selecciona zona y número de personas
  ↓
Muestra información de la lista (cantidad en espera, posición)
  ↓
Usuario confirma solicitud
  ↓
Se agrega entrada a waitlist_entries en localStorage
  ↓
Se actualiza estado a isConfirmed = true
  ↓
Muestra diseño inicial por 10 segundos
  ↓
Después de 10 segundos, muestra diseño de progreso
  ↓
Intervalo actualiza posiciones y tiempos estimados
```

#### Almacenamiento
- **Clave localStorage**: `waitlist_entries`
- **Estructura**: Array de `WaitlistEntry`
- **Persistencia**: Durante la sesión hasta cancelar o ser atendido

#### Simulación en Tiempo Real
- Intervalo que actualiza automáticamente las posiciones
- Simula avance de la lista de espera
- Calcula tiempos estimados dinámicamente

---

### Cambios Recientes (Enero 2025)
- ✅ **Backend Supabase**: Migración completa a Supabase como backend
- ✅ **Capa de API**: Nueva capa de abstracción en `services/api/` para todas las operaciones CRUD
- ✅ **Autenticación Real**: Implementación de Supabase Auth con email/contraseña
- ✅ **Gestión de Productos**: CRUD completo de productos desde `MenuRestaurantScreen`
- ✅ **Gestión de Promociones**: CRUD completo de promociones desde `PromotionsRestaurantScreen`
- ✅ **Múltiples Imágenes**: Soporte para múltiples imágenes por producto
- ✅ **Etiquetas de Productos**: Sistema de badges/etiquetas para productos
- ✅ **Búsqueda Global**: Búsqueda de productos en todo el menú (no solo categoría actual)
- ✅ **Pantallas de Restaurante**: 
  - `MenuRestaurantScreen`: Gestión de menú
  - `PromotionsRestaurantScreen`: Gestión de promociones
  - `RestaurantProfileScreen`: Perfil del restaurante
  - `HomeRestaurantScreen`: Home para restaurantes
  - `StatisticsRestaurantScreen`: Estadísticas
  - `AdminControlPanelScreen`: Panel de control
- ✅ **Separación users/user_profiles**: Arquitectura mejorada de base de datos
- ✅ **Row Level Security**: Políticas RLS configuradas para todas las tablas
- ✅ **Color Primario Actualizado**: Cambio de `#F48C25` a `#EB9947`
- ✅ **Agregado componente `TopNavbar` reutilizable para navegación superior
- ✅ Sistema de favoritos extendido para incluir promociones
- ✅ Integración de `TopNavbar` en pantallas principales (Home, Menu, Order, Transactions, Promotions)
- ✅ Opción para ocultar botón de favoritos en `TopNavbar` mediante prop `showFavorites`
- ✅ Mejora en traducciones de nombres y descripciones de platillos favoritos

### Cambios Recientes (Diciembre 2024)
- ✅ Agregada sección de gestión de recursos estáticos (imágenes de productos)
- ✅ Documentación de carpeta `/public` y su uso en el proyecto
- ✅ Migración de imágenes de productos de URLs externas a archivos locales
- ✅ Documentación de formatos de imágenes soportados (.webp, .jpg, .png, .avif)
- ✅ Actualización de estructura del proyecto para incluir carpeta `/public`
- ✅ Implementación de preservación de estado de navegación (categoría y scroll)
- ✅ Mejora en experiencia de usuario al navegar entre menú y detalle de productos
- ✅ Funcionalidad para agregar más items en pantalla de edición de órdenes
- ✅ Corrección de carga de imágenes en pantalla de edición de órdenes

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.5  
**Responsable**: Equipo de desarrollo
