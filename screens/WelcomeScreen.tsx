
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { languagesData, allLanguages, popularLanguages } from '../content/languages';

interface WelcomeScreenProps {
  onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const { signIn } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [showAllLanguagesModal, setShowAllLanguagesModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const languageSelectorRef = useRef<HTMLDivElement>(null);

  // Idiomas disponibles (solo los que tienen traducciones completas)
  const availableLanguages = [
    { name: 'Español', code: 'es' as const },
    { name: 'English', code: 'en' as const },
    { name: 'Português', code: 'pt' as const },
    { name: 'Français', code: 'fr' as const },
  ];

  const handleLanguageChange = (langCode: 'es' | 'en' | 'pt' | 'fr') => {
    setLanguage(langCode);
    // Guardar el nombre del idioma para compatibilidad con SettingsScreen
    // El nombre se guardará automáticamente en LanguageContext cuando se llame setLanguage
    setShowLanguageSelector(false);
  };

  // Función para cambiar idioma desde el modal (solo para los 4 idiomas con traducciones completas)
  const handleLanguageChangeFromModal = (languageName: string) => {
    const languageMap: Record<string, 'es' | 'en' | 'pt' | 'fr'> = {
      'Español': 'es',
      'English': 'en',
      'Inglés': 'en',
      'Português': 'pt',
      'Portugués': 'pt',
      'Français': 'fr',
      'Francés': 'fr'
    };
    
    const langCode = languageMap[languageName];
    if (langCode) {
      setLanguage(langCode);
      localStorage.setItem('selectedLanguage', languageName === 'English' ? 'Inglés' : languageName === 'Português' ? 'Portugués' : languageName === 'Français' ? 'Francés' : languageName);
      setShowAllLanguagesModal(false);
      setShowLanguageSelector(false);
    }
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

  // Cerrar el selector de idioma al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageSelectorRef.current && !languageSelectorRef.current.contains(event.target as Node)) {
        setShowLanguageSelector(false);
      }
    };

