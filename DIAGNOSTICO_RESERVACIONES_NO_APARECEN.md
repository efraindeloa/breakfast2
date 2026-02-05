# 🔍 Diagnóstico: Las Reservaciones No Aparecen

## 🎯 Problema

La pantalla de gestión de reservaciones (`/gestionar-reservaciones`) no muestra información o aparece vacía.

## 🔧 Solución Rápida (Recomendada)

**Ejecuta este script para corregir automáticamente:**

```bash
psql -d tu_base_de_datos -f scripts/fix-reservations-setup.sql
```

Este script:
- ✅ Crea usuario administrador si no existe
- ✅ Crea restaurante demo si no existe  
- ✅ Conecta usuario con restaurante
- ✅ Crea reservaciones de ejemplo
- ✅ Verifica que todo esté conectado

## 🔍 Diagnóstico Manual

### Paso 1: Verificar Datos Básicos

```bash
psql -d tu_base_de_datos -f scripts/debug-reservations.sql
```

**Busca estos problemas comunes:**

❌ **"Total reservaciones: 0"**
- **Problema**: No hay reservaciones en la BD
- **Solución**: `psql -d tu_bd -f scripts/insert-sample-reservations-simple.sql`

❌ **"Usuarios: 0"**  
- **Problema**: No hay usuarios
- **Solución**: Crea una cuenta desde `/register`

❌ **"Restaurantes: 0"**
- **Problema**: No hay restaurantes
- **Solución**: El script de fix creará uno automáticamente

❌ **"Staff activo: 0"**
- **Problema**: Usuario no está asociado a restaurante
- **Solución**: El script de fix creará la relación

### Paso 2: Verificar Conexiones

```bash
psql -d tu_base_de_datos -f scripts/test-restaurant-connection.sql
```

**Verifica que:**
- ✅ Hay usuarios con `account_type = 'owner'`
- ✅ Hay restaurantes con `is_active = true`
- ✅ Hay relaciones en `restaurant_staff` activas
- ✅ Las reservaciones tienen `restaurant_id` válido

### Paso 3: Verificar Autenticación

**En el navegador (DevTools → Console):**

```javascript
// Verificar usuario actual
console.log(localStorage.getItem('simpleAuthUser'));

// Debería mostrar algo como:
// {"id":"uuid-del-usuario","email":"tu@email.com","name":"Tu Nombre"}
```

**Si no hay usuario logueado:**
1. Ve a `/login`
2. Inicia sesión con cuenta de restaurante
3. Verifica que `account_type` sea `'owner'`

### Paso 4: Verificar API

**En DevTools → Network:**

1. Ve a `/gestionar-reservaciones`
2. Busca estas llamadas:
   - `POST /rest/v1/rpc/set_config` (debería ser 200 OK)
   - `GET /rest/v1/reservations` (debería ser 200 OK)

**Si hay errores 401/403:**
- Problema de autenticación o RLS
- Ejecuta: `psql -d tu_bd -f scripts/fix-user-profiles-rls.sql`

**Si hay error 404:**
- La tabla `reservations` no existe
- Ejecuta el script de creación de tablas

## 🚨 Problemas Comunes y Soluciones

### 1. "No hay reservaciones para esta fecha"

**Causa**: Las reservaciones están en fechas diferentes

**Solución**:
```sql
-- Ver qué fechas tienen reservaciones
SELECT reservation_date, COUNT(*) 
FROM reservations 
GROUP BY reservation_date 
ORDER BY reservation_date;

-- Cambiar fechas a hoy
UPDATE reservations 
SET reservation_date = CURRENT_DATE 
WHERE notes LIKE 'EJEMPLO -%' OR notes LIKE 'DEMO -%';
```

### 2. "Error al cargar reservaciones"

**Causa**: Problema de API o autenticación

**Soluciones**:
```sql
-- Verificar RLS
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

-- O configurar RLS correctamente
\i scripts/fix-user-profiles-rls.sql
```

### 3. "Usuario no autenticado"

**Causa**: Sesión expirada o problema de auth

**Soluciones**:
1. Cerrar sesión y volver a iniciar
2. Limpiar localStorage: `localStorage.clear()`
3. Verificar que el usuario sea tipo `'owner'`

