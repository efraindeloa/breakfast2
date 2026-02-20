import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useProducts } from '../contexts/ProductsContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { formatPrice } from '../utils/currency';
import { playClickSound, playBackspaceSound } from '../utils/sound';
import TopNavbar from '../components/TopNavbar';
import { getMenuSections } from '../services/api';

type OriginType = 'mar' | 'tierra' | 'aire' | 'vegetariano' | 'vegano' | 
  // Filtros para Bebidas
  'cafe' | 'digestivos' | 'refrescos' | 'agua_mineralizada' | 'aguas_frescas' | 'electrolit' | 'energizantes' |
  // Filtros para Postres
  'pastel' | 'pay_de_queso' | 'flan' | 'nieve' | 'fruta' |
  // Filtros para Coctelería
  'rum' | 'vodka' | 'tequila' | 'gin' | '';

const MenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart, addToCart } = useCart();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { favoriteDishes } = useFavorites();
  const { products, isLoading: productsLoading } = useProducts();
  const { selectedRestaurantId } = useRestaurant();
  
  // Estados para las secciones del menú (cargadas desde la base de datos)
  const [chefSuggestionsByCategory, setChefSuggestionsByCategory] = useState<Record<string, number[]>>({});
  const [highlightsByCategory, setHighlightsByCategory] = useState<Record<string, number[]>>({});
  const [hasLoadedSections, setHasLoadedSections] = useState(false); // Flag para saber si ya se intentó cargar desde la BD
  
  // Cargar secciones del menú desde la base de datos cuando cambia el restaurante seleccionado
  useEffect(() => {
    const loadMenuSections = async () => {
      if (!selectedRestaurantId) {
        // Si no hay restaurante seleccionado, resetear todo
        setChefSuggestionsByCategory({});
        setHighlightsByCategory({});
        setHasLoadedSections(false);
        return;
      }

      try {
        const sectionsResult = await getMenuSections(selectedRestaurantId);
        if (sectionsResult.success && sectionsResult.data) {
          const [chefSuggestions, highlights] = sectionsResult.data;
          console.log('[MenuScreen] Raw data from getMenuSections:', {
            chefSuggestions,
            highlights,
            chefSuggestionsType: typeof chefSuggestions,
            chefSuggestionsIsArray: Array.isArray(chefSuggestions),
            chefSuggestionsKeys: Object.keys(chefSuggestions || {}),
            highlightsKeys: Object.keys(highlights || {})
          });
          
          // Asegurar que son objetos, no arrays
          const chefSuggestionsObj = chefSuggestions && typeof chefSuggestions === 'object' && !Array.isArray(chefSuggestions) 
            ? chefSuggestions 
            : {};
          const highlightsObj = highlights && typeof highlights === 'object' && !Array.isArray(highlights)
            ? highlights
            : {};
          
          setChefSuggestionsByCategory(chefSuggestionsObj);
          setHighlightsByCategory(highlightsObj);
          setHasLoadedSections(true);
          console.log('[MenuScreen] Menu sections loaded from database:', { 
            chefSuggestions: chefSuggestionsObj, 
            highlights: highlightsObj,
            restaurantId: selectedRestaurantId,
            chefSuggestionsKeys: Object.keys(chefSuggestionsObj),
            highlightsKeys: Object.keys(highlightsObj),
            chefSuggestionsFull: JSON.stringify(chefSuggestionsObj),
            highlightsFull: JSON.stringify(highlightsObj)
          });
        } else {
          console.warn('[MenuScreen] No menu sections found for restaurant:', selectedRestaurantId);
          // Si no hay datos en la BD, usar objetos vacíos (no valores por defecto)
          setChefSuggestionsByCategory({});
          setHighlightsByCategory({});
          setHasLoadedSections(true); // Marcar como cargado para no usar valores por defecto
        }
      } catch (error) {
        console.error('[MenuScreen] Error loading menu sections:', error);
        setChefSuggestionsByCategory({});
        setHighlightsByCategory({});
        setHasLoadedSections(true); // Marcar como cargado incluso si hay error
      }
    };

    loadMenuSections();
  }, [selectedRestaurantId]);
  
  const getCartQuantity = (dishId: number) => {
    return cart.filter(item => item.id === dishId).reduce((sum, item) => sum + item.quantity, 0);
  };

  // Funciones auxiliares para obtener nombres y descripciones traducidas
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
  
  // Obtener categorías desde product.category (igual que MenuRestaurantScreen) para mostrar Entradas, Bebidas, etc.
  const categories = useMemo(() => {
    if (!selectedRestaurantId || !products) {
      return [];
    }
    const categoriesSet = new Set<string>();
    products.forEach((product) => {
      if (product.category && String(product.category).trim() !== '') {
        categoriesSet.add(String(product.category).trim());
      }
    });
    return Array.from(categoriesSet).sort();
  }, [products, selectedRestaurantId]);

  // Restaurar estado desde location.state o sessionStorage
  const getInitialCategory = (availableCategories: string[]) => {
    if (location.state?.selectedCategory) {
      const stateCategory = location.state.selectedCategory;
      // Verificar que la categoría del state sea válida
      if (availableCategories.includes(stateCategory)) {
        return stateCategory;
      }
    }
    const saved = sessionStorage.getItem('menuSelectedCategory');
    if (saved && availableCategories.includes(saved)) {
      return saved;
    }
    // Si no hay categoría válida guardada, usar la primera por defecto
    return availableCategories[0];
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');
  const [showSuggestions, setShowSuggestions] = useState(() => {
    const saved = localStorage.getItem('showSuggestions');
    return saved === null ? true : saved === 'true'; // Por defecto activado
  });
  const [showHighlights, setShowHighlights] = useState(() => {
    const saved = localStorage.getItem('showHighlights');
    return saved === null ? true : saved === 'true'; // Por defecto activado
  });
  const [chefSuggestionsExpanded, setChefSuggestionsExpanded] = useState(true);
  const [highlightsExpanded, setHighlightsExpanded] = useState(true);

  // Colapsar Sugerencias del chef y Destacados después de 5 segundos (una sola vez por visita)
  const collapseSectionsRanRef = useRef(false);
  useEffect(() => {
    if (collapseSectionsRanRef.current) return;
    const t = setTimeout(() => {
      collapseSectionsRanRef.current = true;
      setChefSuggestionsExpanded(false);
      setHighlightsExpanded(false);
    }, 5000);
    return () => clearTimeout(t);
  }, []);

  // Escuchar cambios en localStorage para actualizar el estado cuando se cambia el toggle en Settings
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'showSuggestions') {
        setShowSuggestions(e.newValue === 'true');
      }
      if (e.key === 'showHighlights') {
        setShowHighlights(e.newValue === 'true');
      }
    };

    // Escuchar eventos de storage de otras pestañas/ventanas
    window.addEventListener('storage', handleStorageChange);

    // También verificar periódicamente (para cambios en la misma pestaña)
    const interval = setInterval(() => {
      const savedSuggestions = localStorage.getItem('showSuggestions');
      const savedHighlights = localStorage.getItem('showHighlights');
      
      if (savedSuggestions !== null) {
        const newValue = savedSuggestions === 'true';
        if (newValue !== showSuggestions) {
          setShowSuggestions(newValue);
        }
      }
      
      if (savedHighlights !== null) {
        const newValue = savedHighlights === 'true';
        if (newValue !== showHighlights) {
          setShowHighlights(newValue);
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [showSuggestions, showHighlights]);

  // Establecer la primera categoría disponible si no hay ninguna (solo cuando no hay búsqueda; con búsqueda se sincroniza después de displayCategories)
  useEffect(() => {
    if (searchQuery.trim()) return;
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
      sessionStorage.setItem('menuSelectedCategory', categories[0]);
    } else if (categories.length > 0 && selectedCategory && !categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
      sessionStorage.setItem('menuSelectedCategory', categories[0]);
      setSelectedSubcategory('');
    } else if (categories.length === 0) {
      setSelectedCategory('');
      setSelectedSubcategory('');
      sessionStorage.removeItem('menuSelectedCategory');
    }
  }, [categories, searchQuery, selectedCategory]);

  // Restaurar posición de scroll y categoría al regresar
  useEffect(() => {
    // Restaurar categoría desde location.state
    if (location.state?.selectedCategory) {
      setSelectedCategory(location.state.selectedCategory);
      sessionStorage.setItem('menuSelectedCategory', location.state.selectedCategory);
    }
    
    // Restaurar posición de scroll
    const savedScroll = sessionStorage.getItem('menuScrollPosition');
    if (savedScroll) {
      const scrollPosition = parseInt(savedScroll, 10);
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    }
  }, [location.state]);

  // Guardar categoría en sessionStorage cuando cambia
  useEffect(() => {
    sessionStorage.setItem('menuSelectedCategory', selectedCategory);
  }, [selectedCategory]);

  // Función helper para navegar al detalle guardando el estado
  const navigateToDish = (dishId: number) => {
    // Guardar posición de scroll y categoría antes de navegar
    sessionStorage.setItem('menuScrollPosition', window.scrollY.toString());
    navigate(`/dish/${dishId}`, {
      state: {
        fromPage: 'menu',
        selectedCategory: selectedCategory,
        scrollPosition: window.scrollY
      }
    });
  };

  // Mapeo de categorías en español a traducciones
  const categoryMap: Record<string, string> = useMemo(() => ({
    'Entradas': t('menu.categories.appetizers'),
    'Platos Fuertes': t('menu.categories.mains'),
    'Bebidas': t('menu.categories.drinks'),
    'Postres': t('menu.categories.desserts'),
    'Coctelería': t('menu.categories.cocktails'),
    'Misceláneos': t('menu.categories.miscellaneous')
  }), [t]);

  const getCategoryTileIcon = (category: string) => {
    const c = (category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (c.includes('pan')) return 'bakery_dining';
    if (c.includes('huevo')) return 'egg_alt';
    if (c.includes('bebid') || c.includes('drink')) return 'local_bar';
    if (c.includes('cervez')) return 'sports_bar';
    if (c.includes('coctel') || c.includes('cocktail')) return 'liquor';
    if (c.includes('vino')) return 'wine_bar';
    if (c.includes('licor')) return 'liquor';
    if (c.includes('postre') || c.includes('dessert')) return 'cake';
    if (c.includes('fruta')) return 'nutrition';
    if (c.includes('promo')) return 'sell';
    if (c.includes('alimento') || c.includes('menu') || c.includes('comida') || c.includes('food')) return 'restaurant';
    return 'category';
  };

  // Ya no necesitamos getOriginalCategory porque las categorías ahora son las etiquetas directamente
  const getOriginalCategory = (category: string): string => {
    return category; // Las categorías ahora son las etiquetas directamente
  };

  // Función para obtener los filtros según la categoría seleccionada
  const getFiltersForCategory = (category: string): Array<{ value: OriginType; icon: string }> => {
    const originalCategory = getOriginalCategory(category);
    
    // Filtros para Entradas y Platos Fuertes (categorías por defecto)
    if (originalCategory === 'Entradas' || originalCategory === 'Platos Fuertes') {
      return [
        { value: 'tierra' as OriginType, icon: 'agriculture' },
        { value: 'mar' as OriginType, icon: 'waves' },
        { value: 'aire' as OriginType, icon: 'air' },
        { value: 'vegetariano' as OriginType, icon: 'local_florist' },
        { value: 'vegano' as OriginType, icon: 'eco' },
      ];
    }
    
    // Filtros para Bebidas
    if (originalCategory === 'Bebidas') {
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
    if (originalCategory === 'Postres') {
      return [
        { value: 'pastel' as OriginType, icon: 'cake' },
        { value: 'pay_de_queso' as OriginType, icon: 'pie_chart' },
        { value: 'flan' as OriginType, icon: 'egg' },
        { value: 'nieve' as OriginType, icon: 'icecream' },
        { value: 'fruta' as OriginType, icon: 'apple' },
      ];
    }
    
    // Filtros para Coctelería
    if (originalCategory === 'Coctelería') {
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

  // Obtener los filtros para la categoría actual
  const originFiltersBase = getFiltersForCategory(selectedCategory);

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

  const dishesFromCode = [
    {
      id: 1,
      name: 'Tacos de Atún Marinado',
      description: 'Atún fresco con aderezo de chipotle artesanal, aguacate y cebolla morada.',
      price: '$18.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxagxlshYO2auuogSyw7OhNdc7J8dbVtovgy1mx2QnTHrkMM2grGKiD5FOKoTvHJCxaf3o2IELhRAX9KuZmf3PSo_hZMFmXbeQpucwaZ41LUFYyamXCfCpGD8b3ysaoiUZmN_hQx3AB0zC0PVC5YeERx23oMBXNH-Bix9Tpdb9CNzdIliDef0s4xZn5I_BDf46Q_4zQliQOmvnxglHcpo1lGW6PGIGHletH7NmXDLi-rmVLzUYaOOr3OZJFOHTy4bsX4Sb8uyCMTC',
      badges: ['vegano'],
      category: 'Entradas',
      origin: 'mar' as OriginType,
    },
    {
      id: 2,
      name: 'Ceviche de Maracuyá',
      description: 'Pescado blanco marinado en leche de tigre de maracuyá y toques de cilantro.',
      price: '$22.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0',
      category: 'Entradas',
      origin: 'mar' as OriginType,
    },
    {
      id: 3,
      name: 'Rib Eye a la Leña',
      description: 'Corte premium de 400g cocinado a fuego lento con madera de encino.',
      price: '$45.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      badges: ['especialidad'],
      category: 'Platos Fuertes',
      origin: 'tierra' as OriginType,
    },
    {
      id: 4,
      name: 'Carpaccio de Res',
      description: 'Láminas finas de res con parmesano, arúgula y aceite de trufa blanca.',
      price: '$19.50',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl1Y98JWSxq59D6xrh4JHhm4q072LDOHj17OoZ6LzLrjORuYwpo5U34TJPTXqOI4jEB93fhXcE0vO3VyiAMBLQBDC0E2mFh_aAgBjf5Lyg9-1kfvymXKbxsPQpneXX2TyNW61UnZ3Fo8BP8jz0wJ6ZExUHJGeGUJavA4TKiT4e6JNUG5AdgejiOFA7Gw_lR4o0Q4Fq2jKpNkLbfqTPwfs-rTcYvGMJayKZ0OdUtJDbwETkbjK0bd2ufND56laE10uZeDOX6vMLfJAf',
      category: 'Entradas',
      origin: 'tierra' as OriginType,
    },
    {
      id: 5,
      name: 'Ensalada Mediterránea',
      description: 'Fresco, saludable y de temporada',
      price: '$12.50',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      badges: ['vegano'],
      category: 'Entradas',
      origin: 'vegetariano' as OriginType,
    },
    {
      id: 6,
      name: 'Pollo al Limón & Hierbas',
      description: 'Plato insignia del día',
      price: '$15.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Platos Fuertes',
      origin: 'aire' as OriginType,
    },
    {
      id: 7,
      name: 'Quinoa & Aguacate Bowl',
      description: 'Nutritivo y equilibrado',
      price: '$16.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g',
      badges: ['vegano'],
      category: 'Platos Fuertes',
      origin: 'vegetariano' as OriginType,
    },
    {
      id: 8,
      name: 'Pasta al Pomodoro',
      description: 'Elaboración artesanal',
      price: '$20.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL',
      category: 'Platos Fuertes',
      origin: 'vegetariano' as OriginType,
    },
    {
      id: 9,
      name: 'Café Espresso',
      description: 'Café italiano intenso y aromático',
      price: '$4.50',
      image: '/cafe-expresso-nespresso.webp',
      category: 'Bebidas',
      origin: '' as OriginType,
    },
    {
      id: 10,
      name: 'Jugo de Naranja Natural',
      description: 'Recién exprimido, rico en vitamina C',
      price: '$6.00',
      image: '/jugo-naranja.avif',
      category: 'Bebidas',
      origin: '' as OriginType,
    },
    {
      id: 11,
      name: 'Tarta de Chocolate',
      description: 'Deliciosa tarta con cobertura de chocolate belga',
      price: '$8.50',
      image: '/tarta-chocolate.jpg',
      category: 'Postres',
      origin: '' as OriginType,
    },
    {
      id: 12,
      name: 'Flan de Vainilla',
      description: 'Tradicional flan casero con caramelo',
      price: '$7.00',
      image: '/flan-vainilla.jpg',
      category: 'Postres',
      origin: '' as OriginType,
    },
    // CAFÉ - Bebidas
    {
      id: 15,
      name: 'Americano',
      description: '180 ml - NESPRESSO',
      price: '$48.00',
      image: '/cafe-americano-nespresso.webp',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 16,
      name: 'Espresso',
      description: '60 ml - NESPRESSO',
      price: '$48.00',
      image: '/cafe-expresso-nespresso.webp',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 17,
      name: 'Capuchino',
      description: '180 ml - NESPRESSO. Opciones: Napolitano, baileys, vainilla',
      price: '$60.00',
      image: '/capuchino-nespresso.webp',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 18,
      name: 'Frapuccino',
      description: '180 ml - NESPRESSO',
      price: '$70.00',
      image: '/frappuccino.jpg',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 19,
      name: 'Té',
      description: 'Opciones: Hierbabuena / Manzanilla',
      price: '$35.00',
      image: '/te.webp',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    // DIGESTIVOS - Coctelería
    {
      id: 20,
      name: 'Carajillo',
      description: 'Café con licor 43',
      price: '$145.00',
      image: '/carajillo solo.webp',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 21,
      name: 'Coketillo',
      description: 'Carajillo con paleta de chocomilk',
      price: '$160.00',
      image: '/coketillo_donk.jpg',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 22,
      name: 'Carajilla',
      description: 'Café con Baileys',
      price: '$145.00',
      image: '/carajilla.jpg',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 23,
      name: 'Licor 43',
      description: '700 ml - Porción: $140.00 / Botella: $1,400.00',
      price: '$140.00',
      image: '/licor43.webp',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 24,
      name: 'Baileys',
      description: '700 ml - Porción: $120.00 / Botella: $1,200.00',
      price: '$120.00',
      image: '/baileys.webp',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 25,
      name: 'Frangelico',
      description: '700 ml - Porción: $120.00 / Botella: $1,200.00',
      price: '$120.00',
      image: '/frangelico.webp',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 26,
      name: 'Sambuca',
      description: '700 ml - Porción: $100.00 / Botella: $1,000.00',
      price: '$100.00',
      image: '/sambuca.webp',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 27,
      name: 'Chinchón Seco',
      description: '1000 ml - Porción: $95.00 / Botella: $950.00',
      price: '$95.00',
      image: '/chincho-seco.avif',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 28,
      name: 'Chinchón Dulce',
      description: '1000 ml - Porción: $95.00 / Botella: $950.00',
      price: '$95.00',
      image: '/chinchon-dulce.jpg',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    // POSTRES
    {
      id: 29,
      name: 'Volcán',
      description: 'Con una textura única, firme por fuera, suave por dentro, acompañado de helado. Opciones: Dulce de leche o chocolate',
      price: '$140.00',
      image: '/volcan.jpg',
      badges: ['favorito'],
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 30,
      name: 'Cheesecake Vasco',
      description: 'Cremoso pay de natilla montado sobre cama de galleta horneada y bañado con mermelada de frutos rojos. (200 g.)',
      price: '$190.00',
      image: '/cheesecake-vasco.jpg',
      category: 'Postres',
      origin: 'pay_de_queso' as OriginType,
    },
    {
      id: 31,
      name: 'Pan de Elote',
      description: 'Recién horneado, sobre una cama de mermelada, frutos rojos, helado de vainilla, bañado con dulce de cajeta y nuez. (200 g.)',
      price: '$140.00',
      image: '/pan-elote.jpeg',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 32,
      name: 'Cheesecake Lotus',
      description: 'Pay de queso con la autentica galleta "Lotus Biscoff", bañado con mezcla de leches, acompañado de frutos rojos.',
      price: '$140.00',
      image: '/cheesecake-lotus.png',
      category: 'Postres',
      origin: 'pay_de_queso' as OriginType,
    },
    {
      id: 33,
      name: 'Pastel 3 Leches',
      description: 'Delicioso pan de vainilla, con trozos de durazno, bañado con mezcla de 3 leches, con frutos rojos y nuez.',
      price: '$140.00',
      image: '/pastel-3leches.jpg',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 34,
      name: 'Red Velvet',
      description: 'Pan de red velvet con sabor a chocolate oscuro y betún de queso crema. Coronado con fresa natural.',
      price: '$140.00',
      image: '/red-velvet.jpg',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
  ];

  // Usar productos de Supabase si están disponibles, sino usar los hardcodeados
  const dishes = useMemo(() => {
    if (products.length > 0) {
      // Convertir productos de Supabase al formato esperado (misma estructura que MenuRestaurantScreen)
      return products.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        badges: p.badges || [],
        category: p.category,
        subcategories: p.subcategories || [],
        origin: p.origin as OriginType,
      }));
    }
    return dishesFromCode;
  }, [products]);

  // Al cambiar de categoría, limpiar subcategoría si ya no aplica (foodSubcategories se define después de filteredDishes)
  // Ref para el contenedor de subcategorías (animación de scroll cuando hay más de ~3 filas)
  const subcategoriesScrollRef = useRef<HTMLDivElement>(null);
  const subcategoriesScrollRafRef = useRef(0);
  const subcategoriesScrollStoppedRef = useRef(false);
  const scrollAnimationRanOnceRef = useRef(false);

  const menuSectionRef = useRef<HTMLElement>(null);
  const scrollToMenuSection = () => {
    setTimeout(() => {
      menuSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  // Saber si una categoría tiene subcategorías de 1er nivel (para no hacer scroll hasta ser hoja)
  const getRootOptionsForCategory = (cat: string): string[] => {
    const source = searchQuery.trim() ? filteredDishes : dishes;
    const set = new Set<string>();
    source.forEach((dish) => {
      if (dish.category !== cat || !dish.subcategories?.length) return;
      (dish.subcategories as string[]).forEach((sub: string) => {
        const s = String(sub).trim();
        if (!s) return;
        const root = s.includes('/') ? s.split('/')[0].trim() : s;
        if (root) set.add(root);
      });
    });
    return Array.from(set);
  };

  // Sugerencias del Chef y Destacados ahora se cargan desde la base de datos
  // Valores por defecto hardcodeados solo se usan si no hay restaurante seleccionado o no hay datos en la BD
  const defaultChefSuggestions: Record<string, number[]> = {
    'Entradas': [1, 2, 5, 4],
    'Platos Fuertes': [3, 6, 7, 8],
    'Bebidas': [9, 10, 15, 16, 17, 18, 19],
    'Postres': [11, 12, 29, 30, 31, 32, 33, 34],
    'Coctelería': [13, 14, 20, 21, 22, 23, 24],
  };

  const defaultHighlights: Record<string, number[]> = {
    'Entradas': [1, 2],
    'Platos Fuertes': [3, 7],
    'Bebidas': [15],
    'Postres': [29],
    'Coctelería': [20],
  };

  // Usar datos de la BD si hay restaurante seleccionado y ya se cargaron los datos
  // Solo usar valores por defecto si NO hay restaurante seleccionado
  const chefSuggestions = (selectedRestaurantId && hasLoadedSections)
    ? chefSuggestionsByCategory 
    : defaultChefSuggestions;
  
  const todayHighlights = (selectedRestaurantId && hasLoadedSections)
    ? highlightsByCategory 
    : defaultHighlights;

  // Búsqueda por nombre/descripción: solo coincide si el término está en el texto (evita falsos positivos)
  const searchMatchesText = (text: string, query: string): boolean => {
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
    const normalizedText = normalize(text);
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return true;
    // Coincidencia exacta
    if (normalizedText === normalizedQuery) return true;
    // El query completo debe aparecer como subcadena (ej. "carajillo" en nombre o descripción)
    if (normalizedText.includes(normalizedQuery)) return true;
    // Si el usuario escribe varias palabras, todas deben aparecer (ej. "cafe leche" → nombre/descripción debe contener "cafe" y "leche")
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 2);
    if (queryWords.length > 1 && queryWords.every(word => normalizedText.includes(word))) return true;
    return false;
  };

  // Filtrar platos por categoría (product.category), subcategoría, búsqueda y origen (igual que MenuRestaurantScreen)
  const filteredDishes = useMemo(() => {
    const hasSearchQuery = searchQuery.trim().length > 0;

    return dishes.filter((dish) => {
      // Si hay búsqueda, buscar en todas las categorías
      if (hasSearchQuery) {
        const query = searchQuery.trim();
        const productName = dish.name || '';
        const productDescription = dish.description || '';
        const matchesName = searchMatchesText(productName, query);
        const matchesDescription = searchMatchesText(productDescription, query);
        if (!matchesName && !matchesDescription) return false;
      } else {
        // Sin búsqueda: filtrar por categoría (campo category, no badges)
        if (selectedCategory && dish.category !== selectedCategory) return false;
        // Si hay subcategoría seleccionada, filtrar por path (exacto o prefijo)
        if (selectedSubcategory) {
          const subcats = dish.subcategories as string[] | undefined;
          if (!subcats || subcats.length === 0) return false;
          const match = subcats.some(
            (s) => s === selectedSubcategory || s.startsWith(selectedSubcategory + '/')
          );
          if (!match) return false;
        }
      }

      // Filtro por origen (ej. vegano por badge)
      if (selectedOrigin === 'vegano') {
        if (!dish.badges || !dish.badges.includes('vegano')) return false;
      } else if (selectedOrigin && dish.origin !== selectedOrigin) {
        return false;
      }

      return true;
    });
  }, [selectedCategory, selectedSubcategory, searchQuery, selectedOrigin, dishes]);

  const dishMatchesSubcategory = (dish: { subcategories?: unknown }, sub: string) => {
    if (!sub) return true;
    const subcats = dish.subcategories as string[] | undefined;
    if (!subcats || subcats.length === 0) return false;
    return subcats.some((s) => s === sub || s.startsWith(sub + '/'));
  };

  // Con búsqueda activa, los filtros muestran solo categorías/subcategorías presentes en los resultados
  const displayCategories = useMemo(() => {
    if (searchQuery.trim()) {
      const set = new Set<string>();
      filteredDishes.forEach((d) => {
        if (d.category && String(d.category).trim() !== '') set.add(String(d.category).trim());
      });
      return Array.from(set).sort();
    }
    return categories;
  }, [searchQuery, filteredDishes, categories]);

  // Con búsqueda: sincronizar categoría/subcategoría con los resultados (displayCategories ya definido aquí)
  useEffect(() => {
    if (!searchQuery.trim()) return;
    if (displayCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(displayCategories[0]);
      sessionStorage.setItem('menuSelectedCategory', displayCategories[0]);
    } else if (displayCategories.length > 0 && selectedCategory && !displayCategories.includes(selectedCategory)) {
      setSelectedCategory(displayCategories[0]);
      sessionStorage.setItem('menuSelectedCategory', displayCategories[0]);
      setSelectedSubcategory('');
    } else if (displayCategories.length === 0) {
      setSelectedCategory('');
      setSelectedSubcategory('');
      sessionStorage.removeItem('menuSelectedCategory');
    }
  }, [displayCategories, searchQuery, selectedCategory]);

  // Subcategorías de la categoría seleccionada; con búsqueda solo las que aparecen en los resultados
  const foodSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const source = searchQuery.trim() ? filteredDishes : dishes;
    const subcategoriesSet = new Set<string>();
    source.forEach((dish) => {
      if (dish.category === selectedCategory && dish.subcategories && dish.subcategories.length > 0) {
        (dish.subcategories as string[]).forEach((subcat: string) => {
          if (subcat && String(subcat).trim() !== '') {
            subcategoriesSet.add(String(subcat).trim());
          }
        });
      }
    });
    return Array.from(subcategoriesSet).sort();
  }, [dishes, filteredDishes, searchQuery, selectedCategory]);

  // 1er nivel: raíz de cada subcategoría (ej. "Cocteles de Mariscos" de "Cocteles de Mariscos/Camarón")
  const subcategoryRootOptions = useMemo(() => {
    const set = new Set<string>();
    foodSubcategories.forEach((s) => {
      const root = s.includes('/') ? s.split('/')[0].trim() : s;
      if (root) set.add(root);
    });
    return Array.from(set).sort();
  }, [foodSubcategories]);

  // Raíz actualmente seleccionada (para mostrar 2do nivel): el primer segmento del path
  const selectedFirstLevel = selectedSubcategory ? selectedSubcategory.split('/')[0] : '';

  // 2do nivel: solo hijos directos de la raíz seleccionada (ej. "Camarón", "Mixto", "Pulpo" cuando raíz = "Cocteles de Mariscos")
  const subcategorySecondLevelOptions = useMemo(() => {
    if (!selectedFirstLevel) return [];
    const prefix = selectedFirstLevel + '/';
    const set = new Set<string>();
    foodSubcategories.forEach((s) => {
      if (!s.startsWith(prefix)) return;
      const after = s.slice(prefix.length);
      const child = after.split('/')[0]?.trim();
      if (child) set.add(child);
    });
    return Array.from(set).sort();
  }, [foodSubcategories, selectedFirstLevel]);

  // Al cambiar de categoría o resultados de búsqueda, limpiar subcategoría si ya no aplica
  useEffect(() => {
    if (selectedCategory && foodSubcategories.length === 0) {
      setSelectedSubcategory('');
      return;
    }
    if (selectedSubcategory && foodSubcategories.length > 0) {
      const valid = foodSubcategories.some(
        (s) => s === selectedSubcategory || s.startsWith(selectedSubcategory + '/')
      );
      if (!valid) setSelectedSubcategory('');
    }
  }, [selectedCategory, foodSubcategories, selectedSubcategory]);

  // Animación de scroll suave: una sola vez al entrar a la página; al salir y volver se repite una vez
  useEffect(() => {
    if (scrollAnimationRanOnceRef.current) return;
    subcategoriesScrollStoppedRef.current = false;
    const el = subcategoriesScrollRef.current;
    if (!el || !selectedCategory || subcategoryRootOptions.length === 0) return;
    const ROW_HEIGHT_APPROX = 40;
    const VISIBLE_ROWS = 3;
    const maxVisibleHeight = ROW_HEIGHT_APPROX * VISIBLE_ROWS;
    if (el.scrollHeight <= maxVisibleHeight) return;

    scrollAnimationRanOnceRef.current = true;
    const maxScroll = Math.min(80, el.scrollHeight - el.clientHeight);
    const duration = 2800;
    const hold = 5000;
    let rafId = 0;
    let phase: 'down' | 'hold-down' | 'up' | 'hold-up' = 'down';
    let startTime = 0;
    let startScrollTop = 0;
    const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    const tick = (now: number) => {
      if (subcategoriesScrollStoppedRef.current) return;
      if (phase === 'down') {
        if (startTime === 0) startTime = now;
        const t = Math.min(1, (now - startTime) / duration);
        el.scrollTop = startScrollTop + easeInOutCubic(t) * maxScroll;
        if (t >= 1) {
          phase = 'hold-down';
          startTime = now;
        }
      } else if (phase === 'hold-down') {
        if (now - startTime >= hold) {
          phase = 'up';
          startTime = now;
          startScrollTop = el.scrollTop;
        }
      } else if (phase === 'up') {
        if (startTime === now) startTime = now - 1;
        const t = Math.min(1, (now - startTime) / duration);
        el.scrollTop = startScrollTop + easeInOutCubic(t) * (0 - startScrollTop);
        if (t >= 1) {
          phase = 'hold-up';
          startTime = now;
        }
      } else {
        if (now - startTime >= hold) {
          phase = 'down';
          startTime = 0;
          startScrollTop = 0;
        }
      }
      rafId = requestAnimationFrame(tick);
      subcategoriesScrollRafRef.current = rafId;
    };
    rafId = requestAnimationFrame(tick);
    subcategoriesScrollRafRef.current = rafId;
    return () => cancelAnimationFrame(rafId);
  }, [selectedCategory, subcategoryRootOptions]);

  // La categoría seleccionada ahora es directamente la etiqueta
  const selectedTagAsCategory = selectedCategory || '';
  
  // Obtener sugerencias y destacados para la categoría actual (etiqueta seleccionada)
  // Si hay restaurante seleccionado, usar datos de BD; si no, usar valores por defecto
  const suggestions = chefSuggestions[selectedTagAsCategory] || [];
  const highlights = todayHighlights[selectedTagAsCategory] || [];

  // Solo mostrar sección si hay al menos un producto visible para la categoría/subcategoría actual
  const hasVisibleSuggestions = useMemo(() => {
    return suggestions.some((dishId) => {
      const dish = dishes.find((d) => d.id === dishId);
      if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
      return dishMatchesSubcategory(dish, selectedSubcategory);
    });
  }, [suggestions, dishes, selectedTagAsCategory, selectedSubcategory]);

  const hasVisibleHighlights = useMemo(() => {
    return highlights.some((dishId) => {
      const dish = dishes.find((d) => d.id === dishId);
      if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
      return dishMatchesSubcategory(dish, selectedSubcategory);
    });
  }, [highlights, dishes, selectedTagAsCategory, selectedSubcategory]);

  // Debug: Log para ver qué está pasando con las secciones
  useEffect(() => {
    console.log('[MenuScreen] Debug secciones:', {
      selectedRestaurantId,
      hasLoadedSections,
      selectedCategory,
      selectedTagAsCategory,
      chefSuggestionsKeys: Object.keys(chefSuggestions),
      highlightsKeys: Object.keys(todayHighlights),
      chefSuggestionsByCategoryKeys: Object.keys(chefSuggestionsByCategory),
      highlightsByCategoryKeys: Object.keys(highlightsByCategory),
      chefSuggestionsForCategory: chefSuggestions[selectedTagAsCategory],
      highlightsForCategory: todayHighlights[selectedTagAsCategory],
      suggestions: suggestions.length,
      highlights: highlights.length,
      showSuggestions,
      showHighlights,
      searchQuery: searchQuery.trim(),
      productsCount: products.length
    });
  }, [selectedRestaurantId, hasLoadedSections, selectedCategory, selectedTagAsCategory, chefSuggestions, todayHighlights, chefSuggestionsByCategory, highlightsByCategory, suggestions.length, highlights.length, showSuggestions, showHighlights, searchQuery, products.length]);

  const hasActiveFilters = selectedOrigin !== '';

  const clearFilters = () => {
    setSelectedOrigin('');
    setSearchQuery('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <TopNavbar title="DONK RESTAURANT" showAvatar={true} />
      <div className="sticky top-[73px] z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Categorías (tiles estilo screenshot) */}
        {selectedRestaurantId && displayCategories.length > 0 && (
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                {t('menu.categoriesLabel') || 'Categorías'}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {displayCategories.map((category) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedSubcategory('');
                      setSelectedOrigin('');
                      if (getRootOptionsForCategory(category).length === 0) scrollToMenuSection();
                    }}
                    className={`flex h-[86px] w-[86px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border transition-colors ${
                      isSelected
                        ? 'bg-primary border-primary shadow-md shadow-primary/20'
                        : 'bg-white dark:bg-[#322a1a] border-[#f4f3f0] dark:border-[#3d3321]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[28px] leading-none ${
                        isSelected ? 'text-white' : 'text-primary'
                      }`}
                      aria-hidden
                    >
                      {getCategoryTileIcon(category)}
                    </span>
                    <p className={`text-[11px] leading-tight text-center px-1 ${
                      isSelected ? 'font-bold text-white' : 'font-semibold text-[#181611] dark:text-stone-300'
                    }`}>
                      {category}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Subcategorías 1er Nivel: raíces (ej. Cocteles de Mariscos, Cortes, Aguachiles) */}
        {selectedRestaurantId && selectedCategory && subcategoryRootOptions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <p className="px-4 pt-3 pb-2 text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase shrink-0">
              SELECCIONA SUBCATEGORIA
            </p>
            <div
              ref={subcategoriesScrollRef}
              className="overflow-x-auto no-scrollbar pb-1 px-4 pb-2"
            >
              <div className="flex gap-2">
              {subcategoryRootOptions.map((root) => {
                const isActive = selectedSubcategory === root || selectedSubcategory.startsWith(root + '/');
                return (
                  <button
                    key={root}
                    type="button"
                    onClick={() => {
                      subcategoriesScrollStoppedRef.current = true;
                      if (subcategoriesScrollRafRef.current) {
                        cancelAnimationFrame(subcategoriesScrollRafRef.current);
                        subcategoriesScrollRafRef.current = 0;
                      }
                      const next = selectedSubcategory === root ? '' : root;
                      setSelectedSubcategory(next);
                      setSelectedOrigin('');
                      const hasChildren = next && foodSubcategories.some((s) => s.startsWith(next + '/'));
                      if (next && !hasChildren) scrollToMenuSection();
                    }}
                    className={`flex min-h-[65px] h-auto min-w-[65px] w-auto max-w-[180px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors py-2 px-2 ${
                      isActive
                        ? 'bg-primary border-primary shadow-md shadow-primary/20'
                        : 'bg-white dark:bg-[#322a1a] border-[#f4f3f0] dark:border-[#3d3321]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[21px] leading-none shrink-0 ${
                        isActive ? 'text-white' : 'text-primary'
                      }`}
                      aria-hidden
                    >
                      {getCategoryTileIcon(selectedCategory)}
                    </span>
                    <p className={`text-[10px] leading-tight text-center px-0.5 whitespace-normal ${
                      isActive ? 'font-bold text-white' : 'font-semibold text-[#181611] dark:text-stone-300'
                    }`}>
                      {root}
                    </p>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
        )}
        {/* Subcategorías 2do Nivel: solo hijos de la raíz seleccionada (ej. Camarón, Mixto, Pulpo) */}
        {selectedRestaurantId && selectedCategory && subcategorySecondLevelOptions.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <p className="px-4 pt-3 pb-2 text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase shrink-0">
              SELECCIONA SUBCATEGORIA
            </p>
            <div className="overflow-x-auto no-scrollbar pb-1 px-4 pb-2">
              <div className="flex gap-2">
              {subcategorySecondLevelOptions.map((label) => {
                const fullPath = selectedFirstLevel + '/' + label;
                const isActive = selectedSubcategory === fullPath;
                return (
                  <button
                    key={fullPath}
                    type="button"
                    onClick={() => {
                      subcategoriesScrollStoppedRef.current = true;
                      if (subcategoriesScrollRafRef.current) {
                        cancelAnimationFrame(subcategoriesScrollRafRef.current);
                        subcategoriesScrollRafRef.current = 0;
                      }
                      setSelectedSubcategory(isActive ? selectedFirstLevel : fullPath);
                      setSelectedOrigin('');
                      scrollToMenuSection();
                    }}
                    className={`flex min-h-[65px] h-auto min-w-[65px] w-auto max-w-[180px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border transition-colors py-2 px-2 ${
                      isActive
                        ? 'bg-primary border-primary shadow-md shadow-primary/20'
                        : 'bg-white dark:bg-[#322a1a] border-[#f4f3f0] dark:border-[#3d3321]'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[21px] leading-none shrink-0 ${
                        isActive ? 'text-white' : 'text-primary'
                      }`}
                      aria-hidden
                    >
                      {getCategoryTileIcon(selectedCategory)}
                    </span>
                    <p className={`text-[10px] leading-tight text-center px-0.5 whitespace-normal ${
                      isActive ? 'font-bold text-white' : 'font-semibold text-[#181611] dark:text-stone-300'
                    }`}>
                      {label}
                    </p>
                  </button>
                );
              })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sugerencias del Chef: solo se muestra si hay productos visibles para la categoría/subcategoría actual */}
      {!searchQuery.trim() && showSuggestions && hasVisibleSuggestions && (
        <section
          className={`mx-4 mt-8 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 ${!chefSuggestionsExpanded ? 'min-h-[56px] flex flex-col justify-center py-0' : 'pt-6 pb-4'}`}
        >
          <button
            type="button"
            onClick={() => setChefSuggestionsExpanded((e) => !e)}
            className={`flex w-full justify-between items-center text-left ${chefSuggestionsExpanded ? 'mb-4' : ''}`}
            aria-expanded={chefSuggestionsExpanded}
          >
            <h3 className="text-gray-500 dark:text-gray-400 text-lg font-bold leading-tight tracking-[-0.015em]">{t('menu.chefSuggestions')}</h3>
            <span
              className={`material-symbols-outlined text-gray-500 dark:text-gray-400 transition-transform duration-300 ${chefSuggestionsExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              expand_more
            </span>
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
            style={{ maxHeight: chefSuggestionsExpanded ? '320px' : '0px' }}
          >
            <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
                <div className="flex gap-4">
                  {suggestions.map((dishId) => {
                    const dish = dishes.find(d => d.id === dishId);
                    if (!dish || !selectedCategory || dish.category !== selectedCategory) return null;
                    if (selectedSubcategory && !dishMatchesSubcategory(dish, selectedSubcategory)) return null;
                    return (
                      <div
                        key={dish.id}
                        onClick={() => navigateToDish(dish.id)}
                        className="flex flex-col gap-3 rounded-xl min-w-[200px] max-w-[280px] w-[200px] bg-white dark:bg-gray-900 p-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                      >
                        <div
                          className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-lg flex flex-col relative"
                          style={{ backgroundImage: `url("${dish.image}")` }}
                        >
                          <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">{formatPrice(dish.price, localStorage.getItem('selectedLanguage'))}</div>
                        </div>
                        <div className="px-2 pb-2 flex-1 flex flex-col">
                          <p className="text-[#181611] dark:text-white text-base font-bold leading-tight mb-1 line-clamp-2">{dish.name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">{dish.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
          </div>
        </section>
      )}

      {/* Destacados: solo se muestra si hay productos visibles para la categoría/subcategoría actual */}
      {!searchQuery.trim() && showHighlights && hasVisibleHighlights && (
        <section
          className={`mx-4 mt-2 mb-8 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 ${!highlightsExpanded ? 'min-h-[56px] flex flex-col justify-center py-0' : 'pb-4'}`}
        >
          <button
            type="button"
            onClick={() => setHighlightsExpanded((e) => !e)}
            className={`flex w-full justify-between items-center text-left ${highlightsExpanded ? 'pb-2' : ''}`}
            aria-expanded={highlightsExpanded}
          >
            <h3 className="text-gray-500 dark:text-gray-400 text-lg font-bold leading-tight tracking-[-0.015em]">{t('menu.highlights')}</h3>
            <span
              className={`material-symbols-outlined text-gray-500 dark:text-gray-400 transition-transform duration-300 ${highlightsExpanded ? 'rotate-180' : ''}`}
              aria-hidden
            >
              expand_more
            </span>
          </button>
          <div
            className="overflow-hidden transition-[max-height] duration-500 ease-in-out"
            style={{ maxHeight: highlightsExpanded ? '1200px' : '0px' }}
          >
            <div className="flex flex-col gap-3">
                {highlights.map((dishId) => {
                  const dish = dishes.find(d => d.id === dishId);
                  if (!dish || !selectedCategory || dish.category !== selectedCategory) return null;
                  if (selectedSubcategory && !dishMatchesSubcategory(dish, selectedSubcategory)) return null;
                  return (
                    <div
                      key={dish.id}
                      onClick={() => navigateToDish(dish.id)}
                      className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                    >
                      <div
                        className="size-16 rounded-lg bg-cover bg-center shrink-0"
                        style={{ backgroundImage: `url("${dish.image}")` }}
                      />
                      <div className="flex-1">
                        <p className="font-bold dark:text-white">{dish.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{dish.description}</p>
                      </div>
                      <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                    </div>
                  );
                })}
              </div>
          </div>
        </section>
      )}

      {/* Search Input - después de Destacados, antes de Menú */}
      <div className="px-4 pt-2 pb-3">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Backspace' || e.key === 'Delete') playBackspaceSound();
              else if (e.key.length === 1) playClickSound();
            }}
            placeholder={t('menu.searchPlaceholder') || 'Buscar productos...'}
            className="w-full h-12 pl-12 pr-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 text-[#181511] dark:text-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Menu List - ref para scroll suave al elegir categoría/subcategoría */}
      <section ref={menuSectionRef} className="px-4 pb-4 scroll-mt-[80px]">
        <div className="flex items-center gap-2 pb-3">
          <span className="material-symbols-outlined text-[#181611] dark:text-white text-xl">restaurant_menu</span>
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{t('navigation.menu')}</h3>
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
                {searchQuery || hasActiveFilters ? 'search_off' : 'restaurant_menu'}
              </span>
              <p className="text-sm text-center">
                {searchQuery || hasActiveFilters 
                  ? t('menu.noDishesFound')
                  : t('menu.noDishesInCategory')}
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


      {/* Modal de Filtros */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181611] dark:text-white">{t('menu.filtersLabel')}</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Filtro por Origen */}
              <div>
                <label className="block text-sm font-semibold text-[#181611] dark:text-white mb-3">
                  {t('menu.proteinOrigin')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {getFiltersForCategory(selectedCategory).map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedOrigin(selectedOrigin === filter.value ? '' : filter.value as OriginType)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedOrigin === filter.value
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-2xl ${
                          selectedOrigin === filter.value
                            ? 'text-primary'
                            : 'text-[#181611] dark:text-white'
                        }`}>
                          {filter.icon}
                        </span>
                        <span className={`font-bold text-sm ${
                          selectedOrigin === filter.value
                            ? 'text-primary'
                            : 'text-[#181611] dark:text-white'
                        }`}>
                          {t(getFilterTranslationKey(filter.value))}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Indicador de filtros activos */}
              {(hasActiveFilters || searchQuery) && (
                <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm">info</span>
                    <p className="text-sm text-[#181611] dark:text-white">
                      {searchQuery ? `Buscando: "${searchQuery}"` : ''}
                      {searchQuery && hasActiveFilters ? ' • ' : ''}
                      {hasActiveFilters ? `Filtro: ${t(getFilterTranslationKey(selectedOrigin))}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors"
                  >
                    {t('menu.clear')}
                  </button>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('menu.clear')}
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('menu.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuScreen;
