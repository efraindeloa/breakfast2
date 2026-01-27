/**
 * Script para actualizar la imagen del restaurante
 * 
 * Uso:
 * 1. Ejecuta este script desde la consola del navegador o como script Node.js
 * 2. La imagen base64 se subirá a Supabase Storage
 * 3. Se actualizará el campo logo_url del restaurante "donk-restaurant"
 */

import { supabase } from '../config/supabase';
import { uploadImage, getRestaurantBySlug, updateRestaurant } from '../services/database';

/**
 * Convierte una imagen base64 a Blob
 */
function base64ToBlob(base64: string, mimeType: string = 'image/png'): Blob {
  // Remover el prefijo data:image/png;base64, si existe
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Convertir base64 a bytes
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Actualiza la imagen del restaurante
 */
export async function updateRestaurantImage(
  base64Image: string,
  imageType: 'logo' | 'cover' = 'logo'
): Promise<boolean> {
  try {
    console.log('🔄 Iniciando actualización de imagen del restaurante...');
    
    // 1. Obtener el restaurante por slug
    const restaurant = await getRestaurantBySlug('donk-restaurant');
    if (!restaurant) {
      console.error('❌ No se encontró el restaurante "donk-restaurant"');
      return false;
    }
    
    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);
    
    // 2. Convertir base64 a Blob
    const blob = base64ToBlob(base64Image, 'image/png');
    console.log(`✅ Imagen convertida a Blob (tamaño: ${blob.size} bytes)`);
    
    // 3. Subir imagen a Supabase Storage
    const filePath = `${imageType === 'logo' ? 'logos' : 'covers'}/donk-restaurant-${Date.now()}.png`;
    const imageUrl = await uploadImage('restaurant-images', filePath, blob);
    
    if (!imageUrl) {
      console.error('❌ Error al subir la imagen a Supabase Storage');
      return false;
    }
    
    console.log(`✅ Imagen subida a: ${imageUrl}`);
    
    // 4. Actualizar el restaurante
    const updateField = imageType === 'logo' ? 'logo_url' : 'cover_image_url';
    const updatedRestaurant = await updateRestaurant(restaurant.id, {
      [updateField]: filePath // Guardar solo la ruta relativa, no la URL completa
    });
    
    if (!updatedRestaurant) {
      console.error('❌ Error al actualizar el restaurante en la base de datos');
      return false;
    }
    
    console.log(`✅ Restaurante actualizado. ${updateField}: ${filePath}`);
    console.log('🎉 ¡Imagen del restaurante actualizada exitosamente!');
    
    return true;
  } catch (error) {
    console.error('❌ Error al actualizar la imagen del restaurante:', error);
    return false;
  }
}

// Si se ejecuta directamente, usar la imagen base64 proporcionada
if (require.main === module) {
  // La imagen base64 debe pasarse como argumento o estar en el código
  const base64Image = process.argv[2];
  
  if (!base64Image) {
    console.error('❌ Por favor, proporciona la imagen base64 como argumento');
    console.log('Uso: ts-node scripts/update-restaurant-image.ts <base64-image>');
    process.exit(1);
  }
  
  updateRestaurantImage(base64Image, 'logo')
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}
