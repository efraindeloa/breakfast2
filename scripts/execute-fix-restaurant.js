import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(__dirname, '../supabase/fix-restaurant-and-associate.sql');

async function displaySQLAndInstructions() {
  try {
    const sqlContent = readFileSync(sqlFile, 'utf8');

    console.log('\n🔧 ========================================');
    console.log('   CORREGIR RESTAURANTE Y ASOCIAR USUARIO');
    console.log('========================================\n');
    console.log('📝 Instrucciones:');
    console.log('   1. Abre Supabase SQL Editor:');
    console.log('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new\n');
    console.log('   2. Copia el siguiente SQL y pégalo en el editor\n');
    console.log('   3. Haz clic en "Run" o presiona F5\n');
    console.log('   4. Este script:');
    console.log('      - Elimina el restaurante con UUID de ejemplo');
    console.log('      - Crea un nuevo restaurante con UUID real');
    console.log('      - Asocia el usuario al restaurante como owner');
    console.log('      - Crea todas las configuraciones necesarias\n');
    console.log('   5. Después ejecuta también: fix-restaurants-rls.sql\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
    console.log(sqlContent);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
    console.log('✅ Script listo para ejecutar en Supabase SQL Editor\n');

  } catch (error) {
    console.error('❌ Error al leer el archivo SQL:', error.message);
  }
}

displaySQLAndInstructions();
