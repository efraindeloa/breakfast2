/**
 * Script para verificar cuántos productos tiene en el carrito un usuario específico
 * 
 * Uso: node scripts/check-user-cart.js efraindeloa@hotmail.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configurar rutas para ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Intentar usar service role key primero (bypass RLS), si no está disponible usar anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (o SUPABASE_SERVICE_ROLE_KEY) deben estar configurados en .env');
  process.exit(1);
}

// Informar qué key se está usando
if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('✅ Usando SERVICE_ROLE_KEY (bypass RLS)\n');
} else {
  console.warn('⚠️  Usando ANON_KEY - puede haber restricciones de RLS\n');
  console.warn('   Para resultados completos, agrega SUPABASE_SERVICE_ROLE_KEY en .env\n');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserCart(email) {
  try {
    console.log(`\n🔍 Buscando carrito del usuario: ${email}\n`);

    // Primero, encontrar el usuario por email
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .limit(1);

    if (userError) {
      console.error('❌ Error al buscar usuario:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log(`⚠️  No se encontró ningún usuario con el email: ${email}`);
      return;
    }

    const user = users[0];
    console.log(`✅ Usuario encontrado:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}\n`);

    // Obtener items del carrito
    // Primero intentar con JOIN, si falla intentar sin JOIN
    let cartItems = [];
    let cartError = null;
    
    const { data: itemsData, error: itemsError } = await supabase
      .from('cart_items')
      .select('id, product_id, quantity, notes, created_at, restaurant_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.error('❌ Error al buscar items del carrito:', itemsError);
      cartError = itemsError;
    } else {
      cartItems = itemsData || [];
      
      // Obtener información de productos por separado si hay items
      if (cartItems.length > 0) {
        const productIds = [...new Set(cartItems.map(item => item.product_id).filter(id => id != null))];
        if (productIds.length > 0) {
          const { data: productsData, error: productsError } = await supabase
            .from('products')
            .select('id, name, price')
            .in('id', productIds);
          
          if (productsError) {
            console.warn('⚠️  Error al obtener información de productos:', productsError);
          } else {
            // Combinar datos
            const productsMap = {};
            if (productsData) {
              productsData.forEach(p => {
                productsMap[p.id] = p;
              });
            }
            
            cartItems = cartItems.map(item => ({
              ...item,
              products: productsMap[item.product_id] || null
            }));
          }
        }
      }
    }

    if (cartError) {
      console.error('❌ No se pudieron obtener los items del carrito');
      return;
    }

    // Mostrar resumen
    const totalItems = cartItems?.length || 0;
    const totalQuantity = cartItems?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;

    console.log('📊 RESUMEN DEL CARRITO:');
    console.log(`   Items diferentes: ${totalItems}`);
    console.log(`   Cantidad total de productos: ${totalQuantity}\n`);

    // Mostrar detalles
    if (totalItems > 0) {
      console.log('🛒 DETALLES DEL CARRITO:');
      console.log('─'.repeat(80));
      cartItems.forEach((item, index) => {
        const product = item.products;
        console.log(`\n${index + 1}. Item ID: ${item.id}`);
        console.log(`   Producto ID: ${item.product_id}`);
        console.log(`   Nombre: ${product?.name || 'N/A'}`);
        console.log(`   Cantidad: ${item.quantity || 1}`);
        console.log(`   Precio: ${product?.price || 'N/A'}`);
        if (item.notes) {
          console.log(`   Notas: ${item.notes}`);
        }
        console.log(`   Agregado: ${new Date(item.created_at).toLocaleString('es-ES')}`);
      });
      console.log('\n' + '─'.repeat(80));
    } else {
      console.log('🛒 El carrito está vacío.\n');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

// Obtener email del argumento de línea de comandos
const email = process.argv[2] || 'efraindeloa@hotmail.com';

checkUserCart(email);
