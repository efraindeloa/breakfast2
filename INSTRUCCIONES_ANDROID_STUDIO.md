# Instrucciones para Generar APK en Android Studio

## Pasos para Generar el APK

### 1. Abrir el Proyecto
- Abre Android Studio
- Selecciona **"Open an Existing Project"**
- Navega a: `C:\Temp\breakfast2\android`
- Selecciona la carpeta `android` y ábrela

### 2. Esperar la Sincronización
- Android Studio comenzará a sincronizar Gradle automáticamente
- Espera a que termine (verás "Gradle sync finished" en la barra inferior)
- Si aparece "Sync Now", haz clic en él

### 3. Verificar Configuración
- Ve a **File → Project Structure → SDK Location**
- Verifica que el **Android SDK** esté configurado correctamente
- Si no está configurado, Android Studio te guiará para instalarlo

### 4. Generar el APK

#### Opción A: Menú Build (Recomendado)
1. Ve a **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Espera a que termine la compilación
3. Aparecerá una notificación: **"APK(s) generated successfully"**
4. Haz clic en **"locate"** para abrir la carpeta del APK

#### Opción B: Terminal Integrada
1. Ve a **View → Tool Windows → Terminal**
2. Ejecuta: `.\gradlew.bat assembleDebug`
3. Espera a que termine

### 5. Ubicación del APK
El APK generado estará en:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

## Solución de Problemas

### Si no pasa nada al hacer clic en Build:
1. Verifica la barra de estado inferior (puede haber errores)
2. Revisa la pestaña **"Build"** en la parte inferior
3. Intenta sincronizar Gradle: **File → Sync Project with Gradle Files**
4. Verifica que no haya errores en el archivo `build.gradle`

### Si hay errores de SDK:
1. Ve a **File → Project Structure → SDK Location**
2. Instala el SDK requerido si falta
3. Sincroniza el proyecto nuevamente

### Si hay errores de Gradle:
1. Ve a **File → Settings → Build, Execution, Deployment → Build Tools → Gradle**
2. Verifica que esté usando **"Gradle wrapper"**
3. Intenta hacer **"Invalidate Caches / Restart"** desde **File → Invalidate Caches**

## Comandos Útiles desde Terminal

```bash
# Sincronizar Capacitor (desde la raíz del proyecto)
cd C:\Temp\breakfast2
npm run build
npx cap sync

# Generar APK Debug (desde android/)
cd android
.\gradlew.bat assembleDebug

# Generar APK Release (requiere firma)
.\gradlew.bat assembleRelease

# Limpiar build anterior
.\gradlew.bat clean
```
