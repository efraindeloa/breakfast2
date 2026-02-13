# Especificación: Versión para Meseros

Documento que define cómo debería ser la experiencia de la app para **meseros** (waiters), apoyado en lo que ya existe para **comensales** y **restaurantes**.

---

## 1. Contexto actual

### 1.1 Comensales (diner)
- **Navegación:** Inicio, Promociones, Menú, Mi Orden, Pagos.
- **Flujo:** Elegir restaurante → Ver menú → Añadir al carrito → Confirmar orden → Enviar a cocina → Ver estado → Pagar.
- **Órdenes:** Creadas con `user_id` del comensal, `restaurant_id`, `table_number` (opcional). Estados: `pending`, `orden_enviada`, `orden_recibida`, `en_preparacion`, `lista_para_entregar`, `en_entrega`, `entregada`, etc.
- **Otros:** Reservaciones (crear como cliente), favoritos, pedidos en grupo, asistencia (ej. “Llamar mesero”).

### 1.2 Restaurantes (staff administrativo)
- **Navegación:** Inicio, Promociones, Menú, Reservaciones, Estadísticas.
- **Funciones:** Gestionar menú y productos, promociones y especiales, reservaciones, ver estadísticas. No toman órdenes en sala en la app.
- **Auth:** Usuario en `restaurant_staff` con `is_active = true` → `accountType = 'restaurant'`. Rol en `restaurant_staff.role` (owner, admin, manager, waiter, chef, cashier).

### 1.3 Base de datos
- **Órdenes:** `orders` con `user_id`, `restaurant_id`, `status`, `items`, `total`, `table_number` (opcional). No hay `waiter_id` hoy.
- **Personal:** `restaurant_staff` con `user_id`, `restaurant_id`, `role` (`'waiter'` para meseros), `is_active`.
- **Documento de roles:** `docs/database-account-types.md` describe `waiter`: toma de órdenes, gestión de mesas asignadas, comunicación con cocina.

---

## 2. Objetivo de la versión Meseros

Dar al **mesero** una app enfocada en:
- Ver sus **mesas asignadas** (o mesas del turno).
- **Tomar órdenes** por mesa (mismo catálogo que el comensal, pero en nombre de la mesa).
- Ver **órdenes activas** de sus mesas y su estado.
- Opcional: solicitar asistencia, ver cuenta por mesa, cerrar mesa.

**No** incluir: editar menú, crear promociones, gestionar reservaciones (eso es hostess/admin), ni estadísticas completas (owner/manager).

---

## 3. Identificación del usuario mesero

- **Mismo login** que el resto del staff: correo/contraseña (o el método que use el restaurante).
- **Criterio:** Usuario con registro en `restaurant_staff` donde `role = 'waiter'` y `is_active = true`.
- **Restaurante:** Siempre el del mesero (`restaurant_staff.restaurant_id`). No hay “selector de restaurante” como en comensal.

**Implementación sugerida:**
- Opción A: Mantener `accountType = 'restaurant'` y usar `restaurant_staff.role` para elegir flujo: si `role === 'waiter'` → mostrar app mesero; si owner/manager/etc. → app restaurante actual.
- Opción B: Introducir `accountType = 'waiter'` (o `accountType = 'restaurant' | 'diner' | 'waiter'`) y asignarlo cuando el usuario sea solo mesero (o cuando entre “como mesero” si en el futuro hay cambio de rol en la misma sesión).

Recomendación: **Opción A** con detección por `role` para no tocar mucho el flujo de login y seguir usando un solo “restaurant” en el backend.

---

## 4. Navegación (Bottom Nav) para Meseros

Barra inferior con 4–5 ítems, centrados en servicio de mesas y órdenes:

| Ícono / clave i18n | Ruta sugerida | Descripción |
|-------------------|----------------|-------------|
| Inicio / home | `/waiter-home` | Resumen: mesas asignadas, órdenes activas recientes, alertas. |
| Mesas / tables | `/waiter-tables` | Lista de mesas (asignadas o del turno). Entrada para “tomar orden” y “ver cuenta” por mesa. |
| Órdenes / orders | `/waiter-orders` | Órdenes activas (pendientes, en cocina, listas para entregar) filtradas por mesero o por sus mesas. |
| (Opcional) Menú | `/waiter-menu` | Acceso rápido al menú para consulta (solo lectura; tomar orden desde la mesa). |
| Perfil / person | `/profile` | Mismo perfil que el resto (ajustes, cerrar sesión). |

No incluir: Promociones (gestión), Estadísticas, Gestionar Reservaciones, Pagos (los ve cajero/gerente).

---

## 5. Pantallas principales

### 5.1 Inicio Mesero (`/waiter-home`)

- **Navbar:** Misma línea que Promociones/Menú restaurante: avatar, “Bienvenido”, nombre del mesero (sin botón atrás).
- **Contenido:**
  - Resumen del turno: “Mesas asignadas: X”, “Órdenes activas: Y”.
  - Lista corta de **mesas con actividad reciente** (ej. orden enviada, orden lista para entregar) con acceso rápido a la mesa o a la orden.
  - Si hay órdenes “listas para entregar” para sus mesas: bloque o botón destacado “Z órdenes listas para entregar”.
  - Opcional: botón “Solicitar asistencia” (si el restaurante usa esa flujo).
