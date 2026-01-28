import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(__dirname, '../supabase/fix-billing-config-rls-final.sql');

async function displaySQLAndInstructions() {
  try {
    const sqlContent = readFileSync(sqlFile, 'utf8');

    console.log('\n🔧 ========================================');
    console.log('   CORRECCIÓN FINAL DE RLS PARA restaurant_billing_config');
    console.log('========================================\n');
    console.log('📝 Instrucciones:');
    console.log('   1. Abre Supabase SQL Editor:');
    console.log('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new\n');
    console.log('   2. Copia el siguiente SQL y pégalo en el editor\n');
    console.log('   3. Haz clic en "Run" o presiona F5\n');
    console.log('   4. Este script crea políticas MÁS ESPECÍFICAS usando TO authenticated');
    console.log('      y políticas separadas para cada operación (SELECT, INSERT, UPDATE, DELETE)\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(sqlContent);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('✅ Script listo para ejecutar en Supabase SQL Editor\n');

  } catch (error) {
    console.error('❌ Error al leer el archivo SQL:', error.message);
  }
}

displaySQLAndInstructions();
