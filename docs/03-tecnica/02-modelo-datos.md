# 🗄️ Modelo de Datos

## Visión General

Este documento describe las estructuras de datos utilizadas en **Breakfast App**, incluyendo interfaces TypeScript, tipos y cómo se almacenan los datos.

---

## Tipos y Interfaces Principales

### Orden (Order)

#### Definición
```typescript
export type OrderStatus = 
  | 'orden_enviada' 
  | 'orden_recibida' 
  | 'en_preparacion' 
  | 'lista_para_entregar' 
  | 'en_entrega' 
  | 'entregada' 
  | 'con_incidencias' 
  | 'orden_cerrada' 
  | 'cancelada';

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
}

export interface Order {
  orderId: string;
  orderNumber: number; // 1 para orden principal, 2, 3, etc. para complementarias
  items: OrderItem[];
  status: OrderStatus;
  timestamp: string;
}
```

#### Estados de Orden

| Estado | Descripción |
|--------|-------------|
| `orden_enviada` | Orden enviada a cocina |
| `orden_recibida` | Orden recibida por cocina |
| `en_preparacion` | En proceso de preparación |
| `lista_para_entregar` | Lista para entregar al mesero |
| `en_entrega` | El mesero está entregando |
| `entregada` | Orden entregada al comensal |
| `con_incidencias` | Hay algún problema con la orden |
| `orden_cerrada` | Orden cerrada y pagada |
| `cancelada` | Orden cancelada |

#### Ejemplo
```json
{
  "orderId": "ORD-2024-001",
  "orderNumber": 1,
  "items": [
    {
      "id": 1,
      "name": "Omelette con Jamón",
      "price": 180,
      "notes": "Sin cebolla",
      "quantity": 2
    }
  ],
  "status": "orden_enviada",
  "timestamp": "2024-12-20T10:30:00Z"
}
```

---

### Carrito (Cart)

#### Definición
```typescript
export interface CartItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
}
```

#### Contexto de Carrito (`CartContext`)
```typescript
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, quantity: number, notes?: string) => void;
  updateCartItemNotes: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  setCartItems: (items: CartItem[]) => void; // Nueva función para establecer items directamente
}
```

#### Funciones Principales
- **`addToCart`**: Agrega item al carrito. Si el item ya existe con el mismo ID y notas, incrementa la cantidad.
- **`removeFromCart`**: Elimina todos los items con el ID especificado.
- **`updateCartItemQuantity`**: Actualiza la cantidad de un item. Si se especifica `notes`, solo actualiza el item con esas notas específicas.
- **`updateCartItemNotes`**: Actualiza las notas de un item.
- **`clearCart`**: Limpia todos los items del carrito.
- **`getCartItemCount`**: Retorna el total de items (sumando cantidades).
- **`setCartItems`**: Establece directamente los items del carrito (útil para cargar órdenes).

#### Almacenamiento
- **Tipo**: Estado en memoria (React Context)
- **Duración**: Durante la sesión
- **Limpieza**: Se limpia al confirmar orden o cerrar sesión

#### Ejemplo
```json
[
  {
    "id": 1,
    "name": "Omelette con Jamón",
    "price": 180,
    "notes": "Sin cebolla, Proteína: Pollo",
    "quantity": 2
  },
  {
    "id": 5,
    "name": "Café Americano",
    "price": 45,
    "notes": "Tamaño: Porción",
    "quantity": 1
  }
]
```

---

### Historial de Órdenes (HistoricalOrder)

#### Definición
```typescript
export interface HistoricalOrderItem {
  id: number;
  name: string;
  price: string; // Precio como string para mostrar (ej: "$18.00")
  notes: string;
  quantity: number;
}

export interface HistoricalOrder {
  id: string;
  restaurantName: string;
  date: string;
  time: string;
  total: number;
  status: 'completada' | 'cancelada';
  items: HistoricalOrderItem[];
  logo: string;
  transactionId?: number;
  timestamp: string; // Fecha completa de cuando se pagó
}
```

#### Almacenamiento
- **Clave localStorage**: `order_history`
- **Tipo**: Array de `HistoricalOrder`
- **Persistencia**: Permanente hasta que el usuario limpie datos

