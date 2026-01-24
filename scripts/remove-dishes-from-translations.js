import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.join(__dirname, '..', 'locales');
const languages = ['es', 'en', 'pt', 'fr'];

console.log('Eliminando sección "dishes" de archivos de traducción...\n');

languages.forEach(lang => {
  const filePath = path.join(localesDir, `${lang}.json`);
  const backupPath = path.join(localesDir, `${lang}.json.backup`);
  
  try {
    // Leer el archivo backup (que tiene todo el contenido)
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    const translations = JSON.parse(backupContent);
    
    // Eliminar la sección "dishes"
    delete translations.dishes;
    
    // Escribir el archivo sin "dishes"
    fs.writeFileSync(filePath, JSON.stringify(translations, null, 2), 'utf8');
    
    console.log(`✅ ${lang}.json: Sección "dishes" eliminada`);
  } catch (error) {
    console.error(`❌ Error procesando ${lang}.json:`, error.message);
  }
});

console.log('\n✨ Proceso completado!');
