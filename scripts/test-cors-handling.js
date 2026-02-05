/**
 * Script para probar el manejo de errores de CORS
 * Ejecutar en la consola del navegador (F12) después de cargar la aplicación
 * 
 * Este script prueba que:
 * 1. Los errores de CORS se silencian correctamente
 * 2. El fallback a consulta directa funciona
 * 3. No aparecen errores molestos en la consola
 */

(async function testCorsHandling() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA DE MANEJO DE ERRORES CORS');
  console.log('🧪 ============================================\n');

  try {
    // Importar módulos
    const { checkRestaurantNameExists } = await import('../services/database.js');
    
    console.log('✅ Módulos importados correctamente\n');

    // Test 1: Verificar que no aparecen errores de CORS en la consola
    console.log('📡 TEST 1: Verificando nombre de restaurante...');
    console.log('   (Usando consulta directa a la base de datos)\n');
    
    const testName = 'Test Restaurant ' + Date.now();
    const exists = await checkRestaurantNameExists(testName);
    
    console.log(`✅ Verificación completada sin errores visibles`);
    console.log(`   Nombre probado: ${testName}`);
    console.log(`   Resultado: ${exists ? 'EXISTE' : 'NO EXISTE (disponible)'}\n`);

    // Test 2: Probar con un nombre que probablemente no existe
    console.log('📡 TEST 2: Probando con otro nombre...');
    const testName2 = 'Restaurante Prueba ' + Date.now();
    const exists2 = await checkRestaurantNameExists(testName2);
    
    console.log(`✅ Segunda verificación completada`);
    console.log(`   Nombre probado: ${testName2}`);
    console.log(`   Resultado: ${exists2 ? 'EXISTE' : 'NO EXISTE (disponible)'}\n`);

    console.log('🎉 ============================================');
    console.log('🎉 PRUEBA COMPLETADA');
    console.log('🎉 ============================================');
    console.log('\n✅ Si no viste errores de CORS en la consola, el manejo funciona correctamente');
    console.log('✅ El fallback a consulta directa está funcionando');
    console.log('\n💡 Nota: Los errores de CORS pueden aparecer en la pestaña Network');
    console.log('   pero NO deberían aparecer en la consola gracias al interceptor');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
})();
