# Tipos de Cuenta de Usuario

## Descripción
Se ha agregado una nueva columna `account_type` a la tabla `users` para identificar el tipo de cuenta y rol de cada usuario en el sistema.

## Tipos de Cuenta Disponibles

### 🏢 **Administración y Gestión**
- **`owner`** - Dueño del restaurante
  - Acceso completo a todas las funcionalidades
  - Puede gestionar otros usuarios y permisos
  - Control total sobre configuración del restaurante

- **`manager`** - Gerente
  - Acceso a la mayoría de funcionalidades administrativas
  - Puede supervisar operaciones diarias
  - Acceso a reportes y análisis

- **`accountant`** - Contador
  - Acceso a información financiera y contable
  - Puede generar reportes de ventas
  - Gestión de facturación

### 👥 **Personal de Servicio**
- **`hostess`** - Anfitriona/Hostess
  - Gestión de reservas y lista de espera
  - Recepción de clientes
  - Asignación de mesas

- **`waiter`** - Mesero/Camarero
  - Toma de órdenes
  - Gestión de mesas asignadas
  - Comunicación con cocina

- **`cashier`** - Cajero
  - Procesamiento de pagos
  - Manejo de caja registradora
  - Generación de tickets y facturas

### 🍳 **Área de Cocina**
- **`kitchen`** - Personal de Cocina
  - Visualización de órdenes
  - Actualización de estado de platillos
  - Gestión de inventario de cocina

### 🚗 **Entregas y Servicios**
- **`delivery_driver`** - Repartidor
  - Gestión de entregas asignadas
  - Actualización de estado de entrega
  - Navegación y rutas

- **`delivery_manager`** - Gerente de Entregas
  - Coordinación de repartidores
  - Optimización de rutas
  - Supervisión de entregas

- **`valet_parking`** - Valet Parking
  - Gestión de estacionamiento
  - Control de llaves de vehículos
  - Servicio de aparcacoches

### 🛠️ **Soporte y Clientes**
- **`support`** - Soporte Técnico
  - Asistencia técnica
  - Resolución de problemas
  - Mantenimiento del sistema

- **`customer`** - Cliente (por defecto)
  - Realizar pedidos
  - Ver historial de órdenes
  - Gestionar perfil personal

## Implementación Técnica

### Base de Datos
```sql
-- Tipo ENUM definido
CREATE TYPE account_type_enum AS ENUM (
  'owner', 'manager', 'hostess', 'waiter', 'cashier', 
  'kitchen', 'delivery_driver', 'delivery_manager', 
  'accountant', 'support', 'customer', 'valet_parking'
);

-- Columna agregada a la tabla users
ALTER TABLE users 
ADD COLUMN account_type account_type_enum NOT NULL DEFAULT 'customer';
```

### Índices Creados
- `idx_users_account_type` - Para búsquedas por tipo de cuenta
- `idx_users_account_type_active` - Para búsquedas de usuarios activos por tipo

### Archivos Modificados
1. `supabase/migrations/20260205000001_add_account_type_to_users.sql` - Migración principal
2. `supabase/schema_optimized.sql` - Esquema optimizado actualizado
3. `supabase/MASTER_SETUP.sql` - Esquema maestro actualizado

## Uso en la Aplicación

### Ejemplo de Consultas
```sql
-- Obtener todos los meseros activos
SELECT * FROM users 
WHERE account_type = 'waiter' AND is_active = true;

-- Obtener personal de cocina
SELECT * FROM users 
WHERE account_type = 'kitchen' AND is_active = true;

-- Obtener administradores (owners y managers)
SELECT * FROM users 
WHERE account_type IN ('owner', 'manager') AND is_active = true;
```

### Control de Acceso
Los tipos de cuenta se pueden usar para:
- Implementar control de acceso basado en roles (RBAC)
- Mostrar interfaces específicas según el tipo de usuario
- Filtrar funcionalidades disponibles
- Generar reportes por tipo de personal

## Migración
- **Valor por defecto**: Todos los usuarios existentes tendrán `account_type = 'customer'`
- **Compatibilidad**: La migración es compatible con versiones anteriores
- **Índices**: Se crean automáticamente para optimizar consultas

## Próximos Pasos
1. Implementar middleware de autenticación basado en roles
2. Crear interfaces específicas para cada tipo de usuario
3. Configurar permisos granulares por tipo de cuenta
4. Implementar sistema de asignación de roles por administradores