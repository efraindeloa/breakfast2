import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

// Importaciones estáticas para carga inicial síncrona
import * as esTranslations from '../locales/es.json';
import * as enTranslations from '../locales/en.json';
import * as ptTranslations from '../locales/pt.json';
import * as frTranslations from '../locales/fr.json';

export type Language = 'es' | 'en' | 'pt' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const allStaticTranslations: Record<Language, Record<string, any>> = {
  es: esTranslations.default || esTranslations,
  en: enTranslations.default || enTranslations,
  pt: ptTranslations.default || ptTranslations,
  fr: frTranslations.default || frTranslations,
};

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

  // Inicializar traducciones de forma síncrona
  const [translations, setTranslations] = useState<Record<string, any>>(() => {
    // Obtener el idioma inicial directamente del localStorage para evitar dependencia de 'language'
    const savedCode = localStorage.getItem('appLanguage');
    const initialLang: Language = (savedCode === 'en' || savedCode === 'pt' || savedCode === 'fr') 
      ? savedCode as Language
      : (() => {
          const savedName = localStorage.getItem('selectedLanguage');
          if (savedName === 'English' || savedName === 'Inglés') return 'en';
          if (savedName === 'Português' || savedName === 'Portugués') return 'pt';
          if (savedName === 'Français' || savedName === 'Francés') return 'fr';
          return 'es';
        })();
    return allStaticTranslations[initialLang] || allStaticTranslations.es;
  });

  useEffect(() => {
    // Actualizar traducciones cuando cambia el idioma
    // Primero intentar usar traducciones estáticas (más rápido)
    if (allStaticTranslations[language]) {
      setTranslations(allStaticTranslations[language]);
    } else {
      // Fallback a carga dinámica si no está en las estáticas
      const loadTranslations = async () => {
        try {
          const translationsModule = await import(`../locales/${language}.json`);
          setTranslations(translationsModule.default || translationsModule);
        } catch (error) {
          console.error(`Error loading translations for ${language}:`, error);
          // Fallback a español si hay error
          setTranslations(allStaticTranslations.es);
        }
      };
      loadTranslations();
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    // Guardar el código del idioma para el sistema de traducción
    localStorage.setItem('appLanguage', lang);
    // También guardar el nombre del idioma para compatibilidad con SettingsScreen
    // IMPORTANTE: Usar los nombres de la lista allLanguages ('Español', 'Inglés', 'Portugués', 'Francés')
    const languageNameMap: Record<Language, string> = {
      'es': 'Español',
      'en': 'Inglés',
      'pt': 'Portugués',
      'fr': 'Francés'
    };
    const languageName = languageNameMap[lang] || 'Español';
    localStorage.setItem('selectedLanguage', languageName);
  };

  const t = useMemo(() => {
    return (key: string): string => {
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
  }, [translations]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
