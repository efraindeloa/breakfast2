/**
 * Script para actualizar el logo del restaurante donk-restaurant
 * con la imagen que ya está en Supabase Storage
 * 
 * INSTRUCCIONES:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este código completo
 * 3. La imagen se actualizará automáticamente
 */

(async function() {
  try {
    console.log('🔄 Actualizando logo del restaurante donk-restaurant...');
    
    // Importar la función (ajusta la ruta según tu estructura)
    const { updateRestaurantImageFromStorage } = await import('../services/database');
    
    // Ruta de la imagen en Storage
    const imagePath = 'logos/logo-donk-restaurant.png';
    
    // Actualizar el restaurante
    const success = await updateRestaurantImageFromStorage(
      'donk-restaurant',
      imagePath,
      'logo'
    );
    
    if (success) {
      console.log('✅ ¡Logo actualizado exitosamente!');
      console.log('🔄 Recarga la página para ver los cambios');
    } else {
      console.error('❌ Error al actualizar el logo');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
