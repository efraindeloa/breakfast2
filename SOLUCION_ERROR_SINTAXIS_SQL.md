# 🔧 Solución: Error de Sintaxis SQL en Script user_profiles

## 📋 Problema Identificado

Al ejecutar el script `scripts/fix-user-profiles-structure.sql`, se produjo el siguiente error:

```
Error: Failed to run sql query: 
ERROR: 42601: syntax error at or near "RAISE" 
LINE 111: RAISE NOTICE '✅ Verificación y corrección de user_profiles completada';
```

## 🎯 Causa del Error

El error ocurre porque `RAISE NOTICE` debe estar dentro de un bloque `DO $$`, no puede ejecutarse directamente en el nivel superior de un script SQL.

### ❌ Código Problemático:
```sql
-- Esto causa error de sintaxis
SELECT column_name FROM information_schema.columns;

RAISE NOTICE '✅ Completado';  -- ❌ Error: fuera de bloque DO
```

### ✅ Código Correcto:
```sql
-- Esto funciona correctamente
SELECT column_name FROM information_schema.columns;

DO $$
BEGIN
    RAISE NOTICE '✅ Completado';  -- ✅ Correcto: dentro de bloque DO
END $$;
```

## ✅ Solución Implementada

### 1. Script Original Corregido

Se corrigió `scripts/fix-user-profiles-structure.sql`:

**Antes:**
```sql
SELECT column_name, data_type FROM information_schema.columns;

RAISE NOTICE '✅ Verificación completada';  -- ❌ Error
```

**Después:**
```sql
SELECT column_name, data_type FROM information_schema.columns;

-- Mensaje final
DO $$
BEGIN
    RAISE NOTICE '✅ Verificación completada';  -- ✅ Correcto
END $$;
```

### 2. Script Simplificado Creado

Se creó `scripts/fix-user-profiles-simple.sql` con:

- ✅ Sintaxis SQL correcta en todos los bloques
- ✅ Verificaciones paso a paso con mensajes informativos
- ✅ Manejo de errores mejorado
- ✅ Estructura más clara y fácil de seguir

## 🚀 Opciones para Ejecutar

### Opción 1: Script Corregido Original
```bash
# Ejecutar el script original ya corregido
psql -d tu_base_de_datos -f scripts/fix-user-profiles-structure.sql
```

### Opción 2: Script Simplificado (Recomendado)
```bash
# Ejecutar el script simplificado y más robusto
psql -d tu_base_de_datos -f scripts/fix-user-profiles-simple.sql
```

### Opción 3: Comandos Individuales
Si prefieres ejecutar paso a paso:

```sql
-- 1. Verificar si existe la tabla
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_profiles';

-- 2. Verificar estructura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Configurar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas (si es necesario)
CREATE POLICY "Users can view their own profile" 
    ON user_profiles FOR SELECT 
    USING (user_id = current_setting('app.user_id', true)::uuid);
```

## 🔍 Verificación de la Solución

### 1. Ejecutar Script Corregido:
```bash
# Debería ejecutarse sin errores de sintaxis
psql -d tu_base_de_datos -f scripts/fix-user-profiles-simple.sql
```

### 2. Salida Esperada:
```
NOTICE: ✓ Tabla user_profiles ya existe
NOTICE: ✓ Estructura correcta: no tiene columna "id"
NOTICE: ✓ Columna user_id existe correctamente
NOTICE: ✓ Trigger para updated_at creado
NOTICE: ✅ Verificación y corrección de user_profiles completada

    tabla     | column_name  | data_type | is_nullable | column_default
--------------+--------------+-----------+-------------+----------------
 user_profiles| user_id      | uuid      | NO          | 
 user_profiles| name         | text      | YES         | 
 user_profiles| phone        | text      | YES         | 
 user_profiles| bio          | text      | YES         | 
 ...
```

### 3. Probar Funcionalidad:
Después de ejecutar el script, probar la actualización de perfil:

1. Ir a `/profile`
2. Editar información del perfil
3. Guardar cambios
4. ✅ Debería funcionar sin errores

## 📁 Archivos Creados/Modificados

- ✅ `scripts/fix-user-profiles-structure.sql` - Script original corregido
- ✅ `scripts/fix-user-profiles-simple.sql` - Script simplificado y robusto
- ✅ `SOLUCION_ERROR_SINTAXIS_SQL.md` - Esta documentación

## 🎯 Diferencias Entre Scripts

### Script Original (`fix-user-profiles-structure.sql`):
- ✅ Más detallado y completo
- ✅ Incluye todas las verificaciones posibles
- ✅ Sintaxis corregida

### Script Simplificado (`fix-user-profiles-simple.sql`):
- ✅ Más fácil de leer y ejecutar
- ✅ Mejor manejo de errores
- ✅ Mensajes informativos paso a paso
- ✅ Verificaciones condicionales (no falla si algo ya existe)

## 🚨 Reglas de Sintaxis SQL

### ✅ Correcto - RAISE NOTICE en bloque DO:
```sql
DO $$
BEGIN
    RAISE NOTICE 'Mensaje informativo';
    RAISE NOTICE 'Otro mensaje';
END $$;
```

### ❌ Incorrecto - RAISE NOTICE fuera de bloque:
```sql
SELECT * FROM tabla;
RAISE NOTICE 'Esto causa error';  -- ❌ Error de sintaxis
```

### ✅ Correcto - Múltiples bloques DO:
```sql
SELECT * FROM tabla;

DO $$
BEGIN
    RAISE NOTICE 'Primer mensaje';
END $$;

SELECT * FROM otra_tabla;

DO $$
BEGIN
    RAISE NOTICE 'Segundo mensaje';
END $$;
```

## 🔄 Próximos Pasos

1. **Ejecutar script corregido:**
   ```bash
   psql -d tu_base_de_datos -f scripts/fix-user-profiles-simple.sql
   ```

2. **Verificar que no hay errores de sintaxis**

3. **Probar funcionalidad de perfil de usuario**

4. **Confirmar que el error original está resuelto**

---

**Nota**: El script simplificado (`fix-user-profiles-simple.sql`) es la opción recomendada por su robustez y claridad.