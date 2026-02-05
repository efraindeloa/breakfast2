# Probar con cURL

## Verificar si existe un restaurante con nombre específico

```bash
# Verificar si existe un restaurante con nombre específico
curl -X GET "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.Mi%20Restaurante%20Test&select=id,name" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer TU_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Probar con autenticación (usuario logueado)

Primero necesitas obtener el token de sesión, luego:

```bash
# Con token de autenticación
curl -X GET "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.Mi%20Restaurante%20Test&select=id,name" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer TU_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

## Reemplazar valores

- `TU_ANON_KEY`: Tu clave anónima de Supabase (VITE_SUPABASE_ANON_KEY)
- `TU_ACCESS_TOKEN`: Token de sesión del usuario autenticado (opcional para Opción 3)

## Ejemplo completo con valores reales

```bash
# Anon key (puedes usar esta para pruebas)
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU3NzEsImV4cCI6MjA4NDY5MTc3MX0.1PG0x0ZdAAjhunyiPBRzpgpsr9nZGV5epHdUvalHqbA"

# Probar verificación de nombre
curl -X GET "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.TestRestaurant&select=id,name" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json"
```

## Respuestas esperadas

### Si el restaurante NO existe:
```json
[]
```

### Si el restaurante existe:
```json
[
  {
    "id": "uuid-del-restaurante",
    "name": "TestRestaurant"
  }
]
```

### Si hay error de permisos:
```json
{
  "message": "new row violates row-level security policy",
  "code": "42501"
}
```
