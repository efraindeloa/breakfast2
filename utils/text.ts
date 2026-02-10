/**
 * Utilidades para manipulación de texto
 */

/**
 * Convierte un texto a Title Case (primera letra de cada palabra en mayúscula)
 * @param text Texto a convertir
 * @returns Texto en Title Case
 */
export const toTitleCase = (text: string): string => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(/\s+/) // Dividir por espacios en blanco
    .map(word => {
      if (word.length === 0) return '';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

/**
 * Capitaliza la primera letra de un texto
 * @param text Texto a capitalizar
 * @returns Texto con primera letra en mayúscula
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};
