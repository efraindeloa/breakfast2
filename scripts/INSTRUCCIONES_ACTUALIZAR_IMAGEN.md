# Instrucciones para Actualizar la Imagen del Restaurante

## Opción 1: Desde la Consola del Navegador (Recomendado)

1. Abre la aplicación en tu navegador
2. Abre la consola del desarrollador (F12 o Cmd+Option+I en Mac)
3. Copia y pega el siguiente código, reemplazando `TU_IMAGEN_BASE64` con la imagen base64 completa:

```javascript
// Importar la función
import { updateRestaurantImageFromBase64 } from './services/database';

// Ejecutar la actualización
await updateRestaurantImageFromBase64(
  'donk-restaurant',  // slug del restaurante
  'TU_IMAGEN_BASE64', // Reemplaza con la imagen base64 completa
  'logo'              // 'logo' o 'cover'
);
```

## Opción 2: Crear un Componente Temporal

Crea un componente React temporal que puedas usar una vez:

```tsx
import { useEffect } from 'react';
import { updateRestaurantImageFromBase64 } from '../services/database';

export function UpdateRestaurantImage() {
  useEffect(() => {
    const updateImage = async () => {
      const base64Image = 'TU_IMAGEN_BASE64_AQUI'; // Pega la imagen base64 aquí
      await updateRestaurantImageFromBase64('donk-restaurant', base64Image, 'logo');
    };
    updateImage();
  }, []);

  return <div>Actualizando imagen...</div>;
}
```

Luego agrega temporalmente esta ruta en tu App.tsx y visita la página.

## Opción 3: Script SQL Directo (Si prefieres actualizar manualmente)

Si prefieres actualizar directamente en Supabase:

1. Sube la imagen a Supabase Storage manualmente en el bucket `restaurant-images`
2. Ejecuta este SQL en el editor SQL de Supabase:

```sql
UPDATE restaurants
SET logo_url = 'logos/tu-imagen.png'  -- Ruta relativa en el bucket
WHERE slug = 'donk-restaurant';
```

## Nota

La función `updateRestaurantImageFromBase64` está disponible en `services/database.ts` y:
- Convierte la imagen base64 a Blob
- La sube a Supabase Storage en el bucket `restaurant-images`
- Actualiza el campo `logo_url` o `cover_image_url` del restaurante
