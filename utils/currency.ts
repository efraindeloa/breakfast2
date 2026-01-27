/**
 * Utilidades para formatear precios según el país/idioma seleccionado
 */

// Mapeo de idiomas/países a símbolos de moneda
const currencySymbols: Record<string, string> = {
  // Idiomas principales
  'Español': '$', // USD o moneda local según el país
  'Inglés': '$', // USD
  'Portugués': 'R$', // Real brasileño
  'Francés': '€', // Euro
  'Chino mandarín': '¥', // Yuan chino
  'Hindi': '₹', // Rupia india
  'Japonés': '¥', // Yen japonés
  'Ruso': '₽', // Rublo ruso
  'Italiano': '€', // Euro
  'Coreano': '₩', // Won surcoreano
  
  // Otros idiomas con sus monedas correspondientes
  'Alemán': '€',
  'Holandés (Neerlandés)': '€',
  'Polaco': 'zł', // Złoty polaco
  'Turco': '₺', // Lira turca
  'Tailandés': '฿', // Baht tailandés
  'Vietnamita': '₫', // Dong vietnamita
  'Indonesio': 'Rp', // Rupia indonesia
  'Filipino': '₱', // Peso filipino
  'Hebreo': '₪', // Shekel israelí
  'Árabe': 'د.إ', // Dirham (varía por país)
  'Sueco': 'kr', // Corona sueca
  'Noruego': 'kr', // Corona noruega
  'Danés': 'kr', // Corona danesa
  'Suizo': 'CHF', // Franco suizo
  'Británico': '£', // Libra esterlina
  'Canadiense': 'C$', // Dólar canadiense
  'Australiano': 'A$', // Dólar australiano
  'Nuevo Zelanda': 'NZ$', // Dólar neozelandés
  'México': '$', // Peso mexicano
  'Argentina': '$', // Peso argentino
  'Chile': '$', // Peso chileno
  'Colombia': '$', // Peso colombiano
  'Perú': 'S/', // Sol peruano
  'Brasil': 'R$', // Real brasileño
};

/**
 * Obtiene el símbolo de moneda basado en el idioma/país seleccionado
 * @param languageName - Nombre del idioma seleccionado (ej: "Español", "Chino mandarín")
 * @returns Símbolo de moneda correspondiente, o '$' por defecto
 */
export const getCurrencySymbol = (languageName: string | null | undefined): string => {
  if (!languageName) {
    return '$'; // Por defecto USD
  }
  
  // Buscar coincidencia exacta
  if (currencySymbols[languageName]) {
    return currencySymbols[languageName];
  }
  
  // Buscar coincidencias parciales para idiomas relacionados
  const lowerName = languageName.toLowerCase();
  
  // Chino (varios dialectos)
  if (lowerName.includes('chino') || lowerName.includes('mandarín') || lowerName.includes('cantonés') || lowerName.includes('min nan') || lowerName.includes('wu') || lowerName.includes('yue')) {
    return '¥';
  }
  
  // Japonés
  if (lowerName.includes('japonés')) {
    return '¥';
  }
  
  // Coreano
  if (lowerName.includes('coreano')) {
    return '₩';
  }
  
  // Hindi y otros idiomas de India
  if (lowerName.includes('hindi') || lowerName.includes('tamil') || lowerName.includes('telugu') || 
      lowerName.includes('malayalam') || lowerName.includes('kannada') || lowerName.includes('gujarati') ||
      lowerName.includes('punjabi') || lowerName.includes('bengalí') || lowerName.includes('maratí') ||
      lowerName.includes('oriya') || lowerName.includes('asamés') || lowerName.includes('urdu')) {
    return '₹';
  }
  
  // Ruso y otros idiomas eslavos
  if (lowerName.includes('ruso') || lowerName.includes('ucraniano') || lowerName.includes('búlgaro') ||
      lowerName.includes('serbio') || lowerName.includes('croata') || lowerName.includes('bosnio')) {
    return '₽';
  }
  
  // Idiomas europeos con Euro
  if (lowerName.includes('francés') || lowerName.includes('italiano') || lowerName.includes('alemán') ||
      lowerName.includes('holandés') || lowerName.includes('español') || lowerName.includes('portugués') ||
      lowerName.includes('griego') || lowerName.includes('finés') || lowerName.includes('irlandés') ||
      lowerName.includes('catalán') || lowerName.includes('gallego') || lowerName.includes('vasco')) {
    // Para español y portugués, usar moneda local si es específico del país
    if (lowerName.includes('español') && !lowerName.includes('mexico') && !lowerName.includes('argentina') && 
        !lowerName.includes('chile') && !lowerName.includes('colombia')) {
      return '€'; // España usa Euro
    }
    if (lowerName.includes('portugués') && !lowerName.includes('brasil')) {
      return '€'; // Portugal usa Euro
    }
    return '€';
  }
  
  // Portugués de Brasil
  if (lowerName.includes('brasil') || (lowerName.includes('portugués') && lowerName.includes('brasil'))) {
    return 'R$';
  }
  
  // Tailandés
  if (lowerName.includes('tailandés') || lowerName.includes('khmer')) {
    return '฿';
  }
  
  // Vietnamita
  if (lowerName.includes('vietnamita')) {
    return '₫';
  }
  
  // Indonesio
  if (lowerName.includes('indonesio') || lowerName.includes('javanés') || lowerName.includes('sundanés')) {
    return 'Rp';
  }
  
  // Turco
  if (lowerName.includes('turco') || lowerName.includes('turcomano') || lowerName.includes('azerí')) {
    return '₺';
  }
  
  // Hebreo
  if (lowerName.includes('hebreo')) {
    return '₪';
  }
  
  // Por defecto, usar dólar
  return '$';
};

/**
 * Formatea un precio con el símbolo de moneda correspondiente
 * @param price - Precio como número o string
 * @param languageName - Nombre del idioma seleccionado
 * @returns Precio formateado con el símbolo de moneda
 */
export const formatPrice = (price: number | string, languageName?: string | null): string => {
  // Obtener el nombre del idioma desde localStorage si no se proporciona
  if (!languageName) {
    const savedLanguage = localStorage.getItem('selectedLanguage');
    languageName = savedLanguage || 'Español';
  }
  
  // Convertir precio a número
  let numericPrice: number;
  if (typeof price === 'string') {
    // Remover cualquier símbolo de moneda existente
    numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;
  } else {
    numericPrice = price;
  }
  
  // Obtener símbolo de moneda
  const symbol = getCurrencySymbol(languageName);
  
  // Formatear precio con 2 decimales
  const formattedPrice = numericPrice.toFixed(2);
  
  // Retornar según la posición del símbolo (algunos van antes, otros después)
  if (symbol === 'Rp' || symbol === 'CHF') {
    return `${symbol} ${formattedPrice}`;
  }
  
  // Para la mayoría de símbolos, van antes del número
  return `${symbol}${formattedPrice}`;
};
