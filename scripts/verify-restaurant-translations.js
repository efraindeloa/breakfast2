/**
 * Script para verificar que las traducciones de navegación del restaurante
 * estén presentes en todos los archivos de idioma
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'locales');
const languages = ['es', 'en', 'pt', 'fr'];

const requiredKeys = [
  'restaurant.navigation.home',
  'restaurant.navigation.promotions', 
  'restaurant.navigation.menu',
  'restaurant.navigation.reservations',
  'restaurant.navigation.statistics',
  'restaurant.home.manageMenu',
  'restaurant.home.manageMenuDescription',
  'restaurant.home.managePromotions',
  'restaurant.home.managePromotionsDescription',
  'restaurant.menu.editModeActive',
  'restaurant.menu.switchToEditMode',
  'restaurant.promotions.title',
  'restaurant.promotions.addPromotion',
  'restaurant.promotions.addSpecial'
];

function checkTranslations() {
  console.log('🔍 Verificando traducciones de navegación del restaurante...\n');
  
  let allGood = true;
  
  for (const lang of languages) {
    const filePath = path.join(localesDir, `${lang}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ ${lang}.json: Archivo no encontrado`);
      allGood = false;
      continue;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const translations = JSON.parse(content);
      
      console.log(`📄 Verificando ${lang}.json:`);
      
      // Verificar que existe la sección restaurant
      if (!translations.restaurant) {
        console.log(`  ❌ Falta sección restaurant`);
        allGood = false;
        continue;
      }
      
      const restaurant = translations.restaurant;
      let langGood = true;
      
      // Verificar cada clave requerida
      for (const key of requiredKeys) {
        const keyPath = key.split('.').slice(1); // Remover 'restaurant'
        const value = keyPath.reduce((obj, k) => obj && obj[k], restaurant);
        
        if (!value) {
          console.log(`  ❌ Falta: ${key}`);
          langGood = false;
          allGood = false;
        } else {
          console.log(`  ✅ ${key}: "${value}"`);
        }
      }
      
      if (langGood) {
        console.log(`  🎉 Todas las traducciones presentes`);
      }
      
    } catch (error) {
      console.log(`  ❌ Error al leer archivo: ${error.message}`);
      allGood = false;
    }
    
    console.log('');
  }
  
  if (allGood) {
    console.log('🎉 ¡Todas las traducciones de navegación del restaurante están presentes!');
  } else {
    console.log('⚠️ Faltan algunas traducciones. Revisa los archivos de idioma.');
  }
  
  return allGood;
}

// Ejecutar verificación
checkTranslations();

export { checkTranslations };