    if (showLanguageSelector) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLanguageSelector]);

  const handleLogin = async () => {
    // Validar campos
    if (!emailOrPhone.trim()) {
      setError(t('welcome.pleaseEnterEmailOrPhone') || 'Por favor ingresa tu correo o teléfono');
      return;
    }

    if (!password.trim()) {
      setError(t('welcome.pleaseEnterPassword') || 'Por favor ingresa tu contraseña');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Supabase Auth solo acepta email, no teléfono directamente
      // Si el usuario ingresó un teléfono, intentar buscar el email asociado
      let email = emailOrPhone.trim();
      
      // Si no contiene @, asumir que es un teléfono y buscar por teléfono
      // Por ahora, requerimos email para login
      if (!email.includes('@')) {
        setError(t('welcome.pleaseUseEmail') || 'Por favor usa tu correo electrónico para iniciar sesión');
        setIsLoading(false);
        return;
      }

      const { error: signInError } = await signIn(email, password);

      if (signInError) {
        // Solo loguear errores inesperados, no errores de credenciales inválidas (que son esperados)
        const errorMessage = signInError.message || '';
        const isExpectedError = errorMessage.includes('Invalid login credentials') || 
                                errorMessage.includes('invalid_credentials') ||
                                errorMessage.includes('Invalid login') ||
                                errorMessage.includes('User not found') ||
                                errorMessage.includes('user_not_found') ||
                                errorMessage.includes('no está registrada') ||
                                errorMessage.includes('regístrate primero');
        
        if (!isExpectedError) {
          console.error('Login error:', signInError);
        }
        
        let displayError = '';
        
        if (errorMessage.includes('no está registrada') || 
            errorMessage.includes('regístrate primero')) {
          displayError = errorMessage; // Usar el mensaje exacto del error
        } else if (errorMessage.includes('Invalid login credentials') || 
            errorMessage.includes('invalid_credentials') ||
            errorMessage.includes('Invalid login')) {
          displayError = t('welcome.invalidCredentials') || 'Correo o contraseña incorrectos';
        } else if (errorMessage.includes('User not found') || 
                   errorMessage.includes('user_not_found')) {
          displayError = t('welcome.invalidCredentials') || 'Correo o contraseña incorrectos';
        } else {
          displayError = errorMessage || t('welcome.loginError') || 'Error al iniciar sesión';
        }
        
        setError(displayError);
        setIsLoading(false);
        return;
      }

      // Login exitoso
      onLogin();
      navigate('/home');
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError(t('welcome.loginError') || 'Error inesperado al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Selector de idioma */}
      <div ref={languageSelectorRef} className="absolute right-4 z-20 safe-top" style={{ top: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
        <button
          onClick={() => setShowLanguageSelector(!showLanguageSelector)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <span className="material-symbols-outlined text-lg text-gray-600 dark:text-gray-300">
            language
          </span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
            {t('settings.selectLanguage')}
          </span>
        </button>
        
        {showLanguageSelector && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-30">
            {availableLanguages.map((lang) => {
              const langInfo = languagesData[lang.name === 'English' ? 'Inglés' : lang.name === 'Português' ? 'Portugués' : lang.name === 'Français' ? 'Francés' : lang.name];
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {langInfo?.flagUrl && (
                    <img 
                      src={langInfo.flagUrl} 
                      alt={lang.name}
                      className="w-6 h-6 rounded object-cover"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {lang.name}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                setShowLanguageSelector(false);
                setShowAllLanguagesModal(true);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left border-t border-gray-200 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-400 text-xl">more_horiz</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('welcome.otherLanguage')}
              </span>
            </button>
          </div>
        )}
      </div>

      <div className="@container w-full">
        <div className="@[480px]:px-4 @[480px]:py-3">
          <div
            className="relative w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-white @[480px]:rounded-xl min-h-[35vh]"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background-light/95 via-transparent to-transparent dark:from-background-dark/95"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 relative -mt-6 z-10">
        <h1 className="text-[#181411] dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center pb-1">
          {t('welcome.goodDay')}
        </h1>
        <p className="text-[#181411]/60 dark:text-white/60 text-base font-normal leading-normal pb-6 text-center">
          {t('welcome.subtitleMessage')}
        </p>
      </div>

      <div className="flex flex-col flex-1 px-6">
        <div className="max-w-[480px] mx-auto w-full space-y-4">
          {/* Mensaje de error general */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-2">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-xl">error</span>
                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              {t('welcome.emailOrPhone')}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                person
              </span>
              <input
                className={`w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  error ? 'ring-2 ring-red-500' : ''
                }`}
                placeholder={t('welcome.emailOrPhonePlaceholder')}
                type="email"
                value={emailOrPhone}
                onChange={(e) => {
                  setEmailOrPhone(e.target.value);
                  if (error) setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isLoading) {
                    handleLogin();
                  }
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              {t('welcome.password')}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                lock
              </span>
              <input
                className={`w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                  error ? 'ring-2 ring-red-500' : ''
                }`}
                placeholder={t('welcome.passwordPlaceholder')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-xl">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-sm text-primary font-medium hover:text-primary/80 transition-colors"
            >
              {t('welcome.forgotPassword')}
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className={`flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('welcome.loggingIn') || 'Iniciando sesión...'}
                </>
              ) : (
                t('welcome.login')
              )}
            </button>
          </div>

          <p className="text-[#8a7560] dark:text-primary/70 text-sm font-medium leading-normal text-center pt-4">
            {t('welcome.noAccount')}{' '}
            <span
              className="underline cursor-pointer text-primary font-bold"
              onClick={() => navigate('/register')}
            >
              {t('welcome.register')}
            </span>
          </p>
        </div>
      </div>

      <div className="h-6 bg-background-light dark:bg-background-dark"></div>

      {/* Modal de todos los idiomas */}
      {showAllLanguagesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => {
          setShowAllLanguagesModal(false);
          setSearchQuery('');
        }}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#181411] dark:text-white">{t('welcome.selectLanguage')}</h2>
              <button
                onClick={() => {
                  setShowAllLanguagesModal(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">close</span>
              </button>
            </div>

            {/* Búsqueda */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('settings.searchLanguage')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl bg-white dark:bg-[#2d241c] border border-[#e6e0db] dark:border-[#3d3228] text-[#181411] dark:text-white placeholder:text-[#8a7560] dark:placeholder:text-[#a8937d] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#8a7560] dark:text-[#a8937d]">search</span>
              </div>
            </div>

            {/* Lista de idiomas */}
            <div className="flex-1 overflow-y-auto">
              {Object.keys(groupedLanguages).map((letter) => (
                <div key={letter}>
                  {!searchQuery && letter === '★' && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-[#3d3228] border-b border-[#e6e0db] dark:border-[#3d3228]">
                      <p className="text-xs font-bold text-[#8a7560] dark:text-[#a8937d] uppercase tracking-wider">{t('settings.popularLanguages')}</p>
                    </div>
                  )}
                  {!searchQuery && letter !== '★' && (
                    <div className="px-4 py-2 bg-gray-50 dark:bg-[#3d3228] border-b border-[#e6e0db] dark:border-[#3d3228]">
                      <p className="text-xs font-bold text-[#8a7560] dark:text-[#a8937d] uppercase tracking-wider">{letter}</p>
                    </div>
                  )}
                  {groupedLanguages[letter].map((lang) => {
                    const langInfo = languagesData[lang];
                    const flag = langInfo?.flagUrl || null;
                    const isPopular = langInfo?.isPopular || false;
                    const nativeName = langInfo?.nativeCountryName || lang;
                    const isAvailable = ['Español', 'Inglés', 'Portugués', 'Francés'].includes(lang);
                    
                    return (
                      <button
                        key={lang}
                        onClick={() => {
                          if (isAvailable) {
                            handleLanguageChangeFromModal(lang);
                          }
                        }}
                        disabled={!isAvailable}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#3d3228] transition-colors text-left ${
                          !isAvailable ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${
                          isPopular ? 'ring-2 ring-primary/20' : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {flag ? (
                            <img 
                              src={flag} 
                              alt={`${lang} flag`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-lg text-gray-400 dark:text-gray-500">language</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#181411] dark:text-white truncate">{lang}</p>
                          {isPopular && nativeName !== lang && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{nativeName}</p>
                          )}
                        </div>
                        {isAvailable && (
                          <span className="material-symbols-outlined text-sm text-primary">check_circle</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomeScreen;