#### Ejemplo
```json
{
  "id": "HIST-2024-001",
  "restaurantName": "Donk Restaurant",
  "date": "20 Dic 2024",
  "time": "10:30 AM",
  "total": 405.00,
  "status": "completada",
  "items": [
    {
      "id": 1,
      "name": "Omelette con Jamón",
      "price": "$180.00",
      "notes": "Sin cebolla",
      "quantity": 2
    }
  ],
  "logo": "https://example.com/logo.png",
  "transactionId": 12345,
  "timestamp": "2024-12-20T10:30:00Z"
}
```

---

### Platillos (Dishes)

#### Estructura en MenuScreen.tsx
```typescript
interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'appetizers' | 'main_courses' | 'desserts' | 'drinks' | 'cocktails';
  subcategory?: string;
  proteins?: string[];
  sizeOptions?: {
    portion?: number;
    bottle?: number;
  };
  badge?: 'vegan' | 'specialty';
}
```

#### Categorías

| Categoría | Descripción | Subcategorías |
|-----------|-------------|---------------|
| `appetizers` | Entradas | `cold`, `hot` |
| `main_courses` | Platos Fuertes | Proteínas: `chicken`, `beef`, `pork`, `fish`, `vegetarian` |
| `desserts` | Postres | - |
| `drinks` | Bebidas | `hot`, `cold`, `natural` |
| `cocktails` | Coctelería | `rum`, `vodka`, `tequila`, `gin` |

#### Ejemplo
```json
{
  "id": 1,
  "name": "Omelette con Jamón",
  "description": "Omelette esponjoso con jamón, queso y hierbas frescas",
  "price": 180,
  "image": "/omelette.jpg",
  "category": "main_courses",
  "proteins": ["chicken", "beef"],
  "badge": "specialty"
}
```

#### Nota sobre Imágenes
- Las imágenes se almacenan en la carpeta `/public` del proyecto
- Se referencian con rutas absolutas que comienzan con `/` (ej: `/imagen.jpg`)
- Durante el build, Vite copia automáticamente los archivos de `public/` al directorio de salida
- Las imágenes de productos de coctelería, postres y bebidas han sido migradas a archivos locales

---

### Transacciones (Transactions)

#### Estructura (Inferida del código)
```typescript
interface Transaction {
  id: number;
  date: string;
  time: string;
  total: number;
  method: 'card' | 'cash' | 'other';
  status: 'completed' | 'pending' | 'failed';
  orderId: string;
  items: HistoricalOrderItem[];
}
```

#### Almacenamiento
- **Clave localStorage**: `transactions`
- **Tipo**: Array de `Transaction`

---

### Pedidos en Grupo (GroupOrder)

#### Estructura (Inferida del código)
```typescript
interface GroupOrder {
  tableCode: string;
  participants: string[]; // IDs de usuarios
  items: GroupOrderItem[];
  status: 'active' | 'closed';
  createdAt: string;
}

interface GroupOrderItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
  addedBy: string; // ID del usuario que agregó
}
```

#### Almacenamiento
- **Tipo**: Estado en memoria y localStorage
- **Clave localStorage**: `group_order`

---

### Favoritos (Favorites)

#### Estructura
```typescript
type Favorites = number[]; // Array de IDs de platillos

interface FavoritePromotion {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
}
```

#### Almacenamiento
- **Clave localStorage**: `favorites`
- **Tipo**: Array de números (IDs de platillos)
- **Clave localStorage**: `favoritePromotions`
- **Tipo**: Array de objetos `FavoritePromotion`

#### Ejemplo
```json
// Favoritos (platillos)
[1, 5, 12, 23]

// Promociones favoritas
[
  {
    "id": "promo-1",
    "title": "Desayuno Especial",
    "description": "Incluye café, jugo y platillo principal",
    "image": "https://example.com/promo1.jpg",
    "category": "Desayuno"
  }
]
```

---

### Configuración del Usuario

#### Idioma
- **Clave localStorage**: `selectedLanguage`
- **Valores posibles**: `"es"`, `"en"`, `"pt"`, `"fr"`
- **Valor por defecto**: `"es"`

#### Tema
- **Clave localStorage**: `theme`
- **Valores posibles**: `"light"`, `"dark"`
- **Valor por defecto**: `"light"`

---

### Configuración del Restaurante

#### Definición
```typescript
export interface RestaurantConfig {
  allowOrderModification: boolean;
  allowCardPayment: boolean;
  allowInvoice: boolean;
}
```

#### Archivo
- **Ubicación**: `config/restaurantConfig.ts`
- **Tipo**: Configuración estática (actualmente)

