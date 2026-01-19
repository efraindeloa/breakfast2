import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import AssistantModal from './AssistantModal';

const POSITION_STORAGE_KEY = 'assistant_button_position';
const DOCKED_STATE_KEY = 'assistant_button_docked';

interface Position {
  x: number;
  y: number;
}

const NAVBAR_BOTTOM_THRESHOLD = 100; // Distancia desde el fondo para considerar anclaje
const NAVBAR_HEIGHT = 80; // Altura aproximada de la navbar

const AssistantButton: React.FC = () => {
  const { t } = useTranslation();
  const [showAssistant, setShowAssistant] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [isDocked, setIsDocked] = useState(() => {
    const saved = localStorage.getItem(DOCKED_STATE_KEY);
    return saved === 'true';
  });
  const [position, setPosition] = useState<Position>(() => {
    // Cargar posición guardada o usar posición por defecto
    const saved = localStorage.getItem(POSITION_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { x: window.innerWidth - 100, y: window.innerHeight - 100 };
      }
    }
    return { x: window.innerWidth - 100, y: window.innerHeight - 100 };
  });
  const dragStartRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const hasMovedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Guardar posición cuando cambie
  useEffect(() => {
    localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
  }, [position]);

  // Guardar estado de anclado
  useEffect(() => {
    localStorage.setItem(DOCKED_STATE_KEY, isDocked.toString());
  }, [isDocked]);

  // Controlar modo compacto: expandir cuando hay interacción, compactar después de 1 segundo sin interacción
  useEffect(() => {
    if (isDocked) {
      setIsCompact(false);
      return;
    }

    // Si está siendo arrastrado, expandir inmediatamente
    if (isDragging) {
      setIsCompact(false);
      setIsInactive(false);
      return;
    }

    // Si no hay interacción, esperar 1 segundo y hacer compacto
    const timer = setTimeout(() => {
      setIsCompact(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isDocked, isDragging]);

  // Detectar inactividad: después de 10 segundos sin actividad, expandir y mostrar mensaje
  useEffect(() => {
    if (isDocked) {
      setIsInactive(false);
      return;
    }

    let inactivityTimer: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      setIsInactive(false);
      clearTimeout(inactivityTimer);
      
      inactivityTimer = setTimeout(() => {
        if (!isDocked && !isDragging) {
          setIsInactive(true);
          setIsCompact(false);
        }
      }, 10000); // 10 segundos de inactividad
    };

    // Eventos que indican actividad del usuario
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    // Iniciar el timer
    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [isDocked, isDragging]);

  // Escuchar eventos de desanclado desde BottomNav
  useEffect(() => {
    const handleUndock = (e: Event) => {
      const customEvent = e as CustomEvent;
      const saved = localStorage.getItem(POSITION_STORAGE_KEY);
      if (saved) {
        try {
          const newPosition = JSON.parse(saved);
          setPosition(newPosition);
          setIsDocked(false);
          
          // Si el evento indica que debemos continuar el arrastre
          if (customEvent.detail?.continueDrag && customEvent.detail?.clientX && customEvent.detail?.clientY) {
            // Inicializar el estado de arrastre para continuar moviendo el botón
            dragStartRef.current = {
              x: customEvent.detail.clientX - newPosition.x,
              y: customEvent.detail.clientY - newPosition.y,
              startX: customEvent.detail.clientX,
              startY: customEvent.detail.clientY,
            };
            hasMovedRef.current = true;
            setIsDragging(true);
          }
        } catch {
          setIsDocked(false);
        }
      } else {
        setIsDocked(false);
      }
    };

    window.addEventListener('assistant-undocked', handleUndock as EventListener);
    return () => {
      window.removeEventListener('assistant-undocked', handleUndock as EventListener);
    };
  }, []);

  // Detectar si el botón está cerca de la navbar inferior
  const checkDocking = useCallback((y: number) => {
    const distanceFromBottom = window.innerHeight - y;
    // Si está cerca del fondo (dentro del threshold), anclar
    if (distanceFromBottom <= NAVBAR_BOTTOM_THRESHOLD && !isDocked) {
      setIsDocked(true);
      // Animar hacia el centro de la navbar
      setPosition({
        x: window.innerWidth / 2 - 50, // Centro menos mitad del ancho del botón
        y: window.innerHeight - NAVBAR_HEIGHT / 2 - 28, // Centro vertical de la navbar
      });
    } else if (distanceFromBottom > NAVBAR_BOTTOM_THRESHOLD + 50 && isDocked) {
      // Si se aleja lo suficiente, desanclar
      setIsDocked(false);
    }
  }, [isDocked, position.x]);

  // Ajustar posición cuando el botón se expande para que no quede oculto en los bordes
  useEffect(() => {
    if (isDocked || isCompact) return;

    // El botón expandido tiene aproximadamente 200px de ancho y 56px de alto
    const expandedWidth = 200;
    const expandedHeight = 56;
    const padding = 10; // Margen de seguridad

    setPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;

      // Verificar y ajustar posición horizontal
      if (newX + expandedWidth > window.innerWidth - padding) {
        // Si se sale por la derecha, moverlo a la izquierda
        newX = window.innerWidth - expandedWidth - padding;
      }
      if (newX < padding) {
        // Si se sale por la izquierda, moverlo a la derecha
        newX = padding;
      }

      // Verificar y ajustar posición vertical
      if (newY + expandedHeight > window.innerHeight - padding) {
        // Si se sale por abajo, moverlo hacia arriba
        newY = window.innerHeight - expandedHeight - padding;
      }
      if (newY < padding) {
        // Si se sale por arriba, moverlo hacia abajo
        newY = padding;
      }

      // Solo actualizar si la posición cambió
      if (newX !== prev.x || newY !== prev.y) {
        return { x: newX, y: newY };
      }

      return prev;
    });
  }, [isCompact, isDocked]);

  // Manejar resize de ventana para mantener el botón dentro de los límites
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => {
        // Ajustar tanto para botón compacto como expandido
        const buttonWidth = isCompact ? 56 : 200;
        const buttonHeight = 56;
        const padding = 10;

        return {
          x: Math.min(prev.x, Math.max(padding, window.innerWidth - buttonWidth - padding)),
          y: Math.min(prev.y, Math.max(padding, window.innerHeight - buttonHeight - padding)),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCompact]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragStartRef.current) {
      const deltaX = Math.abs(e.clientX - dragStartRef.current.startX);
      const deltaY = Math.abs(e.clientY - dragStartRef.current.startY);
      
      // Solo considerar como drag si se movió más de 15 píxeles (aumentado para evitar falsos positivos)
      if (deltaX > 15 || deltaY > 15) {
        hasMovedRef.current = true;
        setIsDragging(true);
        
        // Solo mover si es un drag confirmado
        const newX = e.clientX - dragStartRef.current.x;
        const newY = e.clientY - dragStartRef.current.y;

        // Limitar el botón dentro de los límites de la pantalla
        const maxX = window.innerWidth - 100; // Ancho aproximado del botón
        const maxY = window.innerHeight - 100; // Alto aproximado del botón
        const minX = 0;
        const minY = 0;

        const clampedY = Math.max(minY, Math.min(maxY, newY));
        const clampedX = Math.max(minX, Math.min(maxX, newX));

        setPosition({
          x: clampedX,
          y: clampedY,
        });

        // Verificar si debe anclarse a la navbar
        checkDocking(clampedY);
      }
    }
  }, [checkDocking]);

  const handleMouseUp = useCallback(() => {
    const wasDragging = hasMovedRef.current;
    setIsDragging(false);
    dragStartRef.current = null;
    // Resetear después de un pequeño delay para permitir que el click se procese
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 200);
    return wasDragging;
  }, []);

  // Agregar listeners globales para el drag (siempre activos cuando hay dragStartRef)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (dragStartRef.current) {
        handleMouseMove(e);
      }
    };

    const handleGlobalMouseUp = () => {
      if (dragStartRef.current) {
        handleMouseUp();
      }
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Solo iniciar drag si no es un click normal
    if (e.button === 0) {
      setIsCompact(false); // Expandir al empezar a arrastrar
      hasMovedRef.current = false;
      dragStartRef.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
        startX: e.clientX,
        startY: e.clientY,
      };
    }
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (dragStartRef.current && e.touches.length > 0) {
      const touch = e.touches[0];
      
      // Verificar si hay movimiento significativo
      if (dragStartRef.current.startX !== undefined && dragStartRef.current.startY !== undefined) {
        const deltaX = Math.abs(touch.clientX - dragStartRef.current.startX);
        const deltaY = Math.abs(touch.clientY - dragStartRef.current.startY);
        
        // Solo considerar como drag si se movió más de 15 píxeles
        if (deltaX > 15 || deltaY > 15) {
          // Solo prevenir default si el evento es cancelable
          if (e.cancelable) {
            e.preventDefault();
          }
          hasMovedRef.current = true;
          setIsDragging(true);
          
          const newX = touch.clientX - dragStartRef.current.x;
          const newY = touch.clientY - dragStartRef.current.y;

          const maxX = window.innerWidth - 100;
          const maxY = window.innerHeight - 100;
          const minX = 0;
          const minY = 0;

          const clampedY = Math.max(minY, Math.min(maxY, newY));
          const clampedX = Math.max(minX, Math.min(maxX, newX));

          setPosition({
            x: clampedX,
            y: clampedY,
          });

          // Verificar si debe anclarse a la navbar
          checkDocking(clampedY);
        }
      }
    }
  }, [checkDocking]);

  const handleTouchEnd = useCallback((e?: TouchEvent) => {
    const moved = hasMovedRef.current;
    setIsDragging(false);
    
    // Si no hubo movimiento, abrir el modal
    if (!moved && dragStartRef.current) {
      setShowAssistant(true);
    }
    
    dragStartRef.current = null;
    setTimeout(() => {
      hasMovedRef.current = false;
    }, 100);
  }, []);

  // Agregar listener nativo para touchstart con passive: false
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;

    const nativeTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setIsCompact(false); // Expandir al empezar a arrastrar
        // No prevenir default inmediatamente, solo si hay movimiento
        hasMovedRef.current = false;
        const touch = e.touches[0];
        dragStartRef.current = {
          x: touch.clientX - position.x,
          y: touch.clientY - position.y,
          startX: touch.clientX,
          startY: touch.clientY,
        };
      }
    };

    button.addEventListener('touchstart', nativeTouchStart, { passive: true });
    return () => {
      button.removeEventListener('touchstart', nativeTouchStart);
    };
  }, [position]);

  // Agregar listeners globales para touch siempre que haya dragStartRef
  useEffect(() => {
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (dragStartRef.current) {
        handleTouchMove(e);
      }
    };

    const handleGlobalTouchEnd = (e: TouchEvent) => {
      if (dragStartRef.current) {
        handleTouchEnd(e);
      }
    };

    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    document.addEventListener('touchend', handleGlobalTouchEnd);
    return () => {
      document.removeEventListener('touchmove', handleGlobalTouchMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Por defecto, abrir el modal
    // Solo prevenir si realmente hubo un drag
    const moved = hasMovedRef.current;
    
    // Si no hubo movimiento significativo, abrir el modal
    if (!moved) {
      setShowAssistant(true);
    } else {
      // Si hubo movimiento, resetear el flag después de un delay
      setTimeout(() => {
        hasMovedRef.current = false;
      }, 100);
    }
  };

  // Si está anclado, no mostrar el botón flotante (se mostrará en la navbar)
  if (isDocked) {
    return (
      <>
        {showAssistant && (
          <AssistantModal onClose={() => setShowAssistant(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        className="fixed z-[60] transition-all duration-300"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <button
          ref={buttonRef}
          onMouseDown={(e) => {
            setIsCompact(false); // Expandir inmediatamente al empezar a arrastrar
            handleMouseDown(e);
          }}
          onMouseEnter={() => {
            if (!isDocked) {
              setIsCompact(false); // Expandir al hacer hover
            }
          }}
          onClick={handleClick}
          onMouseUp={(e) => {
            // Si no hubo movimiento, también intentar abrir el modal desde mouseUp
            if (!hasMovedRef.current && !isDragging) {
              // Pequeño delay para asegurar que el click también se procese
              setTimeout(() => {
                if (!hasMovedRef.current) {
                  setShowAssistant(true);
                }
              }, 50);
            }
          }}
          className={`flex items-center justify-center rounded-full transition-all select-none relative overflow-hidden ${
            isCompact ? 'h-14 w-14 px-0' : 'h-14 gap-2 px-6'
          } ${isDragging ? 'scale-95' : 'hover:scale-105 active:scale-95'}`}
          style={{ 
            background: 'linear-gradient(135deg, #FFDB6B 0%, #FFA042 15%, #FA7BA3 35%, #D78CD4 50%, #A385C9 75%, #8B7BC0 100%)',
            boxShadow: `
              0 0 28px rgba(255, 219, 107, 0.5),
              0 0 55px rgba(250, 123, 163, 0.42),
              0 0 82px rgba(163, 133, 201, 0.35),
              0 8px 32px rgba(0, 0, 0, 0.55),
              inset 0 1px 0 rgba(255, 255, 255, 0.18),
              inset 0 -1px 0 rgba(0, 0, 0, 0.35)
            `,
            border: '1px solid rgba(255, 219, 107, 0.45)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            position: 'relative',
          }}
        >
          {/* Efecto de brillo metálico animado con colores intermedios del gradiente */}
          <div 
            className="absolute inset-0 opacity-45"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255, 219, 107, 0.35) 25%, rgba(250, 123, 163, 0.28) 50%, rgba(163, 133, 201, 0.35) 75%, transparent 100%)',
              animation: 'shimmer 3s infinite',
            }}
          />
          {/* Overlay de glow con colores intermedios de la imagen */}
          <div 
            className="absolute inset-0 rounded-full opacity-55"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 219, 107, 0.35) 0%, rgba(250, 123, 163, 0.28) 40%, rgba(163, 133, 201, 0.35) 70%, transparent 100%)',
              filter: 'blur(10px)',
            }}
          />
          {/* Efecto de brillo adicional */}
          <div 
            className="absolute inset-0 rounded-full opacity-38"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 219, 107, 0.42) 0%, rgba(250, 123, 163, 0.35) 50%, rgba(163, 133, 201, 0.42) 100%)',
              filter: 'blur(6px)',
            }}
          />
          {!isCompact && (
            <>
              <span 
                className="material-symbols-outlined relative z-10 transition-all"
                style={{ 
                  color: '#000000',
                  textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)',
                }}
              >
                auto_awesome
              </span>
              <span 
                className="relative z-10 text-sm font-bold drop-shadow-lg transition-all"
                style={{ 
                  color: '#000000',
                  textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)',
                  whiteSpace: 'nowrap',
                }}
              >
                {isInactive ? t('assistant.needHelp') : t('navigation.assistant')}
              </span>
            </>
          )}
          {isCompact && (
            <span 
              className="material-symbols-outlined relative z-10 transition-all"
              style={{ 
                color: '#000000',
                textShadow: '0 0 10px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 0, 0, 0.2)',
              }}
            >
              auto_awesome
            </span>
          )}
          <style>{`
            @keyframes shimmer {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
            }
          `}</style>
        </button>
      </div>
      
      {showAssistant && (
        <AssistantModal onClose={() => setShowAssistant(false)} />
      )}
    </>
  );
};

export default AssistantButton;