### 4. "No se pudo obtener el ID del restaurante"

**Causa**: Usuario no está asociado a ningún restaurante

**Solución**:
```sql
-- Ver relaciones actuales
SELECT u.email, r.name, rs.role, rs.is_active
FROM restaurant_staff rs
JOIN users u ON rs.user_id = u.id  
JOIN restaurants r ON rs.restaurant_id = r.id;

-- Crear relación si no existe
INSERT INTO restaurant_staff (user_id, restaurant_id, role, is_active)
SELECT 
    (SELECT id FROM users WHERE email = 'tu@email.com'),
    (SELECT id FROM restaurants LIMIT 1),
    'owner',
    true;
```

## 🧪 Casos de Prueba

### Test 1: Datos Básicos
```sql
-- Debe retornar números > 0
SELECT 
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM restaurants) as restaurantes,
    (SELECT COUNT(*) FROM reservations) as reservaciones,
    (SELECT COUNT(*) FROM restaurant_staff WHERE is_active = true) as staff;
```

### Test 2: Usuario Actual
```javascript
// En DevTools Console
const user = JSON.parse(localStorage.getItem('simpleAuthUser') || '{}');
console.log('Usuario:', user);
console.log('Tipo de cuenta:', user.account_type); // Debe ser 'owner'
```

### Test 3: API Manual
```javascript
// En DevTools Console - simular llamada API
fetch('/rest/v1/reservations?restaurant_id=eq.RESTAURANT_ID')
  .then(r => r.json())
  .then(data => console.log('Reservaciones:', data));
```

## 📋 Checklist de Verificación

### ✅ Base de Datos:
- [ ] Tabla `reservations` existe
- [ ] Hay al menos 1 usuario
- [ ] Hay al menos 1 restaurante  
- [ ] Hay relaciones en `restaurant_staff`
- [ ] Hay reservaciones de ejemplo

### ✅ Autenticación:
- [ ] Usuario está logueado
- [ ] Usuario tiene `account_type = 'owner'`
- [ ] Usuario está en `restaurant_staff`
- [ ] RLS está configurado correctamente

### ✅ Frontend:
- [ ] No hay errores en Console
- [ ] API calls retornan 200 OK
- [ ] Componente se renderiza sin crashes
- [ ] Filtros funcionan correctamente

## 🎯 Flujo de Solución Recomendado

### 1. Solución Automática (Más Rápida):
```bash
# Esto debería resolver el 90% de los problemas
psql -d tu_base_de_datos -f scripts/fix-reservations-setup.sql
```

### 2. Si Aún No Funciona:
```bash
# Diagnóstico detallado
psql -d tu_base_de_datos -f scripts/debug-reservations.sql
psql -d tu_base_de_datos -f scripts/test-restaurant-connection.sql
```

### 3. Verificación Manual:
1. Revisa la consola del navegador
2. Verifica que estés logueado como `owner`
3. Prueba con diferentes fechas en el filtro
4. Verifica la pestaña Network por errores de API

### 4. Último Recurso:
```sql
-- Desactivar RLS temporalmente para debug
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff DISABLE ROW LEVEL SECURITY;

-- Después de verificar, volver a activar
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;
```

## 💡 Consejos Adicionales

### ✅ Para Desarrollo:
- Usa siempre el script `fix-reservations-setup.sql` en BD nuevas
- Mantén al menos un usuario `owner` y un restaurante activo
- Las reservaciones de ejemplo facilitan el testing

### ✅ Para Producción:
- Verifica que RLS esté habilitado
- Asegúrate de que los usuarios estén correctamente asociados
- Monitorea errores de API en logs

---

## 🎉 Resultado Esperado

Después de seguir estos pasos, deberías ver:

```
📊 Estadísticas:
├── 2 Pendientes
├── 2 Confirmadas  
├── 1 Completada
├── 1 Cancelada
└── 16 Comensales Total

📅 Reservaciones agrupadas por hora
🔍 Filtros funcionando correctamente
👁️ Detalles completos en modales
```

**¡Si sigues estos pasos, las reservaciones deberían aparecer correctamente!** 🚀