/**
 * Script para establecer la imagen del restaurante
 * Este script actualiza la imagen del restaurante "donk-restaurant" en la base de datos
 * 
 * Uso desde la consola del navegador:
 * 1. Abre la consola (F12)
 * 2. Ejecuta: await setRestaurantImageFromBase64('TU_IMAGEN_BASE64_AQUI')
 */

// Función para convertir base64 a Blob
function base64ToBlob(base64, mimeType = 'image/png') {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
}

// Función principal
async function setRestaurantImageFromBase64(base64Image) {
  try {
    console.log('🔄 Actualizando imagen del restaurante...');
    
    // Obtener supabase del contexto global o importarlo
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || window.__SUPABASE_URL__;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || window.__SUPABASE_KEY__;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase no está configurado. Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // 1. Obtener restaurante
    const { data: restaurant, error: rError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'donk-restaurant')
      .single();
    
    if (rError || !restaurant) {
      throw new Error(`No se encontró el restaurante: ${rError?.message}`);
    }
    
    console.log(`✅ Restaurante encontrado: ${restaurant.name}`);
    
    // 2. Convertir y subir imagen
    const blob = base64ToBlob(base64Image);
    const fileName = `logos/donk-restaurant-${Date.now()}.png`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(fileName, blob, { upsert: true });
    
    if (uploadError) {
      throw new Error(`Error al subir imagen: ${uploadError.message}`);
    }
    
    console.log(`✅ Imagen subida: ${fileName}`);
    
    // 3. Actualizar restaurante
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: fileName })
      .eq('id', restaurant.id);
    
    if (updateError) {
      throw new Error(`Error al actualizar restaurante: ${updateError.message}`);
    }
    
    console.log('🎉 ¡Imagen actualizada exitosamente!');
    return { success: true, fileName };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return { success: false, error: error.message };
  }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setRestaurantImageFromBase64, base64ToBlob };
}

// Hacer disponible globalmente si se ejecuta en el navegador
if (typeof window !== 'undefined') {
  window.setRestaurantImageFromBase64 = setRestaurantImageFromBase64;
}