#### Ejemplo
```typescript
export const restaurantConfig: RestaurantConfig = {
  allowOrderModification: true,
  allowCardPayment: true,
  allowInvoice: true,
};
```

---

## Solicitud de Asistencia (Assistance)

### Definición
```typescript
interface AssistanceRequest {
  id: string;
  icon: string;
  label: string;
  translationKey: string;
  searchKeywords?: string[];
}

interface AssistanceHistoryItem {
  id: string;
  label: string;
  icon: string;
  timestamp: string; // ISO string
  isCustom: boolean;
}
```

### Almacenamiento
- **Clave localStorage**: `assistance_history`
- **Tipo**: Array de `AssistanceHistoryItem`
- **Persistencia**: Durante la sesión hasta completar el pago

### Tipos de Solicitudes Predefinidas
- `cutlery`: Cubiertos y Vasos
- `napkins`: Servilletas
- `spillTable`: Limpiar Derrame (Mesa)
- `spillFloor`: Limpiar Derrame (Piso)
- `tortillas`: Tortillas
- `bolillo`: Bolillo
- `spicy`: Picante
- `waiter`: Solicitar Asistencia Personalizada (Llamar Mesero)

### Ejemplo
```json
[
  {
    "id": "history-1703123456789-abc123",
    "label": "Cubiertos y Vasos",
    "icon": "restaurant",
    "timestamp": "2024-12-20T10:30:00.000Z",
    "isCustom": false
  },
  {
    "id": "history-1703123457890-def456",
    "label": "Agua",
    "icon": "priority_high",
    "timestamp": "2024-12-20T10:35:00.000Z",
    "isCustom": true
  }
]
```

### Limpieza
- El historial se limpia automáticamente cuando se completa el pago en `PaymentSuccessScreen.handleFinish()`
- Se elimina con `localStorage.removeItem('assistance_history')`

---

## Lista de Espera (Waitlist)

### Definición
```typescript
interface WaitlistEntry {
  id: string;
  zone: string; // 'interior', 'terrace', 'garden', 'patio', 'rooftop'
  timestamp: string; // ISO string
  confirmed: boolean;
  position: number;
  estimatedWaitMinutes: number;
  numberOfPeople: number;
}
```

### Zonas Disponibles
- `interior`: Interior
- `terrace`: Terraza
- `garden`: Jardín
- `patio`: Patio
- `rooftop`: Rooftop

### Almacenamiento
- **Clave localStorage**: `waitlist_entries`
- **Tipo**: Array de `WaitlistEntry`
- **Persistencia**: Durante la sesión hasta cancelar o ser atendido

### Reglas
- Cada entrada tiene un ID único generado con timestamp y random
- La posición se calcula según la zona y orden de confirmación
- El tiempo estimado se calcula dinámicamente según la posición
- Solo las entradas confirmadas cuentan para el cálculo de posiciones

### Ejemplo
```json
[
  {
    "id": "waitlist-1703123456789-abc123",
    "zone": "interior",
    "timestamp": "2024-12-20T10:30:00.000Z",
    "confirmed": true,
    "position": 3,
    "estimatedWaitMinutes": 15,
    "numberOfPeople": 4
  }
]
```

---

## Programa de Lealtad (Loyalty)

### Definición
```typescript
type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

interface LoyaltyUser {
  userId: string;
  totalPoints: number;
  currentLevel: LoyaltyLevel;
  monthlyGrowth: number;
  joinDate: string; // ISO string
}
```

### Almacenamiento
- **Clave localStorage**: `loyalty_data`
- **Tipo**: `LoyaltyUser`
- **Persistencia**: Permanente

### Niveles
- **Bronze**: 0-999 puntos
- **Silver**: 1000-4999 puntos
- **Gold**: 5000-9999 puntos
- **Platinum**: 10000+ puntos

---

## Contactos del Usuario

### Definición
```typescript
interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
}
```

### Almacenamiento
- **Clave localStorage**: `user_contacts`
- **Tipo**: Array de `Contact`
- **Persistencia**: Permanente

### Reglas
- Nombre es obligatorio
- Teléfono o email es obligatorio (al menos uno)
- Se pueden importar desde el dispositivo móvil

---

## Mesa Lista (Table Ready)

