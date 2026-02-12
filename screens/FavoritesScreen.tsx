import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { formatPrice } from '../utils/currency';
import { playClickSound, playBackspaceSound } from '../utils/sound';
import { toTitleCase } from '../utils/text';
import TopNavbar from '../components/TopNavbar';

type OriginType = 'mar' | 'tierra' | 'aire' | 'vegetariano' | 'vegano' | 
  // Filtros para Bebidas
  'cafe' | 'digestivos' | 'refrescos' | 'agua_mineralizada' | 'aguas_frescas' | 'electrolit' | 'energizantes' |
  // Filtros para Postres
  'pastel' | 'pay_de_queso' | 'flan' | 'nieve' | 'fruta' |
  // Filtros para Coctelería
  'rum' | 'vodka' | 'tequila' | 'gin' | '';

const FavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addToCart } = useCart();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { favoriteDishes, removeFavorite } = useFavorites();

  const getCartQuantity = (dishId: number) => {
    return cart.filter(item => item.id === dishId).reduce((sum, item) => sum + item.quantity, 0);
  };

  // Obtener categorías dinámicamente desde las etiquetas (badges) de los productos favoritos
  const categories = useMemo(() => {
    if (!favoriteDishes || favoriteDishes.length === 0) {
      return [];
    }
    const tagsSet = new Set<string>();
    favoriteDishes.forEach((dish) => {
      if (dish.badges && Array.isArray(dish.badges)) {
        dish.badges.forEach((badge) => {
          if (typeof badge === 'string' && badge.trim() !== '') {
            tagsSet.add(badge.trim());
          }
        });
      }
    });
    // Convertir a array y ordenar alfabéticamente
    return Array.from(tagsSet).sort();
  }, [favoriteDishes]);

  // Restaurar estado desde location.state o sessionStorage
  const getInitialCategory = (availableCategories: string[]) => {
    if (location.state?.selectedCategory) {
      const stateCategory = location.state.selectedCategory;
      // Verificar que la categoría del state sea válida
      if (availableCategories.includes(stateCategory)) {
        return stateCategory;
      }
    }
    const saved = sessionStorage.getItem('favoritesSelectedCategory');
    if (saved && availableCategories.includes(saved)) {
      return saved;
    }
    // Si no hay categoría válida guardada, usar la primera por defecto
    return availableCategories[0] || '';
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');

  // Toggle categoría (agregar o quitar de la selección)
  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        // Deseleccionar
        return prev.filter(c => c !== category);
      } else {
        // Seleccionar
        return [...prev, category];
      }
    });
    // Limpiar el filtro cuando se cambia de categoría
    setSelectedOrigin('');
  };

  // Restaurar posición de scroll al regresar
  useEffect(() => {
    // Restaurar posición de scroll
    const savedScroll = sessionStorage.getItem('favoritesScrollPosition');
    if (savedScroll) {
      const scrollPosition = parseInt(savedScroll, 10);
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }
  }, [location.state]);

  // Función helper para navegar al detalle guardando el estado
  const navigateToDish = (dishId: number) => {
    // Guardar posición de scroll antes de navegar
    sessionStorage.setItem('favoritesScrollPosition', window.scrollY.toString());
    navigate(`/dish/${dishId}`, {
      state: {
        fromPage: 'favorites',
        selectedCategories: selectedCategories,
        scrollPosition: window.scrollY
      }
    });
  };

  // Función para obtener los filtros según la categoría seleccionada
  const getFiltersForCategory = (category: string): Array<{ value: OriginType; icon: string }> => {
    // Filtros para Entradas y Platos Fuertes (categorías por defecto)
    if (category === 'Entradas' || category === 'Platos Fuertes') {
      return [
        { value: 'tierra' as OriginType, icon: 'agriculture' },
        { value: 'mar' as OriginType, icon: 'waves' },
        { value: 'aire' as OriginType, icon: 'air' },
        { value: 'vegetariano' as OriginType, icon: 'local_florist' },
        { value: 'vegano' as OriginType, icon: 'eco' },
      ];
    }
    
    // Filtros para Bebidas
    if (category === 'Bebidas') {
      return [
        { value: 'cafe' as OriginType, icon: 'local_cafe' },
        { value: 'refrescos' as OriginType, icon: 'sports_bar' },
        { value: 'agua_mineralizada' as OriginType, icon: 'water_drop' },
        { value: 'aguas_frescas' as OriginType, icon: 'local_drink' },
        { value: 'electrolit' as OriginType, icon: 'fitness_center' },
        { value: 'energizantes' as OriginType, icon: 'bolt' },
      ];
    }
    
    // Filtros para Postres
    if (category === 'Postres') {
      return [
        { value: 'pastel' as OriginType, icon: 'cake' },
        { value: 'pay_de_queso' as OriginType, icon: 'pie_chart' },
        { value: 'flan' as OriginType, icon: 'egg' },
        { value: 'nieve' as OriginType, icon: 'icecream' },
        { value: 'fruta' as OriginType, icon: 'apple' },
      ];
    }
    
    // Filtros para Coctelería
    if (category === 'Coctelería') {
      return [
        { value: 'digestivos' as OriginType, icon: 'liquor' },
        { value: 'rum' as OriginType, icon: 'local_bar' },
        { value: 'vodka' as OriginType, icon: 'local_bar' },
        { value: 'tequila' as OriginType, icon: 'local_bar' },
        { value: 'gin' as OriginType, icon: 'local_bar' },
      ];
    }
    
    // Por defecto, retornar los filtros de origen
    return [
      { value: 'tierra' as OriginType, icon: 'agriculture' },
      { value: 'mar' as OriginType, icon: 'waves' },
      { value: 'aire' as OriginType, icon: 'air' },
      { value: 'vegetariano' as OriginType, icon: 'local_florist' },
      { value: 'vegano' as OriginType, icon: 'eco' },
    ];
  };

  // Mapeo de valores a claves de traducción
  const getFilterTranslationKey = (value: OriginType): string => {
    const keyMap: Record<string, string> = {
      // Filtros originales
      'tierra': 'menu.filters.land',
      'mar': 'menu.filters.sea',
      'aire': 'menu.filters.air',
      'vegetariano': 'menu.filters.vegetarian',
      'vegano': 'menu.filters.vegan',
      // Filtros para Bebidas
      'cafe': 'menu.filters.cafe',
      'refrescos': 'menu.filters.refrescos',
      'agua_mineralizada': 'menu.filters.aguaMineralizada',
      'aguas_frescas': 'menu.filters.aguasFrescas',
      'electrolit': 'menu.filters.electrolit',
      'energizantes': 'menu.filters.energizantes',
      // Filtros para Postres
      'pastel': 'menu.filters.pastel',
      'pay_de_queso': 'menu.filters.payDeQueso',
      'flan': 'menu.filters.flan',
      'nieve': 'menu.filters.nieve',
      'fruta': 'menu.filters.fruta',
      // Filtros para Coctelería
      'digestivos': 'menu.filters.digestivos',
      'alcoholic': 'menu.filters.alcoholic',
      'non-alcoholic': 'menu.filters.nonAlcoholic',
      'rum': 'menu.filters.rum',
      'vodka': 'menu.filters.vodka',
      'tequila': 'menu.filters.tequila',
      'gin': 'menu.filters.gin',
    };
    return keyMap[value] || '';
  };

  // Convertir favoriteDishes al formato esperado
  const dishes = useMemo(() => {
    return favoriteDishes.map(dish => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      price: dish.price,
      image: dish.image,
      badges: dish.badges || [],
      category: dish.category,
    }));
  }, [favoriteDishes]);

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

  // Filtrar platos por etiqueta (categoría), búsqueda y origen
  const filteredDishes = useMemo(() => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    const hasSelectedCategories = selectedCategories.length > 0;
    
    return dishes.filter(dish => {
      // BÚSQUEDA INTELIGENTE: Si hay búsqueda, ignorar TODOS los filtros y buscar en todos los favoritos
      if (hasSearchQuery) {
        const query = searchQuery.trim().toLowerCase();
        
        // Buscar en nombre
        const productName = (dish.name || '').toLowerCase();
        const matchesName = fuzzyMatch(productName, query);
        
        // Buscar en descripción
        const productDescription = (dish.description || '').toLowerCase();
        const matchesDescription = fuzzyMatch(productDescription, query);
        
        // Buscar en categorías/badges
        const productBadges = (dish.badges || []).map(badge => toTitleCase(badge)).join(' ');
        const matchesBadges = fuzzyMatch(productBadges, query);
        
        // Buscar en categoría
        const productCategory = (dish.category || '').toLowerCase();
        const matchesCategory = fuzzyMatch(productCategory, query);
        
        // Si no hay coincidencias en ningún campo, excluir el producto
        if (!matchesName && !matchesDescription && !matchesBadges && !matchesCategory) {
          return false;
        }
        
        // Si hay búsqueda, retornar true (ignorar todos los demás filtros)
        return true;
      }
      
      // Si NO hay búsqueda, aplicar filtros de categoría
      if (hasSelectedCategories) {
        // Filtro por etiquetas: el producto debe tener al menos una de las etiquetas seleccionadas
        if (!dish.badges || !dish.badges.some(badge => selectedCategories.includes(badge))) {
          return false;
        }
      }
      // Si no hay categorías seleccionadas y no hay búsqueda, mostrar todos los productos
      
      // Filtro por origen (solo vegano usando badges)
      if (selectedOrigin === 'vegano') {
        // Para vegano, verificar si tiene el badge 'vegano'
        if (!dish.badges || !dish.badges.includes('vegano')) return false;
      }
      
      return true;
    });
  }, [selectedCategories, searchQuery, selectedOrigin, dishes]);

  // Obtener el título dinámico basado en las categorías seleccionadas o búsqueda
  const getSectionTitle = () => {
    // Si hay búsqueda activa, mostrar "Resultados de búsqueda"
    if (searchQuery.trim().length > 0) {
      return t('menu.searchResults') || 'Resultados de búsqueda';
    }
    
    // Si no hay búsqueda, mostrar según categorías seleccionadas
    if (selectedCategories.length === 0) {
      return t('favorites.title');
    } else if (selectedCategories.length === 1) {
      return selectedCategories[0];
    } else {
      return selectedCategories.join(', ');
    }
  };

  const hasActiveFilters = selectedOrigin !== '';

  const clearFilters = () => {
    setSelectedOrigin('');
    setSearchQuery('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <TopNavbar title={t('favorites.title')} showAvatar={false} showBackButton={true} />
      
      {/* Search Input - Movido antes de los filtros */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              // Reproducir sonido de tecla para teclas que generan caracteres
              // Excluir teclas especiales como Shift, Ctrl, Alt, etc.
              if (e.key === 'Backspace' || e.key === 'Delete') {
                playBackspaceSound();
              } else if (e.key.length === 1) {
                playClickSound();
              }
            }}
            placeholder={t('menu.searchPlaceholder') || 'Buscar productos...'}
            className="w-full h-12 pl-12 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="sticky top-[73px] z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Categories Chips - Solo mostrar si hay categorías disponibles */}
        {categories.length > 0 && (
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category);
            return (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${
                  !searchQuery.trim() && isSelected
                    ? 'bg-primary shadow-md shadow-primary/20'
                    : 'bg-white dark:bg-[#322a1a] border border-[#f4f3f0] dark:border-[#3d3321]'
                }`}
              >
                <p className={`text-sm font-${!searchQuery.trim() && isSelected ? 'semibold' : 'medium'} ${
                  !searchQuery.trim() && isSelected
                    ? 'text-white'
                    : 'text-[#181611] dark:text-stone-300'
                }`}>
                  {category}
                </p>
              </button>
            );
          })}
        </div>
        )}
      </div>

      {/* Favorites List */}
      <section className="px-4 pb-4">
        <div className="flex items-center gap-2 pb-3">
          <span className="material-symbols-outlined text-[#181611] dark:text-white text-xl">favorite</span>
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{getSectionTitle()}</h3>
        </div>
        
        <div className="flex flex-col gap-4">
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => navigateToDish(dish.id)}
              className="group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform active:scale-[0.98] cursor-pointer"
            >
            <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-[#181611] dark:text-white text-base font-bold leading-tight">{dish.name}</p>
                  {dish.badges?.includes('vegano') && (
                    <span className="material-symbols-outlined text-xs text-green-500" title={t('menu.badges.vegan')}>eco</span>
                  )}
                  {dish.badges?.includes('especialidad') && (
                    <span className="material-symbols-outlined text-xs text-orange-500" title={t('menu.badges.specialty')}>star</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(dish.id);
                    }}
                    className="ml-auto p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                    title={t('favorites.removeFavorite')}
                  >
                    <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                  </button>
                </div>
                <p className="text-[#897c61] dark:text-stone-400 text-sm font-normal leading-snug">{dish.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToDish(dish.id);
                  }}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-8 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <span className="truncate">{formatPrice(dish.price, localStorage.getItem('selectedLanguage'))}</span>
                </button>
                <div
                  className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary transition-colors cursor-default"
                  title={getCartQuantity(dish.id) > 0 ? t('menu.inCart') : ''}
                >
                  <span className="material-symbols-outlined text-lg">note_add</span>
                  {getCartQuantity(dish.id) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {getCartQuantity(dish.id)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className="w-32 h-32 bg-center bg-no-repeat bg-cover rounded-xl flex-shrink-0"
              style={{ backgroundImage: `url("${dish.image}")` }}
            />
            </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <span className="material-symbols-outlined text-4xl mb-2">
                {searchQuery || hasActiveFilters ? 'search_off' : 'favorite_border'}
              </span>
              <p className="text-sm text-center">
                {searchQuery || hasActiveFilters 
                  ? t('menu.noDishesFound')
                  : t('favorites.noFavorites')}
              </p>
              {(searchQuery || hasActiveFilters) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm"
                >
                  {t('menu.clearFilters')}
                </button>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FavoritesScreen;
