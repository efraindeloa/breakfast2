# 🧪 Plan de Pruebas

## Visión General

Este documento describe la estrategia de pruebas para **Breakfast App**, incluyendo qué se prueba, qué no, y en qué ambientes.

---

## 🎯 Objetivos de Pruebas

### Objetivos Principales
1. **Calidad**: Asegurar que la aplicación funcione correctamente
2. **Usabilidad**: Verificar que la experiencia del usuario sea fluida
3. **Rendimiento**: Validar que la aplicación sea rápida y eficiente
4. **Compatibilidad**: Asegurar funcionamiento en diferentes dispositivos
5. **Seguridad**: Validar que los datos estén protegidos

---

## 📋 Áreas de Prueba

### 1. Funcionalidad

#### Autenticación y Registro
- ✅ Registro de nuevos usuarios (consumer y restaurant)
- ✅ Inicio de sesión con Supabase Auth
- ✅ Validación de campos
- ✅ Manejo de errores de autenticación
- ✅ Persistencia de sesión
- ✅ Detección automática de tipo de cuenta
- ✅ Redirección según tipo de cuenta
- ✅ Verificación de email
- ✅ Recuperación de contraseña

#### Menú y Productos
- ✅ Visualización del menú completo
- ✅ Filtros por categoría
- ✅ Búsqueda de platillos
- ✅ Visualización de detalles de producto
- ✅ Personalización de productos (proteínas, tamaños, notas)
- ✅ Sugerencias del chef y destacados
- ✅ Preservación de categoría seleccionada al regresar del detalle
- ✅ Preservación de posición de scroll al regresar del detalle
- ✅ Scroll automático al inicio al abrir detalle de producto
- ✅ Carga correcta de imágenes de productos (archivos locales)

#### Carrito
- ✅ Agregar items al carrito
- ✅ Modificar cantidad
- ✅ Editar notas
- ✅ Eliminar items
- ✅ Agrupación de items similares
- ✅ Cálculo correcto de totales

#### Órdenes
- ✅ Confirmación de orden
- ✅ Validación antes de confirmar
- ✅ Limpieza de carrito tras confirmar
- ✅ Edición de órdenes enviadas
- ✅ Modificación de cantidades en órdenes
- ✅ Eliminación de items en órdenes
- ✅ Agregar más items a órdenes en edición
- ✅ Carga correcta de imágenes en pantalla de edición
- ✅ Actualización automática de total al modificar orden
- ✅ Historial de órdenes
- ✅ Filtros de historial
- ✅ Detalle de orden

#### Pagos
- ✅ Métodos de pago disponibles
- ✅ Agregar nueva tarjeta
- ✅ **Escaneo de tarjeta con OCR real** usando Tesseract.js
- ✅ Extracción automática de datos de tarjeta (número, nombre, fecha)
- ✅ Ingreso manual de datos de tarjeta
- ✅ Validación de datos de tarjeta
- ✅ Procesamiento de pago (simulado)
- ✅ Confirmación de pago
- ✅ Historial de transacciones
- ✅ Manejo de errores en OCR
- ✅ Validación de formato de número de tarjeta (16 dígitos)
- ✅ Formateo automático de número de tarjeta con espacios

#### Pedidos en Grupo
- ✅ Escaneo de QR
- ✅ Ingreso manual de código
- ✅ Unirse a orden grupal
- ✅ Agregar items a orden grupal
- ✅ División de cuenta

#### Opiniones
- ✅ Calificación con estrellas
- ✅ Selección de chips
- ✅ Búsqueda/autocompletado de chips
- ✅ Agregar chips personalizados
- ✅ Comentarios
- ✅ Subida de fotos/videos (hasta 5 archivos)
- ✅ Vincular fotos a producto específico
- ✅ Publicación de opinión
- ✅ Edición de opiniones existentes
- ✅ Calificación independiente por producto
- ✅ Limpieza automática de campos al cambiar de producto
- ✅ Carga automática de datos al seleccionar producto ya calificado
- ✅ Solo se pueden calificar productos ordenados y pagados
- ✅ Ver opiniones verificadas de productos
- ✅ Filtros en opiniones (Más Recientes, Con Foto, Modificados)
- ✅ Estadísticas de productos (promedio, distribución)
- ✅ Calificación promedio visible en detalle de producto

