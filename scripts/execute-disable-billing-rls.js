import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(__dirname, '../supabase/disable-billing-config-rls.sql');

async function displaySQLAndInstructions() {
  try {
    const sqlContent = readFileSync(sqlFile, 'utf8');

    console.log('\n🔧 ========================================');
    console.log('   DESHABILITAR RLS TEMPORALMENTE');
    console.log('========================================\n');
    console.log('⚠️  ADVERTENCIA: Esto deshabilita RLS solo para diagnóstico');
    console.log('   NO usar en producción\n');
    console.log('📝 Instrucciones:');
    console.log('   1. Abre Supabase SQL Editor:');
    console.log('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new\n');
    console.log('   2. Copia el siguiente SQL y pégalo en el editor\n');
    console.log('   3. Haz clic en "Run" o presiona F5\n');
    console.log('   4. Recarga la página del perfil del restaurante\n');
    console.log('   5. Si el error 406 desaparece, el problema es RLS');
    console.log('   6. Si el error persiste, el problema es otra cosa\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(sqlContent);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('✅ Script listo para ejecutar en Supabase SQL Editor\n');

  } catch (error) {
    console.error('❌ Error al leer el archivo SQL:', error.message);
  }
}

displaySQLAndInstructions();
