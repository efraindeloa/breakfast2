import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Componente para manejar el botón de retroceso de Android
 * Intercepta el botón de retroceso físico y navega en el historial
 * en lugar de salir de la aplicación
 */
const AndroidBackButton: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo manejar el botón de retroceso si estamos en una plataforma nativa (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      return; // No hacer nada en web
    }

    const handleBackButton = async () => {
      // Verificar si estamos en la ruta raíz (WelcomeScreen) o en Register
      // En estas pantallas, si presionan back, salir de la app
      if (location.pathname === '/' || location.pathname === '/register') {
        // En la pantalla de inicio/registro, salir de la app
        App.exitApp();
      } else {
        // En cualquier otra pantalla, navegar hacia atrás en el historial
        navigate(-1);
      }
    };

    // Agregar listener para el botón de retroceso
    const backButtonListener = App.addListener('backButton', () => {
      handleBackButton();
    });

    // Limpiar listener al desmontar
    return () => {
      backButtonListener.remove();
    };
  }, [navigate, location.pathname]);

  // Este componente no renderiza nada
  return null;
};

export default AndroidBackButton;
