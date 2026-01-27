/**
 * Script para actualizar el logo del restaurante donk-restaurant
 * Ejecuta: node scripts/run-update-logo.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Cargar variables de entorno
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateDonkLogo() {
  try {
    console.log('🔄 Actualizando logo del restaurante donk-restaurant...\n');
    
    // 1. Obtener el restaurante por slug
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', 'donk-restaurant')
      .eq('is_active', true)
      .single();
    
    if (restaurantError || !restaurant) {
      console.error('❌ No se encontró el restaurante:', restaurantError?.message || 'Restaurante no encontrado');
      process.exit(1);
    }
    
    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);
    console.log(`   Logo actual: ${restaurant.logo_url || 'ninguno'}\n`);
    
    // 2. Verificar si ya tiene el logo correcto
    const imagePath = 'logos/logo-donk-restaurant.png';
    
    if (restaurant.logo_url === imagePath) {
      console.log('✅ El restaurante ya tiene el logo correcto configurado!');
      console.log(`   Logo actual: ${restaurant.logo_url}`);
      console.log(`   URL completa: ${supabaseUrl}/storage/v1/object/public/restaurant-images/${imagePath}`);
      console.log('\n🎉 No se requiere actualización.');
      return;
    }
    
    // 3. Actualizar el restaurante con la nueva ruta de imagen
    const { data: updatedRestaurant, error: updateError } = await supabase
      .from('restaurants')
      .update({ logo_url: imagePath })
      .eq('id', restaurant.id)
      .select();
    
    if (updateError) {
      console.error('❌ Error al actualizar el restaurante:', updateError.message);
      process.exit(1);
    }
    
    if (!updatedRestaurant || updatedRestaurant.length === 0) {
      console.error('❌ No se retornó ningún dato después de la actualización');
      process.exit(1);
    }
    
    const updated = updatedRestaurant[0];
    console.log('✅ Restaurante actualizado exitosamente!');
    console.log(`   Nuevo logo: ${updated.logo_url}`);
    console.log(`   URL completa: ${supabaseUrl}/storage/v1/object/public/restaurant-images/${imagePath}`);
    console.log('\n🎉 ¡Logo actualizado correctamente!');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

updateDonkLogo();
