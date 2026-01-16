# Instrucciones para Generar el APK

## ✅ Lo que ya está configurado:
- ✅ Capacitor instalado y configurado
- ✅ Plataforma Android agregada
- ✅ Proyecto construido y sincronizado

## 📋 Requisitos previos:

1. **Android Studio** debe estar instalado en tu computadora
   - Descarga desde: https://developer.android.com/studio
   - Asegúrate de instalar también el SDK de Android

2. **Java JDK** (generalmente viene con Android Studio)

## 🚀 Pasos para generar el APK:

### Opción 1: Usando Android Studio (Recomendado)

1. Abre Android Studio
2. Selecciona "Open an Existing Project"
3. Navega a la carpeta `C:\Temp\breakfast2\android` y ábrela
4. Espera a que Android Studio sincronice el proyecto (Gradle Sync)
5. Una vez sincronizado:
   - Ve a: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - O usa el atajo: `Ctrl + Shift + A` y busca "Build APK"
6. Espera a que termine la compilación
7. Cuando termine, verás una notificación. Haz clic en "locate" para encontrar el APK
8. El APK estará en: `android\app\build\outputs\apk\debug\app-debug.apk`

### Opción 2: Usando la línea de comandos (Gradle)

Si tienes Gradle configurado en tu PATH:

```bash
cd C:\Temp\breakfast2\android
.\gradlew assembleDebug
```

El APK se generará en: `android\app\build\outputs\apk\debug\app-debug.apk`

### Opción 3: Usando Capacitor CLI

```bash
cd C:\Temp\breakfast2
npm run build
npm run cap:sync
npm run cap:open android
```

Esto abrirá Android Studio automáticamente.

## 📱 Para generar un APK de producción (firmado):

1. En Android Studio, ve a: **Build** → **Generate Signed Bundle / APK**
2. Selecciona **APK**
3. Necesitarás crear un keystore (si no tienes uno):
   - Haz clic en "Create new..."
   - Completa el formulario
   - Guarda el keystore en un lugar seguro
4. Selecciona tu keystore y completa la información
5. Selecciona "release" como build variant
6. El APK firmado estará en: `android\app\build\outputs\apk\release\app-release.apk`

## 🔄 Actualizar la aplicación después de cambios:

Cada vez que hagas cambios en el código:

1. Construye el proyecto web:
   ```bash
   npm run build
   ```

2. Sincroniza con Capacitor:
   ```bash
   npm run cap:sync
   ```

3. Genera el nuevo APK siguiendo los pasos anteriores

## ⚠️ Notas importantes:

- El APK de debug es para pruebas. Para distribución, usa un APK firmado (release)
- El tamaño del APK puede ser grande (~500KB+) debido a que incluye todo el código JavaScript
- Asegúrate de tener suficiente espacio en disco
- Si encuentras errores, verifica que Android Studio tenga todas las herramientas necesarias instaladas

## 🆘 Solución de problemas:

Si encuentras errores al compilar:
1. Verifica que Android Studio tenga el SDK de Android instalado
2. Asegúrate de que Java JDK esté correctamente configurado
3. Intenta hacer "Sync Project with Gradle Files" en Android Studio
4. Limpia el proyecto: **Build** → **Clean Project**