- **Datos:** Mesas asignadas al mesero (ver sección 7) y órdenes con `table_number` en esas mesas y `restaurant_id` del mesero.

### 5.2 Mesas (`/waiter-tables`)

- **Lista de mesas:** Tarjetas o lista por mesa (número/nombre, zona si aplica).
- Por mesa se muestra:
  - Estado: “Sin orden”, “Con orden activa”, “Orden en cocina”, “Lista para entregar”, “Solicitó cuenta”, etc.
  - Resumen: cantidad de personas (si se registra), última actividad.
- **Acciones por mesa:**
  - **Tomar orden:** Navega a flujo “tomar orden para mesa X” (menú igual que comensal, carrito asociado a la mesa).
  - **Ver orden activa:** Ver detalle y estado (y opcionalmente “marcar entregada” si se implementa).
  - **Ver cuenta / Solicitar cuenta:** Lleva a vista de cuenta por mesa (ítems, total, opcional propina) y botón “Solicitar cuenta” o “Enviar a caja”.
- Si no existe concepto de “mesas” en BD, se puede empezar con una lista de “mesas” definida por restaurante (tabla `tables` o configuración por restaurante) y asignación mesero–mesa (ver sección 7).

### 5.3 Órdenes activas (`/waiter-orders`)

- **Lista de órdenes** del restaurante (o solo de las mesas del mesero) con estado “activo”: no entregada, no cancelada.
- Filtros útiles: por estado (pendiente, en cocina, lista para entregar), por mesa.
- Cada ítem: número de mesa, orden #, estado, total, hora. Al tocar → detalle de la orden.
- En detalle: ítems, instrucciones, estado. Acciones posibles: “Marcar como entregada” (si el flujo lo permite).
- **Datos:** Misma tabla `orders`; filtrar por `restaurant_id` y opcionalmente por `table_number IN (mesas del mesero)` o por `waiter_id` si se añade después.

### 5.4 Tomar orden (por mesa)

- **Flujo similar al comensal:** Misma pantalla de menú (por categorías) y detalle de producto (complementos, notas), pero:
  - **Contexto:** “Orden para Mesa X” (siempre visible).
  - **Carrito:** No es el carrito del usuario; es un carrito “temporal” por mesa hasta enviar la orden.
  - Al **confirmar**, se crea una orden con:
    - `restaurant_id`: del mesero.
    - `user_id`: se puede usar un “usuario genérico mesa” o el `user_id` del mesero; si el negocio requiere factura por cliente, más adelante se podría asociar un comensal. Por ahora lo mínimo es `restaurant_id` + `table_number` + opcional `waiter_id`.
  - **table_number:** Obligatorio en este flujo (mesa seleccionada).
- Reutilizar al máximo: `MenuScreen` / `DishDetailScreen` (o variantes), `ProductsContext` (productos del restaurante), y al enviar llamar `createOrder` con `table_number` y, si existe, `waiter_id`.

### 5.5 Cuenta por mesa (opcional en v1)

- Vista de órdenes agrupadas por mesa (todas las órdenes con mismo `table_number` y `restaurant_id` que no estén cerradas).
- Total por mesa, desglose por orden si hay varias (orden 1, orden 2, complementarias).
- Botón “Solicitar cuenta” o “Enviar a caja” para que cajero/gerente procese el cobro (flujo de pagos puede quedar para una fase posterior).

---

## 6. Modelo de datos y API

### 6.1 Órdenes (ya existente)

- `orders`: `user_id`, `restaurant_id`, `status`, `items`, `total`, `table_number` (opcional).
- **Uso mesero:** Siempre enviar `table_number` al crear orden desde la app mesero. Opcional: añadir columna `waiter_id` (FK a `users.id`) para filtrar “mis órdenes” y reportes por mesero.

### 6.2 Mesas y asignación (nuevo o mínimo)

Para que “Mesas” y “mis mesas” tengan sentido:

- **Opción mínima (sin nuevas tablas):**
  - Mesas como lista configurable por restaurante (ej. en `restaurants` como JSONB `table_names` o en configuración). Mesero ve todas las mesas del restaurante y al tomar orden elige número de mesa.
  - No hay “asignación” formal: las órdenes se filtran por `table_number` y `restaurant_id`; el mesero puede ver todas las órdenes del restaurante o solo las de un conjunto de mesas que el gerente asigne por configuración/local.

- **Opción completa:**
  - Tabla `tables`: `id`, `restaurant_id`, `name`/`label` (ej. "Mesa 1", "Terraza 3"), `zone`, `capacity`, `is_active`.
  - Tabla `waiter_table_assignments`: `waiter_id` (user_id del mesero), `table_id`, `restaurant_id`, `shift_date`/`started_at`/`ended_at` para turnos. Así “mis mesas” = mesas asignadas al mesero en el turno actual.
  - Órdenes siguen con `table_number` (string) o se añade `table_id` (FK a `tables`) para unir orden ↔ mesa ↔ asignación.

