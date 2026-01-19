import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex size-10 shrink-0 items-center overflow-hidden rounded-full border-2 border-primary/20">
            <div 
              className="bg-center bg-no-repeat aspect-square bg-cover size-full" 
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA8W-gt9UQiSY7Vq9QGzTlt4YQaXiopOLzDS35FWtxZuPAhT8sfWowp3sgEGG2zYwiFX2dTVEF6w8d4LTsJiaLN9vwaGuOzSDCWPEZPkfx3I8FSXCDxj50hfFneZUCxlm-dIycU0RBsZSR1ZYvK4W-7-omiUU4npcZrn_ep2M9bTmKiEheHCmoiZE_peDNWbV_h0qrxneuvBkI26Z1oGSI__V-OwgI0qhQ4K-r-0PUA2ShZkogtWsVC_GzTZTLR0Koa1TBv8Jhd2acm")' }}
            />
          </div>
          <div className="flex-1 px-3 min-w-0">
            <p className="text-primary/80 dark:text-primary/70 text-xs font-semibold uppercase tracking-wider truncate">{t('home.welcome')}</p>
            <h2 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] truncate">{t('home.goodAppetite')}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700">
              <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className={`flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border transition-colors ${
                location.pathname === '/profile' || location.pathname.includes('billing')
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-100 dark:border-gray-700'
              }`}
              title={t('navigation.profile')}
            >
              <span className={`material-symbols-outlined ${
                location.pathname === '/profile' || location.pathname.includes('billing')
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar">
        <h3 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">{t('home.quickActions')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 max-w-4xl mx-auto">
          <div 
            onClick={() => navigate('/menu')}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 items-start shadow-sm hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-white">restaurant_menu</span>
            </div>
            <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight">{t('home.viewMenu')}</h2>
          </div>
          
          <div 
            onClick={() => navigate('/join-table')}
            className="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 items-start shadow-sm hover:border-primary transition-colors cursor-pointer group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-white">groups</span>
            </div>
            <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight">{t('home.joinTable')}</h2>
          </div>
          
          <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white p-5 items-start shadow-lg cursor-pointer col-span-2 overflow-hidden relative">
            <div className="z-10 flex items-center gap-3">
              <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-md">
                <span className="material-symbols-outlined text-white text-2xl">qr_code_scanner</span>
              </div>
              <div>
                <h2 className="text-white text-lg font-bold leading-tight">{t('home.scanQR')}</h2>
                <p className="text-white/80 text-sm">{t('home.scanQRDescription')}</p>
              </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-[120px]">qr_code_2</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
