# 🚀 Ejecutar Scripts de Supabase

## ⚠️ IMPORTANTE

Este script **reemplazará** las tablas existentes. Si ya tienes datos importantes:
1. **Haz backup primero** desde Supabase Dashboard > Database > Backups
2. O exporta manualmente las tablas que necesites

## 📋 Pasos para Ejecutar

### Opción 1: Script Maestro (Recomendado)

1. **Abre Supabase SQL Editor**:
   - Ve a: https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new

2. **Copia el script completo**:
   - Abre el archivo `supabase/MASTER_SETUP.sql` en tu proyecto
   - Selecciona TODO (Ctrl+A)
   - Copia (Ctrl+C)

3. **Pega y ejecuta**:
   - Pega el SQL en el editor de Supabase
   - Haz clic en **Run** (o presiona F5)
   - Espera a que se complete (puede tomar 1-2 minutos)

4. **Verifica**:
   - Al final del script verás un resumen de tablas creadas
   - Ve a **Table Editor** y verifica que existen:
     - ✅ `restaurants` (1 restaurante)
     - ✅ `products` (34 productos)
     - ✅ `users` (vacía, se llenará con usuarios)
     - ✅ `orders` (vacía)
     - ✅ Y todas las demás tablas

### Opción 2: Scripts Individuales (Si prefieres más control)

Si prefieres ejecutar paso a paso:

1. **Ejecuta el schema**:
   - `supabase/schema_optimized.sql`

2. **Ejecuta las políticas RLS**:
   - `supabase/fix_rls_policies_optimized.sql`

3. **Crea el restaurante** (ya está en el script maestro, pero si quieres hacerlo manual):
   ```sql
   INSERT INTO restaurants (id, name, slug, city, country, is_active) 
   VALUES (
     '00000000-0000-0000-0000-000000000001', 
     'DONK RESTAURANT', 
     'donk-restaurant', 
     'Ciudad de México', 
     'México', 
     true
   );
   ```

4. **Inserta los productos**:
   - `supabase/insert_products_optimized.sql`

## ✅ Verificación Post-Ejecución

Después de ejecutar el script, verifica:

1. **Tablas creadas**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Restaurante creado**:
   ```sql
   SELECT * FROM restaurants;
   ```

3. **Productos insertados**:
   ```sql
   SELECT COUNT(*) as total_productos FROM products;
   -- Debería mostrar 34
   ```

4. **Índices creados**:
   ```sql
   SELECT indexname 
   FROM pg_indexes 
   WHERE schemaname = 'public' 
   ORDER BY indexname;
   ```

## 🔧 Si hay Errores

### Error: "relation already exists"
- Las tablas ya existen. Puedes:
  - Eliminar las tablas manualmente y volver a ejecutar
  - O usar `DROP TABLE IF EXISTS` antes de crear

### Error: "foreign key constraint"
- Asegúrate de ejecutar el script completo en orden
- O ejecuta primero las tablas base (restaurants, users) y luego las dependientes

### Error: "permission denied"
- Verifica que tienes permisos de administrador en Supabase
- O ejecuta desde el SQL Editor con permisos completos

## 📊 Resultado Esperado

Después de ejecutar correctamente:

- ✅ 14 tablas creadas
- ✅ 1 restaurante insertado
- ✅ 34 productos insertados
- ✅ Índices optimizados creados
- ✅ Políticas RLS configuradas
- ✅ Triggers y funciones creados

## 🎯 Próximo Paso

Una vez ejecutado el script:

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Prueba la aplicación**:
   - Los productos deberían cargarse desde Supabase
   - El carrito debería funcionar correctamente

¡Listo! 🎉