### Definición
```typescript
interface TableReadyData {
  zone: string;
  tableNumber?: string;
  timeRemaining: number; // en segundos
  estimatedWaitTime?: number;
  numberOfPeople?: number;
}
```

### Almacenamiento
- **Clave localStorage**: `tableReadyData`
- **Tipo**: `TableReadyData`
- **Persistencia**: Temporal (se limpia al confirmar asistencia)

---

## Pago Dividido (Split Payment)

### Definición
```typescript
interface SelectedItem {
  id: string; // ID único: orderId-itemId-index
  orderId: string;
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isUserItem: boolean;
}

interface SplitPaymentData {
  selectedItems: SelectedItem[];
  subtotal: number;
}
```

### Almacenamiento
- **Clave localStorage**: `splitPaymentData`
- **Tipo**: `SplitPaymentData`
- **Persistencia**: Temporal (se limpia después del pago)

---

## Claves de localStorage

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `selectedLanguage` | string | Idioma seleccionado |
| `theme` | string | Tema (light/dark) |
| `favorites` | number[] | IDs de platillos favoritos |
| `favoritePromotions` | FavoritePromotion[] | Promociones favoritas |
| `orders_list` | Order[] | Órdenes activas |
| `order_history` | HistoricalOrder[] | Historial de órdenes completadas |
| `transactions` | Transaction[] | Historial de transacciones |
| `group_order` | GroupOrder \| null | Orden grupal activa |
| `assistance_history` | AssistanceHistoryItem[] | Historial de solicitudes de asistencia |
| `waitlist_entries` | WaitlistEntry[] | Lista de espera activa |
| `loyalty_data` | LoyaltyUser | Datos del programa de lealtad |
| `user_contacts` | Contact[] | Contactos del usuario |
| `tableReadyData` | TableReadyData | Datos de mesa lista |
| `splitPaymentData` | SplitPaymentData | Datos de pago dividido |
| `selectedRestaurant` | Restaurant \| null | Restaurante seleccionado |

---

## Relaciones Entre Entidades

### Diagrama Conceptual

```
Usuario
  ├── Favoritos (1:N) → Platillos
  ├── Órdenes (1:N) → Order
  │     └── Items (1:N) → OrderItem
  │           └── Referencia (N:1) → Platillo
  ├── Historial (1:N) → HistoricalOrder
  └── Transacciones (1:N) → Transaction
        └── Referencia (N:1) → HistoricalOrder

Restaurante
  └── Configuración (1:1) → RestaurantConfig

GroupOrder
  ├── Participantes (N:M) → Usuario
  └── Items (1:N) → GroupOrderItem
        └── Referencia (N:1) → Platillo
```

---

## Validaciones y Reglas

### OrdenItem
- **id**: Debe ser un número positivo
- **name**: No puede estar vacío
- **price**: Debe ser un número positivo
- **notes**: Puede estar vacío, máximo 500 caracteres
- **quantity**: Debe ser entre 1 y 99

### Order
- **orderId**: Debe ser único
- **orderNumber**: Debe ser 1 para orden principal, incrementa para complementarias
- **items**: Debe tener al menos 1 item
- **status**: Debe ser uno de los estados válidos
- **timestamp**: Debe ser una fecha ISO válida

### HistoricalOrder
- **id**: Debe ser único
- **total**: Debe ser la suma de todos los items
- **status**: Solo puede ser 'completada' o 'cancelada'
- **timestamp**: Debe ser una fecha ISO válida

---

## Migración de Datos (Futuro)

### Versión Actual
- **Versión**: 1.0
- **Formato**: JSON en localStorage
- **Compatibilidad**: Sin versionado

### Plan de Migración (Futuro)
- Cuando se agregue backend, se necesitará:
  1. Exportar datos de localStorage
  2. Transformar al formato del backend
  3. Importar al backend
  4. Validar integridad

---

## Consideraciones de Rendimiento

### localStorage
- **Límite**: ~5-10 MB dependiendo del navegador
- **Acceso**: Síncrono (puede bloquear UI en datos grandes)
- **Recomendación**: Limitar tamaño de datos almacenados

### Optimizaciones Futuras
- **IndexedDB**: Para datos más grandes
- **Backend**: Para datos persistentes
- **Caché**: Para mejorar rendimiento

---

## Seguridad de Datos

### Datos Sensibles

#### Tarjetas de Crédito
- **Estado actual**: Se guardan en localStorage (NO SEGURO)
- **Futuro**: Integración con pasarelas de pago
- **Solo visualización**: Últimos 4 dígitos

