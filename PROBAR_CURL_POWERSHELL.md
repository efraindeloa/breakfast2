# Probar con cURL en PowerShell

## Problema
PowerShell interpreta `curl` como alias de `Invoke-WebRequest`, que tiene sintaxis diferente.

## Solución 1: Usar curl.exe (Recomendado)

```powershell
$anonKey = "TU_ANON_KEY"
$url = "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.Miii%20Restaurante&select=id,name"
curl.exe -X GET $url -H "apikey: $anonKey" -H "Authorization: Bearer $anonKey" -H "Content-Type: application/json"
```

## Solución 2: Usar Invoke-WebRequest (PowerShell nativo)

```powershell
$anonKey = "TU_ANON_KEY"
$url = "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.Miii%20Restaurante&select=id,name"
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}
Invoke-WebRequest -Uri $url -Method GET -Headers $headers | Select-Object -ExpandProperty Content
```

## Solución 3: Usar Invoke-RestMethod (Más simple para JSON)

```powershell
$anonKey = "TU_ANON_KEY"
$url = "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.Miii%20Restaurante&select=id,name"
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri $url -Method GET -Headers $headers
```

## Ejemplo completo con valores reales

```powershell
# Definir variables
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU3NzEsImV4cCI6MjA4NDY5MTc3MX0.1PG0x0ZdAAjhunyiPBRzpgpsr9nZGV5epHdUvalHqbA"
$restaurantName = "Miii Restaurante"
$encodedName = [System.Web.HttpUtility]::UrlEncode($restaurantName)
$url = "https://tkwackqrnsqlmxtalvuw.supabase.co/rest/v1/restaurants?name=ilike.$encodedName&select=id,name"

# Opción 1: curl.exe
curl.exe -X GET $url -H "apikey: $anonKey" -H "Authorization: Bearer $anonKey" -H "Content-Type: application/json"

# Opción 2: Invoke-RestMethod (devuelve objeto JSON)
$headers = @{
    "apikey" = $anonKey
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri $url -Method GET -Headers $headers
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
    "name": "Miii Restaurante"
  }
]
```
