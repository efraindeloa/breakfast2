# Script para ver logs de ADB
$env:Path += ";$env:USERPROFILE\platform-tools"

Write-Host "Limpiando logs anteriores..." -ForegroundColor Yellow
adb logcat -c

Write-Host "`nCapturando logs..." -ForegroundColor Green
Write-Host "Presiona el botón de micrófono en la app ahora." -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C después de probar para detener." -ForegroundColor Yellow
Write-Host "`n" -NoNewline

# Capturar logs y filtrar por términos relevantes
adb logcat | Select-String -Pattern "Permisos|permission|microphone|SpeechRecognition|AssistantModal|capacitor|console|chromium|Error|Exception" -CaseSensitive:$false
