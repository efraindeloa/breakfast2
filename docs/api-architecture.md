# Arquitectura API: REST / RPC / Edge

Criterio de uso por tipo de operación:

| Operación | Backend | Motivo |
|-----------|---------|--------|
| **CRUD productos** | **REST** | Lectura/escritura directa en tabla `products`; RLS y PostgREST suficientes. |
| **Cerrar orden** | **RPC** | Lógica en servidor (validaciones, estado, auditoría); una llamada atómica. |
| **Enviar notificación push** | **Edge** | Integración externa (FCM, OneSignal, etc.); no es solo SQL. |
| **Generar factura** | **Edge** | PDF, integración con SAT o proveedor; lógica y posibles APIs externas. |
| **Calcular reporte mensual** | **RPC** | Agregaciones en la base (ventas, órdenes); una función SQL. |

---

## REST (PostgREST)

- **Uso:** CRUD sobre tablas cuando la lógica es simple y RLS basta.
- **Ejemplo:** Productos → `supabase.from('products').select()`, `.insert()`, `.update()`, `.delete()`.
- **Archivo:** `services/api/products.ts`.

---

## RPC (Funciones en PostgreSQL)

- **Uso:** Operaciones con lógica en la base (transacciones, validaciones, agregaciones).
- **Ejemplos:**
  - Cerrar orden → `supabase.rpc('close_order', { order_id })`.
  - Reporte mensual → `supabase.rpc('calculate_monthly_report', { restaurant_id, year, month })`.
- **Archivos:** `services/api/orders.ts` (closeOrder), `services/api/reports.ts` (getMonthlyReport).
- **Migraciones:** `supabase/migrations/..._rpc_close_order.sql`, `..._rpc_monthly_report.sql`.

---

## Edge Functions (Deno)

- **Uso:** Lógica que requiere APIs externas, secrets o código que no quieres en SQL.
- **Ejemplos:**
  - Notificación push → `supabase.functions.invoke('send-push-notification', { body: { ... } })`.
  - Generar factura → `supabase.functions.invoke('generate-invoice', { body: { ... } })`.
- **Archivos:** `services/api/notifications.ts`, `services/api/invoices.ts`.
- **Funciones:** `supabase/functions/send-push-notification/`, `supabase/functions/generate-invoice/`.
- **Clientes:** `services/api/notifications.ts` (sendPushNotification), `services/api/invoices.ts` (generateInvoice).

---

## Resumen por módulo

| Módulo | Operación | Backend | Función / tabla |
|--------|-----------|---------|------------------|
| `services/api/products.ts` | CRUD productos | REST | `products` |
| `services/api/orders.ts` | Cerrar orden | RPC | `close_order(p_order_id)` → status='entregada', completed_at=now() |
| `services/api/reports.ts` | Reporte mensual | RPC | `calculate_monthly_report(p_restaurant_id, p_year, p_month)` |
| `services/api/notifications.ts` | Notificación push | Edge | `send-push-notification` |
| `services/api/invoices.ts` | Generar factura | Edge | `generate-invoice` |
