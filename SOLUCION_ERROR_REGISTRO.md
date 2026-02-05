# 🚨 Solución: Error "Could not find the 'password_hash' column"

## Problema
Al intentar registrar un usuario como restaurante, aparece el error:
```
Registration error: Could not find the 'password_hash' column of 'users' in the schema cache
```

## Causa
La tabla `users` en la base de datos no tiene las columnas `password_hash` y `account_type` que el código está intentando usar.

## ✅ Solución Rápida

### Opción 1: Usar Supabase Dashboard (Recomendado)
1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ve a **SQL Editor**
3. Copia y pega el siguiente SQL:

```sql
-- Crear tipo ENUM para los tipos de cuenta (si no existe)
DO $$ BEGIN
    CREATE TYPE account_type_enum AS ENUM (
      'owner', 'manager', 'hostess', 'waiter', 'cashier', 'kitchen',
      'delivery_driver', 'delivery_manager', 'accountant', 'support', 
      'customer', 'valet_parking'
    );
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'account_type_enum ya existe, continuando...';
END $$;

-- Agregar columnas faltantes
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type account_type_enum NOT NULL DEFAULT 'customer';

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email_active ON users(email, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_account_type ON users(account_type);
CREATE INDEX IF NOT EXISTS idx_users_account_type_active ON users(account_type, is_active) WHERE is_active = true;
```

4. Haz clic en **Run** para ejecutar
5. Verifica que aparezca "Success" sin errores

### Opción 2: Usar CLI de Supabase
Si tienes el CLI instalado:

```bash
# Ejecutar el script de corrección
supabase db push --db-url "tu_database_url" < scripts/fix-users-table.sql
```

### Opción 3: Usar el script JavaScript
```bash
# Configurar variables de entorno primero
export VITE_SUPABASE_URL="tu_supabase_url"
export SUPABASE_SERVICE_KEY="tu_service_key"

# Ejecutar script
node scripts/apply-user-columns-migration.js
```

## 🔍 Verificación

Después de aplicar la solución, verifica que funcione:

1. **En Supabase Dashboard:**
   - Ve a **Table Editor** → **users**
   - Verifica que existan las columnas:
     - `password_hash` (text, nullable)
     - `account_type` (account_type_enum, not null, default: 'customer')

2. **En la aplicación:**
   - Intenta registrar un nuevo usuario
   - El error debería desaparecer

## 📋 Columnas de la Tabla Users (Actualizada)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'es',
  account_type account_type_enum NOT NULL DEFAULT 'customer',
  password_hash TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);
```

## 🎯 Tipos de Cuenta Disponibles

- `owner` - Dueño del restaurante
- `manager` - Gerente
- `hostess` - Anfitriona
- `waiter` - Mesero
- `cashier` - Cajero
- `kitchen` - Personal de cocina
- `delivery_driver` - Repartidor
- `delivery_manager` - Gerente de entregas
- `accountant` - Contador
- `support` - Soporte técnico
- `customer` - Cliente (por defecto)
- `valet_parking` - Valet parking

## 🚀 Próximos Pasos

Una vez solucionado el error:

1. **Probar el registro:** Intenta registrar un usuario para confirmar que funciona
2. **Verificar tipos de cuenta:** Los nuevos usuarios tendrán `account_type = 'customer'` por defecto
3. **Implementar roles:** Usa el campo `account_type` para controlar permisos en la aplicación

## ⚠️ Notas Importantes

- **Usuarios existentes:** Automáticamente tendrán `account_type = 'customer'`
- **Compatibilidad:** Los cambios son retrocompatibles
- **Índices:** Se crean automáticamente para optimizar consultas
- **Seguridad:** La columna `password_hash` almacena contraseñas hasheadas, nunca en texto plano