#### Datos Personales
- **Almacenamiento**: Solo local (no se envían a servidores)
- **Encriptación**: No se encripta actualmente
- **Futuro**: Encriptación en tránsito y reposo

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.5  
**Responsable**: Equipo de desarrollo

### Opinión de Usuario (Review)

#### Definición
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
  media: string[]; // URLs de archivos (en producción)
  timestamp: string;
  updatedAt?: string;
}
```

#### Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único de la opinión |
| `orderId` | `string` | ID de la orden relacionada |
| `type` | `'experience' \| 'dish'` | Tipo de opinión: experiencia general o producto específico |
| `itemId` | `number?` | ID del producto (solo si type === 'dish') |
| `itemName` | `string?` | Nombre del producto (solo si type === 'dish') |
| `rating` | `number` | Calificación de 1 a 5 estrellas |
| `chips` | `string[]` | Array de características destacadas |
| `comment` | `string` | Comentario libre del usuario |
| `media` | `string[]` | Array de URLs de fotos/videos |
| `timestamp` | `string` | Fecha de creación (ISO 8601) |
| `updatedAt` | `string?` | Fecha de última actualización (ISO 8601, solo si fue editada) |

#### Almacenamiento
- **Clave localStorage**: `user_reviews`
- **Tipo**: Array de objetos `Review`
- **Persistencia**: Las opiniones persisten entre sesiones

#### Ejemplo
```json
[
  {
    "id": "review-1703123456789-abc123",
    "orderId": "ORD-2024-001",
    "type": "dish",
    "itemId": 1,
    "itemName": "Omelette con Jamón",
    "rating": 5,
    "chips": ["Excelente servicio", "Comida deliciosa"],
    "comment": "Excelente platillo, muy recomendado",
    "media": [],
    "timestamp": "2024-12-20T10:30:00Z",
    "updatedAt": "2024-12-20T11:00:00Z"
  },
  {
    "id": "review-1703123456790-def456",
    "orderId": "ORD-2024-001",
    "type": "experience",
    "rating": 4,
    "chips": ["Ambiente agradable", "Rápida atención"],
    "comment": "Buena experiencia en general",
    "media": [],
    "timestamp": "2024-12-20T10:35:00Z"
  }
]
```

#### Reglas de negocio
- Solo se pueden calificar productos que se ordenaron y pagaron
- Cada producto puede tener su propia calificación independiente
- Las opiniones se pueden editar después de publicarlas
- Al editar una opinión, se actualiza el campo `updatedAt`

---

### Cambios Recientes (Enero 2025)
- ✅ Agregado modelo de datos para contactos del usuario (`Contact`)
- ✅ Agregada clave `user_contacts` en localStorage
- ✅ Documentación de estructura de contactos (nombre, teléfono, email)
- ✅ Agregado modelo de datos para restaurantes (`Restaurant`)
- ✅ Documentación de estructura de restaurantes (id, nombre, ubicación, rating)
- ✅ Agregado modelo de datos para datos de lealtad (`LoyaltyUser`)
- ✅ Agregada clave `loyalty_data` en localStorage
- ✅ Documentación de niveles de lealtad (Bronze, Silver, Gold, Platinum)
- ✅ Agregado modelo de datos para promociones favoritas (`FavoritePromotion`)
- ✅ Agregada clave `favoritePromotions` en localStorage
- ✅ Documentación de estructura de promociones favoritas

### Cambios Recientes (Diciembre 2024)
- ✅ Agregado modelo de datos para solicitudes de asistencia (`AssistanceHistoryItem`)
- ✅ Agregada clave `assistance_history` en localStorage
- ✅ Documentación de tipos de solicitudes predefinidas
- ✅ Agregado modelo de datos para opiniones de usuarios (`Review`)
- ✅ Agregada clave `user_reviews` en localStorage
- ✅ Documentación de estructura de opiniones y tipos soportados
- ✅ Migración de imágenes de productos a archivos locales en `/public`
- ✅ Actualización de rutas de imágenes para usar rutas absolutas desde `/public`
- ✅ Documentación de gestión de recursos estáticos (imágenes de productos)
- ✅ Implementación de preservación de estado de navegación usando `sessionStorage`
- ✅ Claves de sessionStorage: `menuSelectedCategory`, `menuScrollPosition`