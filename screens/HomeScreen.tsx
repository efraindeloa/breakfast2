import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';
import { useAuth } from '../contexts/AuthContext';

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
  const { accountType } = useAuth();
  
  // Estados para controlar la opacidad de los botones (efecto fade-in)
  const [buttonOpacities, setButtonOpacities] = useState<Record<string, number>>({
    qr: 0,
    menu: 0,
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
  
  // Estados para controlar la visibilidad de las descripciones
  const [showDescriptions, setShowDescriptions] = useState<boolean>(true);
  const [descriptionsOpacity, setDescriptionsOpacity] = useState<number>(1);
  
  // Estados para controlar la visibilidad del título "Acciones Rápidas"
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [titleOpacity, setTitleOpacity] = useState<number>(1);
  
  // Configuración de todos los botones
  const allButtons: ButtonConfig[] = [
    { id: 'qr', path: '/qr-scanner', titleKey: 'home.scanQR', descriptionKey: 'home.scanQRDescription', icon: 'qr_code_scanner', isQR: true },
    { id: 'menu', path: '/menu', titleKey: 'home.viewMenu', descriptionKey: 'home.viewMenuDescription', icon: 'restaurant_menu' },
    { id: 'assistance', path: '/request-assistance', titleKey: 'payment.requestAssistance', descriptionKey: 'home.requestAssistanceDescription', icon: 'person' },
    { id: 'waitlist', path: '/waitlist', titleKey: 'waitlist.scanQR', descriptionKey: 'waitlist.scanQRDescription', icon: 'schedule' },
    { id: 'joinTable', path: '/join-table', titleKey: 'home.joinTable', descriptionKey: 'home.joinTableDescription', icon: 'groups' },
    { id: 'invite', path: '/invite-users', titleKey: 'invite.title', descriptionKey: 'home.inviteDescription', icon: 'person_add' },
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

    return (
      <div
        key={button.id}
        draggable
        onDragStart={(e) => handleDragStart(e, button.id)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, button.id)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, button.id)}
        onClick={() => navigate(button.path)}
        className={`relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm hover:border-primary transition-all duration-500 ease-out cursor-move group min-h-[140px] overflow-hidden ${
          isDragOver ? 'border-primary border-2 bg-primary/5' : ''
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ opacity: buttonOpacities[button.id] ?? 0 }}
      >
        <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
          <span className="material-symbols-outlined text-primary group-hover:text-white">{button.icon}</span>
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 min-w-0">
          <h2 className={`text-[#111813] dark:text-white font-bold leading-tight line-clamp-2 transition-all duration-500 ease-out ${showDescriptions ? 'text-base' : 'text-lg'}`}>{t(button.titleKey)}</h2>
          {showDescriptions && (
            <p 
              className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 transition-opacity duration-500 ease-out"
              style={{ opacity: descriptionsOpacity }}
            >
              {t(button.descriptionKey)}
            </p>
          )}
        </div>
        {/* Indicador de que se puede arrastrar */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="material-symbols-outlined text-xs text-gray-400">drag_indicator</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      <TopNavbar showWelcome={true} showFavorites={false} />

      <main className="flex-1 overflow-y-auto pb-32 hide-scrollbar safe-bottom" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 85px + 60px)' }}>
        <h3 
          className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6 transition-opacity duration-500 ease-out pointer-events-none"
          style={{ opacity: titleOpacity }}
        >
          {t('home.quickActions')}
        </h3>
        <div className="w-full px-4 pb-4">
          {/* Botón QR que ocupa todo el ancho */}
          {qrButton && (
            <div 
              onClick={() => navigate(qrButton.path)}
              className="flex flex-col gap-3 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white p-5 items-start shadow-lg cursor-pointer overflow-hidden relative mb-3 transition-opacity duration-500 ease-out"
              style={{ opacity: buttonOpacities.qr }}
            >
              <div className="z-10 flex items-center gap-3">
                <div className="flex items-center justify-center size-12 rounded-xl bg-white/20 backdrop-blur-md">
                  <span className="material-symbols-outlined text-white text-2xl">qr_code_scanner</span>
                </div>
                <div>
                  <h2 className={`text-white font-bold leading-tight transition-all duration-500 ease-out ${showDescriptions ? 'text-lg' : 'text-xl'}`}>{t(qrButton.titleKey)}</h2>
                  {showDescriptions && (
                    <p 
                      className="text-white/80 text-sm transition-opacity duration-500 ease-out"
                      style={{ opacity: descriptionsOpacity }}
                    >
                      {t(qrButton.descriptionKey)}
                    </p>
                  )}
                </div>
              </div>
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
            onClick={() => navigate(assistanceButton.path)}
            className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-primary-dark transition-colors w-auto"
          >
            <span className="material-symbols-outlined">{assistanceButton.icon}</span>
            <span>{t(assistanceButton.titleKey)}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
