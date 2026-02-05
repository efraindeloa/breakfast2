# 📋 Guía: Reservaciones de Ejemplo para Testing

## 🎯 Objetivo

Estos scripts crean **reservaciones de ejemplo** con todos los estados posibles para probar la funcionalidad de gestión de reservaciones del restaurante.

## 📁 Scripts Disponibles

### 1. `scripts/insert-sample-reservations.sql` (Completo)
- ✅ **Crea usuarios y restaurantes** si no existen
- ✅ **Más robusto** para bases de datos vacías
- ✅ **Manejo completo de errores**

### 2. `scripts/insert-sample-reservations-simple.sql` (Recomendado)
- ✅ **Más rápido** de ejecutar
- ✅ **Usa datos existentes** (usuarios/restaurantes)
- ✅ **Más limpio** y fácil de entender

## 🚀 Cómo Ejecutar

### Opción 1: Script Simple (Recomendado)
```bash
# Asegúrate de tener al menos un usuario y un restaurante
psql -d tu_base_de_datos -f scripts/insert-sample-reservations-simple.sql
```

### Opción 2: Script Completo
```bash
# Crea todo desde cero si es necesario
psql -d tu_base_de_datos -f scripts/insert-sample-reservations.sql
```

## 📊 Reservaciones que se Crean

### 🗓️ Distribución por Fecha:

| Fecha | Cantidad | Estados |
|-------|----------|---------|
| **Ayer** | 2 | 1 Completada, 1 No Show |
| **Hoy** | 4 | 2 Pendientes, 2 Confirmadas |
| **Mañana** | 1 | 1 Cancelada |
| **Total** | **7** | Todos los estados |

### 🏷️ Estados Incluidos:

| Estado | Cantidad | Descripción |
|--------|----------|-------------|
| ⏳ **Pendiente** | 2 | Esperan confirmación |
| ✅ **Confirmada** | 2 | Aprobadas por restaurante |
| 🏁 **Completada** | 1 | Ya se realizó |
| ❌ **Cancelada** | 1 | Cancelada por cliente |
| 👻 **No Show** | 1 | Cliente no se presentó |

## 🎭 Detalles de Cada Reservación

### 1. ⏳ PENDIENTE - Cumpleaños (Hoy 7:00 PM)
```
👥 4 personas
📍 Terraza
🎉 Cumpleaños
🍰 Pedido: Pastel de Chocolate ($25.00)
📝 Decoración especial, mesa junto a ventana
```

### 2. ✅ CONFIRMADA - Aniversario (Hoy 8:30 PM)
```
👥 2 personas
📍 Zona VIP
💕 Aniversario de bodas
🍷 Pedido: Cena Romántica ($85) + Vino Tinto ($45)
📝 Cliente VIP, mesa romántica con velas
```

### 3. 🏁 COMPLETADA - Negocios (Ayer 1:00 PM)
```
👥 6 personas
📍 Sala Principal
💼 Reunión de Negocios
🍽️ Pedido: 6 Menús Ejecutivos ($35 c/u)
📝 Reunión exitosa, ambiente silencioso
```

### 4. ❌ CANCELADA - Despedida (Mañana 9:00 PM)
```
👥 8 personas
📍 Terraza
🎉 Despedida de Soltero
🥩 Pedido: 2 Parrilladas ($120 c/u)
📝 Cancelada por cambio de planes
```

### 5. 👻 NO SHOW - Familiar (Ayer 6:30 PM)
```
👥 3 personas
📍 Zona Familiar
👨‍👩‍👧 Sin ocasión especial
🚫 Sin pedido anticipado
📝 No se presentó, se esperó 20 minutos
```

### 6. ⏳ PENDIENTE - Comida (Hoy 2:00 PM)
```
👥 5 personas (incluye niños)
📍 Sala Principal
👨‍👩‍👧‍👦 Comida Familiar
🧒 Pedido: 2 Menús Infantiles ($18 c/u)
📝 Mesa amplia, sillas para niños
```

### 7. ✅ CONFIRMADA - Cita (Hoy 3:30 PM)
```
👥 2 personas
📍 Terraza
💑 Cita casual
🚫 Sin pedido anticipado
📝 Mesa con vista, ambiente relajado
```

## 🧪 Cómo Probar la Funcionalidad

### 1. Ver Dashboard Principal:
```
1. Ve a /gestionar-reservaciones
2. ✅ Deberías ver estadísticas:
   - 2 Pendientes
   - 2 Confirmadas  
   - 1 Completada
   - 1 Cancelada
   - 1 No Show
   - 16 Comensales total
```

