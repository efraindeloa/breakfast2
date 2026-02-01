# 📋 Especificaciones Funcionales

## Visión General

Este documento describe todas las funcionalidades del sistema Breakfast App, incluyendo flujos, reglas de negocio, restricciones y comportamientos esperados.

---

## 1. Autenticación y Registro

### 1.1 Pantalla de Bienvenida (`WelcomeScreen`)
**Ruta**: `/`

#### Funcionalidades
- Selección de idioma inicial (Español, Inglés, Portugués, Francés)
- Botón de inicio de sesión (simulado actualmente)
- Botón de registro

#### Reglas de negocio
- El idioma seleccionado se guarda en `localStorage`
- Al iniciar sesión, se marca `isAuthenticated = true`
- Solo usuarios autenticados pueden acceder a las funcionalidades principales

### 1.2 Registro (`RegisterScreen`)
**Ruta**: `/register`

#### Funcionalidades
- Formulario de registro (simulado)
- Validación de campos
- Redirección a pantalla principal tras registro exitoso

#### Reglas de negocio
- Todos los campos son obligatorios
- El email debe tener formato válido
- Tras registro exitoso, usuario queda autenticado

---

## 2. Navegación Principal

### 2.1 Navegación Inferior (`BottomNav`)
**Componente global** que aparece en todas las pantallas autenticadas

#### Opciones de navegación
1. **Inicio** (`/home`)
2. **Menú** (`/menu`)
3. **Mi Orden** (`/orders`)
4. **Favoritos** (`/favorites`)
5. **Perfil** (`/profile`)

#### Reglas de negocio
- Solo visible cuando `isAuthenticated === true`
- Muestra badge con cantidad de items en carrito
- Indicador visual de la ruta actual activa

### 2.2 Navegación Superior (`TopNavbar`)
**Componente reutilizable** que aparece en pantallas autenticadas principales

#### Funcionalidades
- **Avatar del usuario**: Muestra avatar o iniciales del usuario, navega a perfil al hacer click
- **Título personalizable**: Muestra título de la pantalla o mensaje de bienvenida
- **Botón de notificaciones**: Acceso a notificaciones (funcionalidad futura)
- **Botón de favoritos**: Acceso rápido a favoritos (puede ocultarse con prop `showFavorites={false}`)
- **Botón de perfil**: Acceso rápido a perfil
- **Botón de retroceso**: Opcional, se muestra con prop `showBackButton={true}`

#### Reglas de negocio
- Visible en pantallas principales autenticadas
- El botón de favoritos se oculta en `HomeScreen`, `OrderScreen` y `PaymentMethodsScreen`
- Los botones cambian de estado visual cuando la ruta actual coincide con su destino
- El avatar muestra iniciales si no hay imagen de perfil configurada

### 2.2 Botón de Asistente (`AssistantButton`)
**Componente global** flotante

#### Funcionalidades
- Botón flotante con icono de asistente
- Modal con interfaz de chat para asistente IA
- Recomendaciones basadas en preferencias del usuario

#### Reglas de negocio
- Visible en todas las pantallas autenticadas
- Posicionado en esquina inferior derecha
- Se puede minimizar/maximizar

---

## 3. Pantalla de Inicio (`HomeScreen`)
**Ruta**: `/home`

### 3.1 Acciones Rápidas

#### Escanear QR
- **Ruta**: `/qr-scanner`
- **Descripción**: Permite escanear código QR de la mesa
- **Funcionalidad**: Inicia el escáner de cámara para leer códigos QR

#### Ver Menú
- **Ruta**: `/menu`
- **Descripción**: Acceso directo al menú completo

#### Unirse a Mesa
- **Ruta**: `/join-table`
- **Descripción**: Ingreso manual de código de mesa o escaneo QR

---

## 4. Menú y Productos

### 4.1 Pantalla de Menú (`MenuScreen`)
**Ruta**: `/menu`

#### Funcionalidades principales

##### Búsqueda
- Campo de búsqueda que filtra platillos por nombre
- Búsqueda en tiempo real mientras se escribe

##### Filtros por categoría
- **Entradas** (`appetizers`)
- **Platos Fuertes** (`main_courses`)
- **Postres** (`desserts`)
- **Bebidas** (`drinks`)
- **Coctelería** (`cocktails`)

##### Filtros por tipo (dentro de categorías)
- **Entradas**: Frías, Calientes
- **Platos Fuertes**: Proteínas (Pollo, Res, Cerdo, Pescado, Vegetariano)
- **Bebidas**: Calientes, Frías, Naturales
- **Coctelería**: Origen (Ron, Vodka, Tequila, Gin)

##### Sugerencias del Chef
- Sección destacada con platillos recomendados por el chef
- IDs configurados en `chefSuggestions`
- Máximo 4 sugerencias mostradas

##### Destacados del Día
- Sección con platillos destacados
- IDs configurados en `todayHighlights`
- Máximo 4 destacados mostrados

##### Cards de Productos
- **Información mostrada**:
  - Nombre del platillo
  - Descripción con precios (especialmente para bebidas con opciones)
  - Imagen del producto
  - Precio
  - Indicador si está en carrito (botón informativo)

- **Interacciones**:
  - Click en card: Navega a detalle del producto (`/dish/:id`)
  - Botón de agregar: Solo informativo (muestra cantidad en carrito)

#### Reglas de negocio
- Los platillos se agrupan por categoría
- Las sugerencias y destacados aparecen al inicio
- El carrito persiste en `CartContext`
- Los filtros se pueden combinar (categoría + tipo)
- **Preservación de estado**: Al navegar al detalle de un producto, se guarda la categoría seleccionada y la posición de scroll
- **Restauración de estado**: Al regresar del detalle, se restaura automáticamente la categoría y posición de scroll anteriores

### 4.2 Detalle de Producto (`DishDetailScreen`)
**Ruta**: `/dish/:id`

#### Funcionalidades

##### Información del producto
- Imagen grande del platillo
- Nombre y descripción
- Precio base o rango de precios

##### Selección de tamaño (para bebidas)
- Radio buttons para "Porción/Copa" o "Botella"
- Precios diferentes según selección
- Solo disponible si el producto tiene opciones de tamaño

##### Selección de proteínas (para platos fuertes)
- Opciones disponibles según el platillo
- Checkboxes para selección múltiple
- Cada proteína puede tener precio adicional

##### Cantidad
- Botones +/- para incrementar/decrementar
- Valor mínimo: 1
- Valor máximo: 99 (o según restricción)

##### Notas especiales
- Campo de texto libre
- Máximo de caracteres: 500
- Placeholder con sugerencias

##### Botón "Agregar a Orden"
- Agrega el producto al carrito con todas las opciones seleccionadas
- Si hay opciones de tamaño, el precio se calcula según selección
- Muestra confirmación visual

##### Botón "Dejar Opinión"
- Navega a `/review` con contexto del producto
- Disponible para dejar opinión sobre este producto específico

