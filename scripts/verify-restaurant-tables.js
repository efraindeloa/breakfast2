/**
 * Script para verificar que las tablas de perfil de restaurante se crearon correctamente
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

const tablesToCheck = [
  'restaurant_cover_images',
  'restaurant_social_media',
  'restaurant_hours',
  'restaurant_special_hours',
  'restaurant_service_config',
  'restaurant_payment_config',
  'restaurant_billing_config',
  'restaurant_notification_config',
  'restaurant_metrics',
  'restaurant_staff'
];

async function verifyTables() {
  console.log('\n🔍 Verificando tablas de perfil de restaurante...\n');
  
  let allTablesExist = true;
  
  for (const tableName of tablesToCheck) {
    try {
      // Intentar hacer una consulta simple para verificar que la tabla existe
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${tableName}: NO EXISTE`);
          allTablesExist = false;
        } else {
          console.log(`⚠️  ${tableName}: Error al verificar (${error.message})`);
        }
      } else {
        console.log(`✅ ${tableName}: Existe`);
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Error (${err.message})`);
      allTablesExist = false;
    }
  }
  
  // Verificar columnas agregadas a restaurants
  console.log('\n🔍 Verificando columnas agregadas a la tabla restaurants...\n');
  const { data: restaurantColumns, error: columnsError } = await supabase
    .from('restaurants')
    .select('*')
    .limit(0);
  
  if (columnsError) {
    console.log(`⚠️  Error al verificar columnas de restaurants: ${columnsError.message}`);
  } else {
    console.log('✅ Tabla restaurants existe (las columnas se agregan con ALTER TABLE)');
  }
  
  console.log('\n' + '='.repeat(60));
  if (allTablesExist) {
    console.log('✅ ¡Todas las tablas se crearon correctamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Crear funciones TypeScript en services/database.ts');
    console.log('   2. Crear pantalla de perfil del restaurante');
    console.log('   3. Implementar formularios para cada sección del perfil');
  } else {
    console.log('⚠️  Algunas tablas no se crearon. Revisa los errores arriba.');
  }
  console.log('='.repeat(60) + '\n');
}

verifyTables();
