# 🧭 Documento de Visión

## Qué es el producto

**Breakfast App** es una aplicación móvil y web desarrollada con React y Capacitor que permite a los comensales de un restaurante interactuar con el establecimiento de manera digital. La aplicación proporciona una experiencia completa desde la selección de platillos hasta el pago, incluyendo funcionalidades avanzadas como pedidos en grupo, sistema de opiniones, y un asistente con IA.

### Características principales
- **Menú digital interactivo** con categorías, filtros y búsqueda
- **Sistema de carrito** para gestionar órdenes
- **Escaneo QR** para unirse a mesas y ordenar directamente
- **Pedidos en grupo** para compartir órdenes entre múltiples usuarios
- **Sistema de pagos** con tarjetas y métodos alternativos
- **Escaneo de tarjetas con OCR real** usando Tesseract.js para agregar tarjetas rápidamente
- **Perfil de usuario** con historial de órdenes y transacciones
- **Sistema de opiniones** con calificaciones por estrellas, chips, comentarios y fotos
- **Opiniones verificadas** de productos con estadísticas y filtros
- **Edición de opiniones** después de publicarlas
- **Calificación visible en detalle de producto** con promedio y número de reseñas
- **Solicitud de asistencia** con **búsqueda fuzzy (difusa)** que tolera errores de tipeo
- **Historial de solicitudes** para confirmar que las solicitudes fueron enviadas
- **Asistente IA** para recomendaciones y soporte con **speech-to-text** (reconocimiento de voz)
- **Programa de lealtad** con sistema de puntos y niveles
- **Cupones y recompensas** con programa de referidos
- **Módulo de promociones** con filtros y sugerencias de IA
- **Mesa lista** con notificación cuando la mesa está disponible
- **Pago dividido** para dividir la cuenta entre múltiples comensales
- **Descubrir restaurantes** con mapa interactivo y geolocalización
- **Punto de encuentro** para coordinar reuniones en restaurantes
- **Gestión de contactos** con importación desde dispositivo
- **Soporte multiidioma** (Español, Inglés, Portugués, Francés)
- **Modo oscuro/claro** para mejor experiencia visual

## Qué problema resuelve

### Problemas tradicionales del restaurante
1. **Demora en atención**: Los meseros están ocupados y los comensales esperan mucho tiempo
2. **Errores en órdenes**: Comunicación verbal puede llevar a malentendidos
3. **Gestión de pagos**: División de cuentas compleja, especialmente en grupos
4. **Falta de personalización**: Difícil especificar modificaciones o preferencias
5. **Experiencia fragmentada**: Múltiples interacciones con diferentes personas

### Soluciones que ofrece
- ✅ **Órdenes autónomas**: Los comensales pueden ordenar sin depender de meseros
- ✅ **Precisión**: Órdenes digitales con notas detalladas y personalización
- ✅ **Pagos grupales**: División automática de cuentas y pagos individuales
- ✅ **Personalización avanzada**: Selección de proteínas, tamaños, notas especiales
- ✅ **Experiencia unificada**: Todo en una sola aplicación, desde el menú hasta el pago

## Para quién es

### Usuarios principales
1. **Comensales** (Usuario final)
   - Personas que visitan el restaurante
   - Buscan una experiencia rápida y cómoda
   - Necesitan ordenar, pagar y gestionar su experiencia

2. **Restaurante** (Cliente B2B)
   - Propietarios y administradores
   - Necesitan reducir costos operativos
   - Quieren mejorar la experiencia del cliente
   - Requieren métricas y reportes

### Casos de uso específicos
- Comensales que prefieren ordenar sin contacto
- Grupos que necesitan dividir la cuenta
- Usuarios con necesidades dietéticas específicas
- Clientes frecuentes que quieren acceso rápido
- Turistas que necesitan traducción de menús

## Qué NO es

### Limitaciones actuales
- ❌ **NO es un sistema POS completo**: No reemplaza completamente el sistema de punto de venta del restaurante
- ❌ **NO incluye gestión de inventario**: No gestiona stock de ingredientes
- ❌ **NO incluye app para meseros**: Solo está orientada a comensales y propietarios de restaurantes
- ❌ **NO tiene integración con delivery**: Enfoque en servicio en restaurante
- ❌ **NO es una app de reservaciones**: Se enfoca en el servicio durante la visita

