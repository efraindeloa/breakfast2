/**
 * Script para crear un restaurante de ejemplo y asociarlo al usuario actual
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createSampleRestaurant() {
  console.log('\n🍽️  ========================================');
  console.log('   CREAR RESTAURANTE DE EJEMPLO');
  console.log('========================================\n');

  try {
    // 1. Obtener el usuario actual (necesitas estar autenticado)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      console.error('❌ Error: No hay sesión activa. Por favor, inicia sesión primero.');
      console.log('\n💡 Para usar este script:');
      console.log('   1. Inicia sesión en la aplicación');
      console.log('   2. Abre la consola del navegador');
      console.log('   3. Ejecuta: await supabase.auth.getSession()');
      console.log('   4. Copia el user.id');
      console.log('   5. Ejecuta este script con: node scripts/create-sample-restaurant.js <user-id>\n');
      process.exit(1);
    }

    const userId = session.user.id;
    console.log(`✅ Usuario autenticado: ${userId}`);
    console.log(`   Email: ${session.user.email}\n`);

    // 2. Verificar si el usuario ya tiene un restaurante
    const { data: existingStaff, error: staffError } = await supabase
      .from('restaurant_staff')
      .select('restaurant_id, restaurants(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .limit(1);

    if (staffError && staffError.code !== 'PGRST116') {
      throw staffError;
    }

    if (existingStaff && existingStaff.length > 0) {
      const restaurant = existingStaff[0].restaurants;
      console.log('⚠️  Ya tienes un restaurante asociado:');
      console.log(`   Nombre: ${restaurant.name}`);
      console.log(`   ID: ${restaurant.id}`);
      console.log(`   Slug: ${restaurant.slug}\n`);
      console.log('💡 Puedes acceder a la pantalla de perfil en: /restaurant-profile\n');
      return;
    }

    // 3. Crear el restaurante
    console.log('🔄 Creando restaurante de ejemplo...\n');

    const restaurantData = {
      name: 'Donk Restaurant',
      slug: 'donk-restaurant',
      description: 'Restaurante de comida mexicana e internacional',
      address: 'Av. Reforma 123',
      city: 'Ciudad de México',
      state: 'CDMX',
      country: 'México',
      postal_code: '06600',
      latitude: 19.4326,
      longitude: -99.1332,
      phone: '+52 55 1234 5678',
      email: 'contacto@donkrestaurant.com',
      website: 'https://www.donkrestaurant.com',
      logo_url: 'restaurant-images/logos/logo-donk-restaurant.png',
      cover_image_url: null,
      rating: 4.5,
      total_reviews: 120,
      is_active: true,
      is_verified: true,
      timezone: 'America/Mexico_City',
      // Nuevos campos de perfil
      nombre_comercial: 'Donk Restaurant',
      razon_social: 'Donk Restaurant S.A. de C.V.',
      descripcion_corta: 'Deliciosa comida mexicana e internacional en el corazón de la ciudad',
      descripcion_larga: 'Donk Restaurant es un lugar acogedor donde la tradición mexicana se encuentra con sabores internacionales. Ofrecemos platillos preparados con ingredientes frescos y de la más alta calidad, en un ambiente cálido y familiar.',
      tipo_cocina: 'Mexicana e Internacional',
      tags: ['familiar', 'romántico', 'gourmet'],
      direccion_completa: 'Av. Reforma 123, Col. Juárez, Del. Cuauhtémoc, Ciudad de México, CDMX, 06600',
      email_contacto: 'contacto@donkrestaurant.com',
      sitio_web: 'https://www.donkrestaurant.com',
    };

    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurantData)
      .select()
      .single();

    if (restaurantError) {
      // Si el restaurante ya existe, obtenerlo
      if (restaurantError.code === '23505') {
        console.log('⚠️  El restaurante ya existe, obteniendo datos...\n');
        const { data: existingRestaurant, error: fetchError } = await supabase
          .from('restaurants')
          .select('*')
          .eq('slug', 'donk-restaurant')
          .single();

        if (fetchError) throw fetchError;
        restaurant = existingRestaurant;
      } else {
        throw restaurantError;
      }
    }

    console.log(`✅ Restaurante creado/obtenido: ${restaurant.name}`);
    console.log(`   ID: ${restaurant.id}\n`);

    // 4. Asociar el usuario al restaurante como owner
    console.log('🔄 Asociando usuario al restaurante como owner...\n');

    const { data: staff, error: staffInsertError } = await supabase
      .from('restaurant_staff')
      .insert({
        restaurant_id: restaurant.id,
        user_id: userId,
        role: 'owner',
        is_active: true,
      })
      .select()
      .single();

    if (staffInsertError) {
      if (staffInsertError.code === '23505') {
        console.log('⚠️  El usuario ya está asociado a este restaurante\n');
      } else {
        throw staffInsertError;
      }
    } else {
      console.log(`✅ Usuario asociado como ${staff.role}\n`);
    }

    // 5. Crear configuraciones de ejemplo
    console.log('🔄 Creando configuraciones de ejemplo...\n');

    // Service Config
    const { error: serviceError } = await supabase
      .from('restaurant_service_config')
      .upsert({
        restaurant_id: restaurant.id,
        consumo_en_mesa: true,
        para_llevar: true,
        servicio_domicilio: false,
        acepta_reservaciones: true,
        acepta_lista_espera: true,
        tiempo_promedio_preparacion: 30,
        numero_mesas: 20,
        capacidad_total: 80,
      }, { onConflict: 'restaurant_id' });

    if (serviceError) console.warn('⚠️  Error al crear service config:', serviceError.message);
    else console.log('✅ Configuración de servicio creada');

    // Payment Config
    const { error: paymentError } = await supabase
      .from('restaurant_payment_config')
      .upsert({
        restaurant_id: restaurant.id,
        acepta_efectivo: true,
        acepta_tarjeta: true,
        acepta_app: true,
        propina_sugerida: [10, 15, 18, 20],
        divide_cuenta: true,
        moneda: 'MXN',
      }, { onConflict: 'restaurant_id' });

    if (paymentError) console.warn('⚠️  Error al crear payment config:', paymentError.message);
    else console.log('✅ Configuración de pagos creada');

    // Notification Config
    const { error: notificationError } = await supabase
      .from('restaurant_notification_config')
      .upsert({
        restaurant_id: restaurant.id,
        notificaciones_app: true,
        notificaciones_whatsapp: false,
        notificaciones_email: true,
        plantillas_mensajes: {},
        idioma_mensajes: 'es',
        horario_envio_notificaciones: { inicio: '09:00', fin: '22:00' },
      }, { onConflict: 'restaurant_id' });

    if (notificationError) console.warn('⚠️  Error al crear notification config:', notificationError.message);
    else console.log('✅ Configuración de notificaciones creada');

    // Metrics
    const { error: metricsError } = await supabase
      .from('restaurant_metrics')
      .upsert({
        restaurant_id: restaurant.id,
        fecha_alta: new Date().toISOString(),
        estatus: 'activo',
        plan: 'basico',
        uso_app: true,
        ordenes_mes: 150,
        clientes_unicos: 85,
        rating_promedio: 4.5,
        total_opiniones: 120,
      }, { onConflict: 'restaurant_id' });

    if (metricsError) console.warn('⚠️  Error al crear metrics:', metricsError.message);
    else console.log('✅ Métricas creadas');

    console.log('\n' + '='.repeat(60));
    console.log('✅ ¡Restaurante de ejemplo creado exitosamente!');
    console.log('='.repeat(60));
    console.log(`\n📋 Detalles:`);
    console.log(`   Nombre: ${restaurant.name}`);
    console.log(`   Slug: ${restaurant.slug}`);
    console.log(`   ID: ${restaurant.id}`);
    console.log(`\n🌐 Accede a la pantalla de perfil en:`);
    console.log(`   /restaurant-profile\n`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.details) console.error('   Detalles:', error.details);
    if (error.hint) console.error('   Hint:', error.hint);
    process.exit(1);
  }
}

createSampleRestaurant();
