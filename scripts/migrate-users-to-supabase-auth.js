/**
 * Script para migrar usuarios existentes del sistema simple a Supabase Auth
 * 
 * IMPORTANTE: Ejecutar este script DESPUÉS de:
 * 1. Aplicar la migración SQL (20260211000000_migrate_to_supabase_auth.sql)
 * 2. Configurar Supabase Auth en el dashboard
 * 3. Actualizar el código de la aplicación
 * 
 * Este script:
 * 1. Lee todos los usuarios de la tabla users que no tienen auth_user_id
 * 2. Para cada usuario, crea una cuenta en Supabase Auth
 * 3. Actualiza la tabla users con el auth_user_id correspondiente
 * 4. Migra todas las referencias de user_id en otras tablas
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer configuración de Supabase
const envPath = join(__dirname, '..', '.env');
let SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY;

try {
  const envContent = readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('REACT_APP_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim().replace(/['"]/g, '');
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      SUPABASE_SERVICE_ROLE_KEY = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
} catch (error) {
  console.error('Error leyendo archivo .env:', error.message);
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno requeridas:');
  console.error('   - REACT_APP_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nAsegúrate de que estén definidas en el archivo .env');
  process.exit(1);
}

// Crear cliente de Supabase con service role key para operaciones administrativas
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Generar contraseña temporal para usuarios migrados
 */
function generateTempPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Migrar un usuario individual
 */
async function migrateUser(user) {
  console.log(`\n📝 Migrando usuario: ${user.email} (${user.name})`);
  
  try {
    // 1. Crear usuario en Supabase Auth
    const tempPassword = generateTempPassword();
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: tempPassword,
      phone: user.phone || undefined,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        name: user.name,
        full_name: user.name,
        preferred_language: user.preferred_language || 'es',
        migrated_from_simple_auth: true,
        migration_date: new Date().toISOString()
      }
    });

    if (authError) {
      console.error(`❌ Error creando usuario en Auth:`, authError.message);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      console.error(`❌ No se retornó usuario de Auth`);
      return { success: false, error: 'No user returned from Auth' };
    }

    console.log(`✅ Usuario creado en Auth: ${authData.user.id}`);

    // 2. Actualizar tabla users con auth_user_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        auth_user_id: authData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ Error actualizando tabla users:`, updateError.message);
      // Intentar eliminar el usuario de Auth si falló la actualización
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { success: false, error: updateError.message };
    }

    // 3. Migrar referencias en otras tablas
    const tablesToMigrate = [
      'restaurant_staff',
      'orders',
      'order_history',
      'cart_items',
      'favorite_dishes',
      'user_profiles',
      'contacts',
      'waitlist_entries',
      'assistance_requests',
      'reviews',
      'user_payment_methods',
      'user_transactions',
      'loyalty_data'
    ];

    let migratedTables = 0;
    for (const table of tablesToMigrate) {
      try {
        const { error: migrateError } = await supabase
          .from(table)
          .update({ user_id: authData.user.id })
          .eq('user_id', user.id);

        if (migrateError && migrateError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.warn(`⚠️  Error migrando tabla ${table}:`, migrateError.message);
        } else {
          migratedTables++;
        }
      } catch (error) {
        console.warn(`⚠️  Excepción migrando tabla ${table}:`, error.message);
      }
    }

    console.log(`✅ Usuario migrado exitosamente. Tablas actualizadas: ${migratedTables}/${tablesToMigrate.length}`);
    console.log(`🔑 Contraseña temporal: ${tempPassword}`);
    console.log(`📧 El usuario debe cambiar su contraseña en el primer login`);

    return { 
      success: true, 
      authUserId: authData.user.id, 
      tempPassword,
      migratedTables 
    };

  } catch (error) {
    console.error(`❌ Error inesperado migrando usuario:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando migración de usuarios a Supabase Auth...\n');

  try {
    // 1. Obtener usuarios que necesitan migración
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, name, phone, preferred_language, created_at')
      .is('auth_user_id', null)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error obteniendo usuarios:', fetchError.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('✅ No hay usuarios que migrar. Todos los usuarios ya tienen auth_user_id.');
      process.exit(0);
    }

    console.log(`📊 Encontrados ${users.length} usuarios para migrar:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.name}) - Creado: ${user.created_at}`);
    });

    // 2. Confirmar migración
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   - Este proceso creará nuevas cuentas en Supabase Auth');
    console.log('   - Los usuarios necesitarán usar las contraseñas temporales generadas');
    console.log('   - Se recomienda enviar emails de reset de contraseña después');
    console.log('   - El proceso NO es reversible fácilmente\n');

    // En un entorno de producción, aquí podrías agregar una confirmación interactiva
    // Para este script, continuamos automáticamente

    // 3. Migrar usuarios uno por uno
    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`\n[${i + 1}/${users.length}] Procesando usuario...`);
      
      const result = await migrateUser(user);
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        results.errors.push({
          user: user.email,
          error: result.error
        });
      }

      // Pequeña pausa entre migraciones para evitar rate limits
      if (i < users.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // 4. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE MIGRACIÓN');
    console.log('='.repeat(60));
    console.log(`✅ Usuarios migrados exitosamente: ${results.successful}`);
    console.log(`❌ Usuarios con errores: ${results.failed}`);
    console.log(`📊 Total procesados: ${results.successful + results.failed}`);

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORES ENCONTRADOS:');
      results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.user}: ${error.error}`);
      });
    }

    if (results.successful > 0) {
      console.log('\n🎉 MIGRACIÓN COMPLETADA');
      console.log('\n📋 PRÓXIMOS PASOS:');
      console.log('   1. Verificar que los usuarios pueden hacer login con Supabase Auth');
      console.log('   2. Enviar emails de reset de contraseña a los usuarios migrados');
      console.log('   3. Actualizar la aplicación para usar solo Supabase Auth');
      console.log('   4. Eliminar el código de autenticación simple');
      console.log('   5. Opcional: Eliminar la columna password_hash de la tabla users');
    }

  } catch (error) {
    console.error('❌ Error fatal en la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar script
main().catch(console.error);