/**
 * Script para ejecutar SQL usando Supabase CLI
 * Requiere: npm install -g supabase
 * 
 * Uso: node scripts/execute-sql-supabase-cli.js <archivo.sql>
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Obtener el archivo SQL del argumento
const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error('❌ Error: Debes especificar un archivo SQL');
  console.error('   Uso: node scripts/execute-sql-supabase-cli.js <archivo.sql>');
  console.error('   Ejemplo: node scripts/execute-sql-supabase-cli.js supabase/rls-simple-permissive.sql');
  process.exit(1);
}

const fullPath = join(__dirname, '..', sqlFile);

if (!readFileSync(fullPath, 'utf-8')) {
  console.error(`❌ Error: No se pudo leer el archivo: ${fullPath}`);
  process.exit(1);
}

console.log('🚀 Ejecutando script SQL usando Supabase CLI...\n');
console.log(`📁 Archivo: ${fullPath}\n`);

try {
  // Verificar que Supabase CLI está instalado (usar npx como fallback)
  let supabaseCmd = 'supabase';
  try {
    execSync('supabase --version', { stdio: 'ignore' });
  } catch (error) {
    // Intentar con npx
    try {
      execSync('npx supabase --version', { stdio: 'ignore' });
      supabaseCmd = 'npx supabase';
      console.log('ℹ️  Usando npx supabase (no está en PATH)\n');
    } catch (npxError) {
      console.error('❌ Error: Supabase CLI no está instalado');
      console.error('   Instálalo con: npm install -g supabase');
      console.error('   O con: brew install supabase/tap/supabase (macOS)');
      process.exit(1);
    }
  }

  // Ejecutar el script SQL usando Supabase CLI
  // Nota: Necesitas estar vinculado al proyecto primero
  // Comando: supabase db execute -f <archivo>
  
  console.log(`📋 Ejecutando comando: ${supabaseCmd} db execute -f ${sqlFile}`);
  console.log('');
  
  const command = `${supabaseCmd} db execute -f "${fullPath}"`;
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    
    console.log('\n✅ Script SQL ejecutado exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error al ejecutar el script SQL');
    console.error('');
    console.error('💡 Posibles soluciones:');
    console.error('   1. Asegúrate de estar vinculado al proyecto:');
    console.error(`      ${supabaseCmd} link --project-ref tkwackqrnsqlmxtalvuw`);
    console.error('');
    console.error('   2. O ejecuta el script manualmente en el SQL Editor:');
    console.error('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new');
    console.error('');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error inesperado:', error.message);
  process.exit(1);
}
