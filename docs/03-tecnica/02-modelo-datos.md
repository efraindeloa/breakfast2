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
  "image": "https://example.com/omelette.jpg",
  "category": "main_courses",
  "proteins": ["chicken", "beef"],
  "badge": "specialty"
}
```

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
```

#### Almacenamiento
- **Clave localStorage**: `favorites`
- **Tipo**: Array de números (IDs de platillos)

#### Ejemplo
```json
[1, 5, 12, 23]
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

## Claves de localStorage

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `selectedLanguage` | string | Idioma seleccionado |
| `theme` | string | Tema (light/dark) |
| `favorites` | number[] | IDs de platillos favoritos |
| `orders_list` | Order[] | Órdenes activas |
| `order_history` | HistoricalOrder[] | Historial de órdenes completadas |
| `transactions` | Transaction[] | Historial de transacciones |
| `group_order` | GroupOrder \| null | Orden grupal activa |

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

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de desarrollo