#### Reglas de negocio
- El precio se calcula dinámicamente según opciones
- Si no se selecciona tamaño (cuando aplica), se usa el precio base o porción
- Los items en el carrito se agrupan si tienen las mismas notas
- Las proteínas seleccionadas se incluyen en las notas
- **Scroll automático**: Al cargar la página, se desplaza automáticamente al inicio
- **Navegación preservada**: Al regresar al menú, se mantiene la categoría y posición de scroll anteriores

---

## 5. Carrito y Orden

### 5.1 Contexto de Carrito (`CartContext`)

#### Funcionalidades
- **`addToCart`**: Agrega item al carrito
- **`removeFromCart`**: Elimina item del carrito
- **`updateCartItemQuantity`**: Actualiza cantidad de un item
- **`updateCartItemNotes`**: Actualiza notas de un item
- **`clearCart`**: Vacía el carrito
- **`getCartItemCount`**: Retorna total de items

#### Reglas de negocio
- Items con mismo ID y mismas notas se agrupan (incrementan cantidad)
- Items con mismo ID pero diferentes notas son items separados
- El carrito persiste durante la sesión
- El carrito se limpia después de confirmar orden

### 5.2 Pantalla de Orden (`OrderScreen`)
**Ruta**: `/orders`

#### Funcionalidades

##### Lista de items en carrito
- Muestra todos los items agregados
- Información mostrada:
  - Nombre del producto
  - Notas (proteínas, tamaño, notas especiales)
  - Cantidad con botones +/- para modificar
  - Precio unitario
  - Precio total del item

##### Modificación de items
- Editar cantidad
- Editar notas
- Eliminar item

##### Resumen de orden
- Subtotal
- Propina (opcional, porcentaje configurable)
- Total

##### Botón "Confirmar Orden"
- Valida que haya items en el carrito
- Crea la orden
- Redirige a pantalla de confirmación

#### Reglas de negocio
- Orden mínima: Al menos 1 item
- Propina es opcional (0%, 10%, 15%, 20%)
- El total se calcula: Subtotal + Propina
- Tras confirmar, el carrito se limpia

---

## 6. Pedidos en Grupo

### 6.1 Unirse a Mesa (`JoinTableScreen`)
**Ruta**: `/join-table`

#### Funcionalidades

##### Ingreso de código
- Campo de texto para código de mesa
- Botón "Unirme a la Mesa"
- Botón "Escanear QR" que navega a `/qr-scanner`

#### Reglas de negocio
- El código debe tener formato válido (validación básica)
- Tras unirse, el usuario queda asociado a la orden grupal
- El código puede ingresarse manualmente o por escaneo QR

### 6.2 Escáner QR (`QRScannerScreen`)
**Ruta**: `/qr-scanner`

#### Funcionalidades
- Acceso a cámara del dispositivo
- Frame visual que indica área de escaneo
- Lectura automática de códigos QR
- Navegación automática a `/join-table` con código escaneado

#### Reglas de negocio
- Requiere permisos de cámara
- Si no hay cámara o permisos denegados, muestra mensaje de error
- El código escaneado se pasa como `location.state.scannedCode`
- El área de escaneo visual coincide con el área real de escaneo

### 6.3 Contexto de Pedidos en Grupo (`GroupOrderContext`)

#### Funcionalidades
- Gestión de orden grupal
- Invitación de usuarios
- División de cuenta
- Estado de la orden grupal

#### Reglas de negocio
- Un usuario puede estar en una orden grupal a la vez
- El creador de la orden es el administrador
- Los participantes pueden agregar items a la orden
- La cuenta se divide automáticamente entre participantes

---

## 7. Pagos

### 7.1 Métodos de Pago (`PaymentMethodsScreen`)
**Ruta**: `/payments`

#### Funcionalidades
- Lista de tarjetas guardadas
- Agregar nueva tarjeta
- Seleccionar método de pago
- Procesar pago

#### Reglas de negocio
- Se puede tener múltiples tarjetas guardadas
- Solo se muestran últimos 4 dígitos por seguridad
- Requiere validación antes de procesar

### 7.2 Agregar Tarjeta (`AddCardScreen`)
**Ruta**: `/add-card`

#### Funcionalidades
- Formulario para datos de tarjeta
- Validación de número de tarjeta (Luhn)
- Validación de fecha de expiración
- Validación de CVV

#### Reglas de negocio
- Todos los campos son obligatorios
- Número de tarjeta: 13-19 dígitos
- CVV: 3-4 dígitos
- Fecha de expiración: Debe ser futura

### 7.3 Éxito de Pago (`PaymentSuccessScreen`)
**Ruta**: `/payment-success`

#### Funcionalidades
- Confirmación visual de pago exitoso
- Detalles de la transacción
- Opción de ver recibo
- Navegación a home o historial

---

## 8. Perfil y Configuración

### 8.1 Perfil (`ProfileScreen`)
**Ruta**: `/profile`

#### Funcionalidades
- Información del usuario
- Historial de órdenes
- Transacciones
- Configuración de datos fiscales
- Configuración de correo electrónico

#### Opciones disponibles
- Ver historial de órdenes
- Ver transacciones
- Configurar datos fiscales
- Configurar correo para recibos
- Configuración de la aplicación

### 8.2 Configuración (`SettingsScreen`)
**Ruta**: `/settings`

#### Funcionalidades

##### Idioma
- Selector de idioma
- Opciones: Español, Inglés, Portugués, Francés
- Cambio inmediato

##### Modo Oscuro/Claro
- Toggle para alternar tema
- Persiste en `localStorage`

##### Configuración de IA
- Smart Translation (traducción automática)
- Mostrar sugerencias (basadas en preferencias)
- Mostrar destacados

##### Configuración del Restaurante
- Datos fiscales (RFC, razón social)
- Email para recibos

#### Reglas de negocio
- Los cambios de idioma se aplican inmediatamente
- El tema se persiste entre sesiones
- Las configuraciones de IA son opcionales

---

## 9. Historial y Transacciones

### 9.1 Historial de Órdenes (`OrderHistoryScreen`)
**Ruta**: `/order-history`

#### Funcionalidades
- Lista de órdenes completadas
- Filtro por estado (Completadas, Canceladas)
- Detalle de cada orden
- Opción de dejar opinión

#### Información mostrada
- Fecha y hora
- Total
- Estado
- Número de items
- Botón "Dejar Opinión" (solo para órdenes completadas)

### 9.2 Transacciones (`TransactionsScreen`)
**Ruta**: `/transactions`

#### Funcionalidades
- Lista de transacciones de pago
- Filtro por tipo
- Detalle de transacción
- Exportar o compartir recibo

### 9.3 Detalle de Orden (`OrderDetailScreen`)
**Ruta**: `/order-detail`

#### Funcionalidades
- Información completa de la orden
- Estado actual
- Items ordenados
- Total pagado
- Tiempo estimado de entrega
- Botón "Modificar mi orden" (si la orden está en estado `orden_enviada` o `orden_recibida`)
- Botón "Agregar Orden Complementaria" (si hay una orden enviada activa)

