/**
 * Contenido de idiomas
 * 
 * Este archivo contiene información sobre idiomas que puede cambiar dinámicamente.
 * Incluye nombres de idiomas, banderas y nombres nativos de países.
 */

export interface LanguageInfo {
  name: string; // Nombre del idioma en español
  flagUrl?: string; // URL de la bandera del país
  nativeCountryName?: string; // Nombre del país en su idioma nativo
  isPopular?: boolean; // Si es uno de los idiomas más populares
}

// Los 10 idiomas más populares
export const popularLanguages = [
  'Español',
  'Inglés',
  'Portugués',
  'Francés',
  'Chino mandarín',
  'Hindi',
  'Japonés',
  'Ruso',
  'Italiano',
  'Coreano'
];

// Información completa de todos los idiomas
export const languagesData: Record<string, LanguageInfo> = {
  // Idiomas populares
  'Español': {
    name: 'Español',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    nativeCountryName: 'España',
    isPopular: true
  },
  'Inglés': {
    name: 'Inglés',
    flagUrl: 'https://flagcdn.com/w40/gb.png',
    nativeCountryName: 'United Kingdom',
    isPopular: true
  },
  'Portugués': {
    name: 'Portugués',
    flagUrl: 'https://flagcdn.com/w40/pt.png',
    nativeCountryName: 'Portugal',
    isPopular: true
  },
  'Francés': {
    name: 'Francés',
    flagUrl: 'https://flagcdn.com/w40/fr.png',
    nativeCountryName: 'France',
    isPopular: true
  },
  'Chino mandarín': {
    name: 'Chino mandarín',
    flagUrl: 'https://flagcdn.com/w40/cn.png',
    nativeCountryName: '中国',
    isPopular: true
  },
  'Hindi': {
    name: 'Hindi',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'भारत',
    isPopular: true
  },
  'Japonés': {
    name: 'Japonés',
    flagUrl: 'https://flagcdn.com/w40/jp.png',
    nativeCountryName: '日本',
    isPopular: true
  },
  'Ruso': {
    name: 'Ruso',
    flagUrl: 'https://flagcdn.com/w40/ru.png',
    nativeCountryName: 'Россия',
    isPopular: true
  },
  'Italiano': {
    name: 'Italiano',
    flagUrl: 'https://flagcdn.com/w40/it.png',
    nativeCountryName: 'Italia',
    isPopular: true
  },
  'Coreano': {
    name: 'Coreano',
    flagUrl: 'https://flagcdn.com/w40/kr.png',
    nativeCountryName: '한국',
    isPopular: true
  },
  
  // Resto de idiomas
  'Albanés': {
    name: 'Albanés',
    flagUrl: 'https://flagcdn.com/w40/al.png',
    nativeCountryName: 'Shqipëria'
  },
  'Amárico': {
    name: 'Amárico',
    flagUrl: 'https://flagcdn.com/w40/et.png',
    nativeCountryName: 'ኢትዮጵያ'
  },
  'Armenio': {
    name: 'Armenio',
    flagUrl: 'https://flagcdn.com/w40/am.png',
    nativeCountryName: 'Հայաստան'
  },
  'Asamés': {
    name: 'Asamés',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'অসম'
  },
  'Azerí': {
    name: 'Azerí',
    flagUrl: 'https://flagcdn.com/w40/az.png',
    nativeCountryName: 'Azərbaycan'
  },
  'Bambara': {
    name: 'Bambara',
    flagUrl: 'https://flagcdn.com/w40/ml.png',
    nativeCountryName: 'Mali'
  },
  'Bengalí': {
    name: 'Bengalí',
    flagUrl: 'https://flagcdn.com/w40/bd.png',
    nativeCountryName: 'বাংলাদেশ'
  },
  'Birmano': {
    name: 'Birmano',
    flagUrl: 'https://flagcdn.com/w40/mm.png',
    nativeCountryName: 'မြန်မာ'
  },
  'Bosnio': {
    name: 'Bosnio',
    flagUrl: 'https://flagcdn.com/w40/ba.png',
    nativeCountryName: 'Bosna i Hercegovina'
  },
  'Búlgaro': {
    name: 'Búlgaro',
    flagUrl: 'https://flagcdn.com/w40/bg.png',
    nativeCountryName: 'България'
  },
  'Catalán': {
    name: 'Catalán',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    nativeCountryName: 'Catalunya'
  },
  'Cebuano': {
    name: 'Cebuano',
    flagUrl: 'https://flagcdn.com/w40/ph.png',
    nativeCountryName: 'Pilipinas'
  },
  'Checo': {
    name: 'Checo',
    flagUrl: 'https://flagcdn.com/w40/cz.png',
    nativeCountryName: 'Česko'
  },
  'Croata': {
    name: 'Croata',
    flagUrl: 'https://flagcdn.com/w40/hr.png',
    nativeCountryName: 'Hrvatska'
  },
  'Danés': {
    name: 'Danés',
    flagUrl: 'https://flagcdn.com/w40/dk.png',
    nativeCountryName: 'Danmark'
  },
  'Eslovaco': {
    name: 'Eslovaco',
    flagUrl: 'https://flagcdn.com/w40/sk.png',
    nativeCountryName: 'Slovensko'
  },
  'Esloveno': {
    name: 'Esloveno',
    flagUrl: 'https://flagcdn.com/w40/si.png',
    nativeCountryName: 'Slovenija'
  },
  'Estonio': {
    name: 'Estonio',
    flagUrl: 'https://flagcdn.com/w40/ee.png',
    nativeCountryName: 'Eesti'
  },
  'Farsi (Persa)': {
    name: 'Farsi (Persa)',
    flagUrl: 'https://flagcdn.com/w40/ir.png',
    nativeCountryName: 'ایران'
  },
  'Finés': {
    name: 'Finés',
    flagUrl: 'https://flagcdn.com/w40/fi.png',
    nativeCountryName: 'Suomi'
  },
  'Fula': {
    name: 'Fula',
    flagUrl: 'https://flagcdn.com/w40/sn.png',
    nativeCountryName: 'Senegal'
  },
  'Gallego': {
    name: 'Gallego',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    nativeCountryName: 'Galicia'
  },
  'Griego': {
    name: 'Griego',
    flagUrl: 'https://flagcdn.com/w40/gr.png',
    nativeCountryName: 'Ελλάδα'
  },
  'Guaraní': {
    name: 'Guaraní',
    flagUrl: 'https://flagcdn.com/w40/py.png',
    nativeCountryName: 'Paraguái'
  },
  'Gujarati': {
    name: 'Gujarati',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'ગુજરાત'
  },
  'Hausa': {
    name: 'Hausa',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    nativeCountryName: 'Najeriya'
  },
  'Hebreo': {
    name: 'Hebreo',
    flagUrl: 'https://flagcdn.com/w40/il.png',
    nativeCountryName: 'ישראל'
  },
  'Holandés (Neerlandés)': {
    name: 'Holandés (Neerlandés)',
    flagUrl: 'https://flagcdn.com/w40/nl.png',
    nativeCountryName: 'Nederland'
  },
  'Húngaro': {
    name: 'Húngaro',
    flagUrl: 'https://flagcdn.com/w40/hu.png',
    nativeCountryName: 'Magyarország'
  },
  'Igbo': {
    name: 'Igbo',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    nativeCountryName: 'Naịjịrịa'
  },
  'Indonesio': {
    name: 'Indonesio',
    flagUrl: 'https://flagcdn.com/w40/id.png',
    nativeCountryName: 'Indonesia'
  },
  'Javanés': {
    name: 'Javanés',
    flagUrl: 'https://flagcdn.com/w40/id.png',
    nativeCountryName: 'Jawa'
  },
  'Kannada': {
    name: 'Kannada',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'ಕರ್ನಾಟಕ'
  },
  'Kazajo': {
    name: 'Kazajo',
    flagUrl: 'https://flagcdn.com/w40/kz.png',
    nativeCountryName: 'Қазақстан'
  },
  'Khmer': {
    name: 'Khmer',
    flagUrl: 'https://flagcdn.com/w40/kh.png',
    nativeCountryName: 'កម្ពុជា'
  },
  'Kinyarwanda': {
    name: 'Kinyarwanda',
    flagUrl: 'https://flagcdn.com/w40/rw.png',
    nativeCountryName: 'Rwanda'
  },
  'Kirguís': {
    name: 'Kirguís',
    flagUrl: 'https://flagcdn.com/w40/kg.png',
    nativeCountryName: 'Кыргызстан'
  },
  'Lao': {
    name: 'Lao',
    flagUrl: 'https://flagcdn.com/w40/la.png',
    nativeCountryName: 'ລາວ'
  },
  'Letón': {
    name: 'Letón',
    flagUrl: 'https://flagcdn.com/w40/lv.png',
    nativeCountryName: 'Latvija'
  },
  'Lingala': {
    name: 'Lingala',
    flagUrl: 'https://flagcdn.com/w40/cd.png',
    nativeCountryName: 'Kongo'
  },
  'Lituano': {
    name: 'Lituano',
    flagUrl: 'https://flagcdn.com/w40/lt.png',
    nativeCountryName: 'Lietuva'
  },
  'Malayalam': {
    name: 'Malayalam',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'മലയാളം'
  },
  'Maratí': {
    name: 'Maratí',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'मराठी'
  },
  'Maya yucateco': {
    name: 'Maya yucateco',
    flagUrl: 'https://flagcdn.com/w40/mx.png',
    nativeCountryName: 'México'
  },
  'Min Nan': {
    name: 'Min Nan',
    flagUrl: 'https://flagcdn.com/w40/cn.png',
    nativeCountryName: '中國'
  },
  'Nepalí': {
    name: 'Nepalí',
    flagUrl: 'https://flagcdn.com/w40/np.png',
    nativeCountryName: 'नेपाल'
  },
  'Noruego': {
    name: 'Noruego',
    flagUrl: 'https://flagcdn.com/w40/no.png',
    nativeCountryName: 'Norge'
  },
  'Náhuatl': {
    name: 'Náhuatl',
    flagUrl: 'https://flagcdn.com/w40/mx.png',
    nativeCountryName: 'México'
  },
  'Oriya (Odia)': {
    name: 'Oriya (Odia)',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'ଓଡ଼ିଆ'
  },
  'Polaco': {
    name: 'Polaco',
    flagUrl: 'https://flagcdn.com/w40/pl.png',
    nativeCountryName: 'Polska'
  },
  'Punjabi': {
    name: 'Punjabi',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'ਪੰਜਾਬ'
  },
  'Quechua': {
    name: 'Quechua',
    flagUrl: 'https://flagcdn.com/w40/pe.png',
    nativeCountryName: 'Perú'
  },
  'Rumano': {
    name: 'Rumano',
    flagUrl: 'https://flagcdn.com/w40/ro.png',
    nativeCountryName: 'România'
  },
  'Serbio': {
    name: 'Serbio',
    flagUrl: 'https://flagcdn.com/w40/rs.png',
    nativeCountryName: 'Србија'
  },
  'Sesotho': {
    name: 'Sesotho',
    flagUrl: 'https://flagcdn.com/w40/ls.png',
    nativeCountryName: 'Lesotho'
  },
  'Setswana': {
    name: 'Setswana',
    flagUrl: 'https://flagcdn.com/w40/bw.png',
    nativeCountryName: 'Botswana'
  },
  'Shona': {
    name: 'Shona',
    flagUrl: 'https://flagcdn.com/w40/zw.png',
    nativeCountryName: 'Zimbabwe'
  },
  'Sindhi': {
    name: 'Sindhi',
    flagUrl: 'https://flagcdn.com/w40/pk.png',
    nativeCountryName: 'سنڌ'
  },
  'Sueco': {
    name: 'Sueco',
    flagUrl: 'https://flagcdn.com/w40/se.png',
    nativeCountryName: 'Sverige'
  },
  'Suajili': {
    name: 'Suajili',
    flagUrl: 'https://flagcdn.com/w40/ke.png',
    nativeCountryName: 'Kenya'
  },
  'Sundanés': {
    name: 'Sundanés',
    flagUrl: 'https://flagcdn.com/w40/id.png',
    nativeCountryName: 'Sunda'
  },
  'Tagalo (Filipino)': {
    name: 'Tagalo (Filipino)',
    flagUrl: 'https://flagcdn.com/w40/ph.png',
    nativeCountryName: 'Pilipinas'
  },
  'Tailandés': {
    name: 'Tailandés',
    flagUrl: 'https://flagcdn.com/w40/th.png',
    nativeCountryName: 'ไทย'
  },
  'Tamil': {
    name: 'Tamil',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'தமிழ்'
  },
  'Tártaro': {
    name: 'Tártaro',
    flagUrl: 'https://flagcdn.com/w40/ru.png',
    nativeCountryName: 'Татарстан'
  },
  'Telugu': {
    name: 'Telugu',
    flagUrl: 'https://flagcdn.com/w40/in.png',
    nativeCountryName: 'తెలుగు'
  },
  'Tigriña': {
    name: 'Tigriña',
    flagUrl: 'https://flagcdn.com/w40/er.png',
    nativeCountryName: 'ኤርትራ'
  },
  'Tok Pisin': {
    name: 'Tok Pisin',
    flagUrl: 'https://flagcdn.com/w40/pg.png',
    nativeCountryName: 'Papua Niugini'
  },
  'Turco': {
    name: 'Turco',
    flagUrl: 'https://flagcdn.com/w40/tr.png',
    nativeCountryName: 'Türkiye'
  },
  'Turcomano': {
    name: 'Turcomano',
    flagUrl: 'https://flagcdn.com/w40/tm.png',
    nativeCountryName: 'Türkmenistan'
  },
  'Ucraniano': {
    name: 'Ucraniano',
    flagUrl: 'https://flagcdn.com/w40/ua.png',
    nativeCountryName: 'Україна'
  },
  'Urdu': {
    name: 'Urdu',
    flagUrl: 'https://flagcdn.com/w40/pk.png',
    nativeCountryName: 'پاکستان'
  },
  'Uzbeko': {
    name: 'Uzbeko',
    flagUrl: 'https://flagcdn.com/w40/uz.png',
    nativeCountryName: 'Oʻzbekiston'
  },
  'Vasco': {
    name: 'Vasco',
    flagUrl: 'https://flagcdn.com/w40/es.png',
    nativeCountryName: 'Euskal Herria'
  },
  'Vietnamita': {
    name: 'Vietnamita',
    flagUrl: 'https://flagcdn.com/w40/vn.png',
    nativeCountryName: 'Việt Nam'
  },
  'Wolof': {
    name: 'Wolof',
    flagUrl: 'https://flagcdn.com/w40/sn.png',
    nativeCountryName: 'Sénégal'
  },
  'Wu': {
    name: 'Wu',
    flagUrl: 'https://flagcdn.com/w40/cn.png',
    nativeCountryName: '中國'
  },
  'Xhosa': {
    name: 'Xhosa',
    flagUrl: 'https://flagcdn.com/w40/za.png',
    nativeCountryName: 'eMzantsi Afrika'
  },
  'Yoruba': {
    name: 'Yoruba',
    flagUrl: 'https://flagcdn.com/w40/ng.png',
    nativeCountryName: 'Nàìjíríà'
  },
  'Yue (Cantonés)': {
    name: 'Yue (Cantonés)',
    flagUrl: 'https://flagcdn.com/w40/cn.png',
    nativeCountryName: '中國'
  },
  'Zulu': {
    name: 'Zulu',
    flagUrl: 'https://flagcdn.com/w40/za.png',
    nativeCountryName: 'iNingizimu Afrika'
  }
};

