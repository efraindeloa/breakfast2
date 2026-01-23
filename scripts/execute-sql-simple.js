import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo SQL
const sqlFile = join(__dirname, '../supabase/MASTER_SETUP.sql');
const sql = readFileSync(sqlFile, 'utf-8');

console.log('📋 Script SQL listo para ejecutar en Supabase\n');
console.log('='.repeat(70));
console.log('INSTRUCCIONES:');
console.log('='.repeat(70));
console.log('1. Abre: https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new');
console.log('2. Copia y pega el siguiente SQL:');
console.log('3. Haz clic en "Run" (o presiona F5)\n');
console.log('='.repeat(70));
console.log('\n📄 SQL:\n');
console.log(sql);
console.log('\n' + '='.repeat(70));
console.log('✅ Script listo. Copia el SQL de arriba y pégalo en Supabase SQL Editor.');
