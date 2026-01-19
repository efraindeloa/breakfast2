
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { languagesData } from '../content/languages';

interface WelcomeScreenProps {
  onLogin: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setLanguage } = useLanguage();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
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
    const languageNames: Record<'es' | 'en' | 'pt' | 'fr', string> = {
      'es': 'Español',
      'en': 'English',
      'pt': 'Português',
      'fr': 'Français'
    };
    localStorage.setItem('selectedLanguage', languageNames[langCode]);
    setShowLanguageSelector(false);
  };

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

  const handleLogin = () => {
    // Aquí se podría agregar validación y lógica de inicio de sesión
    onLogin();
    navigate('/home');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      {/* Selector de idioma */}
      <div ref={languageSelectorRef} className="absolute top-4 right-4 z-20">
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
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              {t('welcome.emailOrPhone')}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                person
              </span>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('welcome.emailOrPhonePlaceholder')}
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
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
                className="w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('welcome.passwordPlaceholder')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              className="flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
            >
              {t('welcome.login')}
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
    </div>
  );
};

export default WelcomeScreen;
