# Migración de Productos a Supabase

## ✅ Pasos Completados

1. ✅ Creada tabla `products` en Supabase (`supabase/products_schema.sql`)
2. ✅ Creado script de inserción (`supabase/insert_products.sql`)
3. ✅ Creadas funciones en `services/database.ts` para obtener productos
4. ✅ Creado `ProductsContext` para manejar productos
5. ✅ Integrado `ProductsProvider` en `App.tsx`
6. ✅ Actualizado `MenuScreen.tsx` para usar productos de Supabase
7. ✅ Actualizado `DishDetailScreen.tsx` para usar productos de Supabase

## 📋 Pasos para Ejecutar

### 1. Ejecutar Schema de Productos

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw
2. Abre **SQL Editor**
3. Abre el archivo `supabase/products_schema.sql` en tu proyecto local
4. Copia TODO el contenido
5. Pégalo en el SQL Editor de Supabase
6. Ejecuta el script (botón "Run" o F5)

Esto creará la tabla `products` con todos los índices y políticas necesarias.

### 2. Insertar Productos

1. En el mismo SQL Editor de Supabase
2. Abre el archivo `supabase/insert_products.sql` en tu proyecto local
3. Copia TODO el contenido
4. Pégalo en el SQL Editor de Supabase
5. Ejecuta el script (botón "Run" o F5)

Esto insertará todos los 34 productos (platillos, bebidas, postres, coctelería) en la base de datos.

### 3. Verificar

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `products`
3. Deberías ver 34 productos

### 4. Probar en la Aplicación

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre la aplicación en el navegador
3. Ve al menú
4. Los productos deberían cargarse desde Supabase
5. Si no hay productos en Supabase, se usarán los hardcodeados como fallback

## 🔄 Funcionamiento

- **Con productos en Supabase**: La aplicación carga productos desde la base de datos
- **Sin productos en Supabase**: La aplicación usa los productos hardcodeados como fallback
- **Sistema híbrido**: Si hay productos en Supabase, se usan; si no, se usan los hardcodeados

## 📝 Notas

- Los productos hardcodeados se mantienen como fallback
- El sistema funciona automáticamente sin necesidad de configuración adicional
- Los productos se cargan una vez al iniciar la aplicación
- Puedes actualizar productos en Supabase y se reflejarán en la aplicación después de recargar
