# 🧩 User Stories / Casos de Uso

## Historias de Usuario

### EPIC 1: Autenticación y Registro

#### US-001: Como usuario nuevo quiero registrarme en la aplicación
**Prioridad**: Alta  
**Criterios de aceptación**:
- El usuario puede acceder a la pantalla de registro
- Puede completar el formulario con sus datos
- El sistema valida que todos los campos sean correctos
- Tras registro exitoso, el usuario queda autenticado
- Se redirige a la pantalla principal

**Caso normal**:
1. Usuario hace click en "Registrarse"
2. Llena el formulario con datos válidos
3. Submit del formulario
4. Sistema valida y crea cuenta
5. Usuario autenticado, redirigido a home

**Caso alterno**: Email ya registrado
1. Usuario intenta registrarse con email existente
2. Sistema muestra error: "Este email ya está registrado"
3. Usuario debe usar otro email o iniciar sesión

---

#### US-002: Como usuario registrado quiero iniciar sesión
**Prioridad**: Alta  
**Criterios de aceptación**:
- El usuario puede ingresar email y contraseña
- El sistema valida las credenciales
- Tras login exitoso, se redirige a pantalla principal
- El estado de autenticación persiste

**Caso normal**:
1. Usuario ingresa email y contraseña correctos
2. Click en "Iniciar sesión"
3. Sistema valida credenciales
4. Usuario autenticado, redirigido a home

**Caso alterno**: Credenciales incorrectas
1. Usuario ingresa credenciales incorrectas
2. Sistema muestra error: "Email o contraseña incorrectos"
3. Usuario puede intentar nuevamente

---

### EPIC 2: Exploración del Menú

#### US-003: Como comensal quiero ver el menú completo del restaurante
**Prioridad**: Alta  
**Criterios de aceptación**:
- El menú muestra todos los platillos disponibles
- Está organizado por categorías
- Puedo ver imagen, nombre, descripción y precio
- Puedo filtrar por categoría
- Puedo buscar por nombre

**Caso normal**:
1. Usuario navega a la pantalla de menú
2. Ve todas las categorías (Entradas, Platos Fuertes, Postres, Bebidas, Coctelería)
3. Ve sugerencias del chef al inicio
4. Puede hacer click en cualquier categoría para filtrar
5. Puede escribir en el buscador para encontrar platillos específicos

**Caso alterno**: Sin resultados en búsqueda
1. Usuario busca "pizza" en un restaurante que no tiene pizza
2. Sistema muestra mensaje: "No se encontraron platillos"
3. Usuario puede limpiar el filtro o buscar otra cosa

---

#### US-004: Como comensal quiero ver los detalles de un platillo antes de ordenarlo
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo hacer click en cualquier platillo del menú
- Ve información detallada: imagen grande, descripción completa, precios
- Puedo seleccionar opciones (proteínas, tamaño, etc.)
- Puedo especificar cantidad
- Puedo agregar notas especiales

**Caso normal**:
1. Usuario hace click en un platillo del menú
2. Navega a pantalla de detalle
3. Ve imagen grande, descripción y precio
4. Si es plato fuerte, ve opciones de proteínas
5. Si es bebida con opciones, ve selección de tamaño
6. Selecciona cantidad
7. Agrega notas especiales si desea
8. Click en "Agregar a Orden"

**Caso alterno**: Bebida con opciones de tamaño
1. Usuario hace click en "Licor 43" (700 ml)
2. Ve opciones: "Porción: $140" o "Botella: $1,400"
3. Selecciona "Porción"
4. El precio se actualiza a $140
5. Agrega al carrito

---

#### US-005: Como comensal quiero buscar platillos rápidamente
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo escribir en un campo de búsqueda
- Los resultados se filtran en tiempo real
- La búsqueda es por nombre del platillo
- Los resultados muestran la misma información que el menú

**Caso normal**:
1. Usuario escribe "omelette" en el buscador
2. El sistema filtra todos los platillos con "omelette" en el nombre
3. Los resultados aparecen inmediatamente
4. El usuario puede hacer click en cualquier resultado

---

### EPIC 3: Gestión del Carrito

#### US-006: Como comensal quiero agregar platillos a mi orden
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo agregar items desde el detalle del producto
- Los items aparecen en mi carrito
- Si agrego el mismo item con las mismas opciones, se incrementa la cantidad
- Puedo ver un resumen del carrito

