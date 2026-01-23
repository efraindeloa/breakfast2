# Integración de Supabase

Esta aplicación ahora está integrada con Supabase para el almacenamiento de datos. La aplicación funciona con un sistema de fallback: si Supabase no está configurado, usará localStorage como respaldo.

## Configuración Inicial

### 1. Crear un Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera a que se complete la configuración (puede tomar unos minutos)

### 2. Configurar las Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Obtén tus credenciales de Supabase:
   - Ve a tu proyecto en Supabase
   - Navega a **Settings** > **API**
   - Copia la **URL** del proyecto
   - Copia la **anon/public key**

3. Edita el archivo `.env` y pega tus credenciales:
   ```env
   VITE_SUPABASE_URL=https://tkwackqrnsqlmxtalvuw.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrd2Fja3FybnNxbG14dGFsdnV3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMTU3NzEsImV4cCI6MjA4NDY5MTc3MX0.1PG0x0ZdAAjhunyiPBRzpgpsr9nZGV5epHdUvalHqbA
   ```
   
   **Nota importante**: La clave anon debe ser un token JWT completo que comienza con `eyJ`. Asegúrate de copiar toda la clave completa.

### 3. Crear las Tablas en Supabase

1. Ve a tu proyecto en Supabase
2. Navega a **SQL Editor**
3. Abre el archivo `supabase/schema.sql` de este proyecto
4. Copia todo el contenido del archivo
5. Pega el SQL en el editor de Supabase
6. Ejecuta el script (botón "Run" o F5)

Esto creará todas las tablas, índices, funciones y políticas de seguridad necesarias.

### 4. Verificar la Configuración

1. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. La aplicación debería conectarse automáticamente a Supabase
3. Si hay algún error, revisa la consola del navegador

## Estructura de Datos

### Tablas Principales

- **orders**: Órdenes de los usuarios
- **cart_items**: Items en el carrito de compras
- **favorite_dishes**: Platillos favoritos
- **saved_combinations**: Combinaciones guardadas
- **loyalty_data**: Datos del programa de lealtad
- **contacts**: Contactos del usuario
- **waitlist_entries**: Entradas en la lista de espera
- **assistance_requests**: Solicitudes de asistencia
- **reviews**: Reseñas de productos

## Funcionamiento

### Sistema de Fallback

La aplicación está diseñada para funcionar con o sin Supabase:

- **Con Supabase configurado**: Todos los datos se guardan en la base de datos
- **Sin Supabase configurado**: Los datos se guardan en localStorage (comportamiento anterior)

### Servicio de Base de Datos

Todas las operaciones de base de datos están centralizadas en `services/database.ts`. Este archivo proporciona funciones para:

- Obtener datos (`getOrders`, `getCart`, `getFavorites`, etc.)
- Crear datos (`createOrder`, `addToCart`, `addFavorite`, etc.)
- Actualizar datos (`updateOrder`, `updateLoyaltyData`, etc.)
- Eliminar datos (`removeFromCart`, `removeFavorite`, etc.)

### Migración de Datos

Si ya tienes datos en localStorage y quieres migrarlos a Supabase:

1. Los datos se migrarán automáticamente cuando uses la aplicación
2. O puedes crear un script de migración personalizado usando las funciones de `services/database.ts`

## Seguridad

### Row Level Security (RLS)

Todas las tablas tienen RLS habilitado. Las políticas permiten que:

- Los usuarios solo vean/editen sus propios datos
- Las reseñas sean visibles para todos, pero solo editables por el autor

### Autenticación

Actualmente, la aplicación usa un `user_id` temporal almacenado en localStorage. Para producción, se recomienda:

1. Implementar autenticación de Supabase (`supabase.auth`)
2. Usar el `user_id` real del usuario autenticado
3. Ajustar las políticas RLS para usar `auth.uid()`

## Desarrollo

### Pruebas Locales

Para desarrollo local sin Supabase:

1. No configures las variables de entorno
2. La aplicación usará localStorage automáticamente
3. Todos los datos se guardarán localmente

### Pruebas con Supabase

1. Configura las variables de entorno
2. Crea las tablas usando el schema SQL
3. La aplicación se conectará automáticamente a Supabase

## Troubleshooting

### Error: "Supabase URL o Anon Key no están configuradas"

- Verifica que el archivo `.env` existe
- Verifica que las variables comienzan con `VITE_`
- Reinicia el servidor de desarrollo después de crear/editar `.env`

### Error: "relation does not exist"

- Asegúrate de haber ejecutado el script SQL en Supabase
- Verifica que todas las tablas se crearon correctamente en el SQL Editor

### Los datos no se guardan

- Revisa la consola del navegador para errores
- Verifica que las políticas RLS permiten la operación
- Si no usas autenticación, las políticas deben usar `current_setting('app.user_id', true)`

## Próximos Pasos

1. **Autenticación**: Implementar autenticación real de Supabase
2. **Sincronización en Tiempo Real**: Usar Supabase Realtime para actualizaciones en vivo
3. **Storage**: Usar Supabase Storage para imágenes de productos
4. **Funciones Edge**: Crear funciones serverless para lógica compleja
