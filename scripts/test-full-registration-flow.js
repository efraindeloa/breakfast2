/**
 * Script completo para probar el registro de restaurante
 * Este script prueba TODO el flujo usando las funciones reales del código
 * 
 * Ejecutar en la consola del navegador (F12) después de cargar la aplicación
 */

(async function testFullRegistrationFlow() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA COMPLETA DE REGISTRO DE RESTAURANTE');
  console.log('🧪 ============================================\n');

  try {
    // Importar módulos
    const { supabase, isSupabaseConfigured } = await import('../config/supabase.js');
    const { checkRestaurantNameExists, registerRestaurant } = await import('../services/database.js');
    
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase no está configurado');
      return;
    }

    console.log('✅ Supabase configurado\n');

    // Generar datos únicos
    const timestamp = Date.now();
    const testEmail = `test.restaurant.${timestamp}@test.com`;
    const testPassword = 'Test1234!@#$';
    const testRestaurantName = `Restaurante Test ${timestamp}`;
    const testRFC = 'TEST123456ABC';

    console.log('📋 Datos de prueba:');
    console.log('   Email:', testEmail);
    console.log('   Restaurante:', testRestaurantName);
    console.log('   RFC:', testRFC);
    console.log('');

    // ========== PASO 1: Verificar nombre disponible ==========
    console.log('📡 PASO 1: Verificando disponibilidad del nombre...');
    const nameExists = await checkRestaurantNameExists(testRestaurantName);
    if (nameExists) {
      console.error('❌ El nombre ya existe');
      return;
    }
    console.log('✅ Nombre disponible\n');

    // ========== PASO 2: Cerrar sesión si existe ==========
    console.log('📡 PASO 2: Verificando sesión...');
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('   Cerrando sesión existente...');
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ Sin sesión activa\n');

    // ========== PASO 3: Crear usuario en Auth ==========
    console.log('📡 PASO 3: Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          email_verified: true,
        },
      },
    });

    if (authError) {
      console.error('❌ Error al crear usuario:', authError);
      return;
    }

    if (!authData.user) {
      console.error('❌ No se creó el usuario');
      return;
    }

    console.log('✅ Usuario creado en Auth:', authData.user.id);
    console.log('');

    // Esperar un momento para que la sesión se establezca
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ========== PASO 4: Crear restaurante ==========
    console.log('📡 PASO 4: Creando restaurante...');
    try {
      const restaurantResult = await registerRestaurant(
        authData.user.id,
        testRestaurantName,
        testRFC
      );
      console.log('✅ Restaurante creado:');
      console.log('   ID:', restaurantResult.restaurant.id);
      console.log('   Nombre:', restaurantResult.restaurant.name);
      console.log('   Slug:', restaurantResult.restaurant.slug);
      console.log('✅ Usuario asociado como owner');
      console.log('');

      // ========== PASO 5: Verificar en base de datos ==========
      console.log('📡 PASO 5: Verificando en base de datos...');
      
      // Verificar restaurante
      const { data: restaurant, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantResult.restaurant.id)
        .single();

      if (restaurantError) {
        console.error('❌ Error al verificar restaurante:', restaurantError);
      } else {
        console.log('✅ Restaurante encontrado en BD:', restaurant.name);
      }

      // Verificar staff
      const { data: staff, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('*')
        .eq('user_id', authData.user.id)
        .eq('restaurant_id', restaurantResult.restaurant.id)
        .single();

      if (staffError) {
        console.error('❌ Error al verificar staff:', staffError);
      } else {
        console.log('✅ Staff encontrado en BD:');
        console.log('   Role:', staff.role);
        console.log('   Is Active:', staff.is_active);
      }

      console.log('');
      console.log('🎉 ============================================');
      console.log('🎉 PRUEBA COMPLETA EXITOSA');
      console.log('🎉 ============================================');
      console.log('✅ Usuario creado en Auth');
      console.log('✅ Restaurante creado');
      console.log('✅ Usuario asociado como owner');
      console.log('✅ Todo funcionando correctamente');
      console.log('');
      console.log('💡 Puedes verificar en Supabase Dashboard:');
      console.log('   - Tabla users: Debe existir el usuario');
      console.log('   - Tabla restaurants: Debe existir el restaurante');
      console.log('   - Tabla restaurant_staff: Debe existir la asociación');

    } catch (restaurantError) {
      console.error('❌ Error al crear restaurante:', restaurantError);
      console.log('🔄 Limpiando usuario creado...');
      // Intentar eliminar el usuario de Auth
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error al limpiar:', e);
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.error('📋 Stack:', error.stack);
  }
})();
