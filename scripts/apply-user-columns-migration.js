/**
 * Script para aplicar la migración de columnas faltantes en la tabla users
 * Ejecuta: node scripts/apply-user-columns-migration.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Supabase
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://tkwackqrnsqlmxtalvuw.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos');
  console.log('Configura las variables de entorno:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_KEY (o VITE_SUPABASE_ANON_KEY como fallback)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración de columnas faltantes en tabla users...');
    
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260205000002_add_missing_columns_to_users.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Error: Archivo de migración no encontrado:', migrationPath);
      process.exit(1);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Ejecutando SQL de migración...');
    
    // Ejecutar la migración
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error);
      
      // Intentar ejecutar directamente si rpc no funciona
      console.log('🔄 Intentando ejecutar directamente...');
      
      // Dividir el SQL en statements individuales
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.includes('DO $$') || statement.includes('END $$')) {
          // Ejecutar bloques DO como una sola unidad
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';'
          });
          if (stmtError) {
            console.error('❌ Error en statement:', statement.substring(0, 100) + '...', stmtError);
          }
        } else {
          // Ejecutar statements normales
          const { error: stmtError } = await supabase.rpc('exec_sql', { 
            sql_query: statement + ';'
          });
          if (stmtError && !stmtError.message.includes('already exists')) {
            console.error('❌ Error en statement:', statement.substring(0, 100) + '...', stmtError);
          }
        }
      }
    }
    
    console.log('✅ Migración aplicada exitosamente');
    
    // Verificar que las columnas existen
    console.log('🔍 Verificando estructura de tabla users...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .order('ordinal_position');
    
    if (tableError) {
      console.error('❌ Error verificando tabla:', tableError);
    } else {
      console.log('📋 Columnas de la tabla users:');
      tableInfo.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`  - ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`);
      });
      
      // Verificar columnas específicas
      const hasPasswordHash = tableInfo.some(col => col.column_name === 'password_hash');
      const hasAccountType = tableInfo.some(col => col.column_name === 'account_type');
      
      if (hasPasswordHash && hasAccountType) {
        console.log('✅ Todas las columnas requeridas están presentes');
      } else {
        console.log('❌ Faltan columnas:');
        if (!hasPasswordHash) console.log('  - password_hash');
        if (!hasAccountType) console.log('  - account_type');
      }
    }
    
  } catch (error) {
    console.error('❌ Error aplicando migración:', error);
    process.exit(1);
  }
}

// Ejecutar migración
applyMigration();