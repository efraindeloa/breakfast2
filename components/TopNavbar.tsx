import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { getUserProfile } from '../services/api';

interface TopNavbarProps {
  showAvatar?: boolean;
  showWelcome?: boolean;
  userName?: string;
  title?: string;
  onBack?: () => void;
  showBackButton?: boolean;
  showFavorites?: boolean;
}

const getInitials = (name: string, email?: string) => {
  const words = name.trim().split(' ').filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }

  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }

  return (email?.substring(0, 2) || 'U').toUpperCase();
};

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
  const { user, accountType, userType } = useAuth();

  const [userName, setUserName] = useState(propUserName || '');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userInitials, setUserInitials] = useState('U');

  // Usuario invitado
  useEffect(() => {
    if ((userType as any) === 'guest') {
      setUserName(t('register.userType'));
      setUserInitials('UR');
    }
  }, [userType, t]);

  // Cargar datos del usuario registrado
  useEffect(() => {
    if (
      !isSupabaseConfigured() ||
      !user?.id ||
      propUserName ||
      (userType as any) !== 'registered'
    ) {
      return;
    }

    const loadUserData = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();

        const name =
          data?.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email ||
          '';

        //setUserName(name.split(' ')[0]);
        setUserName(name);
        setUserInitials(getInitials(name, user.email));

        if (showAvatar) {
          const profile = await getUserProfile(user.id);
          setUserAvatar(profile.success ? profile.data?.avatar_url : null);
        }
      } catch (error) {
        console.error('[TopNavbar] Error loading user data:', error);
      }
    };

    loadUserData();
  }, [user?.id, propUserName, showAvatar, userType]);

  const handleBack = () => {
    onBack ? onBack() : navigate(-1);
  };

  return (
    <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
      <div className="flex items-center p-4 pb-2 justify-between">
        <div className="flex items-center gap-2 shrink-0">
          {showBackButton ? (
            <button onClick={handleBack} className="size-10 rounded-full bg-white dark:bg-gray-800 border">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
          ) : showAvatar ? (
            <button onClick={() => navigate('/profile')} className="size-10 rounded-full overflow-hidden border">
              {userAvatar ? (
                <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold">
                  {userInitials}
                </div>
              )}
            </button>
          ) : null}
        </div>

        <div className="flex-1 px-3 min-w-0">
          {showWelcome && (
            <>
              <p className="text-xs uppercase truncate">{t('home.welcome')}</p>
              <h2 className="text-lg font-bold truncate">{userName}</h2>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showFavorites && accountType !== 'restaurant' && (userType as any) === 'registered' && (
            <button onClick={() => navigate('/favorites')}>
              <span className="material-symbols-outlined">favorite</span>
            </button>
          )}
          <button onClick={() => navigate('/profile')}>
            <span className="material-symbols-outlined">
              {(userType as any) === 'guest' ? 'person_outline' : 'person'}
            </span>
          </button>
        </div>
      </div>

      {title && !showWelcome && (
        <div className="px-4 pb-2">
          <h2 className="text-lg font-bold truncate text-center">{title}</h2>
        </div>
      )}
    </header>
  );
};

export default TopNavbar;