**Caso normal**:
1. Usuario está en detalle de producto
2. Selecciona opciones y cantidad
3. Click en "Agregar a Orden"
4. Ve confirmación visual
5. El item aparece en el carrito (badge en navegación muestra cantidad)

**Caso alterno**: Item duplicado con mismas notas
1. Usuario agrega "Omelette con jamón" sin notas
2. Usuario agrega "Omelette con jamón" sin notas nuevamente
3. El sistema agrupa los items (cantidad = 2)
4. En el carrito aparece un solo item con cantidad 2

**Caso alterno**: Item duplicado con diferentes notas
1. Usuario agrega "Omelette con jamón" sin notas
2. Usuario agrega "Omelette con jamón" con nota "sin cebolla"
3. El sistema crea dos items separados
4. En el carrito aparecen dos items diferentes

---

#### US-007: Como comensal quiero modificar items en mi carrito
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo ver todos los items en mi carrito
- Puedo modificar la cantidad (+/-)
- Puedo editar las notas
- Puedo eliminar items

**Caso normal**:
1. Usuario navega a "Mi Orden"
2. Ve lista de items agregados
3. Hace click en "+" para incrementar cantidad
4. Hace click en "Editar" para modificar notas
5. Guarda cambios
6. El carrito se actualiza

**Caso alterno**: Eliminar item
1. Usuario está en "Mi Orden"
2. Hace click en botón de eliminar (X)
3. El item desaparece del carrito
4. El total se actualiza

---

#### US-008: Como comensal quiero ver el total de mi orden antes de confirmarla
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo ver el subtotal de todos los items
- Puedo agregar propina (opcional)
- Ve el total final
- El total se actualiza automáticamente al modificar items

**Caso normal**:
1. Usuario tiene items en el carrito
2. Navega a "Mi Orden"
3. Ve:
   - Subtotal: $450.00
   - Propina (15%): $67.50
   - Total: $517.50
4. Puede cambiar el porcentaje de propina
5. El total se recalcula automáticamente

---

### EPIC 4: Confirmación de Orden

#### US-009: Como comensal quiero confirmar mi orden
**Prioridad**: Alta  
**Criterios de aceptación**:
- Debo tener al menos 1 item en el carrito
- Puedo revisar todos los items antes de confirmar
- Al confirmar, la orden se envía a cocina
- Recibo confirmación visual
- El carrito se limpia

**Caso normal**:
1. Usuario tiene items en el carrito
2. Navega a "Mi Orden"
3. Revisa el resumen
4. Click en "Confirmar Orden"
5. Sistema muestra pantalla de confirmación
6. Carrito se limpia
7. Usuario puede ver estado de la orden

**Caso alterno**: Carrito vacío
1. Usuario intenta confirmar orden sin items
2. Sistema muestra mensaje: "Agrega items a tu orden primero"
3. Redirige al menú

---

### EPIC 5: Pedidos en Grupo

#### US-010: Como comensal quiero unirme a una mesa usando código QR
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo escanear código QR de la mesa
- El sistema lee el código automáticamente
- Me uno a la orden grupal de esa mesa
- Puedo ver los items que otros han agregado

**Caso normal**:
1. Usuario hace click en "Escanear QR" en la pantalla de inicio
2. Sistema solicita permisos de cámara
3. Usuario permite acceso a cámara
4. Usuario escanea código QR de la mesa
5. Sistema lee el código (ej: "MESA-123")
6. Usuario se une automáticamente a la orden grupal
7. Puede ver items agregados por otros

**Caso alterno**: Permisos de cámara denegados
1. Usuario hace click en "Escanear QR"
2. Sistema solicita permisos
3. Usuario deniega permisos
4. Sistema muestra mensaje: "Se necesitan permisos de cámara para escanear QR"
5. Sistema ofrece opción de ingresar código manualmente

**Caso alterno**: Código QR inválido
1. Usuario escanea un código QR que no es de una mesa
2. Sistema muestra error: "Código inválido"
3. Usuario puede intentar escanear otro código

---

#### US-011: Como comensal quiero ingresar código de mesa manualmente
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo escribir el código de mesa en un campo
- El sistema valida el código
- Me uno a la orden grupal si el código es válido

**Caso normal**:
1. Usuario navega a "Unirse a Mesa"
2. Escribe código: "MESA-123"
3. Click en "Unirme a la Mesa"
4. Sistema valida código
5. Usuario se une a la orden grupal