#### Favoritos
- ✅ Agregar a favoritos
- ✅ Eliminar de favoritos
- ✅ Lista de favoritos
- ✅ Persistencia de favoritos

#### Solicitud de Asistencia
- ✅ Acceso a pantalla de solicitud de asistencia
- ✅ Historial de solicitudes
- ✅ **Búsqueda fuzzy (difusa)** que tolera errores de tipeo
- ✅ Solicitudes predefinidas
- ✅ Creación de solicitudes personalizadas
- ✅ Confirmación visual de solicitudes
- ✅ Limpieza de historial al pagar
- ✅ Ordenamiento por relevancia en búsqueda

#### Configuración
- ✅ Cambio de idioma
- ✅ Modo oscuro/claro
- ✅ Configuración de IA
- ✅ Datos fiscales

#### Programa de Lealtad
- ✅ Visualización de puntos totales
- ✅ Crecimiento mensual
- ✅ Niveles (Bronce, Plata, Oro, Platino)
- ✅ Barra de progreso
- ✅ Beneficios por nivel
- ✅ Persistencia de datos

#### Cupones y Recompensas
- ✅ Carousel de cupones
- ✅ Programa de referidos
- ✅ Compartir código de referido
- ✅ Estadísticas de referidos
- ✅ Detalle de cupón con QR

#### Promociones
- ✅ Filtros por categoría
- ✅ Carousel de promociones principales
- ✅ Sugerencia de IA
- ✅ Especiales de temporada
- ✅ Detalle de promoción con contador
- ✅ Aplicar promoción a orden
- ✅ Carga de promociones desde base de datos
- ✅ Validación de UUID en IDs de promociones

#### Funcionalidades de Restaurante
- ✅ Acceso a pantallas de restaurante (solo con accountType === 'restaurant')
- ✅ Gestión de productos (crear, editar, eliminar)
- ✅ Subida de múltiples imágenes de productos
- ✅ Gestión de etiquetas (badges) de productos
- ✅ Gestión de secciones de menú (Menú, Sugerencias, Destacados)
- ✅ Búsqueda global en menú de restaurante
- ✅ Gestión de promociones (crear, editar, eliminar)
- ✅ Subida de imágenes de promociones
- ✅ Configuración de modo desayuno en promociones
- ✅ Configuración de contador flash
- ✅ Validación de RLS en todas las operaciones
- ✅ Manejo de errores 403/406/409

#### Mesa Lista
- ✅ Detección automática cuando mesa está lista
- ✅ Contador regresivo en tiempo real
- ✅ Confirmar asistencia
- ✅ Extender tiempo (5 minutos más)
- ✅ Navegación automática desde lista de espera

#### Pago Dividido
- ✅ Selección de items a pagar
- ✅ Selección automática de items del usuario
- ✅ Cálculo de subtotal, impuestos, propina
- ✅ Selección de método de pago
- ✅ Integración con tarjetas guardadas

#### Asistente IA con Speech-to-Text
- ✅ Reconocimiento de voz nativo (Android)
- ✅ Reconocimiento de voz web
- ✅ Solicitud de permisos de micrófono
- ✅ Indicador visual de escucha
- ✅ Manejo de errores y permisos

### 2. Usabilidad

#### Navegación
- ✅ Navegación inferior funcional
- ✅ Rutas protegidas
- ✅ Redirecciones correctas
- ✅ Breadcrumbs (si aplica)

#### Interfaz de Usuario
- ✅ Diseño responsive
- ✅ Modo oscuro/claro
- ✅ Accesibilidad básica
- ✅ Feedback visual en interacciones
- ✅ Mensajes de error claros

#### Experiencia del Usuario
- ✅ Flujos intuitivos
- ✅ Tiempos de carga aceptables
- ✅ Animaciones suaves
- ✅ Estados de carga visibles

### 3. Internacionalización

#### Idiomas Soportados
- ✅ Español (es)
- ✅ Inglés (en)
- ✅ Portugués (pt)
- ✅ Francés (fr)

#### Funcionalidades i18n
- ✅ Cambio de idioma funcional
- ✅ Persistencia de idioma
- ✅ Todas las cadenas traducidas
- ✅ Sin texto hardcodeado

### 4. Compatibilidad

