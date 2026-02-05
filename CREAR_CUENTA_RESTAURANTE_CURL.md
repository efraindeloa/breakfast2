# Crear Cuenta de Tipo Restaurante con cURL

## Proceso Completo

El proceso consta de 4 pasos:
1. **Crear usuario en Supabase Auth** (signup)
2. **Crear restaurante** en tabla `restaurants`
3. **Asociar usuario como owner** en tabla `restaurant_staff`
4. **Crear usuario** en tabla `users`

---

## Paso 1: Crear Usuario en Supabase Auth

```bash
curl -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/auth/v1/signup" \
  -H "apikey: TU_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "restaurante@ejemplo.com",
    "password": "Password123!@#",
    "data": {
      "full_name": "Nombre del Dueño"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "user": {
    "id": "uuid-del-usuario",
    "email": "restaurante@ejemplo.com",
    ...
  },
  "session": {
    "access_token": "token-de-acceso",
    "refresh_token": "token-de-refresh",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `access_token` y el `user.id` para los siguientes pasos.

---

## Paso 2: Crear Restaurante

```bash
curl -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer ACCESS_TOKEN_DEL_PASO_1" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Mi Restaurante",
    "slug": "mi-restaurante",
    "city": "Ciudad",
    "country": "México",
    "is_active": true,
    "is_verified": false,
    "rating": 0.0,
    "total_reviews": 0,
    "timezone": "America/Mexico_City"
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-restaurante",
  "name": "Mi Restaurante",
  "slug": "mi-restaurante",
  ...
}
```

**⚠️ IMPORTANTE:** Guarda el `id` del restaurante para el siguiente paso.

---

## Paso 3: Asociar Usuario como Owner

```bash
curl -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurant_staff" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer ACCESS_TOKEN_DEL_PASO_1" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "restaurant_id": "UUID_DEL_RESTAURANTE_PASO_2",
    "user_id": "UUID_DEL_USUARIO_PASO_1",
    "role": "owner",
    "is_active": true
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-staff",
  "restaurant_id": "uuid-del-restaurante",
  "user_id": "uuid-del-usuario",
  "role": "owner",
  "is_active": true
}
```

---

## Paso 4: Crear Usuario en Tabla users

```bash
curl -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/users" \
  -H "apikey: TU_ANON_KEY" \
  -H "Authorization: Bearer ACCESS_TOKEN_DEL_PASO_1" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "id": "UUID_DEL_USUARIO_PASO_1",
    "email": "restaurante@ejemplo.com",
    "name": "Nombre del Dueño",
    "is_active": true
  }'
```

**Respuesta esperada:**
```json
{
  "id": "uuid-del-usuario",
  "email": "restaurante@ejemplo.com",
  "name": "Nombre del Dueño",
  "is_active": true
}
```

---

## Script Completo (PowerShell)

```powershell
# Configuración
$anonKey = "TU_ANON_KEY"
$email = "restaurante@ejemplo.com"
$password = "Password123!@#"
$restaurantName = "Mi Restaurante"
$ownerName = "Nombre del Dueño"

# Paso 1: Crear usuario en Auth
Write-Host "Paso 1: Creando usuario en Auth..."
$signupBody = @{
    email = $email
    password = $password
    data = @{
        full_name = $ownerName
    }
} | ConvertTo-Json

$signupResponse = Invoke-RestMethod -Uri "https://tkwackqrnsqlmxtalvuw.supabase.co/auth/v1/signup" `
    -Method POST `
    -Headers @{
        "apikey" = $anonKey
        "Content-Type" = "application/json"
    } `
    -Body $signupBody

$userId = $signupResponse.user.id
$accessToken = $signupResponse.session.access_token

Write-Host "✅ Usuario creado: $userId"
Write-Host "✅ Token: $accessToken"

# Paso 2: Crear restaurante
Write-Host "`nPaso 2: Creando restaurante..."
$slug = ($restaurantName -replace '[^a-zA-Z0-9\s]', '' -replace '\s+', '-').ToLower()
$restaurantBody = @{
    name = $restaurantName
    slug = $slug
    city = "Ciudad"
    country = "México"
    is_active = $true
    is_verified = $false
    rating = 0.0
    total_reviews = 0
    timezone = "America/Mexico_City"
} | ConvertTo-Json

$restaurantResponse = Invoke-RestMethod -Uri "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants" `
    -Method POST `
    -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } `
    -Body $restaurantBody

$restaurantId = $restaurantResponse.id
Write-Host "✅ Restaurante creado: $restaurantId"

# Paso 3: Asociar usuario como owner
Write-Host "`nPaso 3: Asociando usuario como owner..."
$staffBody = @{
    restaurant_id = $restaurantId
    user_id = $userId
    role = "owner"
    is_active = $true
} | ConvertTo-Json

