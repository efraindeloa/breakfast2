# Script para instalar ADB en Windows
# Descarga Platform Tools de Android y lo agrega al PATH

Write-Host "Instalando ADB (Android Debug Bridge)..." -ForegroundColor Green

# Crear directorio para ADB
$adbDir = "$env:USERPROFILE\platform-tools"
if (Test-Path $adbDir) {
    Write-Host "El directorio $adbDir ya existe. Eliminando..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $adbDir
}

New-Item -ItemType Directory -Path $adbDir -Force | Out-Null
Write-Host "Directorio creado: $adbDir" -ForegroundColor Green

# URL de descarga de Platform Tools (última versión)
$downloadUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
$zipFile = "$env:TEMP\platform-tools.zip"

Write-Host "Descargando Platform Tools desde Google..." -ForegroundColor Yellow
Write-Host "URL: $downloadUrl" -ForegroundColor Gray

try {
    # Descargar el archivo
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipFile -UseBasicParsing
    Write-Host "Descarga completada." -ForegroundColor Green
    
    # Extraer el archivo ZIP
    Write-Host "Extrayendo archivos..." -ForegroundColor Yellow
    Expand-Archive -Path $zipFile -DestinationPath $env:USERPROFILE -Force
    
    # Mover platform-tools a la ubicación correcta si es necesario
    if (Test-Path "$env:USERPROFILE\platform-tools") {
        Write-Host "Archivos extraídos correctamente." -ForegroundColor Green
    }
    
    # Limpiar archivo ZIP temporal
    Remove-Item $zipFile -Force
    
    Write-Host "`nADB instalado en: $adbDir" -ForegroundColor Green
    Write-Host "`nPara usar ADB, ejecuta:" -ForegroundColor Cyan
    Write-Host "  $adbDir\adb.exe devices" -ForegroundColor White
    
    Write-Host "`n¿Deseas agregar ADB al PATH del sistema? (S/N)" -ForegroundColor Yellow
    $response = Read-Host
    
    if ($response -eq "S" -or $response -eq "s" -or $response -eq "Y" -or $response -eq "y") {
        # Agregar al PATH del usuario
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
        if ($currentPath -notlike "*$adbDir*") {
            [Environment]::SetEnvironmentVariable("Path", "$currentPath;$adbDir", "User")
            Write-Host "`nADB agregado al PATH del usuario." -ForegroundColor Green
            Write-Host "Cierra y vuelve a abrir la terminal para usar 'adb' directamente." -ForegroundColor Yellow
        } else {
            Write-Host "ADB ya está en el PATH." -ForegroundColor Yellow
        }
    }
    
    Write-Host "`nInstalación completada!" -ForegroundColor Green
    Write-Host "`nPrueba ejecutando:" -ForegroundColor Cyan
    Write-Host "  $adbDir\adb.exe version" -ForegroundColor White
    
} catch {
    Write-Host "`nError durante la instalación: $_" -ForegroundColor Red
    Write-Host "`nPuedes descargar manualmente desde:" -ForegroundColor Yellow
    Write-Host "https://developer.android.com/tools/releases/platform-tools" -ForegroundColor Cyan
}
