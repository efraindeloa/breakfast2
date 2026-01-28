import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <TopNavbar showWelcome={true} showFavorites={false} />

      <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar">
        <h3 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">{t('home.quickActions')}</h3>
        <div className="w-full px-4 pb-4">
          {/* Botón QR que ocupa todo el ancho */}
          <div 
            onClick={() => navigate('/qr-scanner')}
            className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white p-5 items-start shadow-lg cursor-pointer overflow-hidden relative mb-3"
          >
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

          {/* Contenedor principal con dos columnas */}
          <div className="flex gap-3 w-full">
            {/* Columna izquierda - 50% */}
            <div className="flex flex-col gap-3 w-1/2">
              <div 
                onClick={() => navigate('/menu')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">restaurant_menu</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('home.viewMenu')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('home.viewMenuDescription')}</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/request-assistance')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-600 transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 group-hover:text-white">person</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('payment.requestAssistance')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('home.requestAssistanceDescription')}</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/waitlist')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 group-hover:bg-orange-600 transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 group-hover:text-white">schedule</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('waitlist.scanQR')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('waitlist.scanQRDescription')}</p>
                </div>
              </div>
            </div>

            {/* Columna derecha - 50% */}
            <div className="flex flex-col gap-3 w-1/2">
              <div 
                onClick={() => navigate('/join-table')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">groups</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('home.joinTable')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('home.joinTableDescription')}</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/invite-users')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-primary group-hover:text-white">person_add</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('invite.title')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('home.inviteDescription')}</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/discover')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-green-100 dark:bg-green-900/30 group-hover:bg-green-600 transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400 group-hover:text-white">explore</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">{t('discover.title')}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t('discover.description')}</p>
                </div>
              </div>
              
              <div 
                onClick={() => navigate('/restaurant-profile')}
                className="flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-colors cursor-pointer group min-h-[140px] overflow-hidden"
              >
                <div className="flex items-center justify-center size-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 group-hover:bg-purple-600 transition-colors shrink-0 mb-2">
                  <span className="material-symbols-outlined text-purple-600 dark:text-purple-400 group-hover:text-white">store</span>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
                  <h2 className="text-[#111813] dark:text-white text-base font-bold leading-tight line-clamp-2">Perfil del Restaurante</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">Gestiona tu restaurante</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
