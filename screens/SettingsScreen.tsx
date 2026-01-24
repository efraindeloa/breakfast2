import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage, useTranslation } from '../contexts/LanguageContext';
import { popularLanguages, allLanguages, languagesData } from '../content/languages';
// Importaciones estáticas para obtener traducciones del idioma seleccionado
import * as esTranslations from '../locales/es.json';
import * as enTranslations from '../locales/en.json';
import * as ptTranslations from '../locales/pt.json';
import * as frTranslations from '../locales/fr.json';

const allStaticTranslations: Record<string, Record<string, any>> = {
  es: esTranslations as any,
  en: enTranslations as any,
  pt: ptTranslations as any,
  fr: frTranslations as any,
};

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { language: currentLanguage, setLanguage: setAppLanguage } = useLanguage();
  const { t } = useTranslation();
  // Función auxiliar para obtener el nombre del idioma desde el código usando traducciones estáticas
  const getLanguageNameFromCode = (code: 'es' | 'en' | 'pt' | 'fr', useCurrentLang = true): string => {
    // Si useCurrentLang es true, usar el idioma actual para las traducciones
    // Si es false, usar español (para la inicialización)
    const translations = useCurrentLang ? allStaticTranslations[currentLanguage] : allStaticTranslations.es;
    const langNames = translations?.common?.languageNames || allStaticTranslations.es.common.languageNames;
    return langNames[code] || code.toUpperCase();
  };

  const [language, setLanguage] = useState(() => {
    // Primero intentar obtener desde appLanguage (el código)
    const savedCode = localStorage.getItem('appLanguage') as 'es' | 'en' | 'pt' | 'fr' | null;
    if (savedCode && ['es', 'en', 'pt', 'fr'].includes(savedCode)) {
      return getLanguageNameFromCode(savedCode, false);
    }
    // Fallback al nombre guardado
    const saved = localStorage.getItem('selectedLanguage');
    if (saved && allLanguages.includes(saved)) {
      return saved;
    }
    // Si el idioma guardado es un código, convertirlo
    if (saved && ['es', 'en', 'pt', 'fr'].includes(saved)) {
      return getLanguageNameFromCode(saved as 'es' | 'en' | 'pt' | 'fr', false);
    }
    return getLanguageNameFromCode(currentLanguage, false);
  });
  const [smartTranslation, setSmartTranslation] = useState(true);
  const [suggestions, setSuggestions] = useState(() => {
    const saved = localStorage.getItem('showSuggestions');
    return saved === 'true';
  });
  const [highlights, setHighlights] = useState(() => {
    const saved = localStorage.getItem('showHighlights');
    return saved === 'true';
  });
  const [assistantEnabled, setAssistantEnabled] = useState(() => {
    const saved = localStorage.getItem('assistantEnabled');
    return saved === null ? true : saved === 'true'; // Por defecto habilitado
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [saved, setSaved] = useState(false);

  // Sincronizar el estado del idioma cuando cambie el idioma de la app
  useEffect(() => {
    // Cuando cambia currentLanguage, actualizar el nombre del idioma mostrado
    const languageName = getLanguageNameFromCode(currentLanguage, true);
    setLanguage(languageName);
  }, [currentLanguage]);

  // Mapear nombre del idioma al código
  // Necesitamos mapear todos los nombres posibles en todos los idiomas
  const getLanguageMap = (): Record<string, 'es' | 'en' | 'pt' | 'fr'> => {
    const map: Record<string, 'es' | 'en' | 'pt' | 'fr'> = {
      // Códigos directamente
      'es': 'es',
      'en': 'en',
      'pt': 'pt',
      'fr': 'fr',
    };

    // Agregar nombres en todos los idiomas posibles
    // Español
    map['Español'] = 'es';
    map['Spanish'] = 'es';
    map['Espagnol'] = 'es';
    map['Espanhol'] = 'es';
    
    // Inglés
    map['Inglés'] = 'en';
    map['English'] = 'en';
    map['Anglais'] = 'en';
    map['Inglês'] = 'en';
    
    // Portugués
    map['Portugués'] = 'pt';
    map['Português'] = 'pt';
    map['Portuguese'] = 'pt';
    map['Portugais'] = 'pt';
    
    // Francés
    map['Francés'] = 'fr';
    map['Français'] = 'fr';
    map['French'] = 'fr';
    map['Francês'] = 'fr';

    // También agregar los nombres traducidos actuales
    map[t('common.languageNames.es')] = 'es';
    map[t('common.languageNames.en')] = 'en';
    map[t('common.languageNames.pt')] = 'pt';
    map[t('common.languageNames.fr')] = 'fr';

    return map;
  };
  const languageMap = getLanguageMap();

  // Obtener el código del idioma seleccionado
  const selectedLanguageCode = useMemo(() => {
    // Primero intentar con el valor directo
    let code = languageMap[language];
    
    if (!code) {
      // Si no se encuentra, intentar con el nombre exacto de la lista de idiomas
      // Los nombres en allLanguages son: 'Español', 'Inglés', 'Portugués', 'Francés'
      const supportedLanguageNames = ['Español', 'Inglés', 'Portugués', 'Francés'];
      if (supportedLanguageNames.includes(language)) {
        // Mapeo directo de nombres de la lista a códigos
        const directMap: Record<string, 'es' | 'en' | 'pt' | 'fr'> = {
          'Español': 'es',
          'Inglés': 'en',
          'Portugués': 'pt',
          'Francés': 'fr'
        };
        code = directMap[language];
      }
    }
    
    if (!code) {
      return currentLanguage;
    }
    
    return code;
  }, [language, languageMap, currentLanguage]);

  // Obtener las traducciones del idioma seleccionado para el botón
  const selectedLanguageTranslations = useMemo(() => {
    return allStaticTranslations[selectedLanguageCode] || allStaticTranslations.es;
  }, [selectedLanguageCode]);

  // Función auxiliar para obtener traducciones del idioma seleccionado
  const getTranslation = (key: string): string => {
    const keys = key.split('.');
    let value: any = selectedLanguageTranslations;
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return key; // Retornar la clave si no se encuentra
      }
    }
    return typeof value === 'string' ? value : key;
  };

  // Función para guardar el idioma seleccionado
  const handleSaveLanguage = () => {
    const langCode = selectedLanguageCode;
    
    // Validar que el código del idioma sea uno de los soportados
    if (!['es', 'en', 'pt', 'fr'].includes(langCode)) {
      alert(`El idioma "${language}" no está disponible. Por favor, selecciona uno de los idiomas soportados.`);
      return;
    }
    
    // Solo cambiar si es diferente al idioma actual
    if (langCode === currentLanguage) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      return;
    }
    
    // setAppLanguage ya guarda en localStorage tanto appLanguage como selectedLanguage
    setAppLanguage(langCode);
    setSaved(true);
    // Ocultar el mensaje después de 2 segundos
    setTimeout(() => setSaved(false), 2000);
  };

  // Filtrar idiomas por búsqueda
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return allLanguages;
    const query = searchQuery.toLowerCase();
    return allLanguages.filter(lang => {
      const langInfo = languagesData[lang];
      const searchText = lang.toLowerCase() + 
        (langInfo?.nativeCountryName ? ' ' + langInfo.nativeCountryName.toLowerCase() : '');
      return searchText.includes(query) || 
        searchText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query);
    });
  }, [searchQuery]);

  // Agrupar idiomas por letra inicial, pero mantener los populares al inicio
  const groupedLanguages = useMemo(() => {
    // Si hay búsqueda, agrupar normalmente
    if (searchQuery.trim()) {
      const groups: Record<string, string[]> = {};
      filteredLanguages.forEach(lang => {
        const firstLetter = lang.charAt(0).toUpperCase();
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(lang);
      });
      return groups;
    }
    
    // Si no hay búsqueda, crear grupos especiales: populares primero
    const groups: Record<string, string[]> = {};
    
    // Grupo especial para idiomas populares
    const popularInFiltered = filteredLanguages.filter(lang => popularLanguages.includes(lang));
    if (popularInFiltered.length > 0) {
      groups['★'] = popularInFiltered; // Usar estrella como marcador especial
    }
    
    // Resto de idiomas agrupados por letra inicial
    const otherInFiltered = filteredLanguages.filter(lang => !popularLanguages.includes(lang));
    otherInFiltered.forEach(lang => {
      const firstLetter = lang.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(lang);
    });
    
    return groups;
  }, [filteredLanguages, searchQuery]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 w-10 h-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] text-[#8a7560] dark:text-[#d4c4a8]">chevron_left</span>
            </button>
          </div>
          <h1 className="text-[#181411] dark:text-white text-lg font-semibold tracking-tight">{t('settings.title')}</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-40">
        {/* AI Configuration Section */}
        <section className="mt-4">
          <div className="px-4 pb-2">
            <h2 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-wider opacity-60">{t('settings.ai.title')}</h2>
          </div>
          <div className="mx-4 bg-white dark:bg-[#2d241c] rounded-xl border border-solid border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm">
            {/* Smart Translation Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">{t('settings.ai.smartTranslation')}</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">{t('settings.ai.smartTranslationDesc')}</p>
                </div>
              </div>
              <Toggle checked={smartTranslation} onChange={setSmartTranslation} />
            </div>

            <div className="h-[1px] bg-[#e6e0db] dark:bg-[#3d3228] mx-4"></div>

            {/* Analysis Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-[#8a7560] dark:text-[#a8937d] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#3d3328] shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">restaurant</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">{t('settings.ai.showSuggestions')}</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">{t('settings.ai.suggestionsDesc')}</p>
                </div>
              </div>
              <Toggle checked={suggestions} onChange={(checked) => {
                setSuggestions(checked);
                localStorage.setItem('showSuggestions', checked.toString());
              }} />
            </div>

            <div className="h-[1px] bg-[#e6e0db] dark:bg-[#3d3228] mx-4"></div>

            {/* Highlights Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-[#8a7560] dark:text-[#a8937d] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#3d3328] shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">star</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">{t('settings.ai.showHighlights')}</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">{t('settings.ai.highlightsDesc')}</p>
                </div>
              </div>
              <Toggle checked={highlights} onChange={(checked) => {
                setHighlights(checked);
                localStorage.setItem('showHighlights', checked.toString());
              }} />
            </div>
          </div>
        </section>

        {/* Assistant Configuration Section */}
        <section className="mt-6">
          <div className="px-4 pb-2">
            <h2 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-wider opacity-60">{t('settings.assistant.title') || 'Asistente'}</h2>
          </div>
          <div className="mx-4 bg-white dark:bg-[#2d241c] rounded-xl border border-solid border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm">
            {/* Assistant Button Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">smart_toy</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">{t('settings.assistant.enableButton') || 'Botón de Asistente'}</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">{t('settings.assistant.enableButtonDesc') || 'Mostrar u ocultar el botón flotante de asistente'}</p>
                </div>
              </div>
              <Toggle checked={assistantEnabled} onChange={(checked) => {
                setAssistantEnabled(checked);
                localStorage.setItem('assistantEnabled', checked.toString());
                // Disparar evento para que AssistantButton se actualice
                window.dispatchEvent(new CustomEvent('assistant-enabled-changed', { detail: { enabled: checked } }));
              }} />
            </div>
          </div>
        </section>

        {/* Help Banner */}
        <div className="mt-6 px-4">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-[#8a7560] dark:text-[#c4b19d] text-sm leading-snug">
              {t('settings.privacyNotice')}
            </p>
          </div>
        </div>

        {/* Language Selection Section */}
        <section className="mt-6">
          <div className="px-4 pb-3">
            <h2 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-wider opacity-60 mb-3">{t('settings.selectLanguage')}</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('settings.searchLanguage')}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-[#2d241c] border border-[#e6e0db] dark:border-[#3d3228] text-[#181411] dark:text-white placeholder:text-[#8a7560] dark:placeholder:text-[#a8937d] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7560] dark:text-[#a8937d]">search</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[#8a7560] dark:text-[#a8937d] text-lg">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Languages List */}
          <div className="px-4 pb-4">
            {filteredLanguages.length > 0 ? (
              <div className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm">
                {(() => {
                  const keys = Object.keys(groupedLanguages);
                  // Ordenar: primero el grupo de populares (★), luego el resto alfabéticamente
                  const sortedKeys = keys.sort((a, b) => {
                    if (a === '★') return -1;
                    if (b === '★') return 1;
                    return a.localeCompare(b);
                  });
                  
                  return sortedKeys.map((letter) => (
                    <div key={letter}>
                      {Object.keys(groupedLanguages).length > 1 && (
                        <div className="px-4 py-2 bg-gray-50 dark:bg-[#3d3228] border-b border-[#e6e0db] dark:border-[#3d3228]">
                          <p className="text-xs font-bold text-[#8a7560] dark:text-[#a8937d] uppercase tracking-wider">
                            {letter === '★' ? t('settings.popularLanguages') : letter}
                          </p>
                        </div>
                      )}
                      <div className="divide-y divide-[#e6e0db] dark:divide-[#3d3228]">
                        {groupedLanguages[letter].map((lang) => (
                          <LanguageOption
                            key={lang}
                            id={lang}
                            name={lang}
                            selected={language === lang}
                            onChange={setLanguage}
                          />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#8a7560] dark:text-[#a8937d] mb-3">search_off</span>
                <p className="text-[#181411] dark:text-white font-medium mb-1">{t('settings.noLanguagesFound')}</p>
                <p className="text-[#8a7560] dark:text-[#a8937d] text-sm">{t('settings.tryAnotherSearch')}</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Fixed Save Button */}
      <div className="fixed bottom-24 left-0 right-0 w-full px-4 z-40 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md pt-2 pb-2">
        <button
          onClick={handleSaveLanguage}
          className="w-full font-bold py-4 rounded-full shadow-lg transition-all text-lg bg-primary text-white shadow-primary/20 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2"
        >
              {saved ? (
                <>
                  <span className="material-symbols-outlined">check_circle</span>
                  <span>{getTranslation('common.saved')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>{getTranslation('common.save')}</span>
                </>
              )}
        </button>
      </div>
    </div>
  );
};

const LanguageOption: React.FC<{ id: string; name: string; selected: boolean; onChange: (id: string) => void }> = ({ id, name, selected, onChange }) => {
  const langInfo = languagesData[name];
  const flag = langInfo?.flagUrl || null;
  const isPopular = langInfo?.isPopular || false;
  const nativeName = langInfo?.nativeCountryName || name;
  
  return (
    <label 
      onClick={() => onChange(id)} 
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#3d3228] ${
        selected ? 'bg-primary/5 dark:bg-primary/10' : ''
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
        selected ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'
      }`}>
        {flag ? (
          <img 
            src={flag} 
            alt={`${name} flag`}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className={`material-symbols-outlined text-lg ${selected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
            language
          </span>
        )}
      </div>
      <div className="flex grow items-center">
        <p className={`text-sm font-medium ${
          selected 
            ? 'text-primary dark:text-primary' 
            : 'text-[#181411] dark:text-white'
        }`}>
          {nativeName}
        </p>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected
          ? 'border-primary bg-primary'
          : 'border-[#e6e0db] dark:border-[#3d3228] bg-transparent'
      }`}>
        {selected && (
          <div className="w-2 h-2 rounded-full bg-white"></div>
        )}
      </div>
    </label>
  );
};

const Toggle: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input 
      type="checkbox" 
      className="sr-only peer" 
      checked={checked} 
      onChange={(e) => onChange(e.target.checked)} 
    />
    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
  </label>
);

export default SettingsScreen;
