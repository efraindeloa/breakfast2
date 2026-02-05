# 🔧 Solución: Account Type Incorrecto para Restaurantes

## 📋 Problema Identificado
Cuando se registra una cuenta de restaurante, el usuario se crea con `account_type = 'customer'` en lugar de `account_type = 'owner'`.

## 🎯 Causa del Problema
El código de registro no estaba especificando el tipo de cuenta correcto al crear usuarios para restaurantes.

## ✅ Solución Implementada

### 1. Código Corregido
Se actualizaron los siguientes archivos:

**`services/simple-auth.ts`:**
- Agregado parámetro opcional `account_type` a la función `simpleSignUp`
- Se establece el `account_type` al crear el usuario en la base de datos

**`screens/RegisterScreen.tsx`:**
- Se pasa `account_type: 'owner'` cuando `registerType === 'restaurant'`
- Se pasa `account_type: 'customer'` para registros normales

### 2. Script para Corregir Usuarios Existentes
Ejecuta este script para corregir usuarios que ya se registraron como restaurantes:

```sql
-- Ejecutar en Supabase SQL Editor
-- Archivo: scripts/fix-existing-restaurant-owners.sql
```

## 🚀 Cómo Aplicar la Solución

### Paso 1: Los Nuevos Registros Ya Funcionan
Los cambios en el código ya están aplicados. Los nuevos registros de restaurantes tendrán `account_type = 'owner'` automáticamente.

### Paso 2: Corregir Usuarios Existentes
1. Ve a **Supabase Dashboard** → **SQL Editor**
2. Copia y pega el contenido de `scripts/fix-existing-restaurant-owners.sql`
3. Ejecuta el script

El script:
- ✅ Identifica usuarios que son owners pero están marcados como customer
- ✅ Los actualiza a `account_type = 'owner'`
- ✅ Muestra un resumen de los cambios

### Paso 3: Verificar el Resultado
Después de ejecutar el script, verifica:

```sql
-- Ver todos los tipos de cuenta
SELECT 
    account_type,
    COUNT(*) as total_users
FROM users 
WHERE is_active = true
GROUP BY account_type;

-- Ver usuarios owners específicamente
SELECT 
    u.email,
    u.name,
    u.account_type,
    r.name as restaurant_name
FROM users u
JOIN restaurant_staff rs ON u.id = rs.user_id
JOIN restaurants r ON rs.restaurant_id = r.id
WHERE u.account_type = 'owner' 
  AND rs.role = 'owner'
  AND rs.is_active = true;
```

## 🔍 Tipos de Cuenta Disponibles

| Tipo | Descripción |
|------|-------------|
| `owner` | Dueño del restaurante |
| `manager` | Gerente |
| `hostess` | Anfitriona |
| `waiter` | Mesero |
| `cashier` | Cajero |
| `kitchen` | Personal de cocina |
| `delivery_driver` | Repartidor |
| `delivery_manager` | Gerente de entregas |
| `accountant` | Contador |
| `support` | Soporte técnico |
| `customer` | Cliente (por defecto) |
| `valet_parking` | Valet parking |

## 🧪 Prueba la Solución

1. **Registra un nuevo restaurante:**
   - Ve a la página de registro
   - Selecciona "Restaurante"
   - Completa el formulario
   - Verifica que el usuario tenga `account_type = 'owner'`

2. **Verifica en la base de datos:**
   ```sql
   SELECT email, name, account_type 
   FROM users 
   WHERE email = 'tu_email_de_prueba@example.com';
   ```

## ⚡ Beneficios de la Solución

- ✅ **Nuevos registros correctos:** Los restaurantes tendrán `account_type = 'owner'`
- ✅ **Usuarios existentes corregidos:** Script para actualizar registros anteriores
- ✅ **Sistema escalable:** Fácil agregar más tipos de cuenta en el futuro
- ✅ **Control de permisos:** Usar `account_type` para controlar acceso en la app

## 🔄 Próximos Pasos Recomendados

1. **Implementar control de permisos:** Usar `account_type` en la lógica de la aplicación
2. **Dashboard diferenciado:** Mostrar diferentes interfaces según el tipo de cuenta
3. **Roles adicionales:** Agregar más roles para staff del restaurante si es necesario

---

**Nota:** Esta solución es retrocompatible y no afecta la funcionalidad existente.