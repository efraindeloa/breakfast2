# Diseño de Base de Datos: Órdenes

## Análisis del Problema

### Relaciones
- **Un comensal** puede tener órdenes en **muchos restaurantes** (1:N)
- **Un restaurante** puede tener órdenes de **muchos comensales** (1:N)
- Esto es una relación **N:M** pero simplificada: cada orden pertenece a UN restaurante y UN comensal

### Necesidades

#### Comensal:
- Ver sus órdenes activas (en proceso)
- Ver su historial de órdenes completadas
- Filtrar por restaurante, fecha, status

#### Restaurante:
- Ver órdenes activas (pendientes, en preparación)
- Ver historial de órdenes completadas
- Estadísticas y reportes
- Filtrar por comensal, fecha, status

## Opciones de Diseño

### Opción 1: Una Sola Tabla `orders` (Actual)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  restaurant_id UUID,
  status TEXT, -- 'pending', 'en_preparacion', 'entregada', etc.
  ...
);
```

**Ventajas:**
- ✅ Simplicidad
- ✅ Un solo lugar para consultar
- ✅ Fácil de mantener

**Desventajas:**
- ❌ La tabla puede crecer a millones de registros
- ❌ Mezcla datos "calientes" (activos) con "fríos" (historial)
- ❌ Consultas más lentas con el tiempo
- ❌ Difícil de archivar/eliminar datos antiguos

### Opción 2: Dos Tablas Separadas (RECOMENDADA)
```sql
-- Órdenes activas/en proceso
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID,
  restaurant_id UUID,
  status TEXT CHECK (status IN ('pending', 'orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega')),
  ...
);

-- Historial de órdenes completadas
CREATE TABLE order_history (
  id UUID PRIMARY KEY,
  order_id UUID, -- Referencia a la orden original (opcional)
  user_id UUID,
  restaurant_id UUID,
  status TEXT CHECK (status IN ('entregada', 'cancelada')),
  completed_at TIMESTAMP,
  ...
);
```

**Ventajas:**
- ✅ Separación clara de concerns
- ✅ Mejor rendimiento (tablas más pequeñas)
- ✅ Fácil de archivar/eliminar históricas
- ✅ Índices más eficientes
- ✅ Puede optimizar cada tabla según su uso

**Desventajas:**
- ❌ Más complejidad
- ❌ Necesita migrar datos cuando cambia status

### Opción 3: Una Tabla con Particionamiento
```sql
CREATE TABLE orders (
  ...
) PARTITION BY RANGE (created_at);
```

**Ventajas:**
- ✅ Mantiene una tabla lógica
- ✅ Mejor rendimiento con particiones

**Desventajas:**
- ❌ Más complejo de implementar
- ❌ Requiere mantenimiento

## Recomendación: Opción 2 (Dos Tablas)

### Estructura Propuesta

#### Tabla `orders` (Órdenes Activas)
- Solo órdenes con status: `pending`, `orden_enviada`, `orden_recibida`, `en_preparacion`, `lista_para_entregar`, `en_entrega`
- Se actualiza frecuentemente
- Tamaño limitado (solo órdenes activas)
- Índices optimizados para consultas activas

#### Tabla `order_history` (Historial)
- Solo órdenes con status: `entregada`, `cancelada`
- Principalmente solo lectura
- Puede crecer mucho (millones de registros)
- Índices optimizados para consultas históricas
- Puede archivarse/eliminarse después de X años

### Migración de Datos
Cuando una orden cambia a `entregada` o `cancelada`:
1. Insertar en `order_history`
2. Eliminar de `orders` (o marcar como archivada)

### Consultas Optimizadas

**Comensal - Órdenes Activas:**
```sql
SELECT * FROM orders 
WHERE user_id = ? 
ORDER BY created_at DESC;
```

**Comensal - Historial:**
```sql
SELECT * FROM order_history 
WHERE user_id = ? 
ORDER BY completed_at DESC;
```

**Restaurante - Órdenes Activas:**
```sql
SELECT * FROM orders 
WHERE restaurant_id = ? 
ORDER BY created_at DESC;
```

**Restaurante - Historial:**
```sql
SELECT * FROM order_history 
WHERE restaurant_id = ? 
ORDER BY completed_at DESC;
```

## Implementación

### Índices Recomendados

**Para `orders`:**
- `idx_orders_user_id` - Consultas del comensal
- `idx_orders_restaurant_id` - Consultas del restaurante
- `idx_orders_status` - Filtrar por status
- `idx_orders_user_status` - Comensal + status
- `idx_orders_restaurant_status` - Restaurante + status

**Para `order_history`:**
- `idx_order_history_user_id` - Historial del comensal
- `idx_order_history_restaurant_id` - Historial del restaurante
- `idx_order_history_completed_at` - Ordenar por fecha
- `idx_order_history_user_completed` - Comensal + fecha
- `idx_order_history_restaurant_completed` - Restaurante + fecha