#### Dispositivos
- ✅ Teléfonos Android (diferentes tamaños)
- ✅ Tablets Android
- ✅ Navegadores web (Chrome, Firefox, Safari, Edge)

#### Versiones
- ✅ Android 5.0+ (API 21+)
- ✅ Navegadores modernos (últimas 2 versiones)

### 5. Rendimiento

#### Métricas
- ✅ Tiempo de carga inicial < 3 segundos
- ✅ Transiciones entre pantallas < 500ms
- ✅ Interacciones responden < 100ms
- ✅ Uso de memoria razonable

### 6. Seguridad

#### Datos Sensibles
- ⚠️ Datos de tarjeta (actualmente no seguro - localStorage)
- ✅ Solo últimos 4 dígitos visibles
- ✅ Validación de formularios

#### Autenticación
- ⚠️ Actualmente simulada (validación real en futuro)

---

## 🚫 Qué NO se Prueba

### Funcionalidades Futuras
- ❌ Notificaciones push
- ❌ Integraciones con pasarelas de pago reales
- ❌ Sistema de reservas
- ❌ Dashboard administrativo completo

### Áreas No Implementadas
- ❌ Tests unitarios automatizados (pendiente)
- ❌ Tests de integración (pendiente)
- ❌ Tests E2E automatizados (pendiente)

---

## 🌍 Ambientes de Prueba

### Desarrollo
- **Propósito**: Pruebas durante desarrollo
- **Características**:
  - Hot Module Replacement (HMR)
  - Source maps
  - Logs detallados
  - Errores visibles

### Producción
- **Propósito**: Pruebas finales antes de release
- **Características**:
  - Build optimizado
  - Sin logs de desarrollo
  - Código minificado

### Staging (Futuro)
- **Propósito**: Pruebas de integración
- **Características**:
  - Backend de pruebas
  - Datos de prueba
  - Ambiente similar a producción

---

## 📊 Tipos de Pruebas

### Pruebas Manuales

#### Funcionales
- **Responsable**: QA Team / Desarrolladores
- **Frecuencia**: Antes de cada release
- **Documentación**: Casos de prueba manuales

#### Usabilidad
- **Responsable**: UX Team / QA Team
- **Frecuencia**: Antes de releases mayores
- **Documentación**: Reportes de usabilidad

### Pruebas Automatizadas (Futuro)

#### Unitarias
- **Framework**: Jest + React Testing Library
- **Cobertura objetivo**: 80%
- **Frecuencia**: En cada commit (CI/CD)

#### Integración
- **Framework**: Jest + React Testing Library
- **Frecuencia**: En cada pull request

#### E2E
- **Framework**: Cypress o Playwright
- **Frecuencia**: Antes de cada release
- **Ambiente**: Staging

---

## 🧪 Casos de Prueba Prioritarios

### Prioridad Alta (P0)
1. **Registro e inicio de sesión**
2. **Navegación del menú**
3. **Agregar items al carrito**
4. **Confirmar orden**
5. **Procesar pago**
6. **Escaneo de QR**

### Prioridad Media (P1)
1. **Pedidos en grupo**
2. **Sistema de opiniones**
3. **Favoritos**
4. **Búsqueda de solicitudes de asistencia**
5. **Creación de solicitudes personalizadas**
6. **Historial de solicitudes**
7. **Cambio de idioma**
8. **Modo oscuro/claro**

### Prioridad Baja (P2)
1. **Configuración de IA**
2. **Datos fiscales**
3. **Historial de transacciones**
4. **Exportación de recibos**

---

## 📝 Proceso de Pruebas

### Antes de Desarrollo
1. Revisar casos de prueba relevantes
2. Preparar datos de prueba
3. Verificar ambiente de desarrollo

### Durante Desarrollo
1. Pruebas continuas mientras se desarrolla
2. Validación de funcionalidad básica
3. Verificación de diseño responsive

### Antes de Commit
1. Ejecutar pruebas manuales relevantes
2. Verificar que no haya regresiones
3. Validar código con linter

### Antes de Release
1. Ejecutar suite completa de pruebas
2. Pruebas de regresión
3. Pruebas de compatibilidad
4. Validación de rendimiento

---

## 🐞 Reporte de Bugs

### Formato de Bug Report

