import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

// IDs de todos los productos del menú
const ALL_DISH_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34];

interface AssistanceRequest {
  id: string;
  icon: string;
  label: string;
  translationKey: string;
  searchKeywords?: string[]; // Palabras clave para búsqueda
}

interface AssistanceHistoryItem {
  id: string;
  label: string;
  icon: string;
  timestamp: string;
  isCustom: boolean;
  status?: 'sent' | 'cancelled'; // Estado de la solicitud
}

const ASSISTANCE_HISTORY_KEY = 'assistance_history';

const RequestAssistanceScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [history, setHistory] = useState<AssistanceHistoryItem[]>([]);
  const [customRequestId, setCustomRequestId] = useState<string | null>(null);
  const [customRequestLabel, setCustomRequestLabel] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const assistanceRequests: AssistanceRequest[] = [
    { 
      id: 'cutlery', 
      icon: 'restaurant', 
      label: t('assistance.cutlery'), 
      translationKey: 'cutlery',
      searchKeywords: ['cubiertos', 'vasos', 'cuchara', 'tenedor', 'cuchillo', 'vidrio', 'utensilios', 'cutlery', 'glasses', 'utensils']
    },
    { 
      id: 'napkins', 
      icon: 'inventory', 
      label: t('assistance.napkins'), 
      translationKey: 'napkins',
      searchKeywords: ['servilletas', 'servilleta', 'napkins', 'napkin', 'papel']
    },
    { 
      id: 'spillTable', 
      icon: 'cleaning_services', 
      label: t('assistance.spillTable'), 
      translationKey: 'spillTable',
      searchKeywords: ['derrame', 'mesa', 'table', 'spill', 'limpiar', 'clean', 'líquido', 'derramado', 'accidente']
    },
    { 
      id: 'spillFloor', 
      icon: 'cleaning_services', 
      label: t('assistance.spillFloor'), 
      translationKey: 'spillFloor',
      searchKeywords: ['derrame', 'piso', 'floor', 'suelo', 'spill', 'limpiar', 'clean', 'líquido', 'derramado', 'accidente']
    },
    { 
      id: 'tortillas', 
      icon: 'lunch_dining', 
      label: t('assistance.tortillas'), 
      translationKey: 'tortillas',
      searchKeywords: ['tortillas', 'tortilla', 'tortilla']
    },
    { 
      id: 'bolillo', 
      icon: 'bakery_dining', 
      label: t('assistance.bolillo'), 
      translationKey: 'bolillo',
      searchKeywords: ['bolillo', 'pan', 'bread', 'roll', 'bollo']
    },
    { 
      id: 'spicy', 
      icon: 'local_fire_department', 
      label: t('assistance.spicy'), 
      translationKey: 'spicy',
      searchKeywords: ['picante', 'salsa', 'sauce', 'spicy', 'chile', 'chili', 'condimento']
    },
    { 
      id: 'waiter', 
      icon: 'person', 
      label: t('assistance.callWaiter'), 
      translationKey: 'callWaiter',
      searchKeywords: ['mesero', 'camarero', 'waiter', 'servidor', 'servicio', 'atención', 'ayuda', 'help', 'asistencia']
    },
    { 
      id: 'coffeeRefill', 
      icon: 'local_cafe', 
      label: t('assistance.coffeeRefill'), 
      translationKey: 'coffeeRefill',
      searchKeywords: ['café', 'refill', 'recarga', 'más café', 'mas cafe', 'coffee', 'taza', 'cup', 'recargar', 'rellenar']
    },
    { 
      id: 'sugar', 
      icon: 'coffee', 
      label: t('assistance.sugar'), 
      translationKey: 'sugar',
      searchKeywords: ['azúcar', 'azucar', 'sugar', 'endulzante', 'sweetener', 'dulce']
    },
    { 
      id: 'salt', 
      icon: 'restaurant_menu', 
      label: t('assistance.salt'), 
      translationKey: 'salt',
      searchKeywords: ['sal', 'salt', 'condimento', 'seasoning', 'salero']
    },
  ];

  // Función de búsqueda fuzzy
  const fuzzyMatch = (text: string, query: string): boolean => {
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
        .trim();
    };

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);

    // Coincidencia exacta
    if (normalizedText === normalizedQuery) return true;

    // Coincidencia de subcadena
    if (normalizedText.includes(normalizedQuery)) return true;

    // Buscar palabras individuales del query en el texto
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length > 0) {
      const allWordsMatch = queryWords.every(word => normalizedText.includes(word));
      if (allWordsMatch) return true;
    }

    // Buscar coincidencias parciales de caracteres (permite errores de tipeo menores)
    if (query.length >= 3) {
      let textIndex = 0;
      let queryIndex = 0;
      let matches = 0;

      while (textIndex < normalizedText.length && queryIndex < normalizedQuery.length) {
        if (normalizedText[textIndex] === normalizedQuery[queryIndex]) {
          matches++;
          queryIndex++;
        }
        textIndex++;
      }

      // Si al menos el 70% de los caracteres del query coinciden en orden
      const matchRatio = matches / normalizedQuery.length;
      if (matchRatio >= 0.7) return true;
    }

    // Buscar caracteres del query en cualquier orden (pero juntos)
    if (query.length >= 3) {
      const textChars = normalizedText.split('');
      const queryChars = normalizedQuery.split('');
      let consecutiveMatches = 0;
      let maxConsecutive = 0;

      for (let i = 0; i < textChars.length; i++) {
        let queryIdx = 0;
        for (let j = i; j < textChars.length && queryIdx < queryChars.length; j++) {
          if (textChars[j] === queryChars[queryIdx]) {
            consecutiveMatches++;
            queryIdx++;
          } else {
            consecutiveMatches = 0;
          }
        }
        maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
      }

      // Si hay una secuencia de caracteres que coincide
      if (maxConsecutive >= Math.min(3, normalizedQuery.length)) return true;
    }

    return false;
  };

  // Función para calcular score de relevancia (mayor score = más relevante)
  const calculateRelevanceScore = (request: AssistanceRequest, query: string): number => {
    const normalize = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    };

    const normalizedLabel = normalize(request.label);
    const normalizedQuery = normalize(query);

    let score = 0;

    // Coincidencia exacta en label = score muy alto
    if (normalizedLabel === normalizedQuery) {
      score += 100;
    }
    // Coincidencia al inicio del label = score alto
    else if (normalizedLabel.startsWith(normalizedQuery)) {
      score += 80;
    }
    // Coincidencia en label = score medio
    else if (normalizedLabel.includes(normalizedQuery)) {
      score += 50;
    }

    // Buscar en keywords
    if (request.searchKeywords) {
      request.searchKeywords.forEach(keyword => {
        const normalizedKeyword = normalize(keyword);
        if (normalizedKeyword === normalizedQuery) {
          score += 60;
        } else if (normalizedKeyword.includes(normalizedQuery)) {
          score += 30;
        }
      });
    }

    return score;
  };

  // Funciones auxiliares para obtener nombres y descripciones traducidas de productos
  const getDishName = (dishId: number): string => {
    try {
      return t(`dishes.${dishId}.name`) || `dish-${dishId}`;
    } catch {
      return `dish-${dishId}`;
    }
  };

  const getDishDescription = (dishId: number): string => {
    try {
      return t(`dishes.${dishId}.description`) || '';
    } catch {
      return '';
    }
  };

  // Filtrar botones según la búsqueda fuzzy
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) {
      return assistanceRequests;
    }

    const query = searchQuery.trim();

    // Filtrar usando búsqueda fuzzy
    const filtered = assistanceRequests.filter(request => {
      // Buscar en el label
      if (fuzzyMatch(request.label, query)) {
        return true;
      }
      // Buscar en las palabras clave
      if (request.searchKeywords?.some(keyword => fuzzyMatch(keyword, query))) {
        return true;
      }
      return false;
    });

    // Ordenar por relevancia (mayor score primero)
    return filtered.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a, query);
      const scoreB = calculateRelevanceScore(b, query);
      return scoreB - scoreA;
    });
  }, [searchQuery, assistanceRequests]);

  // Filtrar productos por nombre y descripción (similar a MenuScreen)
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    
    return ALL_DISH_IDS.filter(dishId => {
      const translatedName = getDishName(dishId).toLowerCase();
      const translatedDescription = getDishDescription(dishId).toLowerCase();
      const matchesName = translatedName.includes(query);
      const matchesDescription = translatedDescription.includes(query);
      return matchesName || matchesDescription;
    });
  }, [searchQuery, t]);

  // Cargar historial al montar el componente
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ASSISTANCE_HISTORY_KEY);
      if (stored) {
        const parsedHistory: AssistanceHistoryItem[] = JSON.parse(stored);
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Error loading assistance history:', error);
    }
  }, []);

  // Determinar si se debe mostrar el botón de crear solicitud personalizada
  const shouldShowCustomRequest = useMemo(() => {
    // Mostrar si hay texto en búsqueda Y no hay resultados filtrados
    // O si hay un customRequestId activo (para mantener el botón visible durante el efecto)
    if (customRequestId !== null) return true;
    if (!searchQuery.trim()) return false;
    return filteredRequests.length === 0;
  }, [searchQuery, filteredRequests, customRequestId]);

  // Toggle selección de solicitud
  const handleToggleRequest = (id: string) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  // Toggle selección de solicitud personalizada
  const handleToggleCustomRequest = () => {
    if (searchQuery.trim()) {
      if (customRequestId && selectedRequests.includes(customRequestId)) {
        setSelectedRequests(selectedRequests.filter(reqId => reqId !== customRequestId));
        setCustomRequestId(null);
        setCustomRequestLabel('');
      } else if (!customRequestId) {
        const requestId = `custom-${Date.now()}`;
        setCustomRequestId(requestId);
        setCustomRequestLabel(searchQuery.trim());
        setSelectedRequests([...selectedRequests, requestId]);
      }
    }
  };

  // Enviar todas las solicitudes seleccionadas
  const handleSendRequests = () => {
    if (selectedRequests.length === 0) return;

    const newHistoryItems: AssistanceHistoryItem[] = [];

    selectedRequests.forEach(requestId => {
      // Obtener información de la solicitud
      let requestLabel = '';
      let requestIcon = 'help';
      let isCustom = false;

      if (requestId.startsWith('custom-')) {
        // Es una solicitud personalizada
        requestLabel = customRequestLabel || searchQuery.trim();
        requestIcon = 'priority_high';
        isCustom = true;
      } else {
        // Es una solicitud predefinida
        const request = assistanceRequests.find(r => r.id === requestId);
        if (request) {
          requestLabel = request.label;
          requestIcon = request.icon;
        }
      }

      if (requestLabel) {
        const historyItem: AssistanceHistoryItem = {
          id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          label: requestLabel,
          icon: requestIcon,
          timestamp: new Date().toISOString(),
          isCustom: isCustom,
          status: 'sent', // Estado inicial: enviada
        };
        newHistoryItems.push(historyItem);
      }
    });

    // Agregar al historial
    const updatedHistory = [...newHistoryItems, ...history];
    setHistory(updatedHistory);
    
    // Guardar en localStorage
    try {
      localStorage.setItem(ASSISTANCE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving assistance history:', error);
    }

    // Limpiar selecciones
    setSelectedRequests([]);
    setCustomRequestId(null);
    setCustomRequestLabel('');
    setSearchQuery('');
  };

  // Cancelar una solicitud individual
  const handleCancelRequest = (itemId: string) => {
    const updatedHistory = history.map(item => {
      if (item.id === itemId && item.status === 'sent') {
        return {
          ...item,
          status: 'cancelled' as const,
        };
      }
      return item;
    });
    
    setHistory(updatedHistory);
    
    // Guardar en localStorage
    try {
      localStorage.setItem(ASSISTANCE_HISTORY_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving assistance history:', error);
    }
  };

  return (
    <div className="w-full max-w-full min-h-screen bg-white dark:bg-background-dark relative overflow-hidden flex flex-col md:max-w-2xl md:mx-auto md:shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-[#2d241c] border-b border-[#e6e0db] dark:border-[#3d3228] safe-top">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[#181511] dark:text-white">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-[#181511] dark:text-white">
              {t('assistance.title')}
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-md mx-auto pb-32 overflow-y-auto">
        <div className="p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
            {t('assistance.description')}
          </p>

          {/* History Section */}
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-[#181511] dark:text-white">
                  {t('assistance.historyTitle')}
                </h2>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {history.length} {history.length === 1 ? t('assistance.request') : t('assistance.requests')}
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {history.map((item) => {
                  const date = new Date(item.timestamp);
                  const timeString = date.toLocaleTimeString('es-MX', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const isSent = item.status === 'sent' || item.status === undefined; // Por defecto 'sent' para items antiguos
                  const isCancelled = item.status === 'cancelled';
                  
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        isCancelled 
                          ? 'bg-gray-100 dark:bg-gray-900/50 border-gray-300 dark:border-gray-700 opacity-60'
                          : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className={`flex items-center justify-center size-10 rounded-full flex-shrink-0 ${
                        isCancelled
                          ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                          : 'bg-primary/10 text-primary'
                      }`}>
                        <span className="material-symbols-outlined text-xl">
                          {item.icon}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          isCancelled
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-[#181511] dark:text-white'
                        }`}>
                          {item.label}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {timeString}
                          </span>
                          {item.isCustom && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {t('assistance.custom')}
                            </span>
                          )}
                          {isSent && (
                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              {t('assistance.sent')}
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">cancel</span>
                              {t('assistance.cancelled')}
                            </span>
                          )}
                        </div>
                      </div>
                      {isSent && (
                        <button
                          onClick={() => handleCancelRequest(item.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex-shrink-0 text-xs font-semibold"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          <span>{t('assistance.cancelRequest')}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Botón Enviar Solicitud - Solo visible si hay selecciones */}
          {selectedRequests.length > 0 && (
            <button
              onClick={handleSendRequests}
              className="bg-primary text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 w-full mb-4 transition-colors hover:bg-primary/90 active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined">send</span>
              <span>{t('assistance.sendRequest')} ({selectedRequests.length})</span>
            </button>
          )}

          {/* Search Input */}
          <div className="relative mb-6">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                // Hacer scroll para que el input quede en la parte superior, respetando el header y safe area
                setTimeout(() => {
                  if (searchInputRef.current) {
                    const header = document.querySelector('header');
                    // La altura del header ya incluye el safe area (padding-top de safe-top)
                    const headerHeight = header ? header.offsetHeight : 64;
                    const offset = headerHeight + 8; // 8px de padding adicional para separación
                    
                    const elementPosition = searchInputRef.current.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - offset;
                    
                    window.scrollTo({
                      top: Math.max(0, offsetPosition), // Asegurar que no sea negativo
                      behavior: 'smooth'
                    });
                  }
                }, 100);
              }}
              placeholder={t('assistance.searchPlaceholder')}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            )}
          </div>

          {/* Assistance Buttons Grid */}
          {filteredRequests.length > 0 && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              {filteredRequests
                .filter(request => request.id !== 'waiter') // Excluir "Llamar Mesero" del grid
                .map((request) => {
                const isSelected = selectedRequests.includes(request.id);
                return (
                  <button
                    key={request.id}
                    onClick={() => handleToggleRequest(request.id)}
                    className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 border-2 transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 text-[#181511] dark:text-white'
                    }`}
                  >
                    <div className={`flex items-center justify-center size-16 rounded-full transition-colors ${
                      isSelected
                        ? 'bg-primary text-white'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      <span className="material-symbols-outlined text-3xl">
                        {request.icon}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-center">
                      {request.label}
                    </p>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">check</span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Custom Request Button - Mostrar si no hay resultados */}
          {shouldShowCustomRequest && (
            <div className="grid grid-cols-2 gap-4 mb-4">
              <button
                onClick={handleToggleCustomRequest}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl p-6 border-2 transition-all ${
                  customRequestId && selectedRequests.includes(customRequestId)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 text-[#181511] dark:text-white'
                }`}
              >
                <div className={`flex items-center justify-center size-16 rounded-full transition-colors ${
                  customRequestId && selectedRequests.includes(customRequestId)
                    ? 'bg-primary text-white'
                    : 'bg-primary/10 text-primary'
                }`}>
                  <span className="material-symbols-outlined text-3xl">
                    priority_high
                  </span>
                </div>
                <p className="text-sm font-semibold text-center">
                  {searchQuery}
                </p>
                {customRequestId && selectedRequests.includes(customRequestId) && (
                  <div className="absolute top-2 right-2">
                    <div className="size-6 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}

          {/* Productos filtrados */}
          {filteredProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#181511] dark:text-white mb-4">
                {t('menu.title') || 'Productos'}
              </h3>
              <div className="flex flex-col gap-3">
                {filteredProducts.map((dishId) => {
                  const dishName = getDishName(dishId);
                  const dishDescription = getDishDescription(dishId);
                  return (
                    <div
                      key={dishId}
                      onClick={() => navigate(`/dish/${dishId}`)}
                      className="group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform active:scale-[0.98] cursor-pointer"
                    >
                      <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <p className="text-[#181611] dark:text-white text-base font-bold leading-tight">
                              {dishName}
                            </p>
                          </div>
                          {dishDescription && (
                            <p className="text-[#897c61] dark:text-stone-400 text-sm font-normal leading-snug">
                              {dishDescription}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-xl flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-4xl">
                          restaurant_menu
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Results Message */}
          {searchQuery.trim() && filteredRequests.length === 0 && !shouldShowCustomRequest && filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-gray-400 text-3xl">search_off</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                {t('assistance.noResults')}
              </p>
            </div>
          )}

          {/* Info Message */}
          <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 flex-shrink-0">
                info
              </span>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {t('assistance.infoMessage')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestAssistanceScreen;
