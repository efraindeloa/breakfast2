import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGroupOrder } from '../contexts/GroupOrderContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actionRoute?: string | null; // Ruta de navegación sugerida
  actionLabel?: string; // Texto del botón de acción
}

interface MessageStorage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO string para localStorage
  actionRoute?: string | null;
  actionLabel?: string;
}

interface AssistantModalProps {
  onClose: () => void;
}

const CHAT_HISTORY_KEY = 'assistant_chat_history';

const AssistantModal: React.FC<AssistantModalProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { cart } = useCart();
  const { isGroupOrder, participants, isConfirmed } = useGroupOrder();
  const { t } = useTranslation();
  const { setLanguage, language } = useLanguage();
  
  // Función para cargar el historial desde localStorage
  const loadChatHistory = (): Message[] => {
    try {
      const stored = localStorage.getItem(CHAT_HISTORY_KEY);
      if (stored) {
        const storedMessages: MessageStorage[] = JSON.parse(stored);
        return storedMessages.map(msg => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
    // Mensaje inicial si no hay historial
    return [
      {
        id: '1',
        type: 'assistant',
        content: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre cómo usar la app, el menú, tu orden, o cualquier otra consulta general.',
        timestamp: new Date(),
      },
    ];
  };

  // Función para guardar el historial en localStorage
  const saveChatHistory = (messagesToSave: Message[]) => {
    try {
      const messagesToStore: MessageStorage[] = messagesToSave.map(msg => ({
        id: msg.id,
        type: msg.type,
        content: msg.content,
        timestamp: msg.timestamp.toISOString(),
        actionRoute: msg.actionRoute || null,
        actionLabel: msg.actionLabel || undefined,
      }));
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messagesToStore));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };

  const [messages, setMessages] = useState<Message[]>(loadChatHistory);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingNavigationRef = useRef<string | null>(null);
  const messageRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isSearchMode) {
      scrollToBottom();
    }
  }, [messages, isSearchMode]);

  useEffect(() => {
    if (!isSearchMode) {
      inputRef.current?.focus();
    } else {
      searchInputRef.current?.focus();
    }
  }, [isSearchMode]);

  // Verificar soporte de Speech Recognition y configurar
  useEffect(() => {
    const checkSpeechSupport = async () => {
      // Verificar si estamos en plataforma nativa (Android/iOS)
      if (Capacitor.isNativePlatform()) {
        setIsNativePlatform(true);
        try {
          // Verificar si el plugin está disponible
          const available = await SpeechRecognition.available();
          if (available) {
            setSpeechSupported(true);
            // Solicitar permisos
            const permission = await SpeechRecognition.checkPermissions();
            if ((permission as any).microphone !== 'granted') {
              await SpeechRecognition.requestPermissions();
            }
          }
        } catch (error) {
          console.error('Error checking native speech recognition:', error);
          setSpeechSupported(false);
        }
      } else {
        // Web: usar Web Speech API
        const SpeechRecognitionWeb = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognitionWeb) {
          setSpeechSupported(true);
          const recognition = new SpeechRecognitionWeb();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          // Configurar idioma según el idioma de la app
          const langMap: { [key: string]: string } = {
            'es': 'es-ES',
            'en': 'en-US',
            'pt': 'pt-BR',
            'fr': 'fr-FR'
          };
          recognition.lang = langMap[language] || 'es-ES';
          
          recognition.onstart = () => {
            setIsListening(true);
          };

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev + (prev ? ' ' : '') + transcript);
            setIsListening(false);
          };

          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
            if (event.error === 'no-speech') {
              alert(t('assistant.noSpeechDetected'));
            } else if (event.error === 'not-allowed') {
              alert(t('assistant.microphonePermissionDenied'));
            } else {
              alert(t('assistant.speechError'));
            }
          };

          recognition.onend = () => {
            setIsListening(false);
          };

          recognitionRef.current = recognition;
        }
      }
    };

    checkSpeechSupport();

    return () => {
      if (!isNativePlatform && recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignorar errores al detener
        }
      }
    };
  }, [language, t, isNativePlatform]);

  // Filtrar mensajes basándose en la búsqueda
  const filteredMessages = searchQuery.trim()
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Encontrar índices de mensajes que coinciden con la búsqueda
  const searchMatches = searchQuery.trim()
    ? messages
        .map((msg, index) => ({ msg, index }))
        .filter(({ msg }) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(({ index }) => index)
    : [];

  // Navegar al siguiente resultado de búsqueda
  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIndex);
    const messageId = messages[searchMatches[nextIndex]].id;
    messageRefs.current[messageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Navegar al resultado anterior de búsqueda
  const goToPreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = currentSearchIndex <= 0 ? searchMatches.length - 1 : currentSearchIndex - 1;
    setCurrentSearchIndex(prevIndex);
    const messageId = messages[searchMatches[prevIndex]].id;
    messageRefs.current[messageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Resaltar texto en los mensajes
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    // Escapar caracteres especiales de regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    
    // Dividir cada parte por saltos de línea y crear elementos React
    const result: React.ReactNode[] = [];
    parts.forEach((part, index) => {
      const isMatch = part.toLowerCase() === query.toLowerCase();
      const lines = part.split('\n');
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          result.push(<br key={`br-${index}-${lineIndex}`} />);
        }
        if (isMatch && line) {
          result.push(
            <mark key={`match-${index}-${lineIndex}`} className="bg-[#F6E820]/30 text-[#181611] dark:text-white px-1 rounded">
              {line}
            </mark>
          );
        } else if (line) {
          result.push(<span key={`text-${index}-${lineIndex}`}>{line}</span>);
        }
      });
    });
    
    return result.length > 0 ? result : text;
  };

  // Manejar cambio en el modo de búsqueda
  const handleToggleSearch = () => {
    setIsSearchMode(!isSearchMode);
    setSearchQuery('');
    setCurrentSearchIndex(-1);
  };

  // Función para borrar el historial
  const handleClearHistory = () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial del chat? Esta acción no se puede deshacer.')) {
      const initialMessage: Message = {
        id: '1',
        type: 'assistant',
        content: '¡Hola! Soy tu asistente inteligente. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre cómo usar la app, el menú, tu orden, o cualquier otra consulta general.',
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  // Guardar el historial cada vez que cambien los mensajes
  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages]);

  // Detectar respuestas afirmativas
  const isAffirmativeResponse = (message: string): boolean => {
    const affirmativeWords = ['sí', 'si', 'yes', 'ok', 'okay', 'claro', 'por favor', 'adelante', 'vamos', 'vamos a', 'llevame', 'lleva', 'quiero', 'deseo', 'perfecto', 'genial', 'bueno', 'está bien', 'está bien', 'de acuerdo', 'acepto'];
    const lowerMessage = message.toLowerCase().trim();
    return affirmativeWords.some(word => lowerMessage.includes(word));
  };

  // Extraer ruta de navegación del mensaje del asistente
  const extractNavigationRoute = (assistantMessage: string): string | null => {
    const lowerMessage = assistantMessage.toLowerCase();
    
    if (lowerMessage.includes('menú') || lowerMessage.includes('menu')) {
      return '/menu';
    }
    if (lowerMessage.includes('orden') || lowerMessage.includes('pedido')) {
      if (lowerMessage.includes('grupal')) {
        return '/orders';
      }
      return '/orders';
    }
    if (lowerMessage.includes('perfil')) {
      return '/profile';
    }
    if (lowerMessage.includes('fiscal') || lowerMessage.includes('factura') || lowerMessage.includes('datos fiscales')) {
      return '/billing-step-1';
    }
    if (lowerMessage.includes('historial') || lowerMessage.includes('pago') || lowerMessage.includes('transacciones')) {
      return '/transactions';
    }
    if (lowerMessage.includes('pagar') || lowerMessage.includes('cuenta')) {
      return '/payments';
    }
    
    return null;
  };

  // Detectar el tipo de consulta y generar respuesta
  const generateResponse = (userMessage: string, previousAssistantMessage?: string): { response: string; navigationRoute?: string | null } => {
    const message = userMessage.toLowerCase().trim();
    
    // Si el usuario responde afirmativamente a una pregunta previa del asistente
    if (previousAssistantMessage && isAffirmativeResponse(userMessage)) {
      const route = extractNavigationRoute(previousAssistantMessage);
      if (route) {
        return {
          response: 'Perfecto, te llevo ahí ahora mismo...',
          navigationRoute: route
        };
      }
    }
    
    // Consultas sobre la aplicación
    if (message.includes('orden') || message.includes('pedido')) {
      if (message.includes('crear') || message.includes('hacer') || message.includes('agregar')) {
        return {
          response: 'Para crear una orden:\n1. Ve al menú y selecciona los platillos que deseas\n2. Haz clic en el precio o en el botón "+" para agregar al carrito\n3. Ve a "Mi orden" para revisar y personalizar\n4. Presiona "Confirmar y Enviar Orden" cuando estés listo\n\n¿Te gustaría que te lleve al menú?',
          navigationRoute: null
        };
      }
      if (message.includes('modificar') || message.includes('cambiar') || message.includes('editar')) {
        if (isConfirmed) {
          return {
            response: 'Tu orden ya fue confirmada. Si necesitas modificarla, puedes usar el botón "Cambiar mi orden" en los detalles de tu orden, siempre y cuando la cocina no haya empezado a prepararla.',
            navigationRoute: null
          };
        }
        return {
          response: 'Para modificar tu orden:\n1. Ve a "Mi orden"\n2. Puedes cambiar cantidades, agregar notas o eliminar platillos\n3. Si es una orden grupal, asegúrate de que todos los participantes estén listos antes de confirmar\n\n¿Te gustaría que te lleve a tu orden?',
          navigationRoute: '/orders'
        };
      }
      if (message.includes('estado') || message.includes('dónde') || message.includes('cuándo')) {
        return {
          response: 'Para ver el estado de tu orden:\n1. Ve a "Mi orden" o "Detalles de la orden"\n2. Ahí verás el estado actual y el historial completo\n\nLos estados posibles son: Orden Enviada, Orden Recibida, En Preparación, Lista para Entregar, En Entrega, Entregada, y Orden Cerrada.',
          navigationRoute: null
        };
      }
      return {
        response: 'Puedo ayudarte con tu orden. ¿Quieres crear una nueva orden, modificar una existente, o ver el estado de tu orden actual?',
        navigationRoute: null
      };
    }

    if (message.includes('pagar') || message.includes('pago') || message.includes('cuenta')) {
      if (message.includes('dividir') || message.includes('separar')) {
        return {
          response: 'Para dividir el pago:\n1. Ve a "Pagar cuenta" después de que todos hayan terminado de comer\n2. Selecciona los métodos de pago para cada persona\n3. Puedes dividir por porcentaje o monto específico\n\nNota: El pago se realiza después de comer, no al momento de ordenar.',
          navigationRoute: null
        };
      }
      return {
        response: 'Para pagar tu cuenta:\n1. Una vez que hayas terminado de comer, ve a "Pagar cuenta"\n2. Selecciona tu método de pago (tarjeta, efectivo, etc.)\n3. Si necesitas factura, puedes configurarla en tus datos fiscales\n\nRecuerda: El pago se realiza después de comer, no al momento de ordenar.',
        navigationRoute: null
      };
    }

    if (message.includes('menú') || message.includes('platillo') || message.includes('comida')) {
      return {
        response: 'Para navegar el menú:\n1. Usa las categorías en la parte superior (Entradas, Platos Fuertes, Bebidas, etc.)\n2. Puedes usar los filtros para buscar por origen (Tierra, Mar, Aire, Vegetariano, Vegano)\n3. Haz clic en cualquier platillo para ver más detalles\n4. Agrega platillos a tu orden con el botón de precio o el icono "+"\n\n¿Te gustaría que te lleve al menú?',
        navigationRoute: '/menu'
      };
    }

    if (message.includes('factura') || message.includes('fiscal')) {
      return {
        response: 'Para solicitar factura electrónica:\n1. Ve a tu perfil\n2. Configura tus datos fiscales en la sección correspondiente\n3. Al pagar, selecciona la opción de enviar factura\n4. La factura se enviará al correo electrónico que configuraste\n\n¿Te gustaría que te lleve a configurar tus datos fiscales?',
        navigationRoute: null
      };
    }

    if (message.includes('historial') || message.includes('anteriores')) {
      return {
        response: 'Para ver tu historial:\n- Historial de órdenes: Ve a "Mi orden" y luego al historial\n- Historial de pagos: Ve a "Transacciones" en el menú principal\n\nAhí podrás ver todas tus órdenes y pagos anteriores con detalles completos.',
        navigationRoute: null
      };
    }

    if (message.includes('grupal') || message.includes('grupo') || message.includes('invitar')) {
      return {
        response: 'Para crear una orden grupal:\n1. Ve a "Mi orden"\n2. Presiona el botón "Orden Grupal"\n3. Invita a otros usuarios por correo, teléfono o desde tus favoritos\n4. Cada participante puede agregar sus platillos\n5. Todos deben marcar "Marcar como listo" antes de confirmar\n\n¿Te gustaría que te lleve a crear una orden grupal?',
        navigationRoute: null
      };
    }

    if (message.includes('idioma') || message.includes('language')) {
      // Detectar si el usuario quiere cambiar el idioma directamente
      const languageMap: Record<string, 'es' | 'en' | 'pt' | 'fr'> = {
        'español': 'es',
        'spanish': 'es',
        'espanol': 'es',
        'inglés': 'en',
        'ingles': 'en',
        'english': 'en',
        'portugués': 'pt',
        'portugues': 'pt',
        'português': 'pt',
        'portuguese': 'pt',
        'francés': 'fr',
        'frances': 'fr',
        'français': 'fr',
        'french': 'fr',
      };

      // Buscar si el mensaje contiene un nombre de idioma
      for (const [langName, langCode] of Object.entries(languageMap)) {
        if (message.includes(langName.toLowerCase())) {
          // Cambiar el idioma directamente
          setLanguage(langCode);
          const langNames: Record<'es' | 'en' | 'pt' | 'fr', string> = {
            'es': 'Español',
            'en': 'English',
            'pt': 'Português',
            'fr': 'Français'
          };
          return {
            response: `¡Perfecto! He cambiado el idioma a ${langNames[langCode]}. La aplicación se actualizará automáticamente.`,
            navigationRoute: null
          };
        }
      }

      // Si no especifica un idioma, mostrar opciones
      return {
        response: 'Puedo cambiar el idioma por ti. Solo dime a qué idioma quieres cambiar:\n\n• Español\n• Inglés (English)\n• Portugués (Português)\n• Francés (Français)\n\nEjemplo: "cambiar idioma a inglés" o "idioma español"',
        navigationRoute: null
      };
    }

    if (message.includes('perfil') || message.includes('configuración') || message.includes('datos personales')) {
      return {
        response: 'Para configurar tu perfil:\n1. Ve a tu perfil desde el menú inferior\n2. Ahí puedes editar tu información personal\n3. También puedes configurar tus datos fiscales para facturas\n\n¿Te gustaría que te lleve a tu perfil?',
        navigationRoute: null
      };
    }

    if (message.includes('cupón') || message.includes('promoción') || message.includes('descuento')) {
      return {
        response: 'Para usar cupones y promociones:\n1. Los cupones disponibles aparecerán en el menú o al momento de pagar\n2. Selecciona el cupón que deseas aplicar\n3. El descuento se aplicará automáticamente\n\nTambién puedes acumular puntos de lealtad con cada compra.',
        navigationRoute: null
      };
    }

    // Consultas generales (simuladas - en producción usarías una API de IA)
    if (message.includes('dólar') || message.includes('dolar') || message.includes('precio del dólar')) {
      return {
        response: 'Lo siento, no tengo acceso en tiempo real al precio del dólar. Te recomiendo consultar un sitio financiero confiable o tu banco para obtener esta información actualizada.',
        navigationRoute: null
      };
    }

    if (message.includes('clima') || message.includes('tiempo') || message.includes('temperatura')) {
      return {
        response: 'No tengo acceso al pronóstico del clima en este momento. Te recomiendo consultar una aplicación del clima o sitio web meteorológico para obtener información actualizada sobre las condiciones del tiempo.',
        navigationRoute: null
      };
    }

    if (message.includes('deporte') || message.includes('futbol') || message.includes('resultado')) {
      return {
        response: 'No tengo acceso a resultados deportivos en tiempo real. Te recomiendo consultar sitios deportivos o aplicaciones especializadas para obtener los resultados más recientes.',
        navigationRoute: null
      };
    }

    // Respuesta por defecto
    return {
      response: 'Entiendo tu consulta. Puedo ayudarte con:\n\n📱 Funcionalidades de la app:\n- Crear y gestionar órdenes\n- Navegar el menú\n- Pagar y dividir pagos\n- Ver historial\n- Configurar perfil y datos fiscales\n- Órdenes grupales\n\n💬 Consultas generales:\n- Información general\n- Definiciones\n- Conceptos\n\n¿Sobre qué te gustaría saber más?',
      navigationRoute: null
    };
  };

  const toggleSpeechRecognition = async () => {
    if (!speechSupported) {
      alert(t('assistant.speechNotSupported'));
      return;
    }

    if (isNativePlatform) {
      // Usar plugin nativo de Capacitor
      try {
        if (isListening) {
          await SpeechRecognition.stop();
          setIsListening(false);
        } else {
          // Configurar idioma según el idioma de la app
          const langMap: { [key: string]: string } = {
            'es': 'es-ES',
            'en': 'en-US',
            'pt': 'pt-BR',
            'fr': 'fr-FR'
          };
          
          // Verificar permisos antes de iniciar
          let permission = await SpeechRecognition.checkPermissions();
          console.log('Permisos iniciales:', permission);
          alert('Permisos iniciales: ' + JSON.stringify(permission));
          
          // El plugin puede devolver 'microphone' o 'speechRecognition' como clave
          const hasPermission = (permission as any).microphone === 'granted' || (permission as any).speechRecognition === 'granted';
          
          // Si no está otorgado, solicitar
          if (!hasPermission) {
            console.log('Solicitando permisos...');
            alert('Solicitando permisos...');
            const result = await SpeechRecognition.requestPermissions();
            console.log('Resultado de solicitud de permisos:', result);
            alert('Resultado de solicitud: ' + JSON.stringify(result));
            
            // Esperar un momento para que Android procese los permisos
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verificar nuevamente después de solicitar
            permission = await SpeechRecognition.checkPermissions();
            console.log('Permisos después de solicitar:', permission);
            alert('Permisos después de solicitar: ' + JSON.stringify(permission));
            
            const hasPermissionAfterRequest = (permission as any).microphone === 'granted' || (permission as any).speechRecognition === 'granted';
            if (!hasPermissionAfterRequest) {
              alert(t('assistant.microphonePermissionDenied') + '\n\nPermisos recibidos: ' + JSON.stringify(permission));
              return;
            }
          }
          
          // Verificar una vez más justo antes de iniciar
          const finalCheck = await SpeechRecognition.checkPermissions();
          console.log('Verificación final de permisos:', finalCheck);
          alert('Verificación final: ' + JSON.stringify(finalCheck));
          
          const hasFinalPermission = (finalCheck as any).microphone === 'granted' || (finalCheck as any).speechRecognition === 'granted';
          if (!hasFinalPermission) {
            console.error('Permisos no otorgados en verificación final');
            alert(t('assistant.microphonePermissionDenied') + '\n\nPermisos recibidos: ' + JSON.stringify(finalCheck));
            return;
          }
          
          // Si llegamos aquí, los permisos están otorgados
          console.log('✅ Permisos verificados correctamente, procediendo a iniciar reconocimiento...');
          alert('✅ Permisos OK. Iniciando reconocimiento...');

          setIsListening(true);
          
          // Variables para almacenar los listeners
          let partialListener: any;
          let resultsListener: any;
          let errorListener: any;
          
          // Función para limpiar listeners
          const removeAllListeners = () => {
            try {
              if (partialListener) partialListener.remove();
              if (resultsListener) resultsListener.remove();
              if (errorListener) errorListener.remove();
            } catch (e) {
              // Ignorar errores al remover
            }
          };

          // Configurar listeners antes de iniciar
          partialListener = await (SpeechRecognition as any).addListener('partialResults', (data: any) => {
            if (data.matches && data.matches.length > 0) {
              setInputValue(prev => prev + (prev ? ' ' : '') + data.matches[0]);
            }
          });

          resultsListener = await (SpeechRecognition as any).addListener('results', (data: any) => {
            if (data.matches && data.matches.length > 0) {
              setInputValue(prev => prev + (prev ? ' ' : '') + data.matches[0]);
            }
            setIsListening(false);
            removeAllListeners();
          });

          errorListener = await (SpeechRecognition as any).addListener('error', async (error: any) => {
            console.error('Native speech recognition error:', error);
            console.error('Error completo:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
            setIsListening(false);
            
            // Verificar permisos nuevamente cuando hay un error
            const permissionCheck = await SpeechRecognition.checkPermissions();
            console.log('Permisos al momento del error:', permissionCheck);
            
            // Mostrar detalles completos del error
            let errorInfo = 'Error en listener:\n';
            errorInfo += 'Tipo: ' + typeof error + '\n';
            errorInfo += 'Mensaje: ' + (error?.message || 'Sin mensaje') + '\n';
            errorInfo += 'Código: ' + (error?.code || 'Sin código') + '\n';
            errorInfo += 'Error completo: ' + JSON.stringify(error, Object.getOwnPropertyNames(error));
            errorInfo += '\n\nPermisos al momento del error: ' + JSON.stringify(permissionCheck);
            alert('❌ ' + errorInfo);
            
            // Manejar diferentes tipos de errores
            const errorMessage = (error?.message || '').toLowerCase();
            if (errorMessage.includes('permission') || errorMessage.includes('microphone') || errorMessage.includes('micrófono') || errorMessage.includes('permiso')) {
              // Si el error es de permisos, verificar si realmente están otorgados
              const hasPermission = (permissionCheck as any).microphone === 'granted' || (permissionCheck as any).speechRecognition === 'granted';
              if (!hasPermission) {
                alert(t('assistant.microphonePermissionDenied') + '\n\nPermisos actuales: ' + JSON.stringify(permissionCheck));
              } else {
                alert('⚠️ Error de permisos pero los permisos están otorgados.\n\nEsto puede ser un problema del plugin.\n\nError: ' + (error?.message || 'Desconocido'));
              }
            }
            removeAllListeners();
          });

          // Iniciar reconocimiento
          console.log('Iniciando reconocimiento de voz...');
          console.log('Configuración:', {
            language: langMap[language] || 'es-ES',
            maxResults: 1,
            partialResults: false
          });
          alert('Intentando iniciar reconocimiento...\nIdioma: ' + (langMap[language] || 'es-ES'));
          
          try {
            // Intentar iniciar con configuración mínima primero
            const startConfig = {
              language: langMap[language] || 'es-ES',
              maxResults: 1,
              prompt: '',
              partialResults: false,
              popup: false
            };
            
            console.log('Configuración de inicio:', JSON.stringify(startConfig));
            alert('Configuración: ' + JSON.stringify(startConfig));
            
            await SpeechRecognition.start(startConfig);
            console.log('Reconocimiento iniciado correctamente');
            alert('✅ Reconocimiento iniciado correctamente');
          } catch (startError: any) {
            console.error('Error al iniciar reconocimiento:', startError);
            console.error('Tipo de error:', typeof startError);
            console.error('Mensaje de error:', startError?.message);
            console.error('Stack trace:', startError?.stack);
            console.error('Error completo:', JSON.stringify(startError, null, 2));
            
            // Capturar todos los detalles del error
            let errorDetails = 'Error al iniciar reconocimiento:\n\n';
            errorDetails += 'Tipo: ' + typeof startError + '\n';
            errorDetails += 'Mensaje: ' + (startError?.message || 'Sin mensaje') + '\n';
            errorDetails += 'Código: ' + (startError?.code || 'Sin código') + '\n';
            errorDetails += 'Error completo: ' + JSON.stringify(startError, Object.getOwnPropertyNames(startError));
            
            alert('❌ ' + errorDetails);
            setIsListening(false);
            removeAllListeners();
            
            // Verificar el mensaje de error específico
            const errorMessage = startError?.message || startError?.toString() || '';
            const errorLower = errorMessage.toLowerCase();
            
            console.log('Analizando error:', errorMessage);
            
            // Si el error menciona permisos o micrófono
            if (errorLower.includes('permission') || 
                errorLower.includes('microphone') || 
                errorLower.includes('micrófono') ||
                errorLower.includes('permiso') ||
                errorMessage.includes('Se necesita permiso')) {
              
              console.log('Error relacionado con permisos detectado, solicitando nuevamente...');
              
              // Esperar un momento
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Verificar permisos una vez más
              const recheckPermission = await SpeechRecognition.checkPermissions();
              console.log('Re-verificación de permisos:', recheckPermission);
              
              if ((recheckPermission as any).microphone !== 'granted') {
                // Solicitar permisos nuevamente
                const retryPermission = await SpeechRecognition.requestPermissions();
                console.log('Resultado de nueva solicitud:', retryPermission);
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const finalPermissionCheck = await SpeechRecognition.checkPermissions();
                console.log('Verificación final después de nueva solicitud:', finalPermissionCheck);
                
                if ((finalPermissionCheck as any).microphone !== 'granted') {
                  alert(t('assistant.microphonePermissionDenied') + '\n\nPor favor, verifica los permisos en Configuración > Apps > ' + (Capacitor.getPlatform() === 'android' ? 'appsistente' : 'la app'));
                  return;
                }
              }
              
              // Intentar iniciar nuevamente después de verificar/solicitar permisos
              try {
                console.log('Reintentando iniciar reconocimiento...');
                await SpeechRecognition.start({
                  language: langMap[language] || 'es-ES',
                  maxResults: 1,
                  prompt: '',
                  partialResults: false,
                  popup: false
                });
                console.log('Reconocimiento iniciado después de resolver permisos');
              } catch (retryError: any) {
                console.error('Error al reintentar después de permisos:', retryError);
                console.error('Mensaje de error en reintento:', retryError?.message);
                alert(t('assistant.microphonePermissionDenied') + '\n\nError: ' + (retryError?.message || 'Desconocido'));
                return;
              }
            } else {
              // Error no relacionado con permisos
              console.error('Error no relacionado con permisos:', errorMessage);
              alert(t('assistant.speechError') + (errorMessage ? '\n\n' + errorMessage : ''));
            }
            return;
          }
        }
      } catch (error: any) {
        console.error('Error with native speech recognition:', error);
        setIsListening(false);
        
        // Manejar diferentes tipos de errores
        if (error.message && (error.message.includes('permission') || error.message.includes('microphone'))) {
          alert(t('assistant.microphonePermissionDenied'));
        } else {
          alert(t('assistant.speechError'));
        }
      }
    } else {
      // Usar Web Speech API
      if (!recognitionRef.current) return;

      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('Error starting speech recognition:', error);
          alert(t('assistant.speechError'));
        }
      }
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    // Obtener el último mensaje del asistente para contexto
    const lastAssistantMessage = messages
      .filter(m => m.type === 'assistant')
      .slice(-1)[0]?.content;

    // Simular respuesta del asistente
    setTimeout(() => {
      const { response, navigationRoute } = generateResponse(currentInput, lastAssistantMessage);
      
      // Determinar el label del botón según la ruta
      let actionLabel = '';
      if (navigationRoute) {
        if (navigationRoute.includes('menu')) actionLabel = 'Ir al menú';
        else if (navigationRoute.includes('orders')) actionLabel = 'Ver mi orden';
        else if (navigationRoute.includes('profile')) actionLabel = 'Ir a perfil';
        else if (navigationRoute.includes('billing')) actionLabel = 'Configurar datos fiscales';
        else if (navigationRoute.includes('transactions')) actionLabel = 'Ver historial de pagos';
        else if (navigationRoute.includes('payments')) actionLabel = 'Ir a pagar';
        else actionLabel = 'Ir';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        actionRoute: navigationRoute || null,
        actionLabel: actionLabel || undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);

      // Navegar si hay una ruta pendiente (solo si el usuario respondió afirmativamente)
      if (navigationRoute && isAffirmativeResponse(currentInput)) {
        setTimeout(() => {
          onClose(); // Cerrar el modal primero
          navigate(navigationRoute);
        }, 800);
      }
    }, 500);

    // Detectar acciones sugeridas directas (cuando el usuario pide explícitamente ir a algún lugar)
    const message = currentInput.toLowerCase();
    if (message.includes('llevar') || message.includes('ir a') || message.includes('mostrar') || message.includes('llevame')) {
      if (message.includes('menú') || message.includes('menu')) {
        setTimeout(() => {
          onClose();
          navigate('/menu');
        }, 800);
      } else if (message.includes('orden') || message.includes('pedido')) {
        setTimeout(() => {
          onClose();
          navigate('/orders');
        }, 800);
      } else if (message.includes('perfil')) {
        setTimeout(() => {
          onClose();
          navigate('/profile');
        }, 800);
      } else if (message.includes('historial') || message.includes('pago') || message.includes('transacciones')) {
        setTimeout(() => {
          onClose();
          navigate('/transactions');
        }, 800);
      } else if (message.includes('fiscal') || message.includes('factura') || message.includes('datos fiscales')) {
        setTimeout(() => {
          onClose();
          navigate('/billing-step-1');
        }, 800);
      } else if (message.includes('pagar') || message.includes('cuenta')) {
        setTimeout(() => {
          onClose();
          navigate('/payments');
        }, 800);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
      <div className="w-full h-[90vh] bg-white dark:bg-gray-800 rounded-t-3xl flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
          {!isSearchMode ? (
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative overflow-hidden"
                  style={{ 
                    background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 25%, #2d3f5f 50%, #1e3a5f 75%, #0f1b2e 100%)',
                    boxShadow: '0 4px 20px rgba(0, 200, 255, 0.4), 0 0 0 1px rgba(0, 200, 255, 0.2)',
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
                  <span 
                    className="material-symbols-outlined relative z-10"
                    style={{ 
                      color: '#00419E',
                      textShadow: '0 0 10px rgba(0, 65, 158, 0.8), 0 0 20px rgba(0, 65, 158, 0.4)',
                    }}
                  >
                    auto_awesome
                  </span>
                  <style>{`
                    @keyframes shimmer {
                      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
                      100% { transform: translateX(200%) translateY(200%) rotate(45deg); }
                    }
                  `}</style>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#181611] dark:text-white">{t('assistant.title')}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by IA</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleSearch}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={t('assistant.searchInChat')}
                >
                  <span className="material-symbols-outlined text-[#181611] dark:text-white">search</span>
                </button>
                {messages.length > 1 && (
                  <button
                    onClick={handleClearHistory}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    title={t('assistant.clearHistory')}
                  >
                    <span className="material-symbols-outlined text-[#181611] dark:text-white">delete</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined text-[#181611] dark:text-white">close</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                    search
                  </span>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentSearchIndex(-1);
                    }}
                    placeholder={t('assistant.searchPlaceholder')}
                    className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentSearchIndex(-1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  )}
                </div>
                <button
                  onClick={handleToggleSearch}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title={t('assistant.closeSearch')}
                >
                  <span className="material-symbols-outlined text-[#181611] dark:text-white">close</span>
                </button>
              </div>
              {searchQuery.trim() && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {searchMatches.length > 0 
                      ? `${searchMatches.length} ${searchMatches.length !== 1 ? t('assistant.results') : t('assistant.result')} ${t('assistant.found')}`
                      : t('assistant.noResultsFound')}
                  </span>
                  {searchMatches.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={goToPreviousMatch}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Anterior"
                      >
                        <span className="material-symbols-outlined text-[#181611] dark:text-white text-lg">
                          keyboard_arrow_up
                        </span>
                      </button>
                      <span className="text-gray-600 dark:text-gray-400 text-xs min-w-[60px] text-center">
                        {currentSearchIndex >= 0 ? `${currentSearchIndex + 1} / ${searchMatches.length}` : '—'}
                      </span>
                      <button
                        onClick={goToNextMatch}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Siguiente"
                      >
                        <span className="material-symbols-outlined text-[#181611] dark:text-white text-lg">
                          keyboard_arrow_down
                        </span>
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {filteredMessages.length === 0 && searchQuery.trim() ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-3xl">search_off</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center">
                {t('assistant.noMessagesFound')}: "{searchQuery}"
              </p>
            </div>
          ) : (
            filteredMessages.map((message, index) => {
              const originalIndex = messages.findIndex(m => m.id === message.id);
              const isHighlighted = searchMatches.includes(originalIndex) && originalIndex === (currentSearchIndex >= 0 ? searchMatches[currentSearchIndex] : -1);
              
              return (
                <div
                  key={message.id}
                  ref={(el) => { messageRefs.current[message.id] = el; }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} transition-all ${
                    isHighlighted ? 'ring-2 ring-[#F6E820] ring-offset-2 rounded-lg' : ''
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.type === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-[#181611] dark:text-white'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span 
                          className="material-symbols-outlined text-sm relative"
                          style={{ 
                            color: '#00419E',
                            textShadow: '0 0 8px rgba(0, 65, 158, 0.8), 0 0 16px rgba(0, 65, 158, 0.4)',
                          }}
                        >
                          auto_awesome
                        </span>
                        <span className="text-xs font-semibold opacity-70">Asistente</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-line leading-relaxed">
                      {highlightText(message.content, searchQuery)}
                    </p>
                    {message.type === 'assistant' && message.actionRoute && message.actionLabel && (
                      <button
                        onClick={() => {
                          onClose();
                          navigate(message.actionRoute!);
                        }}
                        className="mt-3 w-full py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                      >
                        {message.actionLabel}
                      </button>
                    )}
                    <p className={`text-xs mt-2 opacity-60 ${
                      message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isSearchMode && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative rounded-xl transition-all" id="input-wrapper">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('assistant.placeholder')}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#181611] dark:text-white focus:outline-none focus:border-transparent transition-all relative z-10"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => {
                    const wrapper = e.target.parentElement;
                    if (wrapper) {
                      wrapper.style.background = 'linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #6c5ce7 50%, #4834d4 75%, #ffa726 100%)';
                      wrapper.style.padding = '2px';
                      wrapper.style.boxShadow = `
                        0 0 10px rgba(255, 107, 157, 0.5),
                        0 0 20px rgba(196, 69, 105, 0.4),
                        0 0 30px rgba(108, 92, 231, 0.3),
                        0 0 40px rgba(72, 52, 212, 0.2),
                        0 0 50px rgba(255, 167, 38, 0.3)
                      `;
                    }
                  }}
                  onBlur={(e) => {
                    const wrapper = e.target.parentElement;
                    if (wrapper) {
                      wrapper.style.background = 'transparent';
                      wrapper.style.padding = '0';
                      wrapper.style.boxShadow = 'none';
                    }
                  }}
                />
              </div>
              {speechSupported && (
                <button
                  onClick={toggleSpeechRecognition}
                  disabled={isTyping}
                  className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                    isListening
                      ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } ${isTyping ? 'opacity-50 cursor-not-allowed' : ''}`}
                  title={isListening ? t('assistant.stopListening') : t('assistant.startListening')}
                >
                  <span className="material-symbols-outlined">{isListening ? 'mic' : 'mic_none'}</span>
                </button>
              )}
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                  inputValue.trim() && !isTyping
                    ? 'bg-primary text-white hover:bg-primary/90'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantModal;
