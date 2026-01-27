/**
 * SCRIPT PARA ACTUALIZAR LA IMAGEN DEL RESTAURANTE
 * 
 * INSTRUCCIONES:
 * 1. Copia este script completo
 * 2. Abre la consola del navegador (F12)
 * 3. Pega el script
 * 4. Reemplaza 'TU_IMAGEN_BASE64_AQUI' con la imagen base64 completa que te proporcionaron
 * 5. Ejecuta el script
 */

(async function() {
  // ===== REEMPLAZA ESTA LÍNEA CON TU IMAGEN BASE64 =====
  const base64Image = 'TU_IMAGEN_BASE64_AQUI';
  // ======================================================
  
  if (base64Image === 'TU_IMAGEN_BASE64_AQUI') {
    console.error('❌ Por favor, reemplaza TU_IMAGEN_BASE64_AQUI con tu imagen base64');
    return;
  }

  try {
    console.log('🔄 Iniciando actualización de imagen del restaurante...');
    
    // Obtener supabase del contexto de la aplicación
    // Ajusta esto según cómo tengas configurado Supabase en tu app
    const supabase = window.__SUPABASE__ || (await import('../config/supabase')).supabase;
    
    if (!supabase) {
      throw new Error('No se pudo obtener la instancia de Supabase. Asegúrate de que esté disponible globalmente o importa desde config/supabase');
    }
    
    // 1. Convertir base64 a Blob
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'image/png' });
    
    console.log(`✅ Imagen convertida a Blob (tamaño: ${blob.size} bytes)`);
    
    // 2. Obtener el restaurante por slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'donk-restaurant')
      .eq('is_active', true)
      .single();
    
    if (restaurantError || !restaurant) {
      throw new Error(`No se encontró el restaurante: ${restaurantError?.message || 'Restaurante no encontrado'}`);
    }
    
    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);
    
    // 3. Subir imagen a Supabase Storage
    const filePath = `logos/donk-restaurant-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (uploadError) {
      throw new Error(`Error al subir la imagen: ${uploadError.message}`);
    }
    
    console.log(`✅ Imagen subida a: ${filePath}`);
    
    // 4. Actualizar el restaurante
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: filePath })
      .eq('id', restaurant.id)
      .select()
      .single();
    
    if (updateError || !updatedRestaurant) {
      throw new Error(`Error al actualizar el restaurante: ${updateError?.message || 'Error desconocido'}`);
    }
    
    console.log(`✅ Restaurante actualizado. logo_url: ${filePath}`);
    console.log('🎉 ¡Imagen del restaurante actualizada exitosamente!');
    console.log('🔄 Recarga la página para ver los cambios');
    
    return { success: true, filePath, restaurant: updatedRestaurant };
    
  } catch (error) {
    console.error('❌ Error al actualizar la imagen del restaurante:', error);
    return { success: false, error: error.message };
  }
})();
