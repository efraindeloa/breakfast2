/**
 * Script para mostrar el SQL de las tablas de perfil de restaurante
 * Este script muestra el contenido del archivo SQL para que puedas copiarlo y ejecutarlo en Supabase
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlFile = join(__dirname, '../supabase/restaurant_profile_tables.sql');

try {
  const sqlContent = readFileSync(sqlFile, 'utf-8');
  
  console.log('\n📋 ========================================');
  console.log('   SCRIPT SQL PARA PERFIL DE RESTAURANTE');
  console.log('========================================\n');
  console.log('📝 Instrucciones:');
  console.log('   1. Abre Supabase SQL Editor:');
  console.log('      https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new\n');
  console.log('   2. Copia el siguiente SQL y pégalo en el editor\n');
  console.log('   3. Haz clic en "Run" o presiona F5\n');
  console.log('   4. Verifica que se crearon las tablas en Table Editor\n');
  console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  console.log(sqlContent);
  console.log('\n═══════════════════════════════════════════════════════════════════════════════\n');
  console.log('✅ Script listo para ejecutar en Supabase SQL Editor\n');
  
} catch (error) {
  console.error('❌ Error al leer el archivo SQL:', error.message);
  process.exit(1);
}
