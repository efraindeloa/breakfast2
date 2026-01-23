# Almacenamiento de Imágenes (Supabase Storage)

## Descripción General

La aplicación utiliza Supabase Storage para almacenar imágenes que los restaurantes suben y que los comensales necesitan acceder. Todas las imágenes son públicas para lectura, pero solo usuarios autenticados pueden subirlas.

## Arquitectura

### Buckets Configurados

1. **`product-images`**
   - Propósito: Imágenes de productos del menú
   - Tamaño máximo: 5MB
   - Formatos permitidos: JPEG, JPG, PNG, WebP, GIF
   - Acceso: Lectura pública, escritura autenticada

2. **`restaurant-images`**
   - Propósito: Logos y portadas de restaurantes
   - Tamaño máximo: 10MB
   - Formatos permitidos: JPEG, JPG, PNG, WebP, GIF
   - Acceso: Lectura pública, escritura autenticada

3. **`user-avatars`**
   - Propósito: Avatares de usuarios/comensales
   - Tamaño máximo: 2MB
   - Formatos permitidos: JPEG, JPG, PNG, WebP
   - Acceso: Lectura pública, escritura autenticada (solo su propio avatar)

4. **`promotion-images`**
   - Propósito: Imágenes de promociones
   - Tamaño máximo: 5MB
   - Formatos permitidos: JPEG, JPG, PNG, WebP, GIF
   - Acceso: Lectura pública, escritura autenticada

5. **`coupon-images`**
   - Propósito: Imágenes de cupones
   - Tamaño máximo: 5MB
   - Formatos permitidos: JPEG, JPG, PNG, WebP, GIF
   - Acceso: Lectura pública, escritura autenticada

## Políticas de Seguridad (RLS)

### Lectura (SELECT)
- **Público**: Cualquier persona puede ver las imágenes sin autenticación
- Esto permite que los comensales accedan a las imágenes sin necesidad de login

### Escritura (INSERT/UPDATE/DELETE)
- **Autenticado**: Solo usuarios autenticados pueden subir/modificar/eliminar imágenes
- Para avatares: Los usuarios solo pueden modificar sus propias imágenes (basado en carpeta de usuario)

## Estructura de URLs

Las imágenes almacenadas en Supabase Storage tienen la siguiente estructura de URL:

```
https://[PROJECT_REF].supabase.co/storage/v1/object/public/[BUCKET_NAME]/[FILE_PATH]
```

Ejemplo:
```
https://tkwackqrnsqlmxtalvuw.supabase.co/storage/v1/object/public/product-images/products/taco-atun.jpg
```

## Funciones de la API

### `uploadImage(bucketName, filePath, file)`
Sube una imagen a Supabase Storage.

**Parámetros:**
- `bucketName`: Nombre del bucket (ej: 'product-images')
- `filePath`: Ruta donde guardar el archivo (ej: 'products/product-123.jpg')
- `file`: Archivo a subir (File o Blob)

**Retorna:** URL pública de la imagen subida, o `null` si hay error

**Ejemplo:**
```typescript
const file = event.target.files[0];
const imageUrl = await uploadImage('product-images', `products/${productId}.jpg`, file);
if (imageUrl) {
  // Actualizar producto con la nueva URL
  await updateProduct(productId, { image_url: imageUrl });
}
```

### `deleteImage(bucketName, filePath)`
Elimina una imagen de Supabase Storage.

**Parámetros:**
- `bucketName`: Nombre del bucket
- `filePath`: Ruta del archivo a eliminar

**Retorna:** `true` si se eliminó correctamente, `false` en caso contrario

### `getImageUrl(bucketName, filePath)`
Obtiene la URL pública de una imagen almacenada.

**Parámetros:**
- `bucketName`: Nombre del bucket
- `filePath`: Ruta del archivo

**Retorna:** URL pública de la imagen

### Helpers Específicos

- `getProductImageUrl(imageUrl)`: Obtiene URL de imagen de producto
- `getRestaurantImageUrl(imageUrl, type)`: Obtiene URL de imagen de restaurante (logo o cover)
- `getUserAvatarUrl(imageUrl)`: Obtiene URL de avatar de usuario

Estos helpers manejan automáticamente:
- URLs completas (http/https) - las retornan tal cual
- Rutas relativas - las convierten a URLs de Supabase Storage
- Fallback a rutas locales si Supabase no está configurado

## Flujo de Trabajo

### Para Restaurantes (Subir Imagen)

1. El restaurante selecciona una imagen desde su dispositivo
2. Se valida el tamaño y formato del archivo
3. Se genera una ruta única (ej: `products/[restaurant_id]/[product_id].jpg`)
4. Se sube la imagen usando `uploadImage()`
5. Se actualiza el registro en la base de datos con la nueva `image_url`

### Para Comensales (Ver Imagen)

1. El comensal accede a un producto/restaurante
2. La aplicación obtiene `image_url` de la base de datos
3. Se usa `getProductImageUrl()` o `getRestaurantImageUrl()` para obtener la URL pública
4. La imagen se muestra en el navegador

## Migración desde Archivos Locales

Si actualmente tienes imágenes en la carpeta `public/`, puedes:

1. **Opción 1: Mantener archivos locales**
   - Las funciones helper detectan URLs locales y las manejan correctamente
   - No es necesario migrar todas las imágenes de inmediato

2. **Opción 2: Migrar a Supabase Storage**
   - Subir imágenes existentes usando `uploadImage()`
   - Actualizar `image_url` en la base de datos
   - Las nuevas imágenes se subirán automáticamente a Storage

## Consideraciones de Rendimiento

1. **CDN**: Supabase Storage utiliza CDN, por lo que las imágenes se sirven rápidamente desde ubicaciones cercanas al usuario

2. **Caché**: Las imágenes tienen un `cacheControl` de 3600 segundos (1 hora)

3. **Optimización**: Se recomienda:
   - Usar formatos modernos (WebP) cuando sea posible
   - Comprimir imágenes antes de subirlas
   - Usar tamaños apropiados (no subir imágenes de 10MB si solo se mostrarán a 200x200px)

## Seguridad

- Las políticas RLS previenen que usuarios no autenticados suban imágenes
- Los usuarios solo pueden modificar sus propios avatares
- Los restaurantes pueden subir imágenes a sus buckets correspondientes
- Las imágenes son públicas para lectura, lo cual es necesario para que los comensales las vean

## Troubleshooting

### Error: "Bucket not found"
- Verifica que hayas ejecutado `supabase/storage_setup.sql`
- Verifica que el nombre del bucket sea correcto

### Error: "new row violates row-level security policy"
- Verifica que las políticas RLS estén configuradas correctamente
- Asegúrate de estar autenticado para operaciones de escritura

### Las imágenes no se muestran
- Verifica que la URL pública sea correcta
- Verifica que el bucket sea público
- Verifica que la ruta del archivo sea correcta