Recomendación: empezar con **opción mínima** (lista de mesas por restaurante y `table_number` en la orden); luego añadir `tables` y asignaciones si el negocio lo requiere.

### 6.3 APIs sugeridas

- **Órdenes por restaurante (para mesero):**  
  `getOrdersByRestaurant(restaurantId, { status?, tableNumber? })`  
  - Hoy las órdenes se obtienen por `user_id` (comensal). Para mesero hace falta un endpoint (o RLS con rol staff) que permita leer por `restaurant_id` (y opcionalmente `table_number`, `waiter_id`). Solo roles waiter/cashier/manager/owner del mismo restaurante.

- **Crear orden (ya existe):**  
  `createOrder({ restaurant_id, items, total, table_number, ... })`  
  - Asegurar que el mesero pueda enviar `table_number` y, si se implementa, `waiter_id` (o guardar `waiter_id` en backend según usuario autenticado).

- **Actualizar orden (ya existe):**  
  `updateOrder(orderId, { status })`  
  - Para marcar “entregada” o “lista para entregar” desde la app mesero (según políticas del negocio).

---

## 7. Permisos y seguridad

- **RLS (Supabase):** Las filas de `orders` que el mesero puede ver/actualizar deben limitarse a `restaurant_id` = restaurante del mesero. Si se añade `waiter_id`, se puede restringir “solo mis órdenes” para meseros y seguir mostrando todas las del restaurante a manager/owner.
- **Auth:** El mesero ya está autenticado y vinculado a un `restaurant_id` vía `restaurant_staff`. No debe poder ver órdenes de otro restaurante.
- **Roles:** Solo `waiter` (y los que el negocio defina, ej. `cashier`, `manager`) deben acceder a rutas `/waiter-*`. Redirigir a home correspondiente si el usuario no tiene permiso.

---

## 8. Resumen de reutilización

| Elemento | Comensal | Restaurante | Mesero |
|----------|----------|-------------|--------|
| Menú (productos, categorías) | Lectura, carrito propio | Edición (MenuRestaurantScreen) | **Lectura** (como comensal), carrito por mesa |
| Órdenes | Crear (su orden), ver (sus órdenes) | No crean en app | **Crear** (por mesa), **ver** (por restaurante/mesas) |
| Promociones | Ver | Editar / crear | **Solo ver** (opcional) |
| Reservaciones | Crear | Gestionar (admin/hostess) | No en v1 |
| Estadísticas | No | Sí | No |
| Pagos | Sí (comensal paga) | No en app | No (cajero); opcional “solicitar cuenta” |
| Navbar superior | Según pantalla | Avatar + Bienvenido + nombre | **Igual que restaurante:** Avatar + Bienvenido + nombre |
| Bottom Nav | 5 ítems (Inicio, Promos, Menú, Orden, Pagos) | 5 ítems (Inicio, Promos, Menú, Reservaciones, Estadísticas) | **4–5 ítems:** Inicio mesero, Mesas, Órdenes, (Menú), Perfil |

---

## 9. Fases de implementación sugeridas

**Fase 1 – Mínimo viable**
- Detección de rol `waiter` en login (mismo `accountType` “restaurant”, distinta navegación por rol).
- Bottom nav y rutas solo para mesero: Inicio, Mesas, Órdenes, Perfil.
- Pantalla “Mesas”: lista simple de mesas (configuración o lista fija por restaurante); al elegir mesa → “Tomar orden para Mesa X”.
- Flujo “Tomar orden”: reutilizar menú y detalle de producto; carrito temporal por mesa; al confirmar, `createOrder` con `restaurant_id` del mesero y `table_number`.
- Pantalla “Órdenes activas”: listar órdenes del restaurante (API nueva o ampliada) con filtro por estado; solo lectura en v1.

**Fase 2**
- “Inicio mesero” con resumen de mesas y órdenes activas.
- Marcar orden como “entregada” (o “lista para entregar”) desde la app mesero.
- Opcional: columna `waiter_id` en `orders` y filtrar “mis órdenes”.

**Fase 3**
- Cuenta por mesa (agrupar órdenes por `table_number`) y botón “Solicitar cuenta”.
- Si el negocio lo pide: tabla `tables` y asignación mesero–mesas por turno.

---

## 10. Traducciones (i18n)

Añadir claves bajo `restaurant` o nuevo bloque `waiter`, por ejemplo:

- `waiter.home.title` → "Inicio"
- `waiter.tables.title` → "Mesas"
- `waiter.tables.takeOrder` → "Tomar orden"
- `waiter.tables.viewBill` → "Ver cuenta"
- `waiter.orders.title` → "Órdenes activas"
- `waiter.orders.readyToServe` → "Lista para entregar"
- `waiter.orderForTable` → "Orden para Mesa {{number}}"

Y en navegación:

- `waiter.navigation.home` → "Inicio"
- `waiter.navigation.tables` → "Mesas"
- `waiter.navigation.orders` → "Órdenes"

Con esto se tiene una especificación clara y alineada con comensales y restaurantes para implementar la versión para meseros de forma ordenada y reutilizando la mayor parte del código existente.
