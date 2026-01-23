<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Breakfast App

Aplicación móvil y web para restaurantes que permite a los comensales interactuar con el establecimiento de manera digital.

## 🚀 Inicio Rápido

### Requisitos Previos
- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Java**: 17 (para build de Android, opcional)
- **Android SDK**: (para build de Android, opcional)

### Instalación

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   - Crear archivo `.env` en la raíz del proyecto
   - Configurar `GEMINI_API_KEY` si usas IA
   - Configurar Supabase (ver [README_SUPABASE.md](./README_SUPABASE.md)):
     ```env
     VITE_SUPABASE_URL=https://tkwackqrnsqlmxtalvuw.supabase.co
     VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU3NzEsImV4cCI6MjA4NDY5MTc3MX0.1PG0x0ZdAAjhunyiPBRzpgpsr9nZGV5epHdUvalHqbA
     ```

3. **Ejecutar en desarrollo**:
   ```bash
   npm run dev
   ```
   - La aplicación estará disponible en `http://localhost:5173`

### Scripts Disponibles

- `npm run dev`: Inicia servidor de desarrollo
- `npm run build`: Build de producción web
- `npm run preview`: Preview del build de producción
- `npm run android:build`: Build APK de Android
- `npm run android:release`: Build APK Release de Android
- `npx cap sync`: Sincronizar con Capacitor
- `npx cap open`: Abrir proyecto en Android Studio

## 📚 Documentación

La documentación completa está disponible en la carpeta [`docs/`](./docs/).

### Documentación Principal
- **[Índice General](./docs/README.md)**: Visión general de toda la documentación
- **[Documento de Visión](./docs/01-producto/01-vision.md)**: Qué es el producto y qué problema resuelve
- **[Especificaciones Funcionales](./docs/01-producto/02-especificaciones-funcionales.md)**: Todas las funcionalidades del sistema
- **[Guía del Usuario](./docs/02-usuarios/01-guia-cliente.md)**: Cómo usar la aplicación
- **[Arquitectura del Sistema](./docs/03-tecnica/01-arquitectura.md)**: Arquitectura técnica
- **[Guía de Contribución](./docs/CONTRIBUTING.md)**: Cómo contribuir al proyecto

### Por Categoría

#### 📄 Producto
- [Documento de Visión](./docs/01-producto/01-vision.md)
- [Especificaciones Funcionales](./docs/01-producto/02-especificaciones-funcionales.md)
- [User Stories](./docs/01-producto/03-user-stories.md)

#### 👤 Usuarios
- [Guía del Usuario (Cliente)](./docs/02-usuarios/01-guia-cliente.md)

#### 🏗️ Técnica
- [Arquitectura del Sistema](./docs/03-tecnica/01-arquitectura.md)
- [Modelo de Datos](./docs/03-tecnica/02-modelo-datos.md)

#### 🧪 QA
- [Plan de Pruebas](./docs/04-qa/01-plan-pruebas.md)

#### 🚀 Operación
- [Deployment & Release](./docs/05-operacion/01-deployment.md)

#### 🎨 Diseño
- [Design System](./docs/07-diseno/01-design-system.md)

## 🛠️ Tecnologías

- **Frontend**: React 19, TypeScript, Vite
- **Mobile**: Capacitor 8, Android
- **Estilos**: Tailwind CSS
- **Iconos**: Material Symbols
- **i18n**: Sistema propio con JSON
- **QR Scanner**: html5-qrcode

## 📱 Plataformas Soportadas

- **Web**: Navegadores modernos (Chrome, Firefox, Safari, Edge)
- **Android**: 5.0+ (API 21+)
- **iOS**: (Planificado)

## 🌍 Idiomas Soportados

- 🇪🇸 Español (es)
- 🇬🇧 Inglés (en)
- 🇵🇹 Portugués (pt)
- 🇫🇷 Francés (fr)

## 📝 Licencia

Este proyecto es propietario. Todos los derechos reservados.

## 🤝 Contribuir

¿Quieres contribuir? Lee nuestra [Guía de Contribución](./docs/CONTRIBUTING.md).

## 📞 Soporte

Para soporte técnico o preguntas:
- **Email**: soporte@restaurante.com
- **Issues**: Usa el sistema de issues de GitHub

---

**Última actualización**: Diciembre 2024  
**Versión**: 0.0.0
