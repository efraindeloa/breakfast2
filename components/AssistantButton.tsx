import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [showAssistant, setShowAssistant] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
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
      return;
    }

    // Si no hay interacción, esperar 1 segundo y hacer compacto
    const timer = setTimeout(() => {
      setIsCompact(true);
    }, 1000);

    return () => clearTimeout(timer);
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

  // Manejar resize de ventana para mantener el botón dentro de los límites
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 100),
        y: Math.min(prev.y, window.innerHeight - 100),
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
            background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 25%, #2d3f5f 50%, #1e3a5f 75%, #0f1b2e 100%)',
            boxShadow: `
              0 0 20px rgba(0, 200, 255, 0.4),
              0 0 40px rgba(0, 200, 255, 0.2),
              0 8px 32px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              inset 0 -1px 0 rgba(0, 0, 0, 0.3)
            `,
            border: '1px solid rgba(0, 200, 255, 0.3)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none',
            position: 'relative',
          }}
        >
          {/* Efecto de brillo metálico animado */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
              animation: 'shimmer 3s infinite',
            }}
          />
          {/* Overlay de glow cian */}
          <div 
            className="absolute inset-0 rounded-full opacity-50"
            style={{
              background: 'radial-gradient(circle at center, rgba(0, 200, 255, 0.3) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          {!isCompact && (
            <>
              <span 
                className="material-symbols-outlined relative z-10 transition-all"
                style={{ 
                  color: '#F9FEFC',
                  textShadow: '0 0 10px rgba(249, 254, 252, 0.8), 0 0 20px rgba(249, 254, 252, 0.4)',
                }}
              >
                auto_awesome
              </span>
              <span 
                className="relative z-10 text-sm font-bold drop-shadow-lg transition-all"
                style={{ 
                  color: '#F9FEFC',
                  textShadow: '0 0 10px rgba(249, 254, 252, 0.8), 0 0 20px rgba(249, 254, 252, 0.4)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ textDecoration: 'underline' }}>A</span>s<span style={{ textDecoration: 'underline' }}>i</span>stente
              </span>
            </>
          )}
          {isCompact && (
            <span 
              className="material-symbols-outlined relative z-10 transition-all"
              style={{ 
                color: '#F9FEFC',
                textShadow: '0 0 10px rgba(249, 254, 252, 0.8), 0 0 20px rgba(249, 254, 252, 0.4)',
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