#### Reglas de negocio
- Solo se puede modificar una orden si está en estado `orden_enviada` o `orden_recibida`
- Solo aparece si `config.allowOrderModification` está habilitado
- Se pueden agregar órdenes complementarias mientras hay una orden activa

### 9.4 Editar Orden (`EditOrderScreen`)
**Ruta**: `/edit-order?orderId={id}`

#### Funcionalidades

##### Carga de orden
- Carga los items de la orden en el carrito
- Muestra las cantidades exactas de la orden original
- Agrupa items por ID y notas para visualización correcta

##### Banner informativo
- Indica que se puede editar hasta que la cocina acepte la orden
- Advertencia sobre variaciones de precio según modificaciones

##### Lista de items
- Muestra todos los items de la orden con:
  - Imagen del producto (usando imágenes locales actualizadas)
  - Nombre del producto
  - Precio unitario
  - Notas especiales (si tiene)
  - Controles de cantidad (+/-)
  - Botón de eliminar
- **Estado vacío**: Si no hay items, muestra mensaje y botón para agregar items
- **Botón "Agregar más items"**: Permite navegar al menú para agregar productos adicionales a la orden

##### Modificación de items
- **Incrementar cantidad**: Botón "+" incrementa la cantidad
- **Decrementar cantidad**: Botón "-" decrementa la cantidad
- **Eliminar item**: Botón de eliminación remueve completamente el item
- **Editar notas**: Las notas de último minuto se pueden agregar

##### Notas de último minuto
- Campo de texto para agregar notas adicionales
- Se aplican a toda la orden
- Placeholder con ejemplos

##### Total actualizado
- Calcula el total en tiempo real según las modificaciones
- Muestra "+ Impuestos incluidos"
- Se actualiza automáticamente al modificar items

##### Guardar cambios
- Botón "Guardar Cambios" actualiza la orden
- Actualiza el timestamp de la orden
- Navega de vuelta a `/order-detail`

#### Reglas de negocio
- Solo se puede editar si la orden está en estado `orden_enviada` o `orden_recibida`
- El timestamp se actualiza al guardar cambios
- Las cantidades deben coincidir exactamente con las de la orden original al cargar
- El total se calcula dinámicamente según las modificaciones
- Se puede eliminar completamente un item de la orden
- **Agregar items**: Los items agregados desde el menú se incluyen en la orden al guardar
- **Imágenes**: Las imágenes de los productos se obtienen de la lista completa de platillos (`allDishes`)

---

## 10. Favoritos

### 10.1 Pantalla de Favoritos (`FavoritesScreen`)
**Ruta**: `/favorites`

#### Funcionalidades
- **Tabs de navegación**: Platillos, Combinaciones, Promociones
- **Lista de platillos marcados como favoritos**: Muestra todos los platillos favoritos con imagen, nombre y descripción traducidos
- **Lista de combinaciones guardadas**: Muestra combinaciones personalizadas guardadas
- **Lista de promociones favoritas**: Muestra todas las promociones marcadas como favoritas
- **Agregar/eliminar favoritos**: Botones para gestionar favoritos en cada sección
- **Navegación a detalle**: Click en cualquier item navega a su detalle

#### Reglas de negocio
- Los favoritos persisten en `localStorage`
- Un platillo puede estar o no en favoritos
- Las promociones pueden marcarse como favoritas desde `PromotionsScreen` y `PromotionDetailScreen`
- Se pueden eliminar individualmente desde la pantalla de favoritos
- Las traducciones se aplican correctamente a los nombres y descripciones de platillos favoritos

### 10.2 Contexto de Favoritos (`FavoritesContext`)

#### Funcionalidades
- **`addToFavorites`**: Agrega producto a favoritos
- **`removeFromFavorites`**: Elimina producto de favoritos
- **`isFavorite`**: Verifica si un producto es favorito
- **`getFavorites`**: Obtiene lista de favoritos
- **`addFavoritePromotion`**: Agrega promoción a favoritos
- **`removeFavoritePromotion`**: Elimina promoción de favoritos
- **`isPromotionFavorite`**: Verifica si una promoción es favorita
- **`favoritePromotions`**: Lista de promociones favoritas

#### Almacenamiento
- **Platillos favoritos**: `localStorage` con clave `favorites` (array de IDs)
- **Promociones favoritas**: `localStorage` con clave `favoritePromotions` (array de objetos `FavoritePromotion`)

---

## 11. Sistema de Opiniones

### 11.1 Pantalla de Opiniones (`ReviewScreen`)
**Ruta**: `/review`

#### Funcionalidades

##### Selección de Tipo de Opinión
- **Experiencia General**: Opinión general sobre el restaurante/orden
- **Producto Específico**: Opinión sobre un producto individual de la orden
- Selector horizontal con cards scrollables
- Indicador visual de selección (check_circle)
- Badge "Revisado" para productos ya calificados
- Badge "Personalizado" para productos con modificaciones
- Badge "Tradicional" para productos sin modificaciones

##### Calificación por estrellas
- 5 estrellas interactivas (tamaño grande: text-5xl)
- Hover para previsualizar
- Click para seleccionar
- Etiqueta descriptiva centrada debajo de las estrellas
- Texto de calificación (ej: "4.0 - ¡Muy bueno!")

##### Chips de selección rápida
- Opciones predefinidas según tipo de opinión:
  - **Experiencia**: Excelente servicio, Comida deliciosa, Ambiente agradable, Café perfecto, Rápida atención
  - **Producto**: Excelente servicio, Comida deliciosa, Temperatura perfecta, Buena porción, Bien presentado
- Búsqueda/autocompletado para encontrar opciones
- Agregar opciones personalizadas
- Selección múltiple con estilo rounded-full
- Chips seleccionados con fondo `#fef3e2` y borde primario

##### Campo de comentarios
- Textarea libre con estilo rounded-2xl
- Placeholder con sugerencias
- Máximo de caracteres: 1000

##### Subida de fotos/videos
- Hasta 5 archivos
- Grid de 4 columnas, aspect-square
- Las fotos se muestran en el lugar del botón de agregar
- El siguiente espacio disponible muestra el botón de agregar
- Preview de imágenes
- Indicador de cantidad seleccionada (X / 5)
- Toggle para vincular fotos a un producto específico (solo para opiniones de productos)

##### Publicar opinión
- Botón para publicar
- Validación: Requiere al menos calificación
- Permite editar opiniones existentes

##### Edición de Opiniones
- Botón "Editar Opiniones" en historial de órdenes
- Carga datos existentes en el formulario
- Actualiza la opinión existente en lugar de crear nueva
- Muestra timestamp original y fecha de actualización