---

#### US-012: Como comensal quiero agregar items a una orden grupal
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo agregar items normalmente desde el menú
- Los items aparecen en la orden grupal
- Otros participantes pueden ver mis items
- Puedo ver quién agregó cada item

**Caso normal**:
1. Usuario está unido a orden grupal
2. Navega al menú y agrega un platillo
3. El item aparece en la orden grupal con su nombre
4. Otros participantes ven el nuevo item
5. El total de la orden se actualiza

---

#### US-013: Como comensal quiero dividir la cuenta con otros comensales
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ver el total de la orden grupal
- Puedo ver mis items individuales
- Puedo pagar solo por mis items
- Puedo pagar por el total de la orden

**Caso normal**:
1. Usuario está en orden grupal con total de $1,200
2. Sus items suman $300
3. Opción 1: Paga solo sus $300
4. Opción 2: Paga el total dividido entre participantes

---

### EPIC 6: Pagos

#### US-014: Como comensal quiero pagar mi orden con tarjeta
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo seleccionar una tarjeta guardada
- Puedo agregar una nueva tarjeta
- El sistema valida los datos de la tarjeta
- Recibo confirmación de pago

**Caso normal**:
1. Usuario confirma su orden
2. Navega a métodos de pago
3. Selecciona una tarjeta guardada
4. Click en "Pagar"
5. Sistema procesa pago
6. Muestra pantalla de éxito
7. Genera recibo

**Caso alterno**: Agregar nueva tarjeta
1. Usuario no tiene tarjetas guardadas
2. Click en "Agregar Tarjeta"
3. Llena formulario:
   - Número de tarjeta
   - Nombre en tarjeta
   - Fecha de expiración
   - CVV
4. Sistema valida datos
5. Tarjeta se guarda y se usa para el pago

**Caso alterno**: Datos inválidos
1. Usuario ingresa número de tarjeta inválido
2. Sistema muestra error: "Número de tarjeta inválido"
3. Usuario corrige el número

---

#### US-015: Como comensal quiero ver el historial de mis transacciones
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ver lista de todas mis transacciones
- Puedo ver detalles de cada transacción
- Puedo filtrar transacciones
- Puedo ver o descargar recibos

**Caso normal**:
1. Usuario navega a "Transacciones" en perfil
2. Ve lista de transacciones ordenadas por fecha
3. Hace click en una transacción
4. Ve detalles: fecha, items, total, método de pago
5. Puede ver o descargar recibo

---

### EPIC 7: Perfil y Configuración

#### US-016: Como usuario quiero cambiar el idioma de la aplicación
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo seleccionar entre Español, Inglés, Portugués y Francés
- El cambio es inmediato sin recargar
- El idioma se guarda y persiste en futuras sesiones

**Caso normal**:
1. Usuario navega a Configuración
2. Ve selector de idioma
3. Selecciona "English"
4. Toda la interfaz cambia inmediatamente a inglés
5. El idioma se guarda en localStorage

---

#### US-017: Como usuario quiero activar/desactivar el modo oscuro
**Prioridad**: Baja  
**Criterios de aceptación**:
- Puedo alternar entre modo claro y oscuro
- El cambio es inmediato
- La preferencia persiste entre sesiones

**Caso normal**:
1. Usuario navega a Configuración
2. Activa toggle de "Modo Oscuro"
3. La interfaz cambia a tema oscuro inmediatamente
4. La preferencia se guarda

---

#### US-018: Como usuario quiero ver mi historial de órdenes
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ver lista de órdenes anteriores
- Puedo filtrar por estado (Completadas, Canceladas)
- Puedo ver detalles de cada orden
- Puedo dejar opinión sobre órdenes completadas

**Caso normal**:
1. Usuario navega a "Historial de Órdenes" en perfil
2. Ve lista de órdenes ordenadas por fecha (más recientes primero)
3. Hace click en una orden
4. Ve detalles: fecha, items, total, estado
5. Si está completada, ve botón "Dejar Opinión"

---

### EPIC 8: Favoritos

#### US-019: Como comensal quiero marcar platillos como favoritos
**Prioridad**: Baja  
**Criterios de aceptación**:
- Puedo marcar cualquier platillo como favorito
- Los favoritos se guardan
- Puedo ver todos mis favoritos en una lista
- Puedo eliminar favoritos

