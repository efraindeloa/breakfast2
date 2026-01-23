import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer variables de entorno
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas en .env');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Leer el archivo SQL
const sqlFile = join(__dirname, '../supabase/MASTER_SETUP.sql');
const sql = readFileSync(sqlFile, 'utf-8');

console.log('🚀 Ejecutando script SQL en Supabase...\n');
console.log(`📁 Archivo: ${sqlFile}\n`);

// Dividir el SQL en comandos individuales (separados por punto y coma)
// Pero necesitamos manejar bloques DO $$ ... END $$ como una unidad
const commands = [];
let currentCommand = '';
let inDoBlock = false;
let doBlockDepth = 0;

for (let i = 0; i < sql.length; i++) {
  const char = sql[i];
  const nextChars = sql.substring(i, i + 3);
  
  if (nextChars === 'DO ' && !inDoBlock) {
    inDoBlock = true;
    doBlockDepth = 1;
    currentCommand += char;
    continue;
  }
  
  if (inDoBlock) {
    currentCommand += char;
    if (nextChars === '$$;' || (nextChars === 'END' && sql.substring(i, i + 7) === 'END $$;')) {
      doBlockDepth--;
      if (doBlockDepth === 0) {
        inDoBlock = false;
        if (currentCommand.trim()) {
          commands.push(currentCommand.trim());
        }
        currentCommand = '';
        i += 6; // Saltar 'END $$;'
        continue;
      }
    }
    if (nextChars === '$$' && sql[i - 1] === ' ') {
      doBlockDepth++;
    }
    continue;
  }
  
  currentCommand += char;
  
  if (char === ';' && !inDoBlock) {
    const trimmed = currentCommand.trim();
    if (trimmed && !trimmed.startsWith('--')) {
      commands.push(trimmed);
    }
    currentCommand = '';
  }
}

// Agregar el último comando si existe
if (currentCommand.trim() && !inDoBlock) {
  commands.push(currentCommand.trim());
}

console.log(`📊 Total de comandos a ejecutar: ${commands.length}\n`);

// Ejecutar comandos uno por uno
let successCount = 0;
let errorCount = 0;
const errors = [];

for (let i = 0; i < commands.length; i++) {
  const command = commands[i];
  
  // Saltar comentarios y líneas vacías
  if (!command || command.trim().startsWith('--') || command.trim() === '') {
    continue;
  }
  
  try {
    console.log(`⏳ Ejecutando comando ${i + 1}/${commands.length}...`);
    
    // Usar rpc para ejecutar SQL (requiere service_role key, pero intentemos con anon)
    // Alternativamente, podemos usar la API REST directamente
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ sql: command })
    });
    
    if (!response.ok) {
      // Si el RPC no existe, intentar método alternativo
      // Supabase no tiene un endpoint directo para ejecutar SQL arbitrario desde el cliente
      // Necesitamos usar el SQL Editor o psql
      throw new Error('No se puede ejecutar SQL directamente desde el cliente. Usa el SQL Editor de Supabase.');
    }
    
    successCount++;
    console.log(`✅ Comando ${i + 1} ejecutado correctamente\n`);
  } catch (error) {
    errorCount++;
    errors.push({ command: i + 1, error: error.message });
    console.error(`❌ Error en comando ${i + 1}: ${error.message}\n`);
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN DE EJECUCIÓN');
console.log('='.repeat(50));
console.log(`✅ Comandos exitosos: ${successCount}`);
console.log(`❌ Comandos con error: ${errorCount}`);
console.log(`📝 Total: ${commands.length}`);

if (errors.length > 0) {
  console.log('\n❌ ERRORES:');
  errors.forEach(({ command, error }) => {
    console.log(`  Comando ${command}: ${error}`);
  });
}

if (errorCount > 0) {
  console.log('\n⚠️  Nota: Supabase no permite ejecutar SQL arbitrario desde el cliente JavaScript.');
  console.log('   Por favor, ejecuta el script manualmente en el SQL Editor de Supabase:');
  console.log('   https://supabase.com/dashboard/project/tkwackqrnsqlmxtalvuw/sql/new');
  process.exit(1);
} else {
  console.log('\n🎉 ¡Script ejecutado correctamente!');
  process.exit(0);
}