#### Reglas de negocio
- Solo se pueden calificar productos que se ordenaron y pagaron
- La calificación es obligatoria (1-5 estrellas)
- Los chips son opcionales
- El comentario es opcional
- Máximo 5 archivos multimedia
- Tipos permitidos: image/*, video/*
- Tamaño máximo por archivo: 10MB
- Cada producto puede tener su propia calificación independiente
- Al cambiar de producto seleccionado, se limpian todos los campos
- Si un producto ya tiene calificación, se cargan los datos al seleccionarlo
- Las opiniones se guardan en `localStorage` con la clave `user_reviews`
- Cada opinión incluye: id, orderId, type, itemId, itemName, rating, chips, comment, media, timestamp, updatedAt

#### Contextos de uso
- **Producto individual**: Se puede acceder desde detalle de producto (botón removido, solo ver opiniones)
- **Orden completa**: Se puede acceder desde historial de órdenes después del pago
- **Restaurante**: Se puede acceder desde perfil (próximamente)

### 11.2 Pantalla de Opiniones Verificadas (`ProductReviewsScreen`)
**Ruta**: `/product-reviews/:dishId`

#### Funcionalidades

##### Estadísticas del Producto
- **Calificación Promedio**: Número grande (ej: 4.8) con formato decimal
- **Total de Reseñas**: Contador de reseñas (ej: "1,245 reseñas")
- **Distribución por Estrellas**: Barras de progreso mostrando porcentaje de cada calificación (5, 4, 3)
- Fondo especial: `#fffcf5` con borde primario

##### Filtros
- **Más Recientes**: Ordena por fecha más reciente (por defecto)
- **Con Foto**: Solo muestra reseñas que incluyen fotos/videos
- **Modificados**: Solo muestra reseñas que fueron editadas
- Botones horizontales scrollables
- Indicador visual del filtro activo (fondo primario)

##### Lista de Opiniones
- **Información del Usuario**:
  - Avatar (imagen o gradiente por defecto)
  - Nombre del usuario (actualmente muestra ID corto del review)
  - Badge "Verificado" (azul) con icono verified
  - Fecha relativa (Hoy, Ayer, Hace X días) o fecha completa
  - Indicador "Modificado" si fue editada
- **Calificación**: Estrellas llenas según rating
- **Comentario**: Texto completo de la opinión
- **Chips**: Chips de características destacadas (si aplica)
- **Media**: Grid horizontal de fotos/videos (si aplica)
- **Footer**:
  - Botones de likes y comentarios (contadores)
  - Indicador "Traducido por IA" cuando aplica

#### Reglas de negocio
- Solo muestra opiniones verificadas del producto específico
- Filtra por `itemId` que coincida con el `dishId` de la URL
- Ordena según el filtro activo
- Si no hay opiniones, muestra mensaje informativo
- Accesible desde `DishDetailScreen` mediante botón o clic en número de reseñas

### 11.3 Calificación en Detalle de Producto (`DishDetailScreen`)

#### Funcionalidades
- **Calificación Promedio**: Estrellas llenas según promedio redondeado
- **Promedio Numérico**: Número con 1 decimal (ej: 4.8)
- **Número de Reseñas**: Texto clickeable con formato "(X reseña/reseñas)"
- Ubicado debajo del nombre del producto

#### Reglas de negocio
- Calcula el promedio de todas las reviews del producto
- Solo se muestra si el producto tiene al menos una review
- El número de reseñas es un botón que navega a `/product-reviews/:id`
- Actualización en tiempo real al guardar nuevas reviews

---

## 12. Datos Fiscales

### 12.1 Datos Fiscales (`BillingDataScreen`)
**Ruta**: `/billing-step-1`

#### Funcionalidades
- Formulario de datos fiscales
- Selección de régimen fiscal
- Selección de uso de CFDI

#### Campos
- RFC
- Razón social
- Régimen fiscal (dropdown)
- Uso de CFDI (dropdown)

### 12.2 Subir Constancia (`UploadConstanciaScreen`)
**Ruta**: `/billing-step-2`

#### Funcionalidades
- Subir constancia de situación fiscal
- Preview del documento
- Validación de formato

### 12.3 Configuración de Email (`EmailConfigScreen`)
**Ruta**: `/billing-step-3`

#### Funcionalidades
- Configurar email para recibos fiscales
- Validación de formato de email

### 12.4 Confirmación (`ConfirmationScreen`)
**Ruta**: `/billing-step-4`

#### Funcionalidades
- Resumen de datos fiscales configurados
- Confirmación final

---

## 13. Internacionalización

### 13.1 Idiomas Soportados
- **Español** (es) - Por defecto
- **Inglés** (en)
- **Portugués** (pt)
- **Francés** (fr)

### 13.2 Archivos de Traducción
- `locales/es.json`
- `locales/en.json`
- `locales/pt.json`
- `locales/fr.json`

### 13.3 Reglas de negocio
- Todos los textos deben estar en archivos JSON
- No debe haber texto hardcodeado en el código
- El idioma se persiste en `localStorage`
- El cambio de idioma es inmediato sin recargar

---

## 14. Configuración del Restaurante

### 14.1 Configuración (`restaurantConfig.ts`)

#### Banderas de funcionalidad
- **`allowOrderModification`**: Permite modificar órdenes después de enviarlas
- **`allowCardPayment`**: Permite pagos con tarjeta
- **`allowInvoice`**: Permite solicitar factura fiscal

#### Reglas de negocio
- Estas configuraciones vienen del backend (futuro)
- Actualmente se definen en código
- Se pueden activar/desactivar para pruebas

---

## 15. Solicitud de Asistencia

### 15.1 Pantalla de Solicitud de Asistencia (`RequestAssistanceScreen`)
**Ruta**: `/request-assistance`

#### Funcionalidades

##### Historial de Solicitudes
- Muestra todas las solicitudes realizadas durante la sesión
- Información mostrada:
  - Icono de la solicitud
  - Nombre/descripción de la solicitud
  - Hora de envío (formato HH:MM)
  - Badge "Personalizada" si es una solicitud creada dinámicamente
  - Estado "Enviada" con check verde
- Contador de solicitudes en el header
- Scroll automático si hay muchas solicitudes (máximo 48 de altura)

##### Botón "Solicitar Asistencia Personalizada"
- Botón destacado con fondo primario y texto blanco
- Ubicado después del historial y antes del campo de búsqueda
- Permite solicitar que se acerque un mesero personalmente
- Se deshabilita temporalmente después de hacer clic (3 segundos)
- Icono: `person`

##### Campo de Búsqueda
- Campo de texto para buscar solicitudes
- Filtrado en tiempo real mientras se escribe
- Busca en:
  - El nombre del botón
  - Las palabras clave asociadas a cada solicitud
- Botón para limpiar la búsqueda

##### Grid de Botones de Solicitudes
- Grid de 2 columnas con botones de solicitudes disponibles
- Botones predefinidos:
  - **Cubiertos y Vasos**: `restaurant`
  - **Servilletas**: `inventory`
  - **Limpiar Derrame (Mesa)**: `cleaning_services`
  - **Limpiar Derrame (Piso)**: `cleaning_services`
  - **Tortillas**: `lunch_dining`
  - **Bolillo**: `bakery_dining`
  - **Picante**: `local_fire_department`

##### Filtrado Fuzzy (Búsqueda Difusa)
- Al escribir en el campo de búsqueda, se filtran los botones usando búsqueda difusa
- **Funcionalidades de búsqueda fuzzy**:
  - **Normalización**: Elimina acentos y convierte a minúsculas
  - **Coincidencia exacta**: Encuentra coincidencias exactas del texto
  - **Coincidencia de subcadena**: Encuentra coincidencias parciales
  - **Coincidencia por palabras**: Todas las palabras del query deben aparecer en algún lugar
  - **Coincidencia parcial de caracteres**: Permite errores menores de tipeo (≥70% de caracteres coinciden en orden)
  - **Coincidencia de caracteres consecutivos**: Busca secuencias de caracteres en orden
- **Ordenamiento por relevancia**: Los resultados se ordenan por score de relevancia (mayor score primero)
- **Score de relevancia**:
  - Coincidencia exacta en label: 100 puntos
  - Coincidencia al inicio del label: 80 puntos
  - Coincidencia en label: 50 puntos
  - Coincidencia exacta en keyword: 60 puntos
  - Coincidencia en keyword: 30 puntos
- Ejemplos:
  - Escribir "Derrame" muestra solo "Limpiar Derrame (Mesa)" y "Limpiar Derrame (Piso)"
  - Escribir "deram" (error de tipeo) también encuentra "Derrame"
  - Escribir "Vaso" muestra "Cubiertos y Vasos"
  - Escribir "Servilleta" muestra "Servilletas"
  - Escribir "cubier" encuentra "Cubiertos y Vasos"

##### Creación de Solicitudes Personalizadas
- Si no hay coincidencias en la búsqueda, aparece un botón para crear solicitud personalizada
- El botón muestra:
  - Icono genérico `priority_high` (!)
  - El texto que el comensal escribió como título
- Al hacer clic, se crea y envía la solicitud personalizada
- El botón se marca temporalmente como "Solicitado" por 3 segundos

##### Estados Visuales
- **Normal**: Botón blanco/gris con borde, hover muestra borde primario
- **Solicitado**: Fondo primario claro, borde primario, icono en fondo primario sólido con texto blanco, badge "Solicitado" con check
- **Deshabilitado**: Opacidad reducida, cursor no permitido

#### Reglas de negocio
- Las solicitudes se guardan en `localStorage` con la clave `assistance_history`
- El historial persiste durante la sesión del comensal
- El historial se limpia automáticamente cuando se completa el pago
- Los botones se deshabilitan temporalmente (3 segundos) después de hacer clic para evitar solicitudes duplicadas
- El campo de búsqueda se limpia después de crear una solicitud personalizada (después de 3 segundos)
- Las solicitudes personalizadas se identifican con el badge "Personalizada" en el historial

#### Palabras Clave para Búsqueda

##### Cubiertos y Vasos
- `cubiertos`, `vasos`, `cuchara`, `tenedor`, `cuchillo`, `vidrio`, `utensilios`, `cutlery`, `glasses`, `utensils`

##### Servilletas
- `servilletas`, `servilleta`, `napkins`, `napkin`, `papel`

##### Derrame (Mesa)
- `derrame`, `mesa`, `table`, `spill`, `limpiar`, `clean`, `líquido`, `derramado`, `accidente`

##### Derrame (Piso)
- `derrame`, `piso`, `floor`, `suelo`, `spill`, `limpiar`, `clean`, `líquido`, `derramado`, `accidente`

##### Tortillas
- `tortillas`, `tortilla`

##### Bolillo
- `bolillo`, `pan`, `bread`, `roll`, `bollo`

##### Picante
- `picante`, `salsa`, `sauce`, `spicy`, `chile`, `chili`, `condimento`

##### Llamar Mesero
- `mesero`, `camarero`, `waiter`, `servidor`, `servicio`, `atención`, `ayuda`, `help`, `asistencia`

---

## 16. Lista de Espera (Waitlist)

### 16.1 Pantalla de Lista de Espera (`WaitlistScreen`)
**Ruta**: `/waitlist`

#### Funcionalidades

##### Acceso a Lista de Espera
- Se accede mediante escaneo de código QR desde `/home`
- También se puede navegar directamente a `/waitlist`

##### Selección de Zona
- **Zonas disponibles**:
  - Interior
  - Terraza
  - Jardín
  - Patio
  - Rooftop
- Algunas zonas pueden estar deshabilitadas por el restaurante
- Zonas deshabilitadas muestran aviso explicativo

##### Selección de Número de Personas
- Selector numérico para elegir cantidad de personas
- Rango: 1 a máximo configurado

##### Información de la Lista
- Muestra cantidad de mesas en lista de espera por zona
- Indica la posición en la lista donde se colocará al usuario
- Muestra timestamp del momento del escaneo (hasta confirmar)
- Formato de hora: 12 horas (AM/PM)

##### Confirmación de Solicitud
- Botón "Confirmar solicitud"
- Al confirmar, se agrega a la lista de espera
- Se actualiza el estado a "confirmado"

##### Estado Inicial (Primeros 10 segundos)
- Diseño simple con información básica
- Muestra saludo personalizado
- Muestra turno y posición
- Tarjeta grande con número de turno
- Estadísticas de espera (tiempo estimado, mesas por delante)
- Botones para cambiar zona y cancelar

##### Estado de Progreso (Después de 10 segundos)
- Diseño más elaborado con:
  - Header con badge "Ingreso por QR"
  - Banner animado indicando que la mesa casi está lista
  - Barra de progreso con porcentaje avanzado
  - Estadísticas detalladas (mesas antes, tiempo estimado)
  - Botón destacado "Ver Menú y Armar Pedido"
  - Botones para cambiar zona y cancelar espera
  - Imagen del restaurante con información de ubicación

##### Cambio de Zona
- Opción para cambiar de zona
- Muestra advertencia sobre perder el lugar actual
- Indica que se agregará al final de la nueva lista
- Actualiza el timestamp al cambiar de zona
- Muestra modal de confirmación

##### Cancelación de Solicitud
- Opción para cancelar la solicitud
- Muestra advertencia sobre perder el lugar
- Requiere confirmación
- Al cancelar, se remueve de la lista de espera

##### Actualización en Tiempo Real
- La lista se actualiza automáticamente cada intervalo de tiempo
- Simula avance de la lista de espera
- Actualiza posiciones y tiempos estimados

#### Reglas de negocio
- Solo se puede editar la solicitud antes de confirmar
- Una vez confirmada, se muestra el progreso
- El nuevo diseño aparece después de 10 segundos de confirmación
- Las zonas deshabilitadas no se pueden seleccionar
- Al cambiar de zona, se pierde el lugar en la zona actual
- La posición en la lista se calcula según la zona seleccionada
- El timestamp se muestra solo hasta confirmar la solicitud
- El timestamp se actualiza al cambiar de zona

---

## 17. Reservaciones (Reservations)

### 17.1 Pantalla de Reservaciones (`ReservationsRestaurantScreen`)
**Ruta**: `/reservations`

#### Funcionalidades

##### Modal de Bienvenida
- Aparece al entrar a la pantalla
- Título: "Hacer una reservación"
- Mensaje explicativo sobre completar las preguntas
- Botón "Continuar" para cerrar el modal

##### Selección de Fecha (Obligatorio)
- Calendario mensual interactivo
- Navegación entre meses (anterior/siguiente)
- Indicador visual del día seleccionado
- Indicador del día actual
- Pregunta: "¿Qué día quieres reservar?"

##### Selección de Hora (Obligatorio)
- Selector de hora personalizado con diseño de reloj
- Incremento/decremento de horas (1-12)
- Incremento/decremento de minutos (00, 15, 30, 45)
- Selector AM/PM
- Formato de visualización: 12 horas (AM/PM)
- Valor por defecto: 00:00
- Pregunta: "¿A qué hora llegas?"

##### Número de Personas (Obligatorio)
- Selector con botones de incremento/decremento
- Rango: 0 a 20 personas
- Valor por defecto: 0
- Etiqueta: "Personas"

##### Selección de Zona (Obligatorio)
- Opciones: Interior, Terraza, Jardín
- Grid de 3 columnas con iconos
- Ninguna zona seleccionada por defecto
- Pregunta: "Selecciona la Zona"

##### Ocasión Especial (Opcional)
- Botones de selección: Cumpleaños, Aniversario, Negocios, Cita
- Se puede seleccionar/deseleccionar
- Etiqueta: "(opcional)"

##### Preferencias de Mesa (Opcional)
- Textarea para escribir preferencias
- Placeholder con ejemplos
- Etiqueta: "(opcional)"

##### Pedido Anticipado (Opcional)
- Lista de productos destacados
- Botón para agregar productos al pedido anticipado
- Contador de cantidad por producto
- Botón "Ver el menú completo"
- Etiqueta: "(opcional)"

##### Botón de Confirmación
- Aparece solo cuando se completan los campos obligatorios:
  - Fecha seleccionada
  - Hora seleccionada (diferente de 00:00)
  - Número de personas > 0
  - Zona seleccionada
- Texto: "Solicitar reservación"
- Estado de carga mientras se guarda
- Ubicado antes de la sección de Pedido Anticipado

##### Visualización Progresiva
- Las secciones aparecen progresivamente según se completan las anteriores
- Animación de fade-in (500ms) al mostrar cada sección
- Después de seleccionar zona, se muestran todas las secciones opcionales

#### Reglas de negocio
- Los campos obligatorios deben completarse antes de mostrar el botón de confirmación
- La fecha debe ser seleccionada explícitamente (no solo inicializada)
- La hora debe ser diferente de 00:00
- El número de personas debe ser mayor que 0
- La zona debe estar seleccionada
- Los campos opcionales no bloquean la creación de la reservación
- Al confirmar, se guarda la reservación en la base de datos
- Los items del pedido anticipado se agregan al carrito después de crear la reservación
- La reservación se crea con estado `pending` por defecto
- Se navega al home después de crear la reservación exitosamente

#### Estados de Reservación
- `pending`: Pendiente de confirmación por el restaurante
- `confirmed`: Confirmada por el restaurante
- `cancelled`: Cancelada
- `completed`: Completada (el comensal asistió)
- `no_show`: El comensal no asistió

#### Almacenamiento
- **Base de datos**: Tabla `reservations` en Supabase PostgreSQL
- **Campos guardados**:
  - `user_id`: ID del usuario que hace la reservación
  - `restaurant_id`: ID del restaurante
  - `reservation_date`: Fecha de la reservación (DATE)
  - `reservation_time`: Hora de la reservación (TIME)
  - `number_of_people`: Número de personas
  - `zone`: Zona seleccionada
  - `special_occasion`: Ocasión especial (opcional)
  - `table_preferences`: Preferencias de mesa (opcional)
  - `advance_order_items`: Items del pedido anticipado (JSONB)
  - `status`: Estado de la reservación

---

## 18. Restricciones y Validaciones

### 17.1 Autenticación
- Todas las pantallas principales requieren autenticación
- Si no está autenticado, redirige a `/`
- Las pantallas de facturación no requieren autenticación (flujo independiente)

### 17.2 Carrito
- Mínimo 1 item para confirmar orden
- Máximo 99 unidades por item (o según restricción)
- El carrito se limpia después de confirmar orden

### 17.3 Pagos
- Requiere método de pago válido
- Validación de datos de tarjeta antes de procesar
- Transacciones se guardan en historial

### 17.4 Opiniones
- Calificación es obligatoria
- Comentario es opcional
- Máximo 5 archivos multimedia
- Tamaño máximo por archivo: 10MB

### 17.5 Datos Fiscales
- RFC debe tener formato válido
- Email debe tener formato válido
- Todos los campos son obligatorios

---

## 18. Estados de Órdenes

### 18.1 Estados Disponibles
1. **`orden_enviada`**: Orden enviada a cocina
2. **`orden_recibida`**: Orden recibida por cocina
3. **`en_preparacion`**: En proceso de preparación
4. **`lista_para_entregar`**: Lista para entregar al mesero
5. **`en_entrega`**: El mesero está entregando
6. **`entregada`**: Orden entregada al comensal
7. **`con_incidencias`**: Hay algún problema con la orden
8. **`orden_cerrada`**: Orden cerrada y pagada
9. **`cancelada`**: Orden cancelada

### 18.2 Transiciones de Estado
- Solo ciertas transiciones son válidas
- Las transiciones las gestiona el backend (futuro)
- El frontend muestra el estado actual

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.4  
**Responsable**: Equipo de desarrollo

### Cambios Recientes (Enero 2025)
- ✅ Agregada sección completa de Descubrir Restaurantes (17)
- ✅ Agregada sección completa de Punto de Encuentro (18)
- ✅ Agregada sección completa de Gestión de Contactos (19)
- ✅ Documentada integración con Leaflet y OpenStreetMap
- ✅ Documentada geolocalización con Capacitor Geolocation
- ✅ Documentado acceso a contactos del dispositivo con Capacitor Contacts
- ✅ Agregada funcionalidad para agregar más items en pantalla de edición de órdenes
- ✅ Mejora en preservación de categoría y scroll al navegar entre menú y detalle
- ✅ Scroll automático al inicio al abrir detalle de producto
- ✅ Corrección de carga de imágenes en pantalla de edición de órdenes
- ✅ Mejora en experiencia de navegación del menú
- ✅ Agregado componente `TopNavbar` reutilizable (2.2)
- ✅ Sistema de favoritos extendido para promociones (10.1, 10.2)
- ✅ Botones de favoritos en promociones (22.1, 22.2)

## 20. Programa de Lealtad

### 20.1 Pantalla de Lealtad (`LoyaltyScreen`)
**Ruta**: `/loyalty`

#### Funcionalidades
- Resumen de puntos totales con efecto glow
- Crecimiento mensual de puntos
- Visualización de nivel actual (Bronce, Plata, Oro, Platino)
- Barra de progreso hacia el siguiente nivel
- Lista horizontal scrollable de beneficios del nivel
- Sección "Cómo ganar más puntos" con tareas
- Integración en navegación inferior y perfil

#### Reglas de negocio
- Los puntos se acumulan por acciones del usuario
- Los niveles se calculan según puntos totales
- Los beneficios se muestran según el nivel actual
- Los datos se persisten en `localStorage` con clave `loyalty_data`

## 21. Cupones y Recompensas

### 21.1 Pantalla de Cupones (`CouponsScreen`)
**Ruta**: `/coupons`

#### Funcionalidades
- Saludo dinámico según hora del día (Buenos días, Buenas tardes, Buenas noches)
- Carousel horizontal de cupones con efecto de perforación
- Programa de referidos con código único
- Estadísticas de referidos (referidos, puntos ganados)
- Compartir código de referido (Web Share API)
- Integración en navegación inferior y perfil

### 21.2 Detalle de Cupón (`CouponDetailScreen`)
**Ruta**: `/coupon-detail/:id`

#### Funcionalidades
- Visualización ampliada del cupón
- QR code grande para mostrar al personal
- Instrucciones de uso del cupón
- Información del restaurante

## 22. Módulo de Promociones

### 22.1 Pantalla de Promociones (`PromotionsScreen`)
**Ruta**: `/promotions`

#### Funcionalidades
- Filtros por categoría (Desayuno, Temporada, Exclusivo VIP)
- Carousel horizontal de promociones principales
- Sección "Sugerencia de IA" con recomendación personalizada
- Grid de especiales de temporada
- **Botón de favoritos en cada promoción**: Permite marcar/desmarcar promociones como favoritas directamente desde la lista
- Integración en navegación inferior con badge de notificación

### 22.2 Detalle de Promoción (`PromotionDetailScreen`)
**Ruta**: `/promotion-detail/:id`

#### Funcionalidades
- Imagen principal grande con badge de categoría
- Título y subtítulo de la oferta
- Sección "Ahorro Real" con precios antes/después
- Contador regresivo en tiempo real
- Condiciones de aplicación (horarios, días)
- Lista de items incluidos
- Botón sticky "Aplicar a mi Orden"
- **Botón de favoritos**: Permite marcar/desmarcar la promoción como favorita

#### Reglas de negocio
- El contador regresivo se actualiza cada segundo
- Las condiciones se muestran según la promoción
- El botón "Aplicar" navega al menú con la promoción aplicada
- El botón de favoritos cambia de estado visual al marcar/desmarcar
- Las promociones favoritas se guardan en `localStorage` y aparecen en la pantalla de favoritos

## 23. Mesa Lista (Table Ready)

### 23.1 Pantalla de Mesa Lista (`TableReadyScreen`)
**Ruta**: `/table-ready`

#### Funcionalidades
- Detección automática cuando posición en lista de espera es 0 o 1
- Contador regresivo en tiempo real (minutos y segundos)
- Botón "¡Ya estoy aquí!" para confirmar asistencia
- Botón "Necesito 5 min más" para extender tiempo
- Visualización de zona de la mesa
- Diseño con gradiente breakfast-gradient

#### Reglas de negocio
- Se navega automáticamente desde `WaitlistScreen` cuando la mesa está lista
- El contador inicia en 5 minutos por defecto
- Se puede extender el tiempo agregando 5 minutos adicionales
- Los datos se persisten en `localStorage` con clave `tableReadyData`
- Al confirmar asistencia, se limpian los datos y se navega al menú

## 24. Pago Dividido (Split Payment)

### 24.1 Selección de Items (`SplitPaymentSelectionScreen`)
**Ruta**: `/split-payment-selection`

#### Funcionalidades
- Lista de todos los items de las órdenes activas
- Selección automática de items del usuario por defecto
- Selección/deselección de cualquier item
- Agrupación de items iguales para mejor visualización
- Badge "Tu item" en items del usuario
- Cálculo de subtotal en tiempo real
- Botón "Continuar" que se habilita solo si hay items seleccionados

#### Reglas de negocio
- En órdenes grupales, identifica items del usuario comparando con `currentUserParticipant.orderItems`
- En órdenes individuales, todos los items se consideran del usuario
- Cada item se identifica por `id`, `notes` y posición en la orden
- Los datos seleccionados se guardan en `localStorage` con clave `splitPaymentData`

### 24.2 Resumen y Pago (`SplitPaymentSummaryScreen`)
**Ruta**: `/split-payment-summary`

#### Funcionalidades
- Visualización de items seleccionados agrupados
- Cálculo de subtotal
- Cálculo de impuestos (16% IVA)
- Sistema de propina (porcentaje o cantidad fija)
- Selección de método de pago (efectivo o tarjeta)
- Visualización de tarjetas guardadas
- Opción para agregar nueva tarjeta
- Botón "Pagar ahora" con validación

#### Reglas de negocio
- Los impuestos se calculan sobre el subtotal
- La propina se calcula sobre el subtotal (antes de impuestos)
- El total incluye subtotal + impuestos + propina
- Se requiere seleccionar método de pago antes de pagar
- Si se selecciona tarjeta, se requiere seleccionar una tarjeta guardada

### 24.3 Integración con Pagos
- Botón "Dividir cuenta" en `PaymentMethodsScreen`
- Navegación a selección de items desde pantalla de pagos
- Integración con sistema de pagos existente

## 25. Asistente IA con Speech-to-Text

### 25.1 Reconocimiento de Voz (`AssistantModal`)
**Componente**: `components/AssistantModal.tsx`

#### Funcionalidades
- Reconocimiento de voz nativo con Capacitor Speech Recognition
- Reconocimiento de voz web con Web Speech API
- Detección automática de plataforma (nativo vs web)
- Solicitud de permisos de micrófono
- Indicador visual de estado de escucha
- Botón de micrófono en modal de asistente

#### Reglas de negocio
- En plataformas nativas (Android/iOS), usa `@capacitor-community/speech-recognition`
- En web, usa `SpeechRecognition` o `webkitSpeechRecognition`
- Requiere permisos de micrófono (`RECORD_AUDIO` en Android)
- Manejo robusto de errores y permisos denegados
- Los resultados se insertan automáticamente en el campo de texto

## 26. Funcionalidades para Restaurantes

### 26.1 Autenticación y Tipos de Cuenta

#### Tipos de Cuenta
- **`consumer`**: Cuenta de comensal (usuario final)
- **`restaurant`**: Cuenta de restaurante (propietario/administrador)

#### Detección de Tipo de Cuenta
- Se determina automáticamente al iniciar sesión
- Basado en la tabla `restaurant_staff` en Supabase
- Si el usuario está asociado a un restaurante, `accountType = 'restaurant'`
- Si no, `accountType = 'consumer'`

#### Redirección Automática
- Usuarios con `accountType === 'restaurant'` son redirigidos a pantallas específicas:
  - `/home` → `/home-restaurant`
  - `/menu` → `/menu-restaurant`
  - `/promotions` → `/promotions-restaurant`

### 26.2 Gestión de Menú (`MenuRestaurantScreen`)
**Ruta**: `/menu-restaurant`

#### Funcionalidades Principales

##### Visualización del Menú
- Lista de productos organizados por categorías
- Filtros por categoría (Entradas, Platos Fuertes, Bebidas, Postres, Coctelería)
- Filtro por etiquetas (badges)
- Búsqueda global en todo el menú
- Modo de edición para gestionar productos

##### Crear Producto
- Formulario completo con:
  - Nombre del producto
  - Descripción
  - Precio
  - Categoría
  - Origen (Tierra, Mar, Aire)
  - Múltiples imágenes (hasta 5)
  - Etiquetas (badges)
  - Complementos (proteínas, tamaños, etc.)
- Subida de imágenes a Supabase Storage
- Validación de campos obligatorios

##### Editar Producto
- Carga datos existentes del producto
- Permite modificar todos los campos
- Actualiza imágenes (agregar o reemplazar)
- Manejo de cambios de capitalización en nombre (evita conflictos de unique constraint)

##### Eliminar Producto
- Eliminación desde sección "Menú": Elimina completamente de BD y todas las secciones
- Eliminación desde "Sugerencias" o "Destacados": Solo remueve de esa sección
- Modal de confirmación personalizado (no `window.confirm`)
- Notificaciones temporales in-app

##### Gestión de Secciones
- **Menú**: Productos disponibles en el menú principal
- **Sugerencias del Chef**: Productos destacados como sugerencias
- **Destacados**: Productos destacados del día
- Agregar/remover productos de cada sección
- Guardado automático con debouncing

##### Búsqueda
- Búsqueda en tiempo real
- Busca en todo el menú, no solo categoría actual
- Filtra por nombre y descripción
- Oculta filtros de origen cuando hay búsqueda activa

#### Reglas de Negocio
- Solo usuarios con `accountType === 'restaurant'` pueden acceder
- Solo pueden gestionar productos de su propio restaurante
- Validación de unique constraint: `(restaurant_id, name)`
- Soft delete: `is_active = false` en lugar de eliminar físicamente
- Imágenes se almacenan en bucket `product-images` de Supabase Storage

### 26.3 Gestión de Promociones (`PromotionsRestaurantScreen`)
**Ruta**: `/promotions-restaurant`

#### Funcionalidades Principales

##### Visualización de Promociones
- Lista de todas las promociones del restaurante
- Filtros por estado (activas, inactivas)
- Búsqueda de promociones
- Modo de edición para gestionar promociones

##### Crear Promoción
- Formulario completo con:
  - Nombre de la promoción
  - Descripción
  - Imagen (banner promocional 16:9)
  - Tipo de descuento (Porcentaje, Monto Fijo, Precio Final, 2x1, Combo)
  - Valor de descuento
  - Modo Desayuno (toggle):
    - Hora inicio/fin
    - Días de la semana
  - Segmentación de clientes (Todos, Nuevos Usuarios, VIP)
  - Tipo de oferta (2x1, Combo, Regalo)
  - Vigencia (fecha inicio/fin)
  - Activar Contador Flash (toggle)
- Subida de imagen a Supabase Storage
- Validación de campos

##### Editar Promoción
- Carga datos existentes
- Permite modificar todos los campos
- Actualiza imagen si se cambia
- Sincroniza tipo de descuento con tipo de oferta

##### Eliminar Promoción
- Modal de confirmación personalizado
- Notificaciones temporales in-app
- Soft delete: `is_active = false`

##### Contador Flash
- Si está activado, muestra contador regresivo en `PromotionDetailScreen`
- Basado en `valid_until` de la promoción
- Actualización en tiempo real

#### Reglas de Negocio
- Solo usuarios con `accountType === 'restaurant'` pueden acceder
- Solo pueden gestionar promociones de su propio restaurante
- Validación de RLS en todas las operaciones
- Imágenes se almacenan en bucket `promotion-images` de Supabase Storage

### 26.4 Perfil del Restaurante (`RestaurantProfileScreen`)
**Ruta**: `/restaurant-profile`

#### Funcionalidades
- Visualización de información del restaurante
- Edición de datos del restaurante
- Subida de logo y portada
- Configuración de horarios
- Información de contacto

### 26.5 Home de Restaurante (`HomeRestaurantScreen`)
**Ruta**: `/home-restaurant`

#### Funcionalidades
- Acceso rápido a:
  - Gestión de menú
  - Gestión de promociones
  - Perfil del restaurante
  - Estadísticas
  - Panel de control
- Resumen de actividad reciente
- Métricas básicas

### 26.6 Estadísticas (`StatisticsRestaurantScreen`)
**Ruta**: `/estadisticas-restaurant`

#### Funcionalidades
- Métricas de ventas
- Productos más vendidos
- Promociones más efectivas
- Análisis de clientes
- Reportes por período

### 26.7 Panel de Control (`AdminControlPanelScreen`)
**Ruta**: `/admin-control-panel`

#### Funcionalidades
- Gestión de personal del restaurante
- Asignación de roles (owner, admin, manager, staff)
- Configuración avanzada
- Integraciones

#### Reglas de Negocio
- Solo usuarios con rol `owner` o `admin` pueden acceder
- Los roles se gestionan en la tabla `restaurant_staff`

---

### Cambios Recientes (Enero 2025)
- ✅ **Agregada sección completa de Reservaciones (17)**
- ✅ Documentada pantalla de reservaciones con todas sus funcionalidades
- ✅ Documentado flujo completo de creación de reservaciones
- ✅ Documentado sistema de campos obligatorios y opcionales
- ✅ Documentado almacenamiento en base de datos (tabla `reservations`)
- ✅ **Agregada sección completa de Funcionalidades para Restaurantes (26)**
- ✅ Documentadas todas las pantallas de restaurante (Menú, Promociones, Perfil, Home, Estadísticas, Panel de Control)
- ✅ Documentado sistema de tipos de cuenta (consumer vs restaurant)
- ✅ Documentado CRUD completo de productos y promociones
- ✅ Documentado sistema de secciones de menú (Menú, Sugerencias, Destacados)
- ✅ Agregada sección completa de Programa de Lealtad (20)
- ✅ Agregada sección completa de Cupones y Recompensas (21)
- ✅ Agregada sección completa de Módulo de Promociones (22)
- ✅ Agregada sección completa de Mesa Lista (23)
- ✅ Agregada sección completa de Pago Dividido (24)
- ✅ Agregada sección completa de Asistente IA con Speech-to-Text (25)
- ✅ Documentada integración de todas las nuevas funcionalidades

### Cambios Recientes (Diciembre 2024)
- ✅ Agregada sección completa de Edición de Órdenes (9.4)
- ✅ Agregada sección completa de Lista de Espera (16)
- ✅ Actualizada sección de Detalle de Orden (9.3) con nuevas funcionalidades
- ✅ Agregada sección de Solicitud de Asistencia (15)
- ✅ Documentadas todas las funcionalidades de búsqueda inteligente
- ✅ Documentadas solicitudes predefinidas y personalizadas
- ✅ Documentado historial de solicitudes y su limpieza automática
