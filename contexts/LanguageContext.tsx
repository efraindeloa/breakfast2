import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'es' | 'en' | 'pt' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Hook para traducciones
export const useTranslation = () => {
  const { t } = useLanguage();
  return { t };
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Cargar idioma guardado o usar español por defecto
    const savedCode = localStorage.getItem('appLanguage');
    if (savedCode === 'en' || savedCode === 'pt' || savedCode === 'fr') {
      return savedCode as Language;
    }
    // Fallback al nombre del idioma guardado
    const savedName = localStorage.getItem('selectedLanguage');
    if (savedName === 'English' || savedName === 'Inglés') return 'en';
    if (savedName === 'Português' || savedName === 'Portugués') return 'pt';
    if (savedName === 'Français' || savedName === 'Francés') return 'fr';
    return 'es';
  });

  // Cargar traducciones dinámicamente
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    // Cargar el archivo de traducción correspondiente
    const loadTranslations = async () => {
      try {
        const translationsModule = await import(`../locales/${language}.json`);
        setTranslations(translationsModule.default);
      } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
        // Fallback a español si hay error
        try {
          const fallbackModule = await import('../locales/es.json');
          setTranslations(fallbackModule.default);
        } catch (fallbackError) {
          console.error('Error loading fallback translations:', fallbackError);
        }
      }
    };
    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Guardar el código del idioma para el sistema de traducción
    localStorage.setItem('appLanguage', lang);
    // También guardar el nombre del idioma para compatibilidad con SettingsScreen
    const languageNames: Record<Language, string> = {
      'es': 'Español',
      'en': 'English',
      'pt': 'Português',
      'fr': 'Français'
    };
    localStorage.setItem('selectedLanguage', languageNames[lang]);
  };

  const t = (key: string): string => {
    // Soporte para claves anidadas con notación de punto (ej: "common.save")
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retornar la clave si no se encuentra
      }
    }
    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
