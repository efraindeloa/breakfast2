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

---

## 10. Favoritos

### 10.1 Pantalla de Favoritos (`FavoritesScreen`)
**Ruta**: `/favorites`

#### Funcionalidades
- Lista de platillos marcados como favoritos
- Agregar/eliminar favoritos
- Navegación a detalle del producto

#### Reglas de negocio
- Los favoritos persisten en `localStorage`
- Un platillo puede estar o no en favoritos
- Se pueden eliminar individualmente

### 10.2 Contexto de Favoritos (`FavoritesContext`)

#### Funcionalidades
- **`addToFavorites`**: Agrega producto a favoritos
- **`removeFromFavorites`**: Elimina producto de favoritos
- **`isFavorite`**: Verifica si un producto es favorito
- **`getFavorites`**: Obtiene lista de favoritos

---

## 11. Sistema de Opiniones

### 11.1 Pantalla de Opiniones (`ReviewScreen`)
**Ruta**: `/review`

#### Funcionalidades

##### Calificación por estrellas
- 5 estrellas interactivas
- Hover para previsualizar
- Click para seleccionar
- Etiqueta descriptiva según calificación

##### Chips de selección rápida
- Opciones predefinidas (Excelente servicio, Comida deliciosa, etc.)
- Búsqueda/autocompletado para encontrar opciones
- Agregar opciones personalizadas
- Selección múltiple

##### Campo de comentarios
- Textarea libre
- Placeholder con sugerencias
- Máximo de caracteres: 1000

##### Subida de fotos/videos
- Hasta 5 archivos
- Preview de imágenes
- Indicador de cantidad seleccionada

##### Publicar opinión
- Botón para publicar
- Validación: Requiere al menos calificación

#### Reglas de negocio
- La calificación es obligatoria (1-5 estrellas)
- Los chips son opcionales
- El comentario es opcional
- Máximo 5 archivos multimedia
- Tipos permitidos: image/*, video/*
- Tamaño máximo por archivo: 10MB

#### Contextos de uso
- **Producto individual**: Se puede acceder desde detalle de producto
- **Orden completa**: Se puede acceder desde historial de órdenes
- **Restaurante**: Se puede acceder desde perfil (próximamente)

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

## 15. Restricciones y Validaciones

### 15.1 Autenticación
- Todas las pantallas principales requieren autenticación
- Si no está autenticado, redirige a `/`
- Las pantallas de facturación no requieren autenticación (flujo independiente)

### 15.2 Carrito
- Mínimo 1 item para confirmar orden
- Máximo 99 unidades por item (o según restricción)
- El carrito se limpia después de confirmar orden

### 15.3 Pagos
- Requiere método de pago válido
- Validación de datos de tarjeta antes de procesar
- Transacciones se guardan en historial

### 15.4 Opiniones
- Calificación es obligatoria
- Comentario es opcional
- Máximo 5 archivos multimedia
- Tamaño máximo por archivo: 10MB

### 15.5 Datos Fiscales
- RFC debe tener formato válido
- Email debe tener formato válido
- Todos los campos son obligatorios

---

## 16. Estados de Órdenes

### 16.1 Estados Disponibles
1. **`orden_enviada`**: Orden enviada a cocina
2. **`orden_recibida`**: Orden recibida por cocina
3. **`en_preparacion`**: En proceso de preparación
4. **`lista_para_entregar`**: Lista para entregar al mesero
5. **`en_entrega`**: El mesero está entregando
6. **`entregada`**: Orden entregada al comensal
7. **`con_incidencias`**: Hay algún problema con la orden
8. **`orden_cerrada`**: Orden cerrada y pagada
9. **`cancelada`**: Orden cancelada

### 16.2 Transiciones de Estado
- Solo ciertas transiciones son válidas
- Las transiciones las gestiona el backend (futuro)
- El frontend muestra el estado actual

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de desarrollo
