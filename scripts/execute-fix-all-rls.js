import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(__dirname, '../supabase/fix-all-restaurant-rls.sql');

async function displaySQLAndInstructions() {
  try {
    const sqlContent = readFileSync(sqlFile, 'utf8');

    console.log('\n🔧 ========================================');
    console.log('   CORRECCIÓN COMPLETA DE POLÍTICAS RLS');
    console.log('========================================\n');
    console.log('📝 Instrucciones:');
    console.log('   1. Abre Supabase SQL Editor:');
    console.log('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new\n');
    console.log('   2. Copia el siguiente SQL y pégalo en el editor\n');
    console.log('   3. Haz clic en "Run" o presiona F5\n');
    console.log('   4. Este script corrige TODAS las políticas RLS para:');
    console.log('      - restaurants');
    console.log('      - restaurant_billing_config');
    console.log('      - restaurant_notification_config');
    console.log('      - restaurant_metrics');
    console.log('      - restaurant_service_config');
    console.log('      - restaurant_payment_config');
    console.log('      - restaurant_cover_images');
    console.log('      - restaurant_social_media');
    console.log('      - restaurant_hours');
    console.log('      - restaurant_special_hours');
    console.log('      - restaurant_staff\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(sqlContent);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('✅ Script listo para ejecutar en Supabase SQL Editor\n');

  } catch (error) {
    console.error('❌ Error al leer el archivo SQL:', error.message);
  }
}

displaySQLAndInstructions();
