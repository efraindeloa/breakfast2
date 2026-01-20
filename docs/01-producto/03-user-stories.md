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
| US-023 | Alta | 🔄 Pendiente | Gestión Restaurante |
| US-024 | Media | 🔄 Pendiente | Gestión Restaurante |

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0  
**Responsable**: Equipo de desarrollo
