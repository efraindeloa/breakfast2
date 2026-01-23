# Schema Optimizado para Escala Mundial

## 📊 Escala Objetivo

- **Cientos de miles de usuarios**
- **Cientos de miles de restaurantes**
- **Millones de productos**
- **Millones de órdenes**

## 🏗️ Arquitectura Optimizada

### Tablas Principales

1. **`restaurants`** - Restaurantes con ubicación geográfica
2. **`users`** - Usuarios/comensales
3. **`products`** - Productos asociados a restaurantes (multi-tenancy)
4. **`orders`** - Órdenes con particionamiento opcional por fecha
5. **`cart_items`** - Carrito de compras
6. **`favorite_dishes`** - Favoritos
7. **`reviews`** - Reseñas de productos y restaurantes
8. **`promotions`** - Promociones por restaurante
9. **`coupons`** - Cupones por usuario

### Optimizaciones Implementadas

#### 1. Índices Compuestos
- `idx_products_restaurant_active`: Para consultas rápidas de productos activos por restaurante
- `idx_orders_user_created`: Para historial de órdenes por usuario
- `idx_orders_restaurant_created`: Para órdenes por restaurante

#### 2. Índices de Texto (Búsqueda)
- `idx_products_name_trgm`: Búsqueda de texto eficiente usando trigramas
- Extension `pg_trgm` habilitada

#### 3. Índices Geográficos
- `idx_restaurants_location`: Búsqueda por proximidad usando GIST

#### 4. Foreign Keys
- Todas las relaciones tienen foreign keys con `ON DELETE CASCADE` o `ON DELETE RESTRICT` según corresponda

#### 5. Particionamiento (Opcional)
- Las órdenes pueden particionarse por fecha para mejorar rendimiento
- Ejemplo comentado en el schema

#### 6. Vista Materializada
- `restaurant_stats`: Estadísticas agregadas que se actualizan periódicamente

## 📋 Pasos para Migrar

### 1. Ejecutar Schema Optimizado

**⚠️ IMPORTANTE**: Este schema reemplaza el anterior. Si ya tienes datos, haz backup primero.

1. Ve a Supabase SQL Editor
2. Ejecuta `supabase/schema_optimized.sql`
3. Esto creará todas las tablas optimizadas

### 2. Crear Restaurante Inicial

Antes de insertar productos, necesitas crear un restaurante:

```sql
INSERT INTO restaurants (id, name, slug, city, country, is_active) 
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'DONK RESTAURANT', 
  'donk-restaurant', 
  'Ciudad de México', 
  'México', 
  true
);
```

### 3. Insertar Productos

1. Ejecuta `supabase/insert_products_optimized.sql`
2. Esto insertará productos asociados al restaurante creado

### 4. Aplicar Políticas RLS

1. Ejecuta `supabase/fix_rls_policies_optimized.sql`
2. Esto ajustará las políticas para desarrollo

## 🔄 Migración de Datos Existentes

Si ya tienes datos en las tablas anteriores:

1. **Backup**: Exporta todas las tablas actuales
2. **Migrar usuarios**: Crea usuarios en la tabla `users`
3. **Migrar restaurantes**: Crea restaurantes en la tabla `restaurants`
4. **Migrar productos**: Asocia productos existentes a restaurantes
5. **Migrar órdenes**: Actualiza `orders` con `restaurant_id` y `user_id` (UUID)

## 🚀 Mejoras de Rendimiento

### Para Millones de Productos

- **Índices compuestos**: Consultas rápidas por restaurante + categoría
- **Filtrado por `is_active`**: Solo productos activos en índices parciales
- **Paginación**: Usa `limit` y `offset` en consultas

### Para Millones de Órdenes

- **Particionamiento por fecha**: Divide órdenes por mes/año
- **Índices por usuario y restaurante**: Consultas rápidas de historial
- **Archivado**: Mueve órdenes antiguas a tablas de archivo

### Para Cientos de Miles de Restaurantes

- **Índices geográficos**: Búsqueda por proximidad eficiente
- **Filtrado por ciudad/país**: Índices en campos de ubicación
- **Vista materializada**: Estadísticas pre-calculadas

## 📝 Notas Importantes

1. **Multi-tenancy**: Cada restaurante tiene sus propios productos
2. **Escalabilidad horizontal**: El schema soporta particionamiento
3. **Búsquedas eficientes**: Índices optimizados para consultas comunes
4. **Integridad referencial**: Foreign keys aseguran consistencia de datos
5. **RLS**: Políticas de seguridad por usuario/restaurante

## 🔐 Seguridad

- **Row Level Security (RLS)**: Habilitado en todas las tablas
- **Políticas por usuario**: Cada usuario solo ve sus propios datos
- **Políticas por restaurante**: Los restaurantes solo gestionan sus productos
- **Productos públicos**: Todos pueden ver productos activos

## 📈 Próximos Pasos

1. Implementar autenticación real de Supabase
2. Agregar sistema de roles (admin, restaurante, usuario)
3. Implementar caché para productos populares
4. Configurar replicación para alta disponibilidad
5. Implementar archivado automático de órdenes antiguas
