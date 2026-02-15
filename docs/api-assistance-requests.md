# API: Solicitudes de asistencia

Operaciones para que los comensales envíen solicitudes de asistencia y los meseros las listen y actualicen.

**Base URL (Edge Functions):** `https://<PROJECT_REF>.supabase.co/functions/v1/assistance-requests`

---

## 1. Crear solicitud (comensal)

**Método:** `POST`  
**Path:** `/assistance-requests`  
**Body (JSON):** Alineado con el schema de `assistance_requests`:

| Campo          | Tipo   | Requerido | Descripción |
|----------------|--------|-----------|-------------|
| restaurant_id  | UUID   | Sí        | ID del restaurante (FK restaurants) |
| user_id        | UUID   | Sí        | ID del usuario (FK users, NOT NULL en schema) |
| order_id       | UUID   | No        | ID de la orden (FK orders, opcional) |
| type           | string | Sí        | Tipo: cutlery, napkins, waiter, custom, etc. (NOT NULL) |
| request_type   | string | No        | Default 'custom' |
| message        | string | No        | Texto mostrado (ej. label traducido) |
| table_number   | string | No        | Número de mesa (ej. "1") |

**Respuesta 200:** Objeto con la fila creada (id, restaurant_id, user_id, order_id, type, request_type, message, table_number, status, created_at, updated_at).

**Ejemplo:**

```json
POST /assistance-requests
{
  "restaurant_id": "uuid-del-restaurante",
  "user_id": "uuid-del-usuario",
  "order_id": "uuid-de-la-orden",
  "type": "cutlery",
  "request_type": "cutlery",
  "message": "Cubiertos y Vasos",
  "table_number": "1"
}
```

---

## 2. Listar solicitudes (mesero)

**Método:** `GET`  
**Path:** `/assistance-requests`  
**Query:**

| Parámetro     | Tipo   | Descripción                                |
|---------------|--------|--------------------------------------------|
| restaurant_id | UUID   | Requerido. ID del restaurante              |
| status        | string | Opcional. pending \| attended \| cancelled |
| limit         | number | Opcional. Máximo de filas (default 100)   |

**Respuesta 200:** Array de solicitudes (más recientes primero).

**Ejemplo:**

```
GET /assistance-requests?restaurant_id=uuid&status=pending&limit=50
```

---

## 3. Actualizar solicitud (mesero)

**Método:** `PATCH`  
**Path:** `/assistance-requests`  
**Body (JSON):**

| Campo  | Tipo   | Requerido | Descripción                    |
|--------|--------|-----------|--------------------------------|
| id     | UUID   | Sí        | ID de la solicitud             |
| status | string | Sí        | pending \| attended \| cancelled |

**Respuesta 200:** Objeto con la fila actualizada.

**Ejemplo:**

```json
PATCH /assistance-requests
{
  "id": "uuid-de-la-solicitud",
  "status": "attended"
}
```

---

## Uso desde la app (cliente)

La app usa el módulo `services/api/assistance-requests.ts`, que hoy llama a Supabase (RPC + from()). Para usar los endpoints HTTP (Edge Functions), configurar la base URL y llamar a las funciones que usen `fetch` a esos endpoints; los tipos y contratos son los mismos que en este documento.

**Paths de referencia:** `services/api/endpoints/assistance-requests.ts`

---

## Edge Function (HTTP)

La Edge Function `assistance-requests` expone los tres métodos en una sola URL:

- **URL:** `https://<PROJECT_REF>.supabase.co/functions/v1/assistance-requests`
- **Despliegue:** `npx supabase functions deploy assistance-requests`
- **Variables:** La función usa `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_ANON_KEY`) inyectadas por Supabase.

Para llamarla desde la app con `fetch` en lugar del cliente Supabase, usar esta URL y el header `Authorization: Bearer <ANON_KEY>`.

---

## Comandos curl para probar

Sustituye:
- `YOUR_PROJECT_REF` → ref de tu proyecto (ej. `tkwackqrnsqlmxtalvuw`)
- `YOUR_ANON_KEY` → clave anon de Supabase (Settings → API → anon public)
- `RESTAURANT_UUID` → UUID de un restaurante en tu base
- `USER_UUID` → UUID de un usuario en la tabla users (requerido para crear)
- `ORDER_UUID` → UUID de una orden (opcional)
- `REQUEST_UUID` → UUID de una solicitud (lo obtienes del POST o del GET)

**Base URL:** `https://YOUR_PROJECT_REF.supabase.co/functions/v1/assistance-requests`

### 1. Crear solicitud (POST)

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/functions/v1/assistance-requests" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "RESTAURANT_UUID",
    "user_id": "USER_UUID",
    "order_id": "ORDER_UUID",
    "type": "cutlery",
    "request_type": "cutlery",
    "message": "Cubiertos y Vasos",
    "table_number": "1"
  }'
```

### 2. Listar solicitudes pendientes (GET)

```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/assistance-requests?restaurant_id=RESTAURANT_UUID&status=pending&limit=50" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 3. Listar todas las solicitudes del restaurante (GET)

```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/functions/v1/assistance-requests?restaurant_id=RESTAURANT_UUID" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### 4. Marcar como atendida (PATCH)

```bash
curl -X PATCH "https://YOUR_PROJECT_REF.supabase.co/functions/v1/assistance-requests" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "REQUEST_UUID",
    "status": "attended"
  }'
```

### 5. Probar contra Supabase REST (sin Edge Function)

Si aún no tienes desplegada la Edge Function, puedes probar la RPC de crear y el resto vía REST de Supabase:

**Crear (RPC):**

```bash
curl -X POST "https://YOUR_PROJECT_REF.supabase.co/rest/v1/rpc/create_assistance_request" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "p_restaurant_id": "RESTAURANT_UUID",
    "p_user_id": "USER_UUID",
    "p_order_id": "ORDER_UUID",
    "p_request_type": "cutlery",
    "p_message": "Cubiertos y Vasos",
    "p_table_number": "1"
  }'
```

**Listar (REST):**

```bash
curl -X GET "https://YOUR_PROJECT_REF.supabase.co/rest/v1/assistance_requests?restaurant_id=eq.RESTAURANT_UUID&status=eq.pending&order=created_at.desc" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "apikey: YOUR_ANON_KEY"
```
