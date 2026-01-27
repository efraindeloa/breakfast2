import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { getUserProfile } from '../services/database';

interface TopNavbarProps {
  showAvatar?: boolean;
  showWelcome?: boolean;
  userName?: string;
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  showFavorites?: boolean;
}

const TopNavbar: React.FC<TopNavbarProps> = ({
  showAvatar = true,
  showWelcome = false,
  userName: propUserName,
  title,
  onBack,
  showBackButton = false,
  showFavorites = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userName, setUserName] = useState<string>(propUserName || '');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState<string>('');

  // Cargar datos del usuario si no se proporcionaron
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSupabaseConfigured() || !user?.id || propUserName) {
        return;
      }

      try {
        // Cargar nombre del usuario
        const { data, error } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        let name = '';
        if (error) {
          name = user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 '';
        } else if (data?.name) {
          name = data.name;
        } else {
          name = user.user_metadata?.full_name || 
                 user.user_metadata?.name || 
                 user.email?.split('@')[0] || 
                 '';
        }

        setUserName(name.split(' ')[0]);

        // Generar iniciales (2 letras)
        const words = name.trim().split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
          setUserInitials((words[0][0] + words[words.length - 1][0]).toUpperCase());
        } else if (words.length === 1 && words[0].length >= 2) {
          setUserInitials(words[0].substring(0, 2).toUpperCase());
        } else if (words.length === 1) {
          setUserInitials((words[0][0] + words[0][0]).toUpperCase());
        } else {
          const emailPrefix = user.email?.split('@')[0] || '';
          setUserInitials(emailPrefix.substring(0, 2).toUpperCase());
        }

        // Cargar avatar del usuario
        if (showAvatar) {
          const profile = await getUserProfile(user.id);
          if (profile?.avatar_url) {
            setUserAvatar(profile.avatar_url);
          } else {
            setUserAvatar(null);
          }
        }
      } catch (error) {
        console.error('[TopNavbar] Error loading user data:', error);
        const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 
                         user?.user_metadata?.name?.split(' ')[0] || 
                         user?.email?.split('@')[0] || 
                         '';
        setUserName(firstName);
        
        const name = user?.user_metadata?.full_name || 
                    user?.user_metadata?.name || 
                    user?.email?.split('@')[0] || 
                    '';
        const words = name.trim().split(' ').filter(w => w.length > 0);
        if (words.length >= 2) {
          setUserInitials((words[0][0] + words[words.length - 1][0]).toUpperCase());
        } else if (words.length === 1 && words[0].length >= 2) {
          setUserInitials(words[0].substring(0, 2).toUpperCase());
        } else {
          const emailPrefix = user?.email?.split('@')[0] || 'U';
          setUserInitials(emailPrefix.substring(0, 2).toUpperCase());
        }
      }
    };

    loadUserData();
  }, [user?.id, propUserName, showAvatar]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
      <div className="flex items-center p-4 pb-2 justify-between">
        {/* Left side: Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {showAvatar ? (
            <button
              onClick={() => navigate('/profile')}
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 transition-all hover:border-primary/40 active:scale-95"
            >
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName || 'Usuario'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    if (target.parentElement) {
                      const initialsDiv = document.createElement('div');
                      initialsDiv.className = 'w-full h-full flex items-center justify-center text-primary dark:text-primary/90 font-bold text-sm';
                      initialsDiv.textContent = userInitials || 'U';
                      target.parentElement.appendChild(initialsDiv);
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary dark:text-primary/90 font-bold text-sm">
                  {userInitials || 'U'}
                </div>
              )}
            </button>
          ) : null}
        </div>

        {/* Center: Title or Welcome message */}
        <div className="flex-1 px-3 min-w-0">
          {showWelcome ? (
            <>
              <p className="text-primary/80 dark:text-primary/70 text-xs font-semibold uppercase tracking-wider truncate">
                {t('home.welcome')}
              </p>
              <h2 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] truncate">
                {userName 
                  ? t('home.goodAppetite').replace('Alex', userName)
                  : t('home.goodAppetite')}
              </h2>
            </>
          ) : title ? (
            <h2 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] truncate text-center">
              {title}
            </h2>
          ) : null}
        </div>

        {/* Right side: Notifications, Favorites, Profile */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            className="flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title={t('navigation.notifications') || 'Notificaciones'}
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">notifications</span>
          </button>
          
          {showFavorites && (
            <button 
              onClick={() => navigate('/favorites')}
              className={`flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border transition-colors ${
                location.pathname === '/favorites'
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              title={t('navigation.favorites') || 'Favoritos'}
            >
              <span className={`material-symbols-outlined ${
                location.pathname === '/favorites'
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>favorite</span>
            </button>
          )}
          
          <button 
            onClick={() => navigate('/profile')}
            className={`flex size-10 items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-sm border transition-colors ${
              location.pathname === '/profile' || location.pathname.includes('billing')
                ? 'border-primary bg-primary/10'
                : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
            title={t('navigation.profile') || 'Perfil'}
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
  );
};

export default TopNavbar;
