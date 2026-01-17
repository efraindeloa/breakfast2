import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const languages = [
  'Albanés', 'Amárico', 'Armenio', 'Asamés', 'Azerí',
  'Bambara', 'Bengalí', 'Birmano', 'Bosnio', 'Búlgaro',
  'Catalán', 'Cebuano', 'Checo', 'Chino mandarín', 'Coreano', 'Croata',
  'Danés',
  'Eslovaco', 'Esloveno', 'Español', 'Estonio',
  'Farsi (Persa)', 'Finés', 'Francés', 'Fula',
  'Gallego', 'Griego', 'Guaraní', 'Gujarati',
  'Hausa', 'Hebreo', 'Hindi', 'Holandés (Neerlandés)', 'Húngaro',
  'Igbo', 'Indonesio', 'Inglés', 'Italiano',
  'Japonés', 'Javanés',
  'Kannada', 'Kazajo', 'Khmer', 'Kinyarwanda', 'Kirguís',
  'Lao', 'Letón', 'Lingala', 'Lituano',
  'Malayalam', 'Maratí', 'Maya yucateco', 'Min Nan',
  'Nepalí', 'Noruego', 'Náhuatl',
  'Oriya (Odia)',
  'Polaco', 'Portugués', 'Punjabi',
  'Quechua',
  'Rumano', 'Ruso',
  'Serbio', 'Sesotho', 'Setswana', 'Shona', 'Sindhi', 'Sueco', 'Suajili', 'Sundanés',
  'Tagalo (Filipino)', 'Tailandés', 'Tamil', 'Tártaro', 'Telugu', 'Tigriña', 'Tok Pisin', 'Turco', 'Turcomano',
  'Ucraniano', 'Urdu', 'Uzbeko',
  'Vasco', 'Vietnamita',
  'Wolof', 'Wu',
  'Xhosa',
  'Yoruba', 'Yue (Cantonés)',
  'Zulu'
];

const SettingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState('Español');
  const [smartTranslation, setSmartTranslation] = useState(true);
  const [suggestions, setSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar idiomas por búsqueda
  const filteredLanguages = useMemo(() => {
    if (!searchQuery.trim()) return languages;
    const query = searchQuery.toLowerCase();
    return languages.filter(lang => 
      lang.toLowerCase().includes(query) || 
      lang.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query)
    );
  }, [searchQuery]);

  // Agrupar idiomas por letra inicial
  const groupedLanguages = useMemo(() => {
    const groups: Record<string, string[]> = {};
    filteredLanguages.forEach(lang => {
      const firstLetter = lang.charAt(0).toUpperCase();
      if (!groups[firstLetter]) {
        groups[firstLetter] = [];
      }
      groups[firstLetter].push(lang);
    });
    return groups;
  }, [filteredLanguages]);

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
          <h1 className="text-[#181411] dark:text-white text-lg font-semibold tracking-tight">Configuración</h1>
          <div className="w-10"></div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* AI Configuration Section */}
        <section className="mt-4">
          <div className="px-4 pb-2">
            <h2 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-wider opacity-60">Inteligencia Artificial</h2>
          </div>
          <div className="mx-4 bg-white dark:bg-[#2d241c] rounded-xl border border-solid border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm">
            {/* Smart Translation Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">auto_awesome</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">Traducción Inteligente</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">Traduce automáticamente menús y reseñas en tiempo real</p>
                </div>
              </div>
              <Toggle checked={smartTranslation} onChange={setSmartTranslation} />
            </div>

            <div className="h-[1px] bg-[#e6e0db] dark:bg-[#3d3228] mx-4"></div>

            {/* Analysis Toggle */}
            <div className="flex items-center gap-4 px-4 py-5 justify-between">
              <div className="flex items-center gap-4">
                <div className="text-[#8a7560] dark:text-[#a8937d] flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#3d3228] shrink-0 size-12">
                  <span className="material-symbols-outlined text-[26px]">restaurant</span>
                </div>
                <div className="flex flex-col justify-center max-w-[200px]">
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight">Sugerencias Gastronómicas</p>
                  <p className="text-[#8a7560] dark:text-[#a8937d] text-xs font-normal leading-normal mt-1">Basado en tus preferencias anteriores</p>
                </div>
              </div>
              <Toggle checked={suggestions} onChange={setSuggestions} />
            </div>
          </div>
        </section>

        {/* Help Banner */}
        <div className="mt-6 px-4">
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-4">
            <span className="material-symbols-outlined text-primary">info</span>
            <p className="text-[#8a7560] dark:text-[#c4b19d] text-sm leading-snug">
              La inteligencia artificial utiliza datos procesados localmente para proteger tu privacidad.
            </p>
          </div>
        </div>

        {/* Language Selection Section */}
        <section className="mt-6">
          <div className="px-4 pb-3">
            <h2 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-wider opacity-60 mb-3">Seleccionar Idioma</h2>
            
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar idioma..."
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
                {Object.keys(groupedLanguages).sort().map((letter) => (
                  <div key={letter}>
                    {Object.keys(groupedLanguages).length > 1 && (
                      <div className="px-4 py-2 bg-gray-50 dark:bg-[#3d3228] border-b border-[#e6e0db] dark:border-[#3d3228]">
                        <p className="text-xs font-bold text-[#8a7560] dark:text-[#a8937d] uppercase tracking-wider">{letter}</p>
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
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[#8a7560] dark:text-[#a8937d] mb-3">search_off</span>
                <p className="text-[#181411] dark:text-white font-medium mb-1">No se encontraron idiomas</p>
                <p className="text-[#8a7560] dark:text-[#a8937d] text-sm">Intenta con otro término de búsqueda</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const LanguageOption: React.FC<{ id: string; name: string; selected: boolean; onChange: (id: string) => void }> = ({ id, name, selected, onChange }) => (
  <label 
    onClick={() => onChange(id)} 
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-[#3d3228] ${
      selected ? 'bg-primary/5 dark:bg-primary/10' : ''
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
      selected ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'
    }`}>
      <span className={`material-symbols-outlined text-lg ${selected ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>
        language
      </span>
    </div>
    <div className="flex grow items-center">
      <p className={`text-sm font-medium ${
        selected 
          ? 'text-primary dark:text-primary' 
          : 'text-[#181411] dark:text-white'
      }`}>
        {name}
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