### 2. Filtrar por Fecha:
```
📅 Selecciona "Hoy":
   - 4 reservaciones (2 pendientes, 2 confirmadas)
   
📅 Selecciona "Ayer":  
   - 2 reservaciones (1 completada, 1 no show)
   
📅 Selecciona "Mañana":
   - 1 reservación (1 cancelada)
```

### 3. Filtrar por Estado:
```
⏳ Pendientes: 2 reservaciones
✅ Confirmadas: 2 reservaciones  
🏁 Completadas: 1 reservación
❌ Canceladas: 1 reservación
👻 No Show: 1 reservación
```

### 4. Probar Búsqueda:
```
🔍 "cumpleaños" → 1 resultado
🔍 "terraza" → 3 resultados
🔍 "VIP" → 1 resultado
🔍 "niños" → 1 resultado
```

### 5. Probar Acciones:
```
✅ Confirmar reservaciones pendientes
❌ Cancelar reservaciones pendientes
🏁 Completar reservaciones confirmadas
👻 Marcar No Show en confirmadas
👁️ Ver detalles de cualquier reservación
```

### 6. Ver Detalles Completos:
```
- Información básica (fecha, hora, personas)
- Zona y preferencias de mesa
- Ocasiones especiales
- Pedidos anticipados con precios
- Notas del restaurante
```

## 🎨 Características de Testing

### ✅ Variedad de Datos:
- **Horarios diversos**: 2:00 PM a 9:00 PM
- **Grupos diferentes**: 2 a 8 personas
- **Zonas variadas**: Terraza, VIP, Sala Principal, Familiar
- **Ocasiones especiales**: Cumpleaños, Aniversario, Negocios, Despedida

### ✅ Pedidos Anticipados:
- **Con productos**: Pasteles, cenas, vinos, menús
- **Con precios**: Diferentes rangos de precios
- **Sin productos**: Algunas reservaciones sin pedido

### ✅ Notas Descriptivas:
- **Contexto claro**: Cada reservación tiene historia
- **Preferencias específicas**: Decoración, ambiente, ubicación
- **Razones de estado**: Por qué se canceló, completó, etc.

## 🗑️ Limpiar Datos de Ejemplo

### Para eliminar todas las reservaciones de ejemplo:
```sql
DELETE FROM reservations WHERE notes LIKE 'EJEMPLO -%';
```

### Para eliminar solo un estado específico:
```sql
-- Solo pendientes
DELETE FROM reservations WHERE notes LIKE 'EJEMPLO -%' AND status = 'pending';

-- Solo completadas  
DELETE FROM reservations WHERE notes LIKE 'EJEMPLO -%' AND status = 'completed';
```

## 📋 Checklist de Testing

### ✅ Funcionalidades Básicas:
- [ ] Dashboard carga sin errores
- [ ] Estadísticas muestran números correctos
- [ ] Filtros por fecha funcionan
- [ ] Filtros por estado funcionan
- [ ] Búsqueda encuentra resultados

### ✅ Acciones de Gestión:
- [ ] Confirmar reservación pendiente
- [ ] Cancelar reservación pendiente  
- [ ] Completar reservación confirmada
- [ ] Marcar No Show en confirmada
- [ ] Ver detalles completos

### ✅ UI/UX:
- [ ] Colores correctos por estado
- [ ] Agrupación por horarios
- [ ] Modal de detalles funciona
- [ ] Responsive en móvil
- [ ] Modo oscuro funciona

### ✅ Datos Mostrados:
- [ ] Pedidos anticipados se ven
- [ ] Ocasiones especiales aparecen
- [ ] Preferencias de mesa se muestran
- [ ] Notas son visibles
- [ ] Precios se calculan bien

## 🎯 Casos de Uso Cubiertos

### ✅ Flujo Típico del Restaurante:
1. **Mañana**: Ver reservaciones del día
2. **Confirmar**: Reservaciones pendientes
3. **Durante servicio**: Marcar como completadas
4. **Gestión**: Cancelar si es necesario
5. **Final del día**: Marcar No Show

### ✅ Escenarios Especiales:
- **Cumpleaños**: Con decoración y pastel
- **Aniversarios**: Ambiente romántico
- **Negocios**: Ambiente profesional
- **Familias**: Consideraciones para niños
- **Grupos grandes**: Mesas especiales

---

## 🎉 ¡Listo para Probar!

Con estas reservaciones de ejemplo, tienes **datos realistas** para probar toda la funcionalidad de gestión de reservaciones. Cada estado, cada escenario, y cada característica está cubierta.

**¡Disfruta probando la nueva funcionalidad!** 🚀