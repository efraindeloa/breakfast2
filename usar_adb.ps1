# Script para usar ADB fácilmente
# Agrega ADB al PATH de la sesión actual

$adbPath = "$env:USERPROFILE\platform-tools"
if (Test-Path "$adbPath\adb.exe") {
    $env:Path += ";$adbPath"
    Write-Host "ADB agregado al PATH de esta sesión." -ForegroundColor Green
    Write-Host "Ahora puedes usar 'adb' directamente." -ForegroundColor Green
    Write-Host "`nEjecutando: adb devices" -ForegroundColor Cyan
    adb devices
} else {
    Write-Host "ADB no encontrado en: $adbPath" -ForegroundColor Red
    Write-Host "Ejecuta primero: instalar_adb.ps1" -ForegroundColor Yellow
}