**Caso normal**:
1. Usuario está en detalle de producto
2. Hace click en ícono de favorito (corazón)
3. El platillo se marca como favorito
4. Aparece en la pantalla de favoritos
5. Puede hacer click nuevamente para desmarcar

---

### EPIC 9: Opiniones

#### US-020: Como comensal quiero dejar una opinión sobre un platillo
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo calificar con estrellas (1-5)
- Puedo seleccionar opciones rápidas con chips
- Puedo escribir un comentario
- Puedo subir fotos o videos (hasta 5)
- Puedo publicar la opinión

**Caso normal**:
1. Usuario está en detalle de producto
2. Hace click en "Dejar Opinión"
3. Navega a pantalla de opiniones
4. Selecciona 5 estrellas
5. Selecciona chips: "Excelente servicio", "Comida deliciosa"
6. Escribe comentario: "El omelette estaba perfecto"
7. Sube 2 fotos del platillo
8. Click en "Publicar Opinión"
9. Opinión se guarda y muestra

**Caso alterno**: Buscar opciones rápidas
1. Usuario está escribiendo en campo de búsqueda de chips
2. Escribe "servicio"
3. Sistema muestra sugerencias: "Excelente servicio", "Rápida atención"
4. Usuario selecciona "Excelente servicio"
5. El chip se agrega

**Caso alterno**: Agregar opción personalizada
1. Usuario escribe "Música agradable" en campo de búsqueda
2. No aparece en sugerencias
3. Sistema muestra botón "Agregar"
4. Usuario hace click
5. "Música agradable" se agrega como chip seleccionado

---

#### US-021: Como comensal quiero dejar una opinión sobre toda mi orden
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo acceder desde historial de órdenes
- El contexto incluye todos los platillos de la orden
- Puedo calificar la experiencia general
- Puedo mencionar items específicos en el comentario

**Caso normal**:
1. Usuario está en historial de órdenes
2. Hace click en "Dejar Opinión" en una orden completada
3. Navega a pantalla de opiniones (contexto: orden completa)
4. Califica 5 estrellas
5. Selecciona chips
6. Escribe comentario general sobre la experiencia
7. Publica opinión

---

### EPIC 10: Datos Fiscales

#### US-022: Como usuario quiero configurar mis datos fiscales para recibir facturas
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ingresar mi RFC
- Puedo seleccionar régimen fiscal
- Puedo seleccionar uso de CFDI
- Puedo subir constancia de situación fiscal
- Puedo configurar email para recibos

**Caso normal**:
1. Usuario navega a "Datos Fiscales" en perfil
2. Paso 1: Ingresa RFC, razón social, régimen fiscal, uso CFDI
3. Paso 2: Sube constancia de situación fiscal (PDF)
4. Paso 3: Configura email para recibir facturas
5. Paso 4: Revisa resumen y confirma
6. Datos fiscales guardados

---

### EPIC 10: Solicitud de Asistencia

#### US-025: Como comensal quiero solicitar asistencia del restaurante desde la aplicación
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo acceder a una pantalla de solicitud de asistencia
- Puedo ver opciones predefinidas de solicitudes comunes
- Puedo seleccionar una opción y enviarla
- Recibo confirmación visual de que la solicitud fue enviada

**Caso normal**:
1. Usuario hace click en "Solicitar asistencia" en la pantalla de inicio o métodos de pago
2. Navega a la pantalla de solicitud de asistencia
3. Ve opciones predefinidas (cubiertos, servilletas, limpiar derrame, etc.)
4. Hace click en una opción (ej: "Cubiertos y Vasos")
5. El botón se marca como "Solicitado"
6. La solicitud aparece en el historial

**Caso alterno**: Solicitar asistencia personalizada
1. Usuario hace click en "Solicitar asistencia personalizada"
2. Se marca como "Solicitado"
3. Aparece en el historial como "Llamar Mesero"

---

#### US-026: Como comensal quiero buscar solicitudes rápidamente escribiendo lo que necesito
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo escribir en un campo de búsqueda
- Los botones se filtran en tiempo real según lo que escribo
- Si no hay coincidencias, puedo crear una solicitud personalizada

**Caso normal**:
1. Usuario escribe "Derrame" en el campo de búsqueda
2. Solo aparecen los botones "Limpiar Derrame (Mesa)" y "Limpiar Derrame (Piso)"
3. Usuario hace click en el botón deseado
4. Se envía la solicitud

