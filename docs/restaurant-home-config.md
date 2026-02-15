# Configuración dinámica del Home por restaurante

La tabla **`restaurant_home_config`** guarda qué botones (funciones) ve cada tipo de cuenta en el home. El **owner** (o manager/admin) del restaurante define esta configuración.

## Tabla `restaurant_home_config`

| Columna        | Tipo    | Descripción |
|----------------|---------|-------------|
| id             | UUID    | PK |
| restaurant_id  | UUID    | FK a `restaurants`. Restaurante al que aplica la config. |
| audience       | TEXT    | `diner` \| `waiter` \| `restaurant`. Quién ve estos botones. |
| button_id      | TEXT    | Identificador del botón (ver listas abajo). |
| position       | INTEGER | Orden de aparición (menor = primero). |
| is_enabled     | BOOLEAN | Si el botón se muestra (true) o se oculta (false). |
| created_at     | TIMESTAMPTZ | |
| updated_at     | TIMESTAMPTZ | |

**Restricción única:** `(restaurant_id, audience, button_id)` — una sola fila por restaurante, audiencia y botón.

## Audiencias

- **`diner`**: Comensal (cuenta tipo comensal, ve el home de cliente).
- **`waiter`**: Mesero (staff con `role = 'waiter'`, ve el home mesero).
- **`restaurant`**: Staff administrativo del restaurante (owner, manager, etc.) cuando ve el home de restaurante (no el de mesero).

## Identificadores de botón (`button_id`) por audiencia

### Comensal (`audience = 'diner'`)

| button_id         | Descripción típica |
|-------------------|--------------------|
| qr                | Escanear QR |
| menu              | Ver menú |
| promotions        | Promociones |
| assistance        | Solicitar asistencia |
| waitlist          | Lista de espera |
| joinTable         | Unirse a mesa |
| invite            | Invitar usuarios |
| discover          | Descubrir |
| reservations      | Reservaciones |
| restaurantProfile | Perfil del restaurante |

### Mesero (`audience = 'waiter'`)

| button_id          | Descripción típica |
|--------------------|--------------------|
| selectTable        | Seleccionar mesa |
| tables             | Mesas (lista para tomar orden) |
| orders             | Órdenes activas |
| assistanceRequests | Solicitudes de asistencia |

### Restaurante / staff (`audience = 'restaurant'`)

| button_id         | Descripción típica |
|-------------------|--------------------|
| menu              | Gestionar menú |
| promotions        | Gestionar promociones |
| reservations      | Reservaciones |
| statistics        | Estadísticas |
| restaurantProfile | Perfil del restaurante |

## Comportamiento en la app

1. **Al cargar el home**  
   La app obtiene `restaurant_id` (del comensal: restaurante seleccionado; del staff: su restaurante) y `audience` (según tipo de cuenta y, si aplica, rol de mesero).  
   Consulta:  
   `SELECT button_id, position FROM restaurant_home_config WHERE restaurant_id = ? AND audience = ? AND is_enabled = true ORDER BY position`.

2. **Si no hay filas para ese restaurante y audiencia**  
   Usar el **orden por defecto** definido en código (comportamiento actual del home).

3. **Solo owner/manager/admin**  
   Pueden insertar, actualizar o borrar filas de `restaurant_home_config` para su restaurante (vía RLS).

## Migración

Ejecutar en Supabase (SQL Editor o migraciones):

- `supabase/migrations/20260213000000_create_restaurant_home_config.sql`

## Ejemplo: configurar home del mesero para un restaurante

```sql
INSERT INTO restaurant_home_config (restaurant_id, audience, button_id, position, is_enabled)
VALUES
  ('<uuid-restaurante>', 'waiter', 'selectTable',  0, true),
  ('<uuid-restaurante>', 'waiter', 'tables',       1, true),
  ('<uuid-restaurante>', 'waiter', 'orders',       2, true),
  ('<uuid-restaurante>', 'waiter', 'assistanceRequests', 3, true);
```

Si no existe ninguna fila para `audience = 'waiter'`, la app seguirá mostrando el home mesero por defecto (los mismos botones en el orden actual).
