# Cómo Revisar los Logs de la Aplicación Android

## Método 1: Usando ADB (Android Debug Bridge) - Recomendado

### Requisitos previos:
1. **Habilitar Modo Desarrollador en tu dispositivo Android:**
   - Ve a `Configuración` > `Acerca del teléfono`
   - Toca 7 veces en "Número de compilación" o "Versión de MIUI" (dependiendo del dispositivo)
   - Aparecerá un mensaje diciendo que eres desarrollador

2. **Habilitar Depuración USB:**
   - Ve a `Configuración` > `Opciones de desarrollador`
   - Activa "Depuración USB"

3. **Instalar ADB en tu computadora:**
   - **Windows:** Descarga "Platform Tools" desde: https://developer.android.com/tools/releases/platform-tools
   - Extrae el archivo ZIP
   - Agrega la carpeta a tu PATH o usa la ruta completa

### Ver logs en tiempo real:

```bash
# Conectar tu dispositivo Android por USB
# Luego ejecutar en la terminal:

# Ver todos los logs
adb logcat

# Ver solo logs de la aplicación (recomendado)
adb logcat | grep -i "appsistente\|capacitor\|speech"

# Ver logs con filtros específicos (mejor opción)
adb logcat | grep -E "Permisos|permission|microphone|SpeechRecognition|AssistantModal"

# Guardar logs en un archivo
adb logcat > logs.txt
```

### Filtros útiles para nuestro caso:

```bash
# Ver solo logs de JavaScript/WebView (donde aparecen console.log)
adb logcat | grep -i "chromium\|console\|js"

# Ver logs de Capacitor
adb logcat | grep -i "capacitor"

# Ver logs de permisos
adb logcat | grep -i "permission\|microphone"

# Combinación: ver logs relevantes para speech recognition
adb logcat | grep -E "Permisos|permission|microphone|SpeechRecognition|AssistantModal|capacitor|console"
```

---

## Método 2: Usando Chrome DevTools (Más fácil, pero requiere configuración)

### Pasos:

1. **Conectar dispositivo por USB** y habilitar depuración USB (ver Método 1)

2. **Abrir Chrome en tu computadora** y navegar a:
   ```
   chrome://inspect/#devices
   ```

3. **Abrir la aplicación** en tu dispositivo Android

4. **En Chrome**, deberías ver tu dispositivo y la aplicación listada

5. **Hacer clic en "inspect"** debajo de la aplicación

6. **Abrir la pestaña "Console"** para ver los `console.log`

### Ventajas:
- Interfaz visual fácil de usar
- Puedes ver los logs en tiempo real
- Puedes interactuar con la consola directamente

---

## Método 3: Logs desde la aplicación misma (Para desarrollo)

Si quieres ver los logs directamente en la aplicación, puedes agregar un componente de debug que muestre los logs en pantalla. Esto es útil para pruebas rápidas.

---

## Qué buscar en los logs:

Cuando presiones el botón de micrófono, deberías ver mensajes como:

```
Permisos iniciales: {microphone: "granted" o "denied" o "prompt"}
Solicitando permisos...
Resultado de solicitud de permisos: {microphone: "granted" o "denied"}
Permisos después de solicitar: {microphone: "granted" o "denied"}
Verificación final de permisos: {microphone: "granted" o "denied"}
Iniciando reconocimiento de voz...
Reconocimiento iniciado correctamente
```

O si hay errores:
```
Error al iniciar reconocimiento: [mensaje de error]
Error relacionado con permisos detectado, solicitando nuevamente...
```

---

## Método 4: Usar aplicaciones de terceros (Alternativa)

Puedes usar aplicaciones como:
- **Logcat Reader** (disponible en Google Play)
- **aLogcat** (disponible en Google Play)

Estas aplicaciones te permiten ver los logs directamente en el dispositivo sin necesidad de una computadora.

---

## Comandos ADB útiles adicionales:

```bash
# Ver dispositivos conectados
adb devices

# Reiniciar el servidor ADB si hay problemas
adb kill-server
adb start-server

# Limpiar logs anteriores
adb logcat -c

# Ver logs solo de errores
adb logcat *:E

# Ver logs con colores (requiere terminal que soporte colores)
adb logcat -v color
```

---

## Notas importantes:

1. **Los logs de `console.log` en JavaScript aparecen en los logs de Chromium/WebView**, no directamente en logcat. Busca líneas que contengan "chromium" o "console".

2. **Los logs de Capacitor aparecen con el tag "Capacitor"** en logcat.

3. **Los permisos de Android** generan logs con tags como "PermissionController" o "ActivityManager".

4. **Para ver logs en tiempo real mientras pruebas**, deja el comando `adb logcat` ejecutándose en una terminal mientras usas la aplicación.

---

## Ejemplo de sesión de depuración:

```bash
# Terminal 1: Limpiar logs y empezar a capturar
adb logcat -c
adb logcat | grep -E "Permisos|permission|microphone|SpeechRecognition|AssistantModal|capacitor|console" > debug_speech.txt

# Terminal 2: O ver en tiempo real
adb logcat | grep -E "Permisos|permission|microphone|SpeechRecognition|AssistantModal|capacitor|console"

# Ahora usa la aplicación y presiona el botón de micrófono
# Los logs aparecerán en tiempo real o se guardarán en debug_speech.txt
```

---

## Si no tienes acceso a ADB:

1. **Usa Chrome DevTools** (Método 2) - Es la opción más fácil
2. **Usa una app de logcat** en el dispositivo mismo
3. **Agrega alertas temporales** en el código para ver qué está pasando (solo para desarrollo)