**Caso alterno**: Búsqueda sin resultados
1. Usuario escribe "Agua" en el campo de búsqueda
2. No aparecen coincidencias
3. Aparece un botón con icono "!" y el texto "Agua"
4. Usuario hace click en el botón
5. Se crea y envía una solicitud personalizada "Agua"

---

#### US-027: Como comensal quiero ver el historial de mis solicitudes para confirmar que fueron enviadas
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ver todas mis solicitudes realizadas durante la sesión
- Veo la hora de cada solicitud
- Puedo distinguir entre solicitudes predefinidas y personalizadas
- Veo el estado "Enviada" con confirmación visual

**Caso normal**:
1. Usuario ha hecho varias solicitudes durante su visita
2. Abre la pantalla de solicitud de asistencia
3. Ve el historial al inicio de la pantalla
4. Cada solicitud muestra:
   - Icono
   - Nombre
   - Hora de envío
   - Badge "Personalizada" si aplica
   - Estado "Enviada" con check verde

---

#### US-028: Como comensal quiero que el historial de solicitudes se limpie al pagar
**Prioridad**: Baja  
**Criterios de aceptación**:
- El historial se mantiene durante toda mi visita
- El historial se limpia automáticamente cuando completo el pago
- Al iniciar una nueva visita, el historial está vacío

**Caso normal**:
1. Usuario hace varias solicitudes durante su visita
2. Completa el pago de su orden
3. El historial de solicitudes se limpia automáticamente
4. En su próxima visita, el historial está vacío

---

## Casos de Uso del Restaurante (Futuros)

### EPIC 11: Gestión de Órdenes (Backend/Futuro)

#### US-023: Como restaurante quiero recibir órdenes en tiempo real
**Prioridad**: Alta (Futuro)  
**Criterios de aceptación**:
- Las órdenes aparecen en el sistema del restaurante
- Puedo ver detalles completos de cada orden
- Puedo actualizar el estado de la orden
- Los comensales reciben notificaciones de cambios de estado

---

#### US-024: Como restaurante quiero generar reportes de ventas
**Prioridad**: Media (Futuro)  
**Criterios de aceptación**:
- Puedo ver reportes diarios, semanales, mensuales
- Puedo ver platillos más vendidos
- Puedo ver ingresos por período
- Puedo exportar reportes en diferentes formatos

---

## Matriz de Prioridades

| User Story | Prioridad | Estado | Epic |
|------------|-----------|--------|------|
| US-001 | Alta | ✅ Completo | Autenticación |
| US-002 | Alta | ✅ Completo | Autenticación |
| US-003 | Alta | ✅ Completo | Menú |
| US-004 | Alta | ✅ Completo | Menú |
| US-005 | Media | ✅ Completo | Menú |
| US-006 | Alta | ✅ Completo | Carrito |
| US-007 | Alta | ✅ Completo | Carrito |
| US-008 | Alta | ✅ Completo | Carrito |
| US-009 | Alta | ✅ Completo | Orden |
| US-010 | Alta | ✅ Completo | Pedidos Grupo |
| US-011 | Media | ✅ Completo | Pedidos Grupo |
| US-012 | Alta | ✅ Completo | Pedidos Grupo |
| US-013 | Media | ✅ Completo | Pedidos Grupo |
| US-014 | Alta | ✅ Completo | Pagos |
| US-015 | Media | ✅ Completo | Pagos |
| US-016 | Media | ✅ Completo | Configuración |
| US-017 | Baja | ✅ Completo | Configuración |
| US-018 | Media | ✅ Completo | Perfil |
| US-019 | Baja | ✅ Completo | Favoritos |
| US-020 | Media | ✅ Completo | Opiniones |
| US-021 | Media | ✅ Completo | Opiniones |
| US-022 | Media | ✅ Completo | Datos Fiscales |
| US-025 | Alta | ✅ Completo | Solicitud Asistencia |
| US-026 | Media | ✅ Completo | Solicitud Asistencia |
| US-027 | Media | ✅ Completo | Solicitud Asistencia |
| US-028 | Baja | ✅ Completo | Solicitud Asistencia |
| US-023 | Alta | 🔄 Pendiente | Gestión Restaurante |
| US-024 | Media | 🔄 Pendiente | Gestión Restaurante |
| US-029 | Media | ✅ Completo | Opiniones Verificadas |
| US-030 | Media | ✅ Completo | Opiniones |
| US-031 | Media | ✅ Completo | Pagos |
| US-032 | Alta | ✅ Completo | Lista de Espera |
| US-033 | Alta | ✅ Completo | Lista de Espera |
| US-034 | Media | ✅ Completo | Lista de Espera |
| US-035 | Media | ✅ Completo | Lista de Espera |
| US-036 | Alta | ✅ Completo | Edición de Órdenes |
| US-037 | Alta | ✅ Completo | Edición de Órdenes |

