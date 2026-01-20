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
  - `CartContext`: Estado del carrito
  - `RestaurantContext`: Configuración del restaurante
  - `GroupOrderContext`: Estado de pedidos grupales
  - `LanguageContext`: Internacionalización
  - `FavoritesContext`: Gestión de favoritos

#### Almacenamiento Local
- **localStorage**: Persistencia de datos en el cliente
  - Configuración del usuario (idioma, tema)
  - Carrito de compras
  - Favoritos
  - Historial de órdenes

### Backend

#### Estado Actual
- **No hay backend propio**: La aplicación utiliza almacenamiento local (localStorage)
- **Datos estáticos**: Los platillos están hardcodeados en el frontend
- **Simulación de servicios**: Los pagos y órdenes se simulan

#### Futuro Backend (Planificado)
- **API REST**: Servicios backend para gestión de órdenes, usuarios, pagos
- **Base de datos**: PostgreSQL o MongoDB para almacenar datos
- **Autenticación**: Sistema de autenticación con JWT
- **Notificaciones**: Servicio de notificaciones push

### Mobile (Capacitor)

#### Plataforma
- **Capacitor 8.1.0**: Framework para aplicaciones nativas
- **Android**: Plataforma móvil soportada actualmente

#### Plugins de Capacitor
- **@capacitor/camera**: Acceso a la cámara para escáner QR
- **@capacitor/android**: Plataforma Android

#### Bibliotecas Externas
- **html5-qrcode 2.3.8**: Escaneo de códigos QR

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
│   └── BottomNav.tsx
├── config/                  # Configuración
│   └── restaurantConfig.ts
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
│   ├── BillingDataScreen.tsx
│   ├── ConfirmationScreen.tsx
│   ├── DishDetailScreen.tsx
│   ├── EmailConfigScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── GroupOrderManagementScreen.tsx
│   ├── HomeScreen.tsx
│   ├── InviteUsersScreen.tsx
│   ├── JoinTableScreen.tsx
│   ├── MenuScreen.tsx
│   ├── OrderConfirmedScreen.tsx
│   ├── OrderDetailScreen.tsx
│   ├── OrderHistoryScreen.tsx
│   ├── OrderScreen.tsx
│   ├── PaymentMethodsScreen.tsx
│   ├── PaymentSuccessScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── QRScannerScreen.tsx
│   ├── RegisterScreen.tsx
│   ├── ReviewScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── TransactionDetailScreen.tsx
│   ├── TransactionsScreen.tsx
│   ├── UploadConstanciaScreen.tsx
│   └── WelcomeScreen.tsx
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
  updateCartItemQuantity: (itemId: number, quantity: number) => void;
  updateCartItemNotes: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
}
```

**Almacenamiento**: Estado en memoria (durante sesión)

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
interface FavoritesContextType {
  favorites: number[];
  addToFavorites: (dishId: number) => void;
  removeFromFavorites: (dishId: number) => void;
  isFavorite: (dishId: number) => boolean;
  getFavorites: () => number[];
}
```

**Almacenamiento**: localStorage

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
/payments                   → PaymentMethodsScreen
/add-card                   → AddCardScreen
/transactions               → TransactionsScreen
/transaction-detail/:id     → TransactionDetailScreen
/order-history              → OrderHistoryScreen
/order-detail               → OrderDetailScreen
/invite-users               → InviteUsersScreen (autenticado)
/group-order-management     → GroupOrderManagementScreen (autenticado)
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

### Cámara (Capacitor)

#### Plugin
- **@capacitor/camera**: Acceso a la cámara del dispositivo

#### Uso (Futuro)
- Actualmente no se usa directamente
- El escáner QR usa html5-qrcode que maneja la cámara internamente

---

## Persistencia de Datos

### localStorage

#### Datos Persistidos
1. **Configuración del usuario**:
   - `selectedLanguage`: Idioma seleccionado
   - `theme`: Modo oscuro/claro
   - `favorites`: Lista de IDs de platillos favoritos

2. **Carrito** (durante sesión):
   - Se limpia al confirmar orden o cerrar sesión

3. **Historial**:
   - `orders_list`: Órdenes activas
   - `order_history`: Historial de órdenes completadas
   - `transactions`: Historial de transacciones

### Estructura de Datos

#### Órdenes
```typescript
interface Order {
  orderId: string;
  orderNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  timestamp: string;
}
```

#### Historial
```typescript
interface HistoricalOrder {
  id: string;
  restaurantName: string;
  date: string;
  time: string;
  total: number;
  status: 'completada' | 'cancelada';
  items: HistoricalOrderItem[];
  logo: string;
  transactionId?: number;
  timestamp: string;
}
```

---

## Seguridad

### Autenticación

#### Estado Actual
- **Simulado**: `isAuthenticated` es un estado de React
- No hay validación real de credenciales
- No hay tokens JWT ni sesiones

#### Futuro (Planificado)
- Autenticación con email/contraseña
- Tokens JWT para sesiones
- Refresh tokens para renovación automática
- Verificación de email

### Datos Sensibles

#### Tarjetas de Crédito
- **Estado Actual**: Se guardan en localStorage (no seguro)
- **Futuro**: Integración con pasarelas de pago (Stripe, PayPal)
- Solo se guardan los últimos 4 dígitos para visualización

#### Datos Personales
- Se almacenan en localStorage localmente
- No se envían a servidores externos (actualmente)

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

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de desarrollo
