import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>('');

  // Cargar nombre del usuario
  useEffect(() => {
    const loadUserName = async () => {
      if (!isSupabaseConfigured() || !user?.id) {
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        if (error) {
          // Si hay error, usar datos de OAuth o email
          const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                           user.user_metadata?.name?.split(' ')[0] || 
                           user.email?.split('@')[0] || 
                           '';
          setUserName(firstName);
        } else if (data?.name) {
          // Usar nombre de la BD
          setUserName(data.name.split(' ')[0]);
        } else {
          // Fallback a OAuth o email
          const firstName = user.user_metadata?.full_name?.split(' ')[0] || 
                           user.user_metadata?.name?.split(' ')[0] || 
                           user.email?.split('@')[0] || 
                           '';
          setUserName(firstName);
        }
      } catch (error) {
        console.error('[HomeScreen] Error loading user name:', error);
        // Fallback a OAuth o email
        const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                         user?.user_metadata?.name?.split(' ')[0] || 
                         user?.email?.split('@')[0] || 
                         '';
        setUserName(firstName);
      }
    };

    loadUserName();
  }, [user?.id]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex size-10 shrink-0 items-center overflow-hidden rounded-full border-2 border-primary/20 bg-white p-1">
            <img 
              src="/logo-donk-restaurant.png" 
              alt="DONK RESTAURANT"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                if (target.parentElement) {
                  const fallback = document.createElement('div');
                  fallback.className = 'bg-center bg-no-repeat aspect-square bg-cover size-full';
                  fallback.style.backgroundImage = 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA8W-gt9UQiSY7Vq9QGzTlt4YQaXiopOLzDS35FWtxZuPAhT8sfWowp3sgEGG2zYwiFX2dTVEF6w8d4LTsJiaLN9vwaGuOzSDCWPEZPkfx3I8FSXCDxj50hfFneZUCxlm-dIycU0RBsZSR1ZYvK4W-7-omiUU4npcZrn_ep2M9bTmKiEheHCmoiZE_peDNWbV_h0qrxneuvBkI26Z1oGSI__V-OwgI0qhQ4K-r-0PUA2ShZkogtWsVC_GzTZTLR0Koa1TBv8Jhd2acm")';
                  target.parentElement.appendChild(fallback);
                }
              }}
            />
          </div>
          <div className="flex-1 px-3 min-w-0">
            <p className="text-primary/80 dark:text-primary/70 text-xs font-semibold uppercase tracking-wider truncate">{t('home.welcome')}</p>
            <h2 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] truncate">
              {userName 
                ? t('home.goodAppetite').replace('Alex', userName)
                : t('home.goodAppetite')}
            </h2>
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
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HomeScreen;
