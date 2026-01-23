# Pasos para Completar la Integración de Supabase

## ✅ Paso 1: Configurar Variables de Entorno (COMPLETADO)
- ✅ Archivo `.env` creado con las credenciales correctas

## 🔨 Paso 2: Ejecutar Schema SQL en Supabase

### Instrucciones:

1. **Abre tu proyecto en Supabase**:
   - Ve a https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre el SQL Editor**:
   - En el menú lateral, haz clic en **SQL Editor**
   - O ve directamente a: https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new

3. **Copia el schema SQL**:
   - Abre el archivo `supabase/schema.sql` en tu proyecto local
   - Selecciona TODO el contenido (Ctrl+A / Cmd+A)
   - Copia (Ctrl+C / Cmd+C)

4. **Pega y ejecuta en Supabase**:
   - Pega el SQL en el editor de Supabase
   - Haz clic en el botón **Run** (o presiona F5)
   - Espera a que se complete la ejecución

5. **Verifica que se crearon las tablas**:
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver estas tablas:
     - ✅ orders
     - ✅ cart_items
     - ✅ favorite_dishes
     - ✅ saved_combinations
     - ✅ loyalty_data
     - ✅ contacts
     - ✅ waitlist_entries
     - ✅ assistance_requests
     - ✅ reviews

## 🧪 Paso 3: Verificar la Conexión

1. **Reinicia el servidor de desarrollo**:
   ```bash
   npm run dev
   ```

2. **Abre la aplicación en el navegador**:
   - Ve a http://localhost:5173
   - Abre la consola del navegador (F12)

3. **Verifica que NO aparece este mensaje**:
   - ❌ `⚠️ Supabase URL o Anon Key no están configuradas`
   
   Si NO aparece ese mensaje, significa que Supabase está configurado correctamente ✅

## 🛒 Paso 4: Probar que Funciona

1. **Agrega un producto al carrito**:
   - Ve al menú
   - Agrega un producto al carrito

2. **Verifica en Supabase**:
   - Ve a **Table Editor** > **cart_items**
   - Deberías ver el producto que agregaste

3. **Recarga la página**:
   - El carrito debería persistir (los datos vienen de Supabase, no de localStorage)

## 📋 Próximos Pasos (Opcionales)

Una vez que verifiques que el carrito funciona:

- [ ] Migrar `FavoritesContext` para usar Supabase
- [ ] Migrar `LoyaltyContext` para usar Supabase
- [ ] Migrar `OrderScreen` para usar Supabase
- [ ] Implementar autenticación real de Supabase

## ❓ ¿Problemas?

Si encuentras algún error:

1. **Error al ejecutar el SQL**:
   - Verifica que copiaste TODO el contenido del archivo
   - Revisa los mensajes de error en Supabase
   - Algunas tablas pueden ya existir (eso está bien)

2. **Error de conexión**:
   - Verifica que el archivo `.env` está en la raíz del proyecto
   - Verifica que las variables comienzan con `VITE_`
   - Reinicia el servidor después de crear/editar `.env`

3. **Los datos no se guardan**:
   - Revisa la consola del navegador para errores
   - Verifica que las tablas se crearon correctamente
   - Verifica que las políticas RLS permiten la operación
