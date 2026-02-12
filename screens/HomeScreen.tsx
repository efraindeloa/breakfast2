import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import CurrencyWidget from '../components/widgets/CurrencyWidget';
import WeatherWidget from '../components/widgets/WeatherWidget';
import GuestRestrictionModal from '../components/GuestRestrictionModal';
import RestaurantSelector from '../components/RestaurantSelector';
import { playClickSound } from '../utils/sound';

interface ButtonConfig {
  id: string;
  path: string;
  titleKey: string;
  descriptionKey: string;
  icon: string;
  isQR?: boolean;
  condition?: (accountType: string) => boolean;
}

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { accountType, userType, user } = useAuth();
  const { selectedRestaurantId } = useRestaurant();
  
  // Estados para controlar la opacidad de los botones (efecto fade-in)
  const [buttonOpacities, setButtonOpacities] = useState<Record<string, number>>({
    qr: 0,
    menu: 0,
    promotions: 0,
    assistance: 0,
    waitlist: 0,
    joinTable: 0,
    invite: 0,
    discover: 0,
    reservations: 0,
    restaurantProfile: 0
  });

  // Estado para el orden de los botones y drag and drop
  const [draggedButtonId, setDraggedButtonId] = useState<string | null>(null);
  const [dragOverButtonId, setDragOverButtonId] = useState<string | null>(null);

  // Estado para el orden de los widgets y drag and drop
  const getDefaultWidgetOrder = (): string[] => ['weather', 'currency'];
  const [widgetOrder, setWidgetOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem('homeWidgetOrder');
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        const defaultOrder = getDefaultWidgetOrder();
        const validOrder = defaultOrder.filter(id => parsed.includes(id));
        const missingWidgets = defaultOrder.filter(id => !parsed.includes(id));
        return [...validOrder, ...missingWidgets];
      } catch {
        return getDefaultWidgetOrder();
      }
    }
    return getDefaultWidgetOrder();
  });
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  
  // Estados para controlar la visibilidad de las descripciones
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [descriptionsOpacity, setDescriptionsOpacity] = useState<number>(1);
  const [descriptionTimer, setDescriptionTimer] = useState<NodeJS.Timeout | null>(null);
  // Estado para controlar la visibilidad de descripciones por botón
  const [buttonDescriptions, setButtonDescriptions] = useState<Record<string, { show: boolean; opacity: number }>>({});
  const [buttonDescriptionTimers, setButtonDescriptionTimers] = useState<Record<string, NodeJS.Timeout>>({});
  
  // Estados para controlar la visibilidad del título "Acciones Rápidas"
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [titleOpacity, setTitleOpacity] = useState<number>(1);
  
  // Estado para el modal de restricción de invitados
  const [guestRestrictionModal, setGuestRestrictionModal] = useState<{ show: boolean; featureName: string }>({
    show: false,
    featureName: ''
  });
  
  // Configuración de todos los botones
  const allButtons: ButtonConfig[] = [
    { id: 'qr', path: '/qr-scanner', titleKey: 'home.scanQR', descriptionKey: 'home.scanQRDescription', icon: 'qr_code_scanner', isQR: true },
    { 
      id: 'menu', 
      path: accountType === 'restaurant' ? '/menu-restaurant' : '/menu', 
      titleKey: accountType === 'restaurant' ? 'restaurant.home.manageMenu' : 'home.viewMenu', 
      descriptionKey: accountType === 'restaurant' ? 'restaurant.home.manageMenuDescription' : 'home.viewMenuDescription', 
      icon: 'restaurant_menu' 
    },
    { 
      id: 'promotions', 
      path: '/promotions-restaurant', 
      titleKey: 'restaurant.home.managePromotions', 
      descriptionKey: 'restaurant.home.managePromotionsDescription', 
      icon: 'local_offer',
      condition: (accountType) => accountType === 'restaurant'
    },
    { id: 'assistance', path: '/request-assistance', titleKey: 'payment.requestAssistance', descriptionKey: 'home.requestAssistanceDescription', icon: 'person' },
    { id: 'waitlist', path: '/waitlist', titleKey: 'waitlist.scanQR', descriptionKey: 'waitlist.scanQRDescription', icon: 'schedule', condition: (type) => type !== 'restaurant' },
    { id: 'joinTable', path: '/join-table', titleKey: 'home.joinTable', descriptionKey: 'home.joinTableDescription', icon: 'groups', condition: (type) => type !== 'restaurant' },
    { id: 'invite', path: '/invite-users', titleKey: 'invite.title', descriptionKey: 'home.inviteDescription', icon: 'person_add', condition: (type) => type !== 'restaurant' },
    { id: 'discover', path: '/discover', titleKey: 'discover.title', descriptionKey: 'discover.description', icon: 'explore', condition: (type) => type !== 'restaurant' },
    { id: 'reservations', path: '/reservations', titleKey: 'home.makeReservation', descriptionKey: 'home.makeReservationDescription', icon: 'calendar_month', condition: (type) => type !== 'restaurant' },
    { id: 'restaurantProfile', path: '/restaurant-profile', titleKey: 'restaurant.profile.title', descriptionKey: 'restaurant.profile.manage', icon: 'store' }
  ];

  // Obtener orden guardado o usar orden por defecto
  const getDefaultOrder = (): string[] => {
    const defaultOrder = ['qr', 'menu', 'assistance', 'waitlist', 'joinTable', 'invite'];
    if (accountType !== 'restaurant') {
      defaultOrder.push('discover', 'reservations');
    }
    defaultOrder.push('restaurantProfile');
    return defaultOrder;
  };

  const [buttonOrder, setButtonOrder] = useState<string[]>(() => {
    const savedOrder = localStorage.getItem(`homeButtonOrder_${accountType}`);
    if (savedOrder) {
      try {
        const parsed = JSON.parse(savedOrder);
        // Validar que todos los botones estén presentes
        const defaultOrder = getDefaultOrder();
        const validOrder = defaultOrder.filter(id => parsed.includes(id));
        const missingButtons = defaultOrder.filter(id => !parsed.includes(id));
        return [...validOrder, ...missingButtons];
      } catch {
        return getDefaultOrder();
      }
    }
    return getDefaultOrder();
  });

  // Guardar orden cuando cambie
  useEffect(() => {
    localStorage.setItem(`homeButtonOrder_${accountType}`, JSON.stringify(buttonOrder));
  }, [buttonOrder, accountType]);

  // Guardar orden de widgets cuando cambie
  useEffect(() => {
    localStorage.setItem('homeWidgetOrder', JSON.stringify(widgetOrder));
  }, [widgetOrder]);

  // Filtrar y ordenar botones según el orden guardado
  const getOrderedButtons = (): ButtonConfig[] => {
    const filtered = allButtons.filter(btn => 
      !btn.condition || btn.condition(accountType || '')
    );
    
    // Ordenar según buttonOrder
    return filtered.sort((a, b) => {
      const indexA = buttonOrder.indexOf(a.id);
      const indexB = buttonOrder.indexOf(b.id);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // Funciones de drag and drop
  const handleDragStart = (e: React.DragEvent, buttonId: string) => {
    setDraggedButtonId(buttonId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', buttonId);
    // Hacer el elemento semi-transparente mientras se arrastra
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedButtonId(null);
    setDragOverButtonId(null);
  };

  const handleDragOver = (e: React.DragEvent, buttonId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedButtonId && draggedButtonId !== buttonId) {
      setDragOverButtonId(buttonId);
    }
  };

  const handleDragLeave = () => {
    setDragOverButtonId(null);
  };

  const handleDrop = (e: React.DragEvent, targetButtonId: string) => {
    e.preventDefault();
    
    if (!draggedButtonId || draggedButtonId === targetButtonId) {
      setDraggedButtonId(null);
      setDragOverButtonId(null);
      return;
    }

    // Reordenar los botones
    const newOrder = [...buttonOrder];
    const draggedIndex = newOrder.indexOf(draggedButtonId);
    const targetIndex = newOrder.indexOf(targetButtonId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Remover el botón arrastrado de su posición actual
      newOrder.splice(draggedIndex, 1);
      // Insertar en la nueva posición
      newOrder.splice(targetIndex, 0, draggedButtonId);
      setButtonOrder(newOrder);
    }

    setDraggedButtonId(null);
    setDragOverButtonId(null);
  };

  // Funciones de drag and drop para widgets
  const handleWidgetDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidgetId(widgetId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', widgetId);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleWidgetDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleWidgetDragOver = (e: React.DragEvent, widgetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedWidgetId && draggedWidgetId !== widgetId) {
      setDragOverWidgetId(widgetId);
    }
  };

  const handleWidgetDragLeave = () => {
    setDragOverWidgetId(null);
  };

  const handleWidgetDrop = (e: React.DragEvent, targetWidgetId: string) => {
    e.preventDefault();
    
    if (!draggedWidgetId || draggedWidgetId === targetWidgetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    // Reordenar los widgets
    const newOrder = [...widgetOrder];
    const draggedIndex = newOrder.indexOf(draggedWidgetId);
    const targetIndex = newOrder.indexOf(targetWidgetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedWidgetId);
      setWidgetOrder(newOrder);
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  // Efecto para mostrar todos los botones al mismo tiempo con fade-in lento
  // Usando el mismo patrón que el botón "Seleccionar idioma"
  useEffect(() => {
    const filtered = allButtons.filter(btn => 
      !btn.condition || btn.condition(accountType || '')
    );
    
    const buttonIds = filtered
      .sort((a, b) => {
        const indexA = buttonOrder.indexOf(a.id);
        const indexB = buttonOrder.indexOf(b.id);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      })
      .map(btn => btn.id);
    
    // Usar requestAnimationFrame doble para asegurar que el navegador procese el estado inicial
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Delay adicional para asegurar que el render inicial se complete
        setTimeout(() => {
          // Cambiar la opacidad a 1 para todos los botones al mismo tiempo
          buttonIds.forEach((buttonId) => {
            setButtonOpacities(prev => ({
              ...prev,
              [buttonId]: 1
            }));
          });
        }, 200); // Delay más largo para asegurar que el estado inicial se renderice
      });
    });
  }, [accountType, buttonOrder]);

  // Función para mostrar descripciones por 10 segundos más
  const showDescriptionsFor10Seconds = () => {
    // Cancelar timer anterior si existe
    if (descriptionTimer) {
      clearTimeout(descriptionTimer);
    }
    
    // Mostrar descripciones inmediatamente
    setShowDescriptions(true);
    setDescriptionsOpacity(1);
    
    // Configurar timer para ocultar después de 10 segundos
    const timer = setTimeout(() => {
      setDescriptionsOpacity(0);
      setTimeout(() => {
        setShowDescriptions(false);
      }, 500);
    }, 10000);
    
    setDescriptionTimer(timer);
  };

  // Función para mostrar descripción de un botón específico por 10 segundos
  const showButtonDescriptionFor10Seconds = (buttonId: string) => {
    // Cancelar timer anterior si existe para este botón
    if (buttonDescriptionTimers[buttonId]) {
      clearTimeout(buttonDescriptionTimers[buttonId]);
    }
    
    // Mostrar descripción inmediatamente
    setButtonDescriptions(prev => ({
      ...prev,
      [buttonId]: { show: true, opacity: 1 }
    }));
    
    // Configurar timer para ocultar después de 10 segundos
    const timer = setTimeout(() => {
      setButtonDescriptions(prev => ({
        ...prev,
        [buttonId]: { show: prev[buttonId]?.show || false, opacity: 0 }
      }));
      setTimeout(() => {
        setButtonDescriptions(prev => ({
          ...prev,
          [buttonId]: { show: false, opacity: 0 }
        }));
      }, 500);
    }, 10000);
    
    setButtonDescriptionTimers(prev => ({
      ...prev,
      [buttonId]: timer
    }));
  };

  // Ocultar descripciones después de 10 segundos con efecto de desvanecimiento
  useEffect(() => {
    const timer = setTimeout(() => {
      // Primero desvanecer (cambiar opacidad a 0)
      setDescriptionsOpacity(0);
      // Después de la transición, ocultar completamente
      setTimeout(() => {
        setShowDescriptions(false);
      }, 500); // Duración de la transición
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (descriptionTimer) {
        clearTimeout(descriptionTimer);
      }
      Object.values(buttonDescriptionTimers).forEach(timer => {
        if (timer && typeof timer === 'object' && 'ref' in timer) {
          clearTimeout(timer as NodeJS.Timeout);
        }
      });
    };
  }, [descriptionTimer, buttonDescriptionTimers]);

  // Ocultar título "Acciones Rápidas" después de 10 segundos con efecto de desvanecimiento
  useEffect(() => {
    const timer = setTimeout(() => {
      // Solo desvanecer (cambiar opacidad a 0) pero mantener el espacio
      setTitleOpacity(0);
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  const orderedButtons = getOrderedButtons();
  const qrButton = orderedButtons.find(btn => btn.id === 'qr');
  const assistanceButton = orderedButtons.find(btn => btn.id === 'assistance');
  const regularButtons = orderedButtons.filter(btn => btn.id !== 'qr' && btn.id !== 'assistance');

  // Dividir botones regulares en dos columnas
  const leftColumnButtons = regularButtons.filter((_, index) => index % 2 === 0);
  const rightColumnButtons = regularButtons.filter((_, index) => index % 2 === 1);

  // Función para renderizar un botón regular
  const renderRegularButton = (button: ButtonConfig) => {
    const isDragging = draggedButtonId === button.id;
    const isDragOver = dragOverButtonId === button.id;
    const buttonDescription = buttonDescriptions[button.id] || { show: showDescriptions, opacity: descriptionsOpacity };
    const shouldShowDescription = buttonDescription.show || showDescriptions;
    const descriptionOpacityValue = buttonDescription.show ? buttonDescription.opacity : descriptionsOpacity;
    
    // Verificar si el botón está deshabilitado para usuarios invitados
    const isGuestRestricted = userType === 'guest' && button.id !== 'menu';
    // Verificar si el botón está deshabilitado por falta de restaurante seleccionado (solo para comensales)
    const restaurantRequiredButtons = ['menu', 'waitlist', 'joinTable', 'invite', 'reservations'];
    const isRestaurantRequired = accountType === 'diner' && restaurantRequiredButtons.includes(button.id) && !selectedRestaurantId;
    const isDisabled = isGuestRestricted || isRestaurantRequired;

    const handleClick = () => {
      if (isDisabled) {
        setGuestRestrictionModal({
          show: true,
          featureName: t(button.titleKey)
        });
        return;
      }
      playClickSound();
      navigate(button.path);
    };

    return (
      <div
        key={button.id}
        draggable={!isDisabled}
        onDragStart={isDisabled ? undefined : (e) => handleDragStart(e, button.id)}
        onDragEnd={isDisabled ? undefined : handleDragEnd}
        onDragOver={isDisabled ? undefined : (e) => handleDragOver(e, button.id)}
        onDragLeave={isDisabled ? undefined : handleDragLeave}
        onDrop={isDisabled ? undefined : (e) => handleDrop(e, button.id)}
        onClick={handleClick}
        className={`relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all duration-500 ease-out group min-h-[140px] overflow-hidden ${
          isDisabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-primary cursor-move'
        } ${
          isDragOver && !isDisabled ? 'border-primary border-2 bg-primary/5' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ opacity: buttonOpacities[button.id] ?? 0 }}
      >
        <div className={`flex items-center justify-center size-10 rounded-lg transition-colors shrink-0 mb-2 ${
          isDisabled 
            ? 'bg-gray-100 dark:bg-gray-700' 
            : 'bg-primary/10 group-hover:bg-primary'
        }`}>
          <span className={`material-symbols-outlined transition-colors ${
            isDisabled 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-primary group-hover:text-white'
          }`}>{button.icon}</span>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
          <h2 className={`font-bold leading-tight line-clamp-2 transition-all duration-500 ease-out ${shouldShowDescription ? 'text-base' : 'text-lg'} ${
            isDisabled 
              ? 'text-gray-400 dark:text-gray-500' 
              : 'text-[#111813] dark:text-white'
          }`}>{t(button.titleKey)}</h2>
          {isDisabled && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {isRestaurantRequired 
                ? (t('restaurant.selectRestaurantHint') || 'Selecciona un restaurante')
                : t('guest.registeredOnly')
              }
            </p>
          )}
          {shouldShowDescription && (
            <p 
              className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 transition-opacity duration-500 ease-out"
              style={{ opacity: descriptionOpacityValue }}
            >
              {t(button.descriptionKey)}
            </p>
          )}
        </div>
        {/* Ícono de información */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            playClickSound();
            showButtonDescriptionFor10Seconds(button.id);
          }}
          className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary/10 dark:hover:bg-primary/20 transition-all duration-500 ease-out z-10 ${
            shouldShowDescription ? 'opacity-0 pointer-events-none' : 'opacity-100'
          }`}
        >
          <span className="material-symbols-outlined text-xs text-gray-500 dark:text-gray-400">info</span>
        </button>
        {/* Indicador de que se puede arrastrar */}
        <div className="absolute top-2 right-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-xs text-gray-400">drag_indicator</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <TopNavbar showWelcome={true} showFavorites={true} />

      <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar safe-bottom" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 85px + 60px)' }}>
        {/* Selector de restaurante solo para comensales */}
        {accountType === 'diner' && <RestaurantSelector />}
        
        <div className="flex items-center justify-between px-4 pb-2 pt-6">
          <h3 
            className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] transition-opacity duration-500 ease-out pointer-events-none"
            style={{ opacity: titleOpacity }}
          >
            {t('home.quickActions')}
          </h3>
          
          {/* Debug: Botón temporal para refrescar tipo de cuenta */}
          {process.env.NODE_ENV === 'development' && (
            <button
              onClick={async () => {
                if (user?.id) {
                  console.log('[DEBUG] Refreshing account type for user:', user.id);
                  console.log('[DEBUG] Current account type:', accountType);
                  
                  // Importar AuthContext dinámicamente para acceder a refreshAccountType
                  const { supabase } = await import('../config/supabase');
                  const { data: staffRow, error } = await supabase
                    .from('restaurant_staff')
                    .select('id, role, restaurant_id')
                    .eq('user_id', user.id)
                    .eq('is_active', true);
                  
                  console.log('[DEBUG] Restaurant staff query result:', { staffRow, error });
                  alert(`Account Type: ${accountType}\nStaff Records: ${JSON.stringify(staffRow, null, 2)}`);
                }
              }}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded border"
            >
              Debug Account
            </button>
          )}
        </div>
        <div className="w-full px-4 pb-4">
          {/* Botón QR que ocupa todo el ancho */}
          {qrButton && (
            <div 
              onClick={() => {
                playClickSound();
                navigate(qrButton.path);
              }}
              className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white p-5 items-start shadow-lg cursor-pointer overflow-hidden relative mb-3 transition-opacity duration-500 ease-out"
              style={{ opacity: buttonOpacities.qr }}
            >
              <div className="z-10 flex items-center gap-3 w-full">
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-md shrink-0">
                  <span className="material-symbols-outlined text-white text-2xl">qr_code_scanner</span>
                </div>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const qrDescription = buttonDescriptions['qr'] || { show: showDescriptions, opacity: descriptionsOpacity };
                    const shouldShowQrDescription = qrDescription.show || showDescriptions;
                    const qrDescriptionOpacityValue = qrDescription.show ? qrDescription.opacity : descriptionsOpacity;
                    return (
                      <>
                        <h2 className={`text-white font-bold leading-tight transition-all duration-500 ease-out ${shouldShowQrDescription ? 'text-lg' : 'text-xl'}`}>{t(qrButton.titleKey)}</h2>
                        {shouldShowQrDescription && (
                          <p 
                            className="text-white/80 text-sm transition-opacity duration-500 ease-out"
                            style={{ opacity: qrDescriptionOpacityValue }}
                          >
                            {t(qrButton.descriptionKey)}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              {/* Ícono de información */}
              {(() => {
                const qrDescription = buttonDescriptions['qr'] || { show: showDescriptions, opacity: descriptionsOpacity };
                const shouldShowQrDescription = qrDescription.show || showDescriptions;
                return (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playClickSound();
                      showButtonDescriptionFor10Seconds('qr');
                    }}
                    className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/30 transition-all duration-500 ease-out z-20 ${
                      shouldShowQrDescription ? 'opacity-0 pointer-events-none' : 'opacity-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-xs text-white">info</span>
                  </button>
                );
              })()}
              <div className="absolute -right-4 -bottom-4 opacity-10">
                <span className="material-symbols-outlined text-[120px]">qr_code_2</span>
              </div>
            </div>
          )}

          {/* Contenedor principal con dos columnas */}
          <div className="flex gap-3 w-full">
            {/* Columna izquierda - 50% */}
            <div className="flex flex-col gap-3 w-1/2">
              {leftColumnButtons.map(button => renderRegularButton(button))}
            </div>

            {/* Columna derecha - 50% */}
            <div className="flex flex-col gap-3 w-1/2">
              {rightColumnButtons.map(button => renderRegularButton(button))}
            </div>
          </div>

          {/* Botón Registrarse para usuarios invitados */}
          {userType === 'guest' && (
            <div className="mt-6 mb-4 px-4" style={{ marginBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
              <button
                onClick={() => {
                  playClickSound();
                  navigate('/register');
                }}
                className="w-full h-14 bg-primary text-white text-base font-bold rounded-xl shadow-lg shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">person_add</span>
                <span>{t('welcome.register')}</span>
              </button>
            </div>
          )}

          {/* Sección de Widgets */}
          <div className={`mt-6 ${userType === 'guest' ? 'mb-4' : 'mb-4'}`} style={{ marginBottom: userType !== 'guest' ? 'calc(100px + env(safe-area-inset-bottom))' : undefined }}>
            <h3 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-3">
              Widgets
            </h3>
            <div className="px-4 space-y-3">
              {widgetOrder.map((widgetId) => {
                const isDragging = draggedWidgetId === widgetId;
                const isDragOver = dragOverWidgetId === widgetId;
                
                return (
                  <div
                    key={widgetId}
                    draggable
                    onDragStart={(e) => handleWidgetDragStart(e, widgetId)}
                    onDragEnd={handleWidgetDragEnd}
                    onDragOver={(e) => handleWidgetDragOver(e, widgetId)}
                    onDragLeave={handleWidgetDragLeave}
                    onDrop={(e) => handleWidgetDrop(e, widgetId)}
                    className={`relative transition-all duration-200 group ${
                      isDragOver ? 'border-2 border-primary border-dashed rounded-xl' : ''
                    } ${isDragging ? 'opacity-50' : ''}`}
                  >
                    {widgetId === 'weather' && <WeatherWidget />}
                    {widgetId === 'currency' && <CurrencyWidget />}
                    {/* Indicador de que se puede arrastrar */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <div className="bg-black/50 dark:bg-white/50 backdrop-blur-sm rounded-lg p-1.5">
                        <span className="material-symbols-outlined text-white dark:text-gray-900 text-sm">drag_indicator</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Botón Solicitar Asistencia fijo en la parte inferior */}
      {assistanceButton && (
        <div 
          className="fixed left-0 right-0 z-40 px-4 transition-opacity duration-500 ease-out"
          style={{ 
            opacity: buttonOpacities.assistance,
            bottom: 'calc(85px + env(safe-area-inset-bottom))'
          }}
        >
          <button
            onClick={() => {
              if (userType === 'guest') {
                setGuestRestrictionModal({
                  show: true,
                  featureName: t(assistanceButton.titleKey)
                });
                return;
              }
              playClickSound();
              navigate(assistanceButton.path);
            }}
            className={`font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto transition-colors w-auto ${
              userType === 'guest'
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark'
            }`}
          >
            <span className="material-symbols-outlined">{assistanceButton.icon}</span>
            <span>{t(assistanceButton.titleKey)}</span>
          </button>
        </div>
      )}

      {/* Modal de restricción para usuarios invitados */}
      {guestRestrictionModal.show && (
        <GuestRestrictionModal
          featureName={guestRestrictionModal.featureName}
          onClose={() => setGuestRestrictionModal({ show: false, featureName: '' })}
        />
      )}
    </div>
  );
};

export default HomeScreen;