### Funcionalidades futuras no incluidas
- Sistema de reservas de mesas
- Programa de lealtad/recompensas
- Notificaciones push para estado de órdenes
- Integración con sistemas de pago en línea completos
- Dashboard administrativo completo

## Alcance del proyecto

### Fase actual (v1.0.0)
- ✅ Backend Supabase con PostgreSQL
- ✅ Autenticación real con Supabase Auth
- ✅ Gestión completa de productos (CRUD)
- ✅ Gestión completa de promociones (CRUD)
- ✅ Gestión de perfiles de usuario y restaurante
- ✅ Sistema de órdenes con base de datos
- ✅ Storage de imágenes en Supabase
- ✅ Row Level Security (RLS) configurado
- ✅ Capa de API para abstracción
- ✅ Soporte multiidioma completo
- ✅ Diseño responsive
- ✅ Pantallas para restaurantes (gestión de menú, promociones, perfil)

### Próximas fases (Planificadas)
- Notificaciones push en tiempo real
- Sistema de reservas
- Dashboard administrativo completo
- Integración con sistemas POS existentes
- Integración con pasarelas de pago reales
- App para meseros
- Sistema de delivery

## Valores fundamentales

1. **Simplicidad**: La aplicación debe ser fácil de usar para cualquier persona
2. **Velocidad**: Proceso de ordenamiento debe ser más rápido que el método tradicional
3. **Precisión**: Menos errores en órdenes gracias a la claridad digital
4. **Flexibilidad**: Soporte para diferentes necesidades y preferencias
5. **Accesibilidad**: Diseño inclusivo y soporte multiidioma

## Métricas de éxito

### Para comensales
- Tiempo promedio de ordenamiento < 5 minutos
- Tasa de satisfacción > 4.5/5 estrellas
- Tasa de error en órdenes < 1%

### Para el restaurante
- Reducción en tiempo de atención de meseros del 30%
- Aumento en volumen de órdenes del 20%
- Reducción en errores de órdenes del 50%

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.3  
**Responsable**: Equipo de desarrollo

### Cambios Recientes (Enero 2025)
- ✅ **Backend Supabase**: Migración completa a Supabase como backend
- ✅ **Autenticación Real**: Implementación de Supabase Auth
- ✅ **Gestión de Productos**: CRUD completo desde `MenuRestaurantScreen`
- ✅ **Gestión de Promociones**: CRUD completo desde `PromotionsRestaurantScreen`
- ✅ **Múltiples Imágenes**: Soporte para múltiples imágenes por producto
- ✅ **Etiquetas de Productos**: Sistema de badges/etiquetas
- ✅ **Búsqueda Global**: Búsqueda en todo el menú, no solo categoría actual
- ✅ **Pantallas de Restaurante**: Gestión completa para propietarios
- ✅ **Capa de API**: Nueva arquitectura con abstracción de base de datos
- ✅ **Row Level Security**: Políticas de seguridad configuradas
- ✅ **Separación users/user_profiles**: Arquitectura mejorada
- ✅ Programa de lealtad con puntos y niveles
- ✅ Cupones y recompensas con referidos
- ✅ Módulo de promociones con sugerencias de IA
- ✅ Notificación de mesa lista con contador regresivo
- ✅ Pago dividido para múltiples comensales
- ✅ Descubrir restaurantes con mapa interactivo
- ✅ Punto de encuentro para coordinar reuniones
- ✅ Gestión de contactos con importación desde dispositivo
- ✅ Speech-to-text en asistente IA
- ✅ Mejoras en navegación del menú con preservación de estado
- ✅ Mejoras en experiencia de usuario al navegar entre menú y detalle
- ✅ Funcionalidad mejorada de edición de órdenes

### Cambios Recientes (Diciembre 2024)
- ✅ Agregada funcionalidad de Solicitud de Asistencia a características principales
- ✅ Implementada búsqueda fuzzy (difusa) en solicitudes de asistencia que tolera errores de tipeo
- ✅ Agregada página de Opiniones Verificadas de productos con estadísticas y filtros
- ✅ Implementado sistema de edición de opiniones después de publicarlas
- ✅ Agregada calificación visible en detalle de producto con promedio y número de reseñas
- ✅ Implementado OCR real con Tesseract.js para escaneo de tarjetas bancarias
- ✅ Mejorado sistema de opiniones: solo se pueden calificar productos ordenados y pagados
- ✅ Agregado ordenamiento por relevancia en búsqueda de solicitudes