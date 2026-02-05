# Script para crear cuenta de tipo restaurante completo
# Uso: .\scripts\crear-cuenta-restaurante.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$true)]
    [string]$Password,
    
    [Parameter(Mandatory=$true)]
    [string]$RestaurantName,
    
    [Parameter(Mandatory=$false)]
    [string]$OwnerName = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Rfc = ""
)

# Leer anon key del .env
$envFile = Join-Path $PSScriptRoot "..\.env"
if (Test-Path $envFile) {
    $anonKey = (Get-Content $envFile | Select-String "VITE_SUPABASE_ANON_KEY" | ForEach-Object { ($_ -split "=")[1].Trim() })
} else {
    Write-Host "Error: No se encontro el archivo .env"
    exit 1
}

if (!$anonKey) {
    Write-Host "Error: No se encontro VITE_SUPABASE_ANON_KEY en .env"
    exit 1
}

$supabaseUrl = "https://tkwackqrnsqlmxtalvuw.supabase.co"

# Si no se proporciono nombre del dueño, usar el email sin dominio
if ([string]::IsNullOrWhiteSpace($OwnerName)) {
    $OwnerName = ($Email -split '@')[0]
}

Write-Host "Creando cuenta de restaurante..."
Write-Host "   Email: $Email"
Write-Host "   Restaurante: $RestaurantName"
Write-Host "   Dueno: $OwnerName"
Write-Host ""

# ==================== PASO 1: Crear usuario en Auth ====================
Write-Host "PASO 1: Creando usuario en Supabase Auth..."

$signupBody = @{
    email = $Email
    password = $Password
    data = @{
        full_name = $OwnerName
    }
} | ConvertTo-Json

try {
    $signupResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/signup" `
        -Method POST `
        -Headers @{
            "apikey" = $anonKey
            "Content-Type" = "application/json"
        } `
        -Body $signupBody

    $userId = $signupResponse.user.id
    
    # Hacer login para obtener un token valido
    Write-Host "Obteniendo token de sesion..."
    $loginBody = @{
        email = $Email
        password = $Password
    } | ConvertTo-Json
    
    $loginResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=password" `
        -Method POST `
        -Headers @{
            "apikey" = $anonKey
            "Content-Type" = "application/json"
        } `
        -Body $loginBody
    
    $accessToken = $loginResponse.access_token

    Write-Host "OK Usuario creado en Auth: $userId"
    Write-Host "OK Token obtenido"
} catch {
    Write-Host "Error al crear usuario en Auth:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
    exit 1
}

# ==================== PASO 2: Crear restaurante ====================
Write-Host ""
Write-Host "PASO 2: Creando restaurante..."

# Generar slug unico
$slug = ($RestaurantName -replace '[^a-zA-Z0-9\s]', '' -replace '\s+', '-').ToLower()

# Verificar que el slug sea unico (simplificado - en produccion deberias verificar)
$restaurantBody = @{
    name = $RestaurantName
    slug = $slug
    city = "Ciudad"
    country = "Mexico"
    is_active = $true
    is_verified = $false
    rating = 0.0
    total_reviews = 0
    timezone = "America/Mexico_City"
} | ConvertTo-Json

try {
    # Intentar primero con el access token
    try {
        $restaurantResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/restaurants" `
            -Method POST `
            -Headers @{
                "apikey" = $anonKey
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "application/json"
                "Prefer" = "return=representation"
            } `
            -Body $restaurantBody
    } catch {
        # Si falla con el token, intentar refrescar la sesión
        Write-Host "Intentando refrescar sesion..."
        $refreshBody = @{
            refresh_token = $signupResponse.session.refresh_token
        } | ConvertTo-Json
        
        $refreshResponse = Invoke-RestMethod -Uri "$supabaseUrl/auth/v1/token?grant_type=refresh_token" `
            -Method POST `
            -Headers @{
                "apikey" = $anonKey
                "Content-Type" = "application/json"
            } `
            -Body $refreshBody
        
        $accessToken = $refreshResponse.access_token
        
        # Intentar de nuevo con el token refrescado
        $restaurantResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/restaurants" `
            -Method POST `
            -Headers @{
                "apikey" = $anonKey
                "Authorization" = "Bearer $accessToken"
                "Content-Type" = "application/json"
                "Prefer" = "return=representation"
            } `
            -Body $restaurantBody
    }

    $restaurantId = $restaurantResponse.id
    Write-Host "OK Restaurante creado: $restaurantId"
    Write-Host "   Nombre: $RestaurantName"
    Write-Host "   Slug: $slug"
} catch {
    Write-Host "Error al crear restaurante:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
    Write-Host ""
    Write-Host "IMPORTANTE: El usuario en Auth ya fue creado. Debes eliminarlo manualmente si quieres intentar de nuevo."
    exit 1
}

# ==================== PASO 3: Asociar usuario como owner ====================
Write-Host ""
Write-Host "PASO 3: Asociando usuario como owner..."

$staffBody = @{
    restaurant_id = $restaurantId
    user_id = $userId
    role = "owner"
    is_active = $true
} | ConvertTo-Json

try {
    $staffResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/restaurant_staff" `
        -Method POST `
        -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
            "Prefer" = "return=representation"
        } `
        -Body $staffBody

    Write-Host "OK Usuario asociado como owner"
    Write-Host "   Staff ID: $($staffResponse.id)"
    Write-Host "   Role: $($staffResponse.role)"
} catch {
    Write-Host "Error al asociar usuario como owner:"
    Write-Host $_.Exception.Message
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message
    }
    Write-Host ""
    Write-Host "IMPORTANTE: El restaurante fue creado pero no se pudo asociar el usuario. Debes eliminarlo manualmente."
    exit 1
}

# ==================== PASO 4: Crear usuario en tabla users ====================
Write-Host ""
Write-Host "PASO 4: Creando usuario en tabla users..."

$userBody = @{
    id = $userId
    email = $Email
    name = $OwnerName
    is_active = $true
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "$supabaseUrl/rest/v1/users" `
        -Method POST `
        -Headers @{
            "apikey" = $anonKey
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
            "Prefer" = "return=representation"
        } `
        -Body $userBody

    Write-Host "OK Usuario creado en tabla users"
} catch {
    # Si es error de duplicado, esta bien (puede haber sido creado por otro proceso)
    if ($_.Exception.Message -like "*duplicate*" -or $_.Exception.Message -like "*23505*") {
        Write-Host "Advertencia: Usuario ya existe en tabla users (puede ser normal)"
    } else {
        Write-Host "Error al crear usuario en tabla users:"
        Write-Host $_.Exception.Message
        if ($_.ErrorDetails.Message) {
            Write-Host $_.ErrorDetails.Message
        }
        Write-Host ""
        Write-Host "IMPORTANTE: El restaurante y staff fueron creados, pero falta el registro en users."
    }
}

# ==================== RESUMEN ====================
Write-Host ""
Write-Host "============================================"
Write-Host "CUENTA DE RESTAURANTE CREADA EXITOSAMENTE"
Write-Host "============================================"
Write-Host ""
Write-Host "Datos creados:"
Write-Host "   Usuario ID: $userId"
Write-Host "   Email: $Email"
Write-Host "   Restaurante ID: $restaurantId"
Write-Host "   Restaurante: $RestaurantName"
Write-Host "   Slug: $slug"
Write-Host ""
Write-Host "Puedes verificar en Supabase Dashboard:"
Write-Host "   - Tabla users: Debe existir el usuario"
Write-Host "   - Tabla restaurants: Debe existir el restaurante"
Write-Host "   - Tabla restaurant_staff: Debe existir la asociacion"
