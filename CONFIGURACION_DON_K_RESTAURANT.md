# 🏪 Configuración Don K Restaurant - Gestión de Reservaciones

## 📋 Información del Restaurante

- **Nombre:** Don K Restaurant
- **ID:** `3de5a7bc-362a-4613-838c-188cf8ff760d`
- **Ciudad:** Ciudad, México
- **Estado:** Activo ✅

## 🚀 Pasos para Configurar las Reservaciones

### 1. Ejecutar Script de Configuración

```bash
# En tu terminal de Supabase SQL Editor o psql
\i scripts/fix-reservations-for-don-k.sql
```

### 2. Verificar la Configuración

El script creará automáticamente:
- ✅ Usuario administrador (si no existe)
- ✅ Relación staff con Don K Restaurant
- ✅ 7 reservaciones de ejemplo específicas para Don K

### 3. Reservaciones de Ejemplo Creadas

#### 📅 **HOY** (4 reservaciones)
1. **🎂 Cumpleaños - 7:00 PM** (PENDIENTE)
   - 4 personas | Terraza
   - Pedido anticipado: Pastel + Velas ($330)
   
2. **💕 Aniversario - 8:30 PM** (CONFIRMADA)
   - 2 personas | Zona VIP
   - Pedido anticipado: Cena romántica completa ($1,480)
   
3. **👨‍👩‍👧‍👦 Comida Familiar - 2:00 PM** (PENDIENTE)
   - 7 personas | Sala Principal
   - Pedido anticipado: Menús infantiles + adultos ($1,570)
   
4. **☕ Cita Casual - 3:30 PM** (CONFIRMADA)
   - 2 personas | Terraza Íntima
   - Pedido anticipado: Cafés + postre ($290)

#### 📅 **AYER** (2 reservaciones)
5. **💼 Reunión Ejecutiva - 1:00 PM** (COMPLETADA)
   - 6 personas | Sala Ejecutiva
   - Pedido anticipado: Menú ejecutivo completo ($2,805)
   
6. **👻 Cena Familiar - 6:30 PM** (NO SHOW)
   - 5 personas | Zona Familiar
   - Sin pedido anticipado

#### 📅 **MAÑANA** (1 reservación)
7. **🎉 Despedida - 9:00 PM** (CANCELADA)
   - 10 personas | Terraza Grande
   - Pedido anticipado: Parrillada grupal ($3,225)

## 🎯 Funcionalidades a Probar

### En la Pantalla de Gestión (`/gestionar-reservaciones`)

1. **📊 Estadísticas**
   - Total: 7 reservaciones
   - Pendientes: 2
   - Confirmadas: 2
   - Comensales totales: 32

2. **🔍 Filtros**
   - Por fecha: Ayer, Hoy, Mañana
   - Por estado: Pendiente, Confirmada, Completada, etc.
   - Búsqueda: "cumpleaños", "VIP", "ejecutiva"

3. **⚡ Acciones**
   - Confirmar reservaciones pendientes
   - Completar reservaciones confirmadas
   - Ver detalles completos
   - Marcar como No Show

## 🧪 Casos de Prueba Sugeridos

### Flujo Típico de Gestión
1. **Filtrar por "Hoy"** → Debería mostrar 4 reservaciones
2. **Buscar "cumpleaños"** → Debería mostrar la reservación de 7:00 PM
3. **Confirmar la reservación pendiente** → Cambiar estado a confirmada
4. **Ver detalles de la cena romántica** → Mostrar pedido anticipado de $1,480

### Pruebas de Estados
1. **Completar una reservación confirmada** → Cambio exitoso de estado
2. **Marcar como No Show** → Verificar cambio de estado
3. **Filtrar por "Completadas"** → Mostrar solo la reunión ejecutiva

## 🗑️ Limpieza Después de Pruebas

Para eliminar las reservaciones de ejemplo:

```sql
DELETE FROM reservations WHERE notes LIKE 'EJEMPLO DON K -%';
```

## 🔧 Solución de Problemas

### Si no aparecen las reservaciones:

1. **Verificar usuario logueado:**
   ```javascript
   // En consola del navegador
   console.log(JSON.parse(localStorage.getItem('simpleAuthUser')));
   ```

2. **Verificar relación con restaurante:**
   ```sql
   SELECT * FROM restaurant_staff WHERE restaurant_id = '3de5a7bc-362a-4613-838c-188cf8ff760d';
   ```

3. **Verificar reservaciones:**
   ```sql
   SELECT COUNT(*) FROM reservations WHERE restaurant_id = '3de5a7bc-362a-4613-838c-188cf8ff760d';
   ```

## 📞 Datos de Contacto del Restaurante

- **Email:** admin@donkrestaurant.com
- **Teléfono:** +52 555 123 4567
- **Zona horaria:** America/Mexico_City

---

¡Listo para probar la gestión de reservaciones de Don K Restaurant! 🎉