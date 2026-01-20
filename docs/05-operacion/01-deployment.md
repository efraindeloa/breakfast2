# 🚀 Deployment & Release

## Visión General

Este documento describe el proceso de deployment y release de **Breakfast App** para diferentes plataformas.

---

## 📦 Build del Proyecto

### Desarrollo Local

#### Requisitos Previos
- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Java**: 17 (para build de Android)
- **Android SDK**: Para build de Android

#### Instalación de Dependencias
```bash
npm install
```

#### Servidor de Desarrollo
```bash
npm run dev
```
- Inicia servidor en `http://localhost:5173`
- Hot Module Replacement (HMR) activado
- Source maps habilitados para debugging

#### Build de Producción Web
```bash
npm run build
```
- Genera archivos estáticos en `dist/`
- Optimiza y minifica código
- Listo para deployment en servidor web

#### Preview de Build
```bash
npm run preview
```
- Sirve el build de producción localmente
- Útil para verificar antes de deployment

---

## 🤖 Build Android

### Requisitos

#### Android Studio
- Instalar Android Studio
- Configurar Android SDK
- Configurar JAVA_HOME (Java 17)

#### Verificar Java
```bash
java -version
# Debe mostrar Java 17
```

#### Configurar JAVA_HOME (Windows)
```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### Proceso de Build

#### 1. Build Web
```bash
npm run build
```
- Construye la aplicación web
- Genera archivos en `dist/`

#### 2. Sincronizar con Capacitor
```bash
npx cap sync
```
- Copia archivos web a proyecto Android
- Sincroniza plugins de Capacitor
- Actualiza configuración nativa

#### 3. Build APK Debug
```bash
cd android
.\gradlew.bat assembleDebug
```

**Ubicación del APK**: `android/app/build/outputs/apk/debug/app-debug.apk`

#### Script Completo
```bash
npm run android:build
```
Este script ejecuta los tres pasos anteriores en secuencia.

### Build de Release

#### 1. Generar Keystore (Solo primera vez)
```bash
keytool -genkey -v -keystore breakfast-app-key.keystore -alias breakfast-app -keyalg RSA -keysize 2048 -validity 10000
```

#### 2. Configurar gradle.properties
Agregar en `android/gradle.properties`:
```properties
KEYSTORE_FILE=../breakfast-app-key.keystore
KEYSTORE_PASSWORD=tu_contraseña
KEY_ALIAS=breakfast-app
KEY_PASSWORD=tu_contraseña
```

#### 3. Configurar build.gradle
Ya debe estar configurado para usar las propiedades del keystore.

#### 4. Build APK Release
```bash
cd android
.\gradlew.bat assembleRelease
```

**Ubicación del APK**: `android/app/build/outputs/apk/release/app-release.apk`

#### Script Completo
```bash
npm run android:release
```

---

## 🌐 Deployment Web

### Opciones de Hosting

#### Vercel (Recomendado)
1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Configuración**:
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Netlify
1. **Instalar Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

3. **Configuración**:
   - Build command: `npm run build`
   - Publish directory: `dist`

#### GitHub Pages
1. **Configurar Vite**:
   ```typescript
   // vite.config.ts
   export default defineConfig({
     base: '/tu-repo/',
     // ...
   });
   ```

2. **Deploy**:
   ```bash
   npm run build
   # Subir contenido de dist/ a rama gh-pages
   ```

#### Servidor Propio
1. **Build**:
   ```bash
   npm run build
   ```

2. **Subir archivos**:
   - Subir contenido de `dist/` a servidor web
   - Configurar servidor para servir `index.html` en todas las rutas (SPA)

---

## 📱 Distribución Android

### APK Directo

#### Para Testing Interno
1. Generar APK debug o release
2. Compartir archivo APK directamente
3. Instalar en dispositivos de prueba

#### Pasos de Instalación
1. Habilitar "Orígenes desconocidos" en Android
2. Transferir APK al dispositivo
3. Abrir APK y seguir instrucciones

### Google Play Store (Futuro)

#### Requisitos
- Cuenta de desarrollador de Google Play ($25 único)
- App Bundle (AAB) en lugar de APK

#### Generar App Bundle
```bash
cd android
.\gradlew.bat bundleRelease
```

**Ubicación**: `android/app/build/outputs/bundle/release/app-release.aab`

#### Proceso de Subida
1. Crear aplicación en Google Play Console
2. Subir AAB
3. Completar información de la aplicación
4. Configurar precios y distribución
5. Enviar a revisión

---

## 🔄 Proceso de Release

### Versionado

#### Formato SemVer
- **Mayor**: Cambios incompatibles (v2.0.0)
- **Menor**: Nuevas funcionalidades compatibles (v1.1.0)
- **Parche**: Correcciones de bugs (v1.0.1)

#### Actualizar Versión
1. **package.json**:
   ```json
   {
     "version": "1.0.1"
   }
   ```

2. **capacitor.config.ts**:
   ```typescript
   const config: CapacitorConfig = {
     appId: 'com.appsistente.app',
     appName: 'appsistente',
     // ...
   };
   ```

3. **Android (build.gradle)**:
   ```gradle
   defaultConfig {
       versionCode 1
       versionName "1.0.1"
   }
   ```

### Checklist Pre-Release

#### Desarrollo
- [ ] Todas las funcionalidades completadas
- [ ] Bugs críticos corregidos
- [ ] Pruebas completadas
- [ ] Código revisado

#### Build
- [ ] Versión actualizada
- [ ] Build exitoso sin errores
- [ ] APK/AAB generado correctamente

#### Testing
- [ ] Pruebas en diferentes dispositivos
- [ ] Pruebas en diferentes versiones de Android
- [ ] Verificar permisos (cámara, etc.)
- [ ] Validar funcionalidades principales

#### Documentación
- [ ] README actualizado
- [ ] Changelog actualizado
- [ ] Documentación técnica actualizada

### Release Notes

#### Formato
```
## Versión 1.0.1 (2024-12-20)

