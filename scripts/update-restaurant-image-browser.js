/**
 * Script para actualizar la imagen del restaurante desde la consola del navegador
 * 
 * INSTRUCCIONES:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este script completo
 * 3. Reemplaza BASE64_IMAGE_HERE con la imagen base64 proporcionada
 * 4. Ejecuta el script
 */

async function updateRestaurantImage() {
  // ===== REEMPLAZA ESTA LÍNEA CON TU IMAGEN BASE64 =====
  const base64Image = 'BASE64_IMAGE_HERE';
  // ======================================================
  
  if (base64Image === 'BASE64_IMAGE_HERE') {
    console.error('❌ Por favor, reemplaza BASE64_IMAGE_HERE con tu imagen base64');
    return;
  }

  try {
    console.log('🔄 Iniciando actualización de imagen del restaurante...');
    
    // Importar funciones necesarias (asumiendo que están disponibles globalmente)
    // Si no, necesitarás importarlas desde los módulos correspondientes
    
    // 1. Convertir base64 a Blob
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    
    console.log(`✅ Imagen convertida a Blob (tamaño: ${blob.size} bytes)`);
    
    // 2. Obtener el restaurante por slug
    const { data: restaurant, error: restaurantError } = await window.supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'donk-restaurant')
      .eq('is_active', true)
      .single();
    
    if (restaurantError || !restaurant) {
      console.error('❌ No se encontró el restaurante "donk-restaurant":', restaurantError);
      return;
    }
    
    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);
    
    // 3. Subir imagen a Supabase Storage
    const filePath = `logos/donk-restaurant-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await window.supabase.storage
      .from('restaurant-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      console.error('❌ Error al subir la imagen a Supabase Storage:', uploadError);
      return;
    }
    
    console.log(`✅ Imagen subida a: ${filePath}`);
    
    // 4. Actualizar el restaurante
    const { data: updatedRestaurant, error: updateError } = await window.supabase
      .from('restaurants')
      .update({ logo_url: filePath })
      .eq('id', restaurant.id)
      .select()
      .single();
    
    if (updateError || !updatedRestaurant) {
      console.error('❌ Error al actualizar el restaurante:', updateError);
      return;
    }
    
    console.log(`✅ Restaurante actualizado. logo_url: ${filePath}`);
    console.log('🎉 ¡Imagen del restaurante actualizada exitosamente!');
    console.log('🔄 Recarga la página para ver los cambios');
    
  } catch (error) {
    console.error('❌ Error al actualizar la imagen del restaurante:', error);
  }
}

// Ejecutar la función
updateRestaurantImage();
