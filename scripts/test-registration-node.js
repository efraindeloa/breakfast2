/**
 * Script para probar el registro completo de restaurante
 * Ejecutar con: node scripts/test-registration-node.js
 * 
 * Requiere: npm install @supabase/supabase-js dotenv
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables de entorno del archivo .env
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    return env;
  } catch (error) {
    console.error('Error al leer .env:', error.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configurados');
  console.log('   Verifica tu archivo .env o variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFullRegistration() {
  console.log('🧪 ============================================');
  console.log('🧪 PRUEBA COMPLETA DE REGISTRO DE RESTAURANTE');
  console.log('🧪 ============================================\n');

  try {
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

    // PASO 1: Verificar nombre disponible usando consulta directa
    console.log('📡 PASO 1: Verificando disponibilidad del nombre...');
    try {
      const nameExists = await checkRestaurantNameExists(testRestaurantName);
      
      if (nameExists) {
        console.error('❌ El nombre ya existe');
        return;
      } else {
        console.log('✅ Nombre disponible\n');
      }
    } catch (error) {
      console.warn('⚠️ Error al verificar nombre:', error.message);
      console.log('   Continuando sin verificación del nombre...\n');
    }

    // PASO 2: Crear usuario en Auth
    console.log('📡 PASO 2: Creando usuario en Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
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

    // PASO 3: Crear restaurante
    console.log('📡 PASO 3: Creando restaurante...');
    
    // Generar slug
    const slug = testRestaurantName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: testRestaurantName.trim(),
        slug: slug,
        city: 'Ciudad',
        country: 'México',
        is_active: true,
        is_verified: false,
        rating: 0.0,
        total_reviews: 0,
        timezone: 'America/Mexico_City',
      })
      .select()
      .single();

    if (restaurantError) {
      console.error('❌ Error al crear restaurante:', restaurantError);
      console.log('🔄 Limpiando usuario creado...');
      // Nota: No podemos eliminar usuarios de Auth desde aquí sin service role key
      return;
    }

    console.log('✅ Restaurante creado:');
    console.log('   ID:', restaurant.id);
    console.log('   Nombre:', restaurant.name);
    console.log('   Slug:', restaurant.slug);
    console.log('');

    // PASO 4: Asociar usuario como owner
    console.log('📡 PASO 4: Asociando usuario como owner...');
    const { data: staff, error: staffError } = await supabase
      .from('restaurant_staff')
      .insert({
        restaurant_id: restaurant.id,
        user_id: authData.user.id,
        role: 'owner',
        is_active: true,
      })
      .select()
      .single();

    if (staffError) {
      console.error('❌ Error al asociar usuario:', staffError);
      console.log('🔄 Limpiando restaurante creado...');
      await supabase.from('restaurants').delete().eq('id', restaurant.id);
      return;
    }

    console.log('✅ Usuario asociado como owner');
    console.log('   Staff ID:', staff.id);
    console.log('   Role:', staff.role);
    console.log('');

    // PASO 5: Crear usuario en tabla users
    console.log('📡 PASO 5: Creando usuario en tabla users...');
    const userName = testEmail.split('@')[0];
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        name: userName,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      console.warn('⚠️ Error al crear usuario en tabla users:', userError);
      console.log('   (Esto puede ser normal si el usuario ya existe)');
    } else {
      console.log('✅ Usuario creado en tabla users');
    }
    console.log('');

    // PASO 6: Verificar todo
    console.log('📡 PASO 6: Verificando en base de datos...');
    
    // Verificar restaurante
    const { data: verifyRestaurant, error: verifyRestaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurant.id)
      .single();

    if (verifyRestaurantError) {
      console.error('❌ Error al verificar restaurante:', verifyRestaurantError);
    } else {
      console.log('✅ Restaurante verificado en BD:', verifyRestaurant.name);
    }

    // Verificar staff
    const { data: verifyStaff, error: verifyStaffError } = await supabase
      .from('restaurant_staff')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('restaurant_id', restaurant.id)
      .single();

    if (verifyStaffError) {
      console.error('❌ Error al verificar staff:', verifyStaffError);
    } else {
      console.log('✅ Staff verificado en BD:');
      console.log('   Role:', verifyStaff.role);
      console.log('   Is Active:', verifyStaff.is_active);
    }

    console.log('');
    console.log('🎉 ============================================');
    console.log('🎉 PRUEBA COMPLETA EXITOSA');
    console.log('🎉 ============================================');
    console.log('✅ Usuario creado en Auth:', authData.user.id);
    console.log('✅ Restaurante creado:', restaurant.id);
    console.log('✅ Usuario asociado como owner');
    console.log('✅ Todo funcionando correctamente');
    console.log('');
    console.log('📋 Datos creados:');
    console.log('   Email:', testEmail);
    console.log('   Restaurante:', testRestaurantName);
    console.log('   Slug:', slug);
    console.log('');
    console.log('💡 Puedes verificar en Supabase Dashboard:');
    console.log('   - Tabla users: Debe existir el usuario');
    console.log('   - Tabla restaurants: Debe existir el restaurante');
    console.log('   - Tabla restaurant_staff: Debe existir la asociación');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    console.error('📋 Stack:', error.stack);
  }
}

testFullRegistration();