$staffResponse = Invoke-RestMethod -Uri "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurant_staff" `
    -Method POST `
    -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } `
    -Body $staffBody

Write-Host "✅ Usuario asociado como owner"

# Paso 4: Crear usuario en tabla users
Write-Host "`nPaso 4: Creando usuario en tabla users..."
$userBody = @{
    id = $userId
    email = $email
    name = $ownerName
    is_active = $true
} | ConvertTo-Json

$userResponse = Invoke-RestMethod -Uri "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/users" `
    -Method POST `
    -Headers @{
        "apikey" = $anonKey
        "Authorization" = "Bearer $accessToken"
        "Content-Type" = "application/json"
        "Prefer" = "return=representation"
    } `
    -Body $userBody

Write-Host "✅ Usuario creado en tabla users"
Write-Host "`n🎉 ¡Cuenta de restaurante creada exitosamente!"
Write-Host "   Usuario ID: $userId"
Write-Host "   Restaurante ID: $restaurantId"
```

---

## Script Completo (Bash/Linux/Mac)

```bash
#!/bin/bash

# Configuración
ANON_KEY="TU_ANON_KEY"
EMAIL="restaurante@ejemplo.com"
PASSWORD="Password123!@#"
RESTAURANT_NAME="Mi Restaurante"
OWNER_NAME="Nombre del Dueño"

# Paso 1: Crear usuario en Auth
echo "Paso 1: Creando usuario en Auth..."
SIGNUP_RESPONSE=$(curl -s -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"data\": {
      \"full_name\": \"$OWNER_NAME\"
    }
  }")

USER_ID=$(echo $SIGNUP_RESPONSE | jq -r '.user.id')
ACCESS_TOKEN=$(echo $SIGNUP_RESPONSE | jq -r '.session.access_token')

echo "✅ Usuario creado: $USER_ID"

# Paso 2: Crear restaurante
echo "Paso 2: Creando restaurante..."
SLUG=$(echo "$RESTAURANT_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g')
RESTAURANT_RESPONSE=$(curl -s -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"name\": \"$RESTAURANT_NAME\",
    \"slug\": \"$SLUG\",
    \"city\": \"Ciudad\",
    \"country\": \"México\",
    \"is_active\": true,
    \"is_verified\": false,
    \"rating\": 0.0,
    \"total_reviews\": 0,
    \"timezone\": \"America/Mexico_City\"
  }")

RESTAURANT_ID=$(echo $RESTAURANT_RESPONSE | jq -r '.id')
echo "✅ Restaurante creado: $RESTAURANT_ID"

# Paso 3: Asociar usuario como owner
echo "Paso 3: Asociando usuario como owner..."
curl -s -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurant_staff" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"restaurant_id\": \"$RESTAURANT_ID\",
    \"user_id\": \"$USER_ID\",
    \"role\": \"owner\",
    \"is_active\": true
  }" > /dev/null

echo "✅ Usuario asociado como owner"

# Paso 4: Crear usuario en tabla users
echo "Paso 4: Creando usuario en tabla users..."
curl -s -X POST "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/users" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"$USER_ID\",
    \"email\": \"$EMAIL\",
    \"name\": \"$OWNER_NAME\",
    \"is_active\": true
  }" > /dev/null

echo "✅ Usuario creado en tabla users"
echo ""
echo "🎉 ¡Cuenta de restaurante creada exitosamente!"
echo "   Usuario ID: $USER_ID"
echo "   Restaurante ID: $RESTAURANT_ID"
```

---

## Notas Importantes

1. **Orden de ejecución:** Los pasos deben ejecutarse en orden, ya que cada uno depende del anterior.

2. **Tokens:** El `access_token` del Paso 1 se usa en los Pasos 2, 3 y 4.

3. **UUIDs:** Guarda los UUIDs de cada paso para usarlos en los siguientes.

4. **Errores:** Si algún paso falla, debes hacer rollback manualmente (eliminar lo creado).

5. **Políticas RLS:** Con las políticas simplificadas, estos comandos deberían funcionar sin problemas.

---

## Manejo de Errores

Si el Paso 2 falla después del Paso 1:
- El usuario en Auth ya existe, pero no hay restaurante
- Puedes intentar el Paso 2 de nuevo o eliminar el usuario de Auth

Si el Paso 3 falla después del Paso 2:
- Debes eliminar el restaurante creado en el Paso 2

Si el Paso 4 falla:
- Los pasos anteriores ya están completos, solo falta el registro en `users`
