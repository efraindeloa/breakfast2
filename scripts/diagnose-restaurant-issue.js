/**
 * Script de diagnóstico para verificar el estado del restaurante y el usuario
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnose() {
  console.log('\n🔍 ========================================');
  console.log('   DIAGNÓSTICO DE RESTAURANTE');
  console.log('========================================\n');

  try {
    // 1. Verificar usuarios
    console.log('1️⃣ Verificando usuarios...\n');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name, is_active')
      .eq('is_active', true)
      .limit(5);

    if (usersError) {
      console.error('❌ Error al obtener usuarios:', usersError.message);
    } else {
      console.log(`✅ Usuarios encontrados: ${users?.length || 0}`);
      users?.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`);
      });
    }

    // 2. Verificar restaurantes
    console.log('\n2️⃣ Verificando restaurantes...\n');
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, slug, is_active')
      .limit(5);

    if (restaurantsError) {
      console.error('❌ Error al obtener restaurantes:', restaurantsError.message);
    } else {
      console.log(`✅ Restaurantes encontrados: ${restaurants?.length || 0}`);
      restaurants?.forEach((rest, index) => {
        console.log(`   ${index + 1}. ${rest.name} (ID: ${rest.id}, Slug: ${rest.slug})`);
      });
    }

    // 3. Verificar restaurant_staff
    console.log('\n3️⃣ Verificando asociaciones usuario-restaurante...\n');
    const { data: staff, error: staffError } = await supabase
      .from('restaurant_staff')
      .select('id, restaurant_id, user_id, role, is_active, restaurants(name, slug), users(email)')
      .eq('is_active', true)
      .limit(10);

    if (staffError) {
      console.error('❌ Error al obtener staff:', staffError.message);
    } else {
      console.log(`✅ Asociaciones encontradas: ${staff?.length || 0}`);
      if (staff && staff.length > 0) {
        staff.forEach((s, index) => {
          const restaurant = s.restaurants;
          const user = s.users;
          console.log(`   ${index + 1}. Usuario: ${user?.email || 'N/A'} → Restaurante: ${restaurant?.name || 'N/A'} (Rol: ${s.role})`);
          console.log(`      Restaurant ID: ${s.restaurant_id}`);
          console.log(`      User ID: ${s.user_id}`);
        });
      } else {
        console.log('   ⚠️  No hay asociaciones. Necesitas ejecutar create-sample-restaurant.sql');
      }
    }

    // 4. Verificar si hay UUIDs de ejemplo
    console.log('\n4️⃣ Verificando UUIDs de ejemplo...\n');
    if (staff && staff.length > 0) {
      const exampleUUIDs = staff.filter(s => 
        s.restaurant_id === '00000000-0000-0000-0000-000000000001' ||
        s.user_id === '00000000-0000-0000-0000-000000000001'
      );
      if (exampleUUIDs.length > 0) {
        console.log('   ⚠️  Se encontraron UUIDs de ejemplo:');
        exampleUUIDs.forEach(s => {
          console.log(`      - Restaurant ID: ${s.restaurant_id}`);
          console.log(`      - User ID: ${s.user_id}`);
        });
        console.log('\n   💡 Esto indica que el restaurante no se creó correctamente.');
        console.log('      Ejecuta el script create-sample-restaurant.sql');
      } else {
        console.log('   ✅ No se encontraron UUIDs de ejemplo');
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN:');
    console.log('='.repeat(60));
    console.log(`   Usuarios activos: ${users?.length || 0}`);
    console.log(`   Restaurantes: ${restaurants?.length || 0}`);
    console.log(`   Asociaciones: ${staff?.length || 0}`);
    
    if (staff && staff.length === 0) {
      console.log('\n   ⚠️  ACCIÓN REQUERIDA:');
      console.log('      Ejecuta el script create-sample-restaurant.sql en Supabase SQL Editor');
    } else if (staff && staff.some(s => s.restaurant_id === '00000000-0000-0000-0000-000000000001')) {
      console.log('\n   ⚠️  ACCIÓN REQUERIDA:');
      console.log('      El restaurante tiene un UUID de ejemplo. Ejecuta create-sample-restaurant.sql');
    } else {
      console.log('\n   ✅ Todo parece estar bien configurado');
    }
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n❌ Error en diagnóstico:', error.message);
    process.exit(1);
  }
}

diagnose();
