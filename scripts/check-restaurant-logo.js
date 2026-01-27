/**
 * Script para verificar el estado actual del logo del restaurante
 * Ejecuta: node scripts/check-restaurant-logo.js
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRestaurantLogo() {
  try {
    console.log('🔍 Verificando estado del logo del restaurante...\n');
    
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
    console.log(`   Slug: ${restaurant.slug}`);
    console.log(`   Logo URL en BD: ${restaurant.logo_url || 'ninguno'}`);
    console.log(`   Cover Image URL: ${restaurant.cover_image_url || 'ninguno'}\n`);
    
    // 2. Construir URL completa
    if (restaurant.logo_url) {
      const fullUrl = `${supabaseUrl}/storage/v1/object/public/restaurant-images/${restaurant.logo_url}`;
      console.log(`📸 URL completa del logo:`);
      console.log(`   ${fullUrl}\n`);
      
      // 3. Verificar si la imagen existe en Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from('restaurant-images')
        .list(restaurant.logo_url.split('/')[0] || 'logos', {
          search: restaurant.logo_url.split('/').pop() || 'logo-donk-restaurant.png'
        });
      
      if (fileError) {
        console.error('⚠️  Error al verificar archivo en Storage:', fileError.message);
      } else if (fileData && fileData.length > 0) {
        console.log(`✅ Archivo encontrado en Storage:`);
        console.log(`   Nombre: ${fileData[0].name}`);
        console.log(`   Tamaño: ${(fileData[0].metadata?.size || 0) / 1024} KB`);
        console.log(`   Creado: ${fileData[0].created_at}`);
      } else {
        console.log(`⚠️  Archivo NO encontrado en Storage en la ruta: ${restaurant.logo_url}`);
        console.log(`   Verificando estructura del bucket...\n`);
        
        // Listar estructura del bucket
        const { data: bucketData, error: bucketError } = await supabase.storage
          .from('restaurant-images')
          .list('', { limit: 100 });
        
        if (bucketError) {
          console.error('❌ Error al listar bucket:', bucketError.message);
        } else {
          console.log('📁 Estructura del bucket restaurant-images:');
          bucketData?.forEach(item => {
            console.log(`   ${item.name} (${item.id})`);
          });
        }
      }
    } else {
      console.log('⚠️  No hay logo_url configurado en la base de datos');
    }
    
    console.log('\n✅ Verificación completada');
    
  } catch (error) {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  }
}

checkRestaurantLogo();
