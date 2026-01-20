import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';

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
  
  const [selectedCategory, setSelectedCategory] = useState(t('menu.categories.appetizers'));
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');
  const [showSuggestions, setShowSuggestions] = useState(() => {
    const saved = localStorage.getItem('showSuggestions');
    return saved === 'true';
  });
  const [showHighlights, setShowHighlights] = useState(() => {
    const saved = localStorage.getItem('showHighlights');
    return saved === 'true';
  });

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

  // Mapeo de categorías en español a traducciones
  const categoryMap: Record<string, string> = {
    'Entradas': t('menu.categories.appetizers'),
    'Platos Fuertes': t('menu.categories.mains'),
    'Bebidas': t('menu.categories.drinks'),
    'Postres': t('menu.categories.desserts'),
    'Coctelería': t('menu.categories.cocktails')
  };
  
  const categories = [
    t('menu.categories.appetizers'),
    t('menu.categories.mains'),
    t('menu.categories.drinks'),
    t('menu.categories.desserts'),
    t('menu.categories.cocktails')
  ];
  
  // Función para obtener la categoría original en español desde la traducción
  const getOriginalCategory = (translatedCategory: string): string => {
    for (const [original, translated] of Object.entries(categoryMap)) {
      if (translated === translatedCategory) return original;
    }
    return translatedCategory;
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
        { value: 'alcoholic' as OriginType, icon: 'wine_bar' },
        { value: 'non-alcoholic' as OriginType, icon: 'water_drop' },
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
      'rum': 'menu.filters.rum',
      'vodka': 'menu.filters.vodka',
      'tequila': 'menu.filters.tequila',
      'gin': 'menu.filters.gin',
    };
    return keyMap[value] || '';
  };

  const dishes = [
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
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      category: 'Bebidas',
      origin: '' as OriginType,
    },
    {
      id: 10,
      name: 'Jugo de Naranja Natural',
      description: 'Recién exprimido, rico en vitamina C',
      price: '$6.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      category: 'Bebidas',
      origin: '' as OriginType,
    },
    {
      id: 11,
      name: 'Tarta de Chocolate',
      description: 'Deliciosa tarta con cobertura de chocolate belga',
      price: '$8.50',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: '' as OriginType,
    },
    {
      id: 12,
      name: 'Flan de Vainilla',
      description: 'Tradicional flan casero con caramelo',
      price: '$7.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgxagxlshYO2auuogSyw7OhNdc7J8dbVtovgy1mx2QnTHrkMM2grGKiD5FOKoTvHJCxaf3o2IELhRAX9KuZmf3PSo_hZMFmXbeQpucwaZ41LUFYyamXCfCpGD8b3ysaoiUZmN_hQx3AB0zC0PVC5YeERx23oMBXNH-Bix9Tpdb9CNzdIliDef0s4xZn5I_BDf46Q_4zQliQOmvnxglHcpo1lGW6PGIGHletH7NmXDLi-rmVLzUYaOOr3OZJFOHTy4bsX4Sb8uyCMTC',
      category: 'Postres',
      origin: '' as OriginType,
    },
    // CAFÉ - Bebidas
    {
      id: 15,
      name: 'Americano',
      description: '180 ml - NESPRESSO',
      price: '$48.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 16,
      name: 'Espresso',
      description: '60 ml - NESPRESSO',
      price: '$48.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 17,
      name: 'Capuchino',
      description: '180 ml - NESPRESSO. Opciones: Napolitano, baileys, vainilla',
      price: '$60.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 18,
      name: 'Frapuccino',
      description: '180 ml - NESPRESSO',
      price: '$70.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    {
      id: 19,
      name: 'Té',
      description: 'Opciones: Hierbabuena / Manzanilla',
      price: '$35.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      category: 'Bebidas',
      origin: 'cafe' as OriginType,
    },
    // DIGESTIVOS - Coctelería
    {
      id: 20,
      name: 'Carajillo',
      description: 'Café con licor 43',
      price: '$145.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 21,
      name: 'Coketillo',
      description: 'Carajillo con paleta de chocomilk',
      price: '$160.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 22,
      name: 'Carajilla',
      description: 'Café con Baileys',
      price: '$145.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 23,
      name: 'Licor 43',
      description: '700 ml - Porción: $140.00 / Botella: $1,400.00',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 24,
      name: 'Baileys',
      description: '700 ml - Porción: $120.00 / Botella: $1,200.00',
      price: '$120.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 25,
      name: 'Frangelico',
      description: '700 ml - Porción: $120.00 / Botella: $1,200.00',
      price: '$120.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 26,
      name: 'Sambuca',
      description: '700 ml - Porción: $100.00 / Botella: $1,000.00',
      price: '$100.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 27,
      name: 'Chinchón Seco',
      description: '1000 ml - Porción: $95.00 / Botella: $950.00',
      price: '$95.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    {
      id: 28,
      name: 'Chinchón Dulce',
      description: '1000 ml - Porción: $95.00 / Botella: $950.00',
      price: '$95.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: 'digestivos' as OriginType,
    },
    // POSTRES
    {
      id: 29,
      name: 'Volcán',
      description: 'Con una textura única, firme por fuera, suave por dentro, acompañado de helado. Opciones: Dulce de leche o chocolate',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      badges: ['favorito'],
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 30,
      name: 'Cheesecake Vasco',
      description: 'Cremoso pay de natilla montado sobre cama de galleta horneada y bañado con mermelada de frutos rojos. (200 g.)',
      price: '$190.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: 'pay_de_queso' as OriginType,
    },
    {
      id: 31,
      name: 'Pan de Elote',
      description: 'Recién horneado, sobre una cama de mermelada, frutos rojos, helado de vainilla, bañado con dulce de cajeta y nuez. (200 g.)',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 32,
      name: 'Cheesecake Lotus',
      description: 'Pay de queso con la autentica galleta "Lotus Biscoff", bañado con mezcla de leches, acompañado de frutos rojos.',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: 'pay_de_queso' as OriginType,
    },
    {
      id: 33,
      name: 'Pastel 3 Leches',
      description: 'Delicioso pan de vainilla, con trozos de durazno, bañado con mezcla de 3 leches, con frutos rojos y nuez.',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
    {
      id: 34,
      name: 'Red Velvet',
      description: 'Pan de red velvet con sabor a chocolate oscuro y betún de queso crema. Coronado con fresa natural.',
      price: '$140.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUigKouglXyIq_ACMY9WY_F0yVW9Vym8tjU4zH4OTK3YugWcVhKXt3EPX6ap2ho7wC858pu7p4ytDeEeR2IoD6-hliBXF1DXiVtqywF6FjOlQI2uW_C0pUb3JwKjGpiwt5Qs1TKsZL-Do7VzTSY_GCy0ZR2bVawIf6NK_-x4mNOCxmOjCmKTlgFDiStnfBcCRQws0BgRl1y3YIOqH4G5QwQiKFnv9SjvF_W-wCWTfIC2CWGgUMLkskr3CuJXPdT3sWS1C8Ulg2pfEz',
      category: 'Postres',
      origin: 'pastel' as OriginType,
    },
  ];

  // Sugerencias del Chef por categoría
  const chefSuggestions: Record<string, number[]> = {
    'Entradas': [1, 2, 5, 4],
    'Platos Fuertes': [3, 6, 7, 8],
    'Bebidas': [15, 16, 17, 18, 19],
    'Postres': [29, 30, 31, 32, 33, 34],
    'Coctelería': [20, 21, 22, 23, 24],
  };

  // Destacados de hoy por categoría
  const todayHighlights: Record<string, number[]> = {
    'Entradas': [1, 2],
    'Platos Fuertes': [3, 7],
    'Bebidas': [15],
    'Postres': [29],
    'Coctelería': [20],
  };

  // Filtrar platos por categoría, búsqueda y origen
  const filteredDishes = useMemo(() => {
    const originalCategory = getOriginalCategory(selectedCategory);
    return dishes.filter(dish => {
      // Filtro por categoría
      if (dish.category !== originalCategory) return false;
      
      // Filtro por búsqueda (usando traducciones)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const translatedName = getDishName(dish.id).toLowerCase();
        const translatedDescription = getDishDescription(dish.id).toLowerCase();
        const matchesName = translatedName.includes(query);
        const matchesDescription = translatedDescription.includes(query);
        if (!matchesName && !matchesDescription) return false;
      }
      
      // Filtro por origen
      if (selectedOrigin) {
        if (selectedOrigin === 'vegano') {
          // Para vegano, verificar si tiene el badge 'vegano'
          if (!dish.badges || !dish.badges.includes('vegano')) return false;
        } else {
          // Para otros orígenes, verificar el campo origin
          if (dish.origin !== selectedOrigin) return false;
        }
      }
      
      return true;
    });
  }, [selectedCategory, searchQuery, selectedOrigin, dishes]);

  const originalCategory = getOriginalCategory(selectedCategory);
  const suggestions = chefSuggestions[originalCategory] || [];
  const highlights = todayHighlights[originalCategory] || [];

  const hasActiveFilters = selectedOrigin !== '';

  const clearFilters = () => {
    setSelectedOrigin('');
    setSearchQuery('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md safe-top">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full overflow-hidden bg-white p-1">
              <img 
                src="/logo-donk-restaurant.png" 
                alt="DONK RESTAURANT"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    const fallback = document.createElement('div');
                    fallback.className = 'text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10';
                    fallback.innerHTML = '<span class="material-symbols-outlined">restaurant_menu</span>';
                    target.parentElement.appendChild(fallback);
                  }
                }}
              />
            </div>
            <h1 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">DONK RESTAURANT</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/favorites')}
              className="relative flex size-10 items-center justify-center rounded-full bg-white dark:bg-[#322a1a] shadow-sm border border-[#f4f3f0] dark:border-[#3d3321] hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              title={t('navigation.favorites')}
            >
              <span className="material-symbols-outlined text-[24px] text-gray-600 dark:text-gray-300">
                {favoriteDishes.length > 0 ? 'favorite' : 'favorite_border'}
              </span>
              {favoriteDishes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {favoriteDishes.length > 9 ? '9+' : favoriteDishes.length}
                </span>
              )}
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className={`flex size-10 items-center justify-center rounded-full bg-white dark:bg-[#322a1a] shadow-sm border transition-colors ${
                location.pathname === '/profile' || location.pathname.includes('billing')
                  ? 'border-primary bg-primary/10'
                  : 'border-[#f4f3f0] dark:border-[#3d3321]'
              }`}
              title={t('navigation.profile')}
            >
              <span className={`material-symbols-outlined ${
                location.pathname === '/profile' || location.pathname.includes('billing')
                  ? 'text-primary'
                  : 'text-gray-600 dark:text-gray-300'
              }`}>person</span>
            </button>
          </div>
        </div>
        
        {/* Categories Chips */}
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                // Limpiar el filtro cuando se cambia de categoría
                setSelectedOrigin('');
              }}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${
                selectedCategory === category
                  ? 'bg-primary shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-[#322a1a] border border-[#f4f3f0] dark:border-[#3d3321]'
              }`}
            >
              <p className={`text-sm font-${selectedCategory === category ? 'semibold' : 'medium'} ${
                selectedCategory === category
                  ? 'text-white'
                  : 'text-[#181611] dark:text-stone-300'
              }`}>
                {category}
              </p>
            </button>
          ))}
        </div>
      </header>

      {/* Sugerencias del Chef */}
      {showSuggestions && suggestions.length > 0 && (
        <section className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">{t('menu.chefSuggestions')}</h3>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            <div className="flex gap-4">
              {suggestions.map((dishId) => {
                const dish = dishes.find(d => d.id === dishId);
                if (!dish) return null;
                return (
                  <div 
                    key={dish.id}
                    onClick={() => navigate(`/dish/${dish.id}`)}
                    className="flex flex-col gap-3 rounded-xl min-w-[200px] max-w-[280px] w-[200px] bg-white dark:bg-gray-900 p-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                  >
                    <div 
                      className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-lg flex flex-col relative" 
                      style={{ backgroundImage: `url("${dish.image}")` }}
                    >
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">{dish.price}</div>
                    </div>
                    <div className="px-2 pb-2 flex-1 flex flex-col">
                      <p className="text-[#181611] dark:text-white text-base font-bold leading-tight mb-1 line-clamp-2">{getDishName(dish.id)}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">{getDishDescription(dish.id)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Destacados */}
      {showHighlights && highlights.length > 0 && (
        <section className="px-4 pb-4">
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2">{t('menu.highlights')}</h3>
          <div className="flex flex-col gap-3">
            {highlights.map((dishId) => {
              const dish = dishes.find(d => d.id === dishId);
              if (!dish) return null;
              return (
                <div 
                  key={dish.id}
                  onClick={() => navigate(`/dish/${dish.id}`)}
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div 
                    className="size-16 rounded-lg bg-cover bg-center shrink-0" 
                    style={{ backgroundImage: `url("${dish.image}")` }}
                  />
                  <div className="flex-1">
                    <p className="font-bold dark:text-white">{getDishName(dish.id)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getDishDescription(dish.id)}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Menu List */}
      <section className="px-4 pb-4">
        <div className="flex items-center gap-2 pb-3">
          <span className="material-symbols-outlined text-[#181611] dark:text-white text-xl">restaurant_menu</span>
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">{t('navigation.menu')}</h3>
        </div>
        
        {/* Origin Filters Chips */}
        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {getFiltersForCategory(selectedCategory).map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedOrigin(selectedOrigin === filter.value ? '' : filter.value)}
              className={`flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 transition-all ${
                selectedOrigin === filter.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-[#322a1a] border border-[#f4f3f0] dark:border-[#3d3321] text-[#181611] dark:text-stone-300'
              }`}
            >
              <span className={`material-symbols-outlined text-base ${
                selectedOrigin === filter.value ? 'text-white' : 'text-primary'
              }`}>
                {filter.icon}
              </span>
              <span className={`text-xs font-medium ${
                selectedOrigin === filter.value ? 'text-white' : 'text-[#181611] dark:text-stone-300'
              }`}>
                {t(getFilterTranslationKey(filter.value))}
              </span>
            </button>
          ))}
          {selectedOrigin && (
            <button
              onClick={() => setSelectedOrigin('')}
              className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  title={t('menu.clearFilter')}
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          {filteredDishes.length > 0 ? (
            filteredDishes.map((dish) => (
            <div
              key={dish.id}
              onClick={() => {
                navigate(`/dish/${dish.id}`);
              }}
              className="group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform active:scale-[0.98] cursor-pointer"
            >
            <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-[#181611] dark:text-white text-base font-bold leading-tight">{getDishName(dish.id)}</p>
                  {dish.badges?.includes('vegano') && (
                    <span className="material-symbols-outlined text-xs text-green-500" title={t('menu.badges.vegan')}>eco</span>
                  )}
                  {dish.badges?.includes('especialidad') && (
                    <span className="material-symbols-outlined text-xs text-orange-500" title={t('menu.badges.specialty')}>star</span>
                  )}
                </div>
                <p className="text-[#897c61] dark:text-stone-400 text-sm font-normal leading-snug">{getDishDescription(dish.id)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dish/${dish.id}`);
                  }}
                  className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-8 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                >
                  <span className="truncate">{dish.price}</span>
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
