
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from '../contexts/LanguageContext';
import AssistantModal from './AssistantModal';

const DOCKED_STATE_KEY = 'assistant_button_docked';
const POSITION_STORAGE_KEY = 'assistant_button_position';

const BottomNav: React.FC = () => {
  const [showAssistant, setShowAssistant] = useState(false);
  const [isDocked, setIsDocked] = useState(() => {
    const saved = localStorage.getItem(DOCKED_STATE_KEY);
    return saved === 'true';
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const dockedButtonRef = useRef<HTMLButtonElement>(null);

  // Escuchar cambios en el estado de anclado
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem(DOCKED_STATE_KEY);
      setIsDocked(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);
    // También verificar periódicamente para cambios en la misma ventana
    const interval = setInterval(handleStorageChange, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Manejar arrastre del botón anclado para desanclarlo
  const handleDockedMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.button === 0) {
      hasMovedRef.current = false;
      dragStartRef.current = {
        startY: e.clientY,
      };
    }
  };

  const handleDockedMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartRef.current && isDocked) {
      const deltaY = dragStartRef.current.startY - e.clientY; // Negativo porque subimos
      
      // Si se arrastra hacia arriba más de 30 píxeles, desanclar
      if (deltaY > 30) {
        hasMovedRef.current = true;
        setIsDocked(false);
        localStorage.setItem(DOCKED_STATE_KEY, 'false');
        // Establecer una posición inicial cuando se desancla
        const newPosition = {
          x: e.clientX - 50, // Posición del mouse menos mitad del ancho del botón
          y: e.clientY - 28, // Posición del mouse menos mitad del alto del botón
        };
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(newPosition));
        // Disparar evento personalizado con información del arrastre para continuar el control
        window.dispatchEvent(new CustomEvent('assistant-undocked', {
          detail: {
            clientX: e.clientX,
            clientY: e.clientY,
            continueDrag: true,
          }
        }));
      }
    }
  }, [isDocked]);

  const handleDockedMouseUp = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    if (dragStartRef.current && isDocked) {
      setIsDragging(true);
      document.addEventListener('mousemove', handleDockedMouseMove);
      document.addEventListener('mouseup', handleDockedMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleDockedMouseMove);
        document.removeEventListener('mouseup', handleDockedMouseUp);
      };
    }
  }, [isDocked, handleDockedMouseMove, handleDockedMouseUp]);

  // Manejar eventos táctiles para desanclar
  const handleDockedTouchStart = (e: React.TouchEvent<HTMLButtonElement>) => {
    if (e.touches.length > 0) {
      hasMovedRef.current = false;
      dragStartRef.current = {
        startY: e.touches[0].clientY,
      };
    }
  };

  const handleDockedTouchMove = useCallback((e: TouchEvent) => {
    if (dragStartRef.current && isDocked && e.touches.length > 0) {
      const touch = e.touches[0];
      const deltaY = dragStartRef.current.startY - touch.clientY;
      
      if (deltaY > 30) {
        // Solo prevenir default si el evento es cancelable
        if (e.cancelable) {
          e.preventDefault();
        }
        hasMovedRef.current = true;
        setIsDocked(false);
        localStorage.setItem(DOCKED_STATE_KEY, 'false');
        const newPosition = {
          x: touch.clientX - 50,
          y: touch.clientY - 28,
        };
        localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(newPosition));
        // Disparar evento personalizado con información del arrastre para continuar el control
        window.dispatchEvent(new CustomEvent('assistant-undocked', {
          detail: {
            clientX: touch.clientX,
            clientY: touch.clientY,
            continueDrag: true,
          }
        }));
      }
    }
  }, [isDocked]);

  const handleDockedTouchEnd = useCallback(() => {
    dragStartRef.current = null;
    setIsDragging(false);
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    if (dragStartRef.current && isDocked) {
      document.addEventListener('touchmove', handleDockedTouchMove, { passive: false });
      document.addEventListener('touchend', handleDockedTouchEnd);
      return () => {
        document.removeEventListener('touchmove', handleDockedTouchMove);
        document.removeEventListener('touchend', handleDockedTouchEnd);
      };
    }
  }, [isDocked, handleDockedTouchMove, handleDockedTouchEnd]);
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const { t } = useTranslation();
  const cartCount = getCartItemCount();

  // Cargar todas las órdenes para mostrar el contador
  const ordersCount = useMemo(() => {
    try {
      const savedData = localStorage.getItem('orders_list');
      if (savedData) {
        const orders = JSON.parse(savedData);
        return Array.isArray(orders) ? orders.length : 0;
      }
    } catch {
      return 0;
    }
    return 0;
  }, []);

  // Verificar si hay una orden enviada
  const hasSentOrder = () => {
    try {
      const savedData = localStorage.getItem('orders_list');
      if (savedData) {
        const orders = JSON.parse(savedData);
        if (Array.isArray(orders) && orders.length > 0) {
          const validStatuses = [
            'orden_enviada',
            'orden_recibida',
            'en_preparacion',
            'lista_para_entregar',
            'en_entrega',
            'entregada',
            'con_incidencias'
          ];
          return orders.some((order: any) => validStatuses.includes(order?.status));
        }
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleOrdersClick = () => {
    if (hasSentOrder()) {
      navigate('/order-detail');
    } else {
      navigate('/orders');
    }
  };

  const navItems = [
    { label: t('navigation.home'), icon: 'home', path: '/home' },
    { label: t('navigation.menu'), icon: 'restaurant_menu', path: '/menu' },
    { label: t('navigation.myOrder'), icon: 'receipt_long', path: '/orders' },
    { label: t('navigation.payments'), icon: 'account_balance_wallet', path: '/payments' },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-gray-100 dark:border-white/10 px-4 sm:px-6 py-2 flex justify-between items-center z-50 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
        const isOrdersPath = item.path === '/orders';
        const isActive = isOrdersPath 
          ? (location.pathname === '/orders' || location.pathname === '/order-detail')
          : (location.pathname === item.path);
        
        return (
          <button
            key={item.label}
            onClick={() => {
              if (isOrdersPath) {
                handleOrdersClick();
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center gap-0.5 transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="relative">
              <span 
                className="material-symbols-outlined text-[28px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {/* Solo mostrar badge si hay items pendientes en el carrito (orden complementaria pendiente) */}
              {isOrdersPath && cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </button>
        );
      })}
      
      {/* Botón del asistente anclado */}
      {isDocked && (
        <button
          ref={dockedButtonRef}
          onMouseDown={handleDockedMouseDown}
          onTouchStart={handleDockedTouchStart}
          onClick={(e) => {
            // Solo abrir el modal si no fue un drag
            if (!hasMovedRef.current) {
              setShowAssistant(true);
            }
          }}
          className={`flex flex-col items-center gap-0.5 transition-all relative ${
            isDragging ? 'opacity-70 scale-95' : 'hover:scale-105'
          }`}
          style={{ 
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          title={t('assistant.dragToUndock')}
        >
          <span 
            className="material-symbols-outlined text-[28px] relative z-10"
            style={{ 
              fontVariationSettings: "'FILL' 1",
              background: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #6c5ce7 50%, #4834d4 75%, #ffa726 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 8px rgba(255, 107, 157, 0.6)) drop-shadow(0 0 12px rgba(196, 69, 105, 0.5)) drop-shadow(0 0 16px rgba(108, 92, 231, 0.4)) drop-shadow(0 0 20px rgba(72, 52, 212, 0.3)) drop-shadow(0 0 24px rgba(255, 167, 38, 0.5))',
            }}
          >
            auto_awesome
          </span>
          <span 
            className="text-[10px] font-bold relative z-10"
            style={{
              color: '#00c8ff',
              textShadow: '0 0 8px rgba(0, 200, 255, 0.8), 0 0 16px rgba(0, 200, 255, 0.4)',
            }}
          >
            {t('navigation.assistant')}
          </span>
        </button>
      )}
      
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    </nav>
    
    {showAssistant && (
      <AssistantModal onClose={() => setShowAssistant(false)} />
    )}
    </>
  );
};

export default BottomNav;
