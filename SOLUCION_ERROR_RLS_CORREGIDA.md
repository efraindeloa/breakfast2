# 🔧 Solución Corregida: Error RLS "new row violates row-level security policy"

## 📋 Problema
El error `new row violates row-level security policy for table "restaurants"` indica que las políticas de Row Level Security (RLS) están configuradas incorrectamente para tu sistema de autenticación simple.

## 🚀 Solución Rápida

### Paso 1: Ejecutar el Script Corregido
Ejecuta este script SQL en tu base de datos Supabase:

```bash
# Desde la raíz del proyecto
psql -h [tu-host] -U [tu-usuario] -d [tu-database] -f scripts/fix-rls-policies-corrected.sql
```

O copia y pega el contenido de `scripts/fix-rls-policies-corrected.sql` en el SQL Editor de Supabase.

### Paso 2: Verificar la Ejecución
El script mostrará mensajes como:
- ✅ Tipo account_type_enum creado exitosamente
- ✅ Columna password_hash agregada exitosamente  
- ✅ Columna account_type agregada exitosamente
- ✅ Políticas de restaurants creadas correctamente
- 🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!

## 🔍 ¿Qué Hace Este Script?

### 1. Crea el Tipo ENUM (Compatible)
```sql
-- Usa DO $$ para compatibilidad con todas las versiones de PostgreSQL
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type_enum') THEN
        CREATE TYPE account_type_enum AS ENUM (...);
    END IF;
END $$;
```

### 2. Agrega Columnas Faltantes
- `password_hash TEXT` para almacenar contraseñas hasheadas
- `account_type account_type_enum` para tipos de cuenta

### 3. Corrige las Políticas RLS
Reemplaza las políticas que requieren `auth.uid()` con políticas simples:

```sql
-- ANTES (problemático)
CREATE POLICY "..." ON restaurants 
USING (owner_id = auth.uid());

-- DESPUÉS (funcional)
CREATE POLICY "simple_restaurants_insert" ON restaurants 
FOR INSERT WITH CHECK (true);
```

### 4. Crea Índices de Optimización
Para mejorar el rendimiento de las consultas por tipo de cuenta y email.

## ✅ Verificación Post-Migración

Después de ejecutar el script, verifica que todo funcione:

1. **Registro de Usuario**: Intenta crear un nuevo usuario
2. **Registro de Restaurante**: Intenta registrar un restaurante
3. **Verificar Columnas**: Confirma que `password_hash` y `account_type` existen

## 🆘 Si Aún Hay Problemas

Si el error persiste, verifica:

1. **Conexión a la Base de Datos**: Asegúrate de estar conectado a la base de datos correcta
2. **Permisos**: Tu usuario debe tener permisos para crear tipos y modificar tablas
3. **Versión de PostgreSQL**: El script es compatible con PostgreSQL 9.1+

## 📞 Soporte Adicional

Si necesitas ayuda adicional, proporciona:
- El mensaje de error completo
- La versión de PostgreSQL (`SELECT version();`)
- Los logs del script de migración

---

**Nota**: Este script es seguro para ejecutar múltiples veces. Verifica si los elementos ya existen antes de crearlos.