---

**Última actualización**: Enero 2025  
**Versión del documento**: 1.3  
**Responsable**: Equipo de desarrollo

### EPIC 11: Opiniones Verificadas

#### US-029: Como comensal quiero ver las opiniones verificadas de un producto antes de ordenarlo
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo ver la calificación promedio del producto en su página de detalle
- Puedo hacer click en el número de reseñas para ver todas las opiniones
- Ve estadísticas del producto (promedio, distribución por estrellas)
- Puedo filtrar opiniones (Más Recientes, Con Foto, Modificados)
- Ve información detallada de cada opinión (usuario, fecha, calificación, comentarios, fotos)

**Caso normal**:
1. Usuario abre detalle de producto
2. Ve calificación promedio con estrellas y número de reseñas
3. Hace click en número de reseñas
4. Navega a página de opiniones verificadas
5. Ve estadísticas y lista de opiniones
6. Puede filtrar por tipo de opinión

**Caso alterno**: Producto sin opiniones
1. Usuario abre detalle de producto sin opiniones
2. No ve calificación ni número de reseñas
3. Al hacer click en botón de opiniones, ve mensaje de "No hay opiniones disponibles"

---

#### US-030: Como comensal quiero editar mis opiniones después de publicarlas
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo acceder a editar una opinión desde el historial de órdenes
- Ve el botón "Editar Opiniones" en lugar de "Dejar Opinión" si ya dejé una
- Puedo cambiar calificación, chips, comentarios y fotos
- Se guarda la fecha original y se agrega fecha de actualización
- La opinión actualizada se muestra con indicador "Modificado"

**Caso normal**:
1. Usuario tiene una orden completada con opinión publicada
2. Hace click en "Editar Opiniones" en el historial
3. Se cargan los datos existentes en el formulario
4. Usuario modifica calificación o comentario
5. Publica cambios
6. La opinión se actualiza y muestra fecha de modificación

---

#### US-031: Como comensal quiero escanear mi tarjeta bancaria con la cámara para agregarla más rápido
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo escanear mi tarjeta usando la cámara del dispositivo
- La aplicación extrae automáticamente número de tarjeta, nombre y fecha de vencimiento
- Los campos se llenan automáticamente
- Puedo revisar y editar los datos extraídos si hay errores
- Si el reconocimiento falla, puedo ingresar los datos manualmente
- El CVV siempre se ingresa manualmente por seguridad

**Caso normal**:
1. Usuario hace click en "Agregar Tarjeta"
2. Hace click en "Escanear tarjeta con cámara"
3. Permite acceso a la cámara
4. Coloca tarjeta dentro del marco con buena iluminación
5. Hace click en "Capturar Tarjeta"
6. La aplicación procesa la imagen y extrae datos
7. Los campos se llenan automáticamente
8. Usuario ingresa CVV manualmente
9. Hace click en "Agregar Tarjeta"

**Caso alterno**: Reconocimiento fallido
1. Usuario escanea tarjeta pero el reconocimiento falla
2. Sistema muestra mensaje: "No se pudieron extraer datos"
3. Usuario puede intentar nuevamente o ingresar datos manualmente

---

### EPIC 12: Lista de Espera (Waitlist)

#### US-032: Como comensal quiero escanear un QR para agregarme a la lista de espera
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo escanear un código QR desde la pantalla de inicio
- Se abre automáticamente la pantalla de lista de espera
- Puedo seleccionar la zona donde quiero la mesa
- Puedo indicar cuántas personas somos
- Veo información sobre la lista de espera en esa zona
- Puedo confirmar mi solicitud

**Caso normal**:
1. Usuario hace click en "Escanear QR para Lista de Espera" en home
2. Escanea el código QR del restaurante
3. Se abre pantalla de lista de espera
4. Selecciona zona (interior, terraza, etc.)
5. Selecciona número de personas
6. Ve información de posición y tiempo estimado
7. Confirma solicitud
8. Se agrega a la lista de espera