// Lista de todos los idiomas (populares primero, luego el resto)
export const allLanguages = [
  ...popularLanguages,
  'Albanés', 'Amárico', 'Armenio', 'Asamés', 'Azerí',
  'Bambara', 'Bengalí', 'Birmano', 'Bosnio', 'Búlgaro',
  'Catalán', 'Cebuano', 'Checo', 'Croata',
  'Danés',
  'Eslovaco', 'Esloveno', 'Estonio',
  'Farsi (Persa)', 'Finés', 'Fula',
  'Gallego', 'Griego', 'Guaraní', 'Gujarati',
  'Hausa', 'Hebreo', 'Holandés (Neerlandés)', 'Húngaro',
  'Igbo', 'Indonesio',
  'Javanés',
  'Kannada', 'Kazajo', 'Khmer', 'Kinyarwanda', 'Kirguís',
  'Lao', 'Letón', 'Lingala', 'Lituano',
  'Malayalam', 'Maratí', 'Maya yucateco', 'Min Nan',
  'Nepalí', 'Noruego', 'Náhuatl',
  'Oriya (Odia)',
  'Polaco', 'Punjabi',
  'Quechua',
  'Rumano',
  'Serbio', 'Sesotho', 'Setswana', 'Shona', 'Sindhi', 'Sueco', 'Suajili', 'Sundanés',
  'Tagalo (Filipino)', 'Tailandés', 'Tamil', 'Tártaro', 'Telugu', 'Tigriña', 'Tok Pisin', 'Turco', 'Turcomano',
  'Ucraniano', 'Urdu', 'Uzbeko',
  'Vasco', 'Vietnamita',
  'Wolof', 'Wu',
  'Xhosa',
  'Yoruba', 'Yue (Cantonés)',
  'Zulu'
];
