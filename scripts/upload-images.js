/**
 * Script para subir todas las imágenes de la carpeta public/ a Supabase Storage
 * 
 * Uso:
 * 1. Asegúrate de tener las variables de entorno configuradas (.env)
 * 2. Ejecuta: node scripts/upload-images.js
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
const envPath = join(__dirname, '..', '.env');
config({ path: envPath });

// Cargar variables (primero desde .env, luego desde process.env)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Error: VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY deben estar configuradas');
  console.error('   Verifica que el archivo .env existe y contiene estas variables');
  console.error(`   Ruta buscada: ${envPath}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Mapeo de imágenes a buckets
const imageMapping = {
  // Imágenes de productos (bebidas, postres, cócteles)
  'baileys.webp': { bucket: 'product-images', path: 'products/baileys.webp' },
  'cafe-americano-nespresso.webp': { bucket: 'product-images', path: 'products/cafe-americano-nespresso.webp' },
  'cafe-expresso-nespresso.webp': { bucket: 'product-images', path: 'products/cafe-expresso-nespresso.webp' },
  'capuchino-nespresso.webp': { bucket: 'product-images', path: 'products/capuchino-nespresso.webp' },
  'carajilla.jpg': { bucket: 'product-images', path: 'products/carajilla.jpg' },
  'carajillo solo.webp': { bucket: 'product-images', path: 'products/carajillo-solo.webp' },
  'carajillo.jpeg': { bucket: 'product-images', path: 'products/carajillo.jpeg' },
  'cheesecake-lotus.png': { bucket: 'product-images', path: 'products/cheesecake-lotus.png' },
  'cheesecake-vasco.jpg': { bucket: 'product-images', path: 'products/cheesecake-vasco.jpg' },
  'chincho-seco.avif': { bucket: 'product-images', path: 'products/chincho-seco.avif' },
  'chinchon-dulce.jpg': { bucket: 'product-images', path: 'products/chinchon-dulce.jpg' },
  'coketillo_donk.jpg': { bucket: 'product-images', path: 'products/coketillo-donk.jpg' },
  'flan-vainilla.jpg': { bucket: 'product-images', path: 'products/flan-vainilla.jpg' },
  'frangelico.webp': { bucket: 'product-images', path: 'products/frangelico.webp' },
  'frappuccino.jpg': { bucket: 'product-images', path: 'products/frappuccino.jpg' },
  'jugo-naranja.avif': { bucket: 'product-images', path: 'products/jugo-naranja.jpg', convert: true },
  'licor43.webp': { bucket: 'product-images', path: 'products/licor43.webp' },
  'pan-elote.jpeg': { bucket: 'product-images', path: 'products/pan-elote.jpeg' },
  'pastel-3leches.jpg': { bucket: 'product-images', path: 'products/pastel-3leches.jpg' },
  'red-velvet.jpg': { bucket: 'product-images', path: 'products/red-velvet.jpg' },
  'sambuca.webp': { bucket: 'product-images', path: 'products/sambuca.webp' },
  'tarta-chocolate.jpg': { bucket: 'product-images', path: 'products/tarta-chocolate.jpg' },
  'te.webp': { bucket: 'product-images', path: 'products/te.webp' },
  'volcan.jpg': { bucket: 'product-images', path: 'products/volcan.jpg' },
  
  // Logo del restaurante
  'logo-donk-restaurant.png': { bucket: 'restaurant-images', path: 'logos/logo-donk-restaurant.png' },
};

/**
 * Sube una imagen a Supabase Storage
 */
async function uploadImage(filePath, bucket, storagePath) {
  try {
    const fileBuffer = await readFile(filePath);
    const fileName = filePath.split(/[/\\]/).pop();
    const contentType = getContentType(fileName);

    console.log(`📤 Subiendo ${fileName} a ${bucket}/${storagePath}...`);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: true // Reemplazar si ya existe
      });

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log(`   ⚠️  Ya existe, actualizando...`);
        // Intentar actualizar
        const { error: updateError } = await supabase.storage
          .from(bucket)
          .update(storagePath, fileBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: true
          });
        if (updateError) throw updateError;
        console.log(`   ✅ Actualizado: ${fileName}`);
      } else {
        throw error;
      }
    } else {
      console.log(`   ✅ Subido: ${fileName}`);
    }

    // Retornar URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    return publicUrl;
  } catch (error) {
    console.error(`   ❌ Error subiendo ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Obtiene el content type basado en la extensión del archivo
 */
function getContentType(fileName) {
  const ext = fileName.split('.').pop().toLowerCase();
  const types = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'avif': 'image/avif'
  };
  return types[ext] || 'image/jpeg';
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando subida de imágenes a Supabase Storage...\n');

  const publicDir = join(__dirname, '..', 'public');
  const files = await readdir(publicDir);
  
  // Filtrar solo archivos de imagen
  const imageFiles = files.filter(file => {
    const ext = file.split('.').pop().toLowerCase();
    return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(ext);
  });

  console.log(`📁 Encontradas ${imageFiles.length} imágenes\n`);

  const results = {
    success: [],
    failed: [],
    skipped: []
  };

  for (const file of imageFiles) {
    const filePath = join(publicDir, file);
    const mapping = imageMapping[file];

    if (!mapping) {
      console.log(`⏭️  Omitiendo ${file} (no está en el mapeo)`);
      results.skipped.push(file);
      continue;
    }

    const publicUrl = await uploadImage(filePath, mapping.bucket, mapping.path);
    
    if (publicUrl) {
      results.success.push({ file, url: publicUrl, bucket: mapping.bucket });
    } else {
      results.failed.push(file);
    }

    // Pequeña pausa para no sobrecargar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Subidas exitosas: ${results.success.length}`);
  console.log(`❌ Fallidas: ${results.failed.length}`);
  console.log(`⏭️  Omitidas: ${results.skipped.length}`);
  console.log('\n📋 URLs públicas generadas:\n');

  results.success.forEach(({ file, url, bucket }) => {
    console.log(`${file}:`);
    console.log(`  Bucket: ${bucket}`);
    console.log(`  URL: ${url}\n`);
  });

  if (results.failed.length > 0) {
    console.log('\n❌ Archivos que fallaron:');
    results.failed.forEach(file => console.log(`  - ${file}`));
  }

  if (results.skipped.length > 0) {
    console.log('\n⏭️  Archivos omitidos (agregar al mapeo si es necesario):');
    results.skipped.forEach(file => console.log(`  - ${file}`));
  }

  console.log('\n✨ ¡Proceso completado!');
  console.log('\n💡 Próximo paso: Actualizar las referencias en la base de datos con las nuevas URLs');
}

// Ejecutar
main().catch(console.error);