**Caso alterno**: Zona deshabilitada
1. Usuario intenta seleccionar zona deshabilitada
2. Ve aviso explicando que la zona no está disponible
3. Debe seleccionar otra zona

---

#### US-033: Como comensal quiero ver mi progreso en la lista de espera en tiempo real
**Prioridad**: Alta  
**Criterios de aceptación**:
- Veo mi posición en la lista de espera
- Veo tiempo estimado de espera
- Veo cuántas mesas están por delante
- La información se actualiza automáticamente
- Veo un diseño progresivo después de confirmar

**Caso normal**:
1. Usuario confirma solicitud de lista de espera
2. Ve diseño inicial con información básica por 10 segundos
3. Después de 10 segundos, ve diseño de progreso más detallado
4. Ve barra de progreso con porcentaje avanzado
5. Ve actualización automática de posición y tiempo

---

#### US-034: Como comensal quiero cambiar de zona si cambio de opinión
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo cambiar de zona después de confirmar
- Se me advierte que perderé mi lugar actual
- Se me indica que seré agregado al final de la nueva lista
- El timestamp se actualiza al cambiar de zona
- Debo confirmar el cambio

**Caso normal**:
1. Usuario está en lista de espera
2. Hace click en "Cambiar de Zona"
3. Ve modal de advertencia
4. Selecciona nueva zona
5. Confirma el cambio
6. Perde su lugar en zona anterior
7. Se agrega al final de nueva zona

---

#### US-035: Como comensal quiero cancelar mi solicitud de lista de espera
**Prioridad**: Media  
**Criterios de aceptación**:
- Puedo cancelar mi solicitud en cualquier momento
- Se me advierte que perderé mi lugar
- Debo confirmar la cancelación
- Se remueve de la lista de espera

**Caso normal**:
1. Usuario está en lista de espera
2. Hace click en "Cancelar Espera"
3. Ve modal de confirmación
4. Confirma cancelación
5. Se remueve de la lista de espera

---

### EPIC 13: Edición de Órdenes

#### US-036: Como comensal quiero modificar mi orden después de enviarla pero antes de que la cocina la acepte
**Prioridad**: Alta  
**Criterios de aceptación**:
- Puedo ver el botón "Modificar mi orden" si la orden está en estado enviada o recibida
- Puedo cambiar las cantidades de los items
- Puedo eliminar items de la orden
- Puedo agregar notas de último minuto
- Veo el total actualizado automáticamente
- Los cambios se guardan y actualizan la orden

**Caso normal**:
1. Usuario envía una orden
2. Va a "Mi Orden"
3. Ve el botón "Modificar mi orden"
4. Hace click en el botón
5. Se abre pantalla de edición con todos los items
6. Modifica cantidades o elimina items
7. Agrega notas de último minuto
8. Ve total actualizado
9. Guarda cambios
10. La orden se actualiza

**Caso alterno**: Orden ya en preparación
1. Usuario intenta modificar orden
2. Orden ya está en estado "en_preparacion"
3. No ve el botón de modificar
4. No puede editar la orden

---

#### US-037: Como comensal quiero ver las cantidades exactas de mi orden original al editarla
**Prioridad**: Alta  
**Criterios de aceptación**:
- Al abrir la pantalla de edición, veo las cantidades exactas de mi orden
- Los items se agrupan correctamente por ID y notas
- Puedo modificar las cantidades desde ese punto
- El total inicial coincide con el total de la orden original

**Caso normal**:
1. Usuario tiene orden con 14 unidades de un item
2. Abre pantalla de edición
3. Ve cantidad 14 mostrada correctamente
4. Puede modificar esa cantidad

---

---

### Cambios Recientes (Diciembre 2024)
- ✅ Agregado EPIC 12: Lista de Espera (Waitlist)
- ✅ Agregadas User Stories US-032 a US-035
- ✅ Agregado EPIC 13: Edición de Órdenes
- ✅ Agregadas User Stories US-036 a US-037
- ✅ Agregado EPIC 10: Solicitud de Asistencia
- ✅ Agregadas User Stories US-025 a US-028
- ✅ Agregado EPIC 11: Opiniones Verificadas
- ✅ Agregadas User Stories US-029 a US-031
- ✅ Actualizada matriz de prioridades con nuevas user stories