```
**Título**: [Breve descripción del problema]

**Severidad**: [Crítica / Alta / Media / Baja]

**Prioridad**: [P0 / P1 / P2]

**Ambiente**: [Android / Web / Ambos]
- Versión OS: 
- Versión de la app:
- Dispositivo/Navegador:

**Pasos para Reproducir**:
1. Paso 1
2. Paso 2
3. ...

**Resultado Esperado**:
[Qué debería pasar]

**Resultado Actual**:
[Qué pasa realmente]

**Screenshots/Videos**:
[Adjuntar si es relevante]

**Logs**:
[Si hay errores en consola]
```

### Severidad de Bugs

#### Crítica
- Bloquea funcionalidad principal
- Datos perdidos o corruptos
- Aplicación inutilizable

#### Alta
- Funcionalidad importante afectada
- Workaround disponible
- Impacta experiencia significativamente

#### Media
- Funcionalidad menor afectada
- Workaround fácil disponible
- Impacto moderado en experiencia

#### Baja
- Problema cosmético
- No afecta funcionalidad
- Mejora sugerida

---

## 📈 Métricas de Calidad

### Objetivos

#### Cobertura de Pruebas (Futuro)
- **Unitarias**: > 80%
- **Integración**: > 70%
- **E2E**: Casos críticos cubiertos

#### Bugs por Release
- **Críticos**: 0
- **Altos**: < 5
- **Medios/Bajos**: Aceptable

#### Tiempo de Resolución
- **Críticos**: < 24 horas
- **Altos**: < 1 semana
- **Medios**: < 2 semanas
- **Bajos**: Según disponibilidad

---

## 🔄 Pruebas de Regresión

### Cuándo Realizar
- Antes de cada release
- Después de cambios significativos
- Cuando se corrige un bug crítico

### Alcance
- Funcionalidades principales
- Funcionalidades relacionadas al cambio
- Funcionalidades que pueden verse afectadas

---

## ✅ Checklist de Pruebas

### Antes de Release

#### Funcionalidad
- [ ] Todas las pantallas cargan correctamente
- [ ] Todas las rutas funcionan
- [ ] Todos los formularios validan correctamente
- [ ] Todas las interacciones responden

#### Usabilidad
- [ ] Diseño responsive en diferentes tamaños
- [ ] Modo oscuro funciona correctamente
- [ ] Cambio de idioma funciona
- [ ] Mensajes de error son claros

#### Compatibilidad
- [ ] Funciona en Android 5.0+
- [ ] Funciona en navegadores principales
- [ ] Permisos de cámara funcionan (QR)

#### Rendimiento
- [ ] Carga inicial < 3 segundos
- [ ] Transiciones suaves
- [ ] Sin lag en interacciones

#### Seguridad
- [ ] Validación de formularios
- [ ] Datos sensibles no expuestos (últimos 4 dígitos)

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.5  
**Responsable**: QA Team

### Cambios Recientes (Enero 2025)
- ✅ **Agregadas pruebas completas para Funcionalidades de Restaurante**
- ✅ Agregadas pruebas para autenticación con Supabase
- ✅ Agregadas pruebas para gestión de productos (CRUD)
- ✅ Agregadas pruebas para gestión de promociones (CRUD)
- ✅ Agregadas pruebas para subida de imágenes a Supabase Storage
- ✅ Agregadas pruebas para validación de RLS
- ✅ Agregadas pruebas para manejo de errores de base de datos
- ✅ Agregadas pruebas para Descubrir Restaurantes
- ✅ Agregadas pruebas para Punto de Encuentro
- ✅ Agregadas pruebas para Gestión de Contactos
- ✅ Agregadas pruebas para geolocalización y permisos
- ✅ Agregadas pruebas para importación de contactos del dispositivo
- ✅ Agregadas pruebas para mapas interactivos (Leaflet)
- ✅ Agregadas pruebas para preservación de estado de navegación
- ✅ Agregadas pruebas para funcionalidad de agregar más items en edición
- ✅ Agregadas pruebas para scroll automático en detalle de producto
- ✅ Agregadas pruebas para carga correcta de imágenes

### Cambios Recientes (Diciembre 2024)
- ✅ Agregadas pruebas de Solicitud de Asistencia en áreas de prueba
- ✅ Agregadas a casos de prueba prioritarios (P0 y P1)
- ✅ Documentadas pruebas de búsqueda inteligente y solicitudes personalizadas
