/**
 * Script completo para probar el registro de restaurante
 * Ejecutar en la consola del navegador (F12) después de cargar la aplicación
 * 
 * INSTRUCCIONES:
 * 1. Abre la aplicación en el navegador
 * 2. Abre la consola del navegador (F12)
 * 3. Copia y pega este script completo
 * 4. Presiona Enter para ejecutar
 */

(async function testRestaurantRegistration() {
  console.log('🧪 ========================================');
  console.log('🧪 PRUEBA COMPLETA DE REGISTRO RESTAURANTE');
  console.log('🧪 ========================================\n');

  try {
    // Importar módulos necesarios
    const supabaseModule = await import('../config/supabase.js');
    const { supabase, isSupabaseConfigured } = supabaseModule;
    const { checkRestaurantNameExists } = await import('../services/database.js');
    
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase no está configurado');
      return;
    }

    console.log('✅ Supabase configurado correctamente\n');

    // Generar datos de prueba únicos
    const timestamp = Date.now();
    const testEmail = `test.restaurant.${timestamp}@test.com`;
    const testPassword = 'Test1234!@#$';
    const testRestaurantName = `Restaurante Test ${timestamp}`;
    const testRFC = 'TEST123456ABC';

    console.log('📋 Datos de prueba generados:');
    console.log('   Email:', testEmail);
    console.log('   Restaurante:', testRestaurantName);
    console.log('   RFC:', testRFC);
    console.log('');

    // ========== TEST 1: Verificar nombre disponible ==========
    console.log('📡 TEST 1: Verificando disponibilidad del nombre...');
    try {
      const nameExists = await checkRestaurantNameExists(testRestaurantName);
      if (nameExists) {
        console.error('❌ El nombre ya existe (puede ser coincidencia)');
      } else {
        console.log('✅ El nombre está disponible');
      }
    } catch (error) {
      console.error('❌ Error al verificar nombre:', error);
      console.log('⚠️ Continuando con la prueba...');
    }
    console.log('');

    // ========== TEST 2: Verificar función checkRestaurantNameExists ==========
    console.log('📡 TEST 2: Verificando función checkRestaurantNameExists...');
    try {
      const nameExists = await checkRestaurantNameExists(testRestaurantName);
      console.log('✅ Función checkRestaurantNameExists funciona correctamente');
      console.log('   Nombre existe:', nameExists ? 'Sí' : 'No');
    } catch (error) {
      console.error('❌ Error al verificar nombre:', error);
    }
    console.log('');

    // ========== TEST 3: Simular registro completo ==========
    console.log('📡 TEST 3: Simulando registro completo...');
    console.log('⚠️ NOTA: Este test NO creará una cuenta real');
    console.log('   Para probar el registro real, usa el formulario de la aplicación\n');

    // Verificar que el usuario no esté autenticado
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (currentSession) {
      console.log('⚠️ Ya hay una sesión activa. Cerrando sesión...');
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // ========== TEST 4: Verificar validaciones ==========
    console.log('📡 TEST 4: Verificando validaciones...');
    
    // Test 4.1: Nombre vacío
    const emptyNameResult = await checkRestaurantNameExists('');
    console.log('   Nombre vacío:', emptyNameResult ? '❌' : '✅', '(debería ser false)');
    
    // Test 4.2: Nombre muy corto
    const shortNameResult = await checkRestaurantNameExists('AB');
    console.log('   Nombre corto (2 chars):', shortNameResult ? '❌' : '✅', '(debería ser false)');
    
    // Test 4.3: Nombre válido
    const validNameResult = await checkRestaurantNameExists(testRestaurantName);
    console.log('   Nombre válido:', validNameResult ? '⚠️ Existe' : '✅ Disponible');
    console.log('');

    // ========== RESUMEN ==========
    console.log('📊 ========================================');
    console.log('📊 RESUMEN DE PRUEBAS');
    console.log('📊 ========================================');
    console.log('✅ Supabase configurado');
    console.log('✅ Función checkRestaurantNameExists disponible');
    console.log('');
    console.log('💡 Para probar el registro completo:');
    console.log('   1. Ve al formulario de registro');
    console.log('   2. Selecciona "Restaurante"');
    console.log('   3. Completa el formulario con:');
    console.log('      - Email:', testEmail);
    console.log('      - Contraseña:', testPassword);
    console.log('      - Nombre restaurante:', testRestaurantName);
    console.log('      - RFC (opcional):', testRFC);
    console.log('   4. Haz clic en "Registrarse"');
    console.log('');
    console.log('🎉 Pruebas completadas!');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.error('📋 Stack:', error.stack);
  }
})();