### Nuevas Funcionalidades
- Agregada funcionalidad X
- Mejorada funcionalidad Y

### Correcciones
- Corregido bug Z
- Mejorado rendimiento en W

### Cambios Técnicos
- Actualizada dependencia X a versión Y
```

---

## 🏗️ CI/CD (Futuro)

### GitHub Actions

#### Workflow de Build
```yaml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Test
      run: npm test
```

#### Workflow de Deploy
```yaml
name: Deploy

on:
  push:
    branches: [ main ]
    tags:
      - 'v*'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 🔍 Verificación Post-Deployment

### Web

#### Checklist
- [ ] Aplicación carga correctamente
- [ ] Todas las rutas funcionan
- [ ] Recursos estáticos cargan
- [ ] No hay errores en consola
- [ ] Modo responsive funciona
- [ ] Internacionalización funciona

### Android

#### Checklist
- [ ] APK se instala correctamente
- [ ] Aplicación se abre sin errores
- [ ] Permisos solicitados correctamente
- [ ] Cámara funciona (QR scanner)
- [ ] Almacenamiento local funciona
- [ ] No hay crashes

---

## 📊 Monitoreo (Futuro)

### Analytics

#### Google Analytics
- Eventos de usuario
- Conversiones
- Rutas más visitadas

#### Firebase Analytics
- Crashes y errores
- Rendimiento
- Uso de funcionalidades

### Logs

#### Errores
- Capturar errores de JavaScript
- Enviar a servicio de logging (Sentry, etc.)

#### Performance
- Métricas de carga
- Tiempo de interacción
- Ancho de banda usado

---

## 🔄 Rollback

### Web
1. Revertir commit en Git
2. Re-desplegar versión anterior
3. O usar funcionalidad de rollback del host (Vercel, Netlify)

### Android
1. Generar APK de versión anterior
2. Distribuir manualmente a usuarios afectados
3. O esperar a próxima actualización en Play Store

---

## 📝 Notas Importantes

### Seguridad

#### Keystore
- **Nunca** commitear el keystore al repositorio
- Guardar el keystore en lugar seguro
- Mantener copias de seguridad

#### Variables de Entorno
- No commitear archivos `.env` con datos sensibles
- Usar variables de entorno del host para secrets

### Performance

#### Optimizaciones
- Código minificado en producción
- Imágenes optimizadas
- Lazy loading de componentes
- Caché de recursos estáticos

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de DevOps
