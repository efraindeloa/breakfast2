import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

type OriginType = 'mar' | 'tierra' | 'aire' | 'vegetariano' | 'vegano' | '';

const MenuScreen: React.FC = () => {
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  
  const getCartQuantity = (dishId: number) => {
    return cart.filter(item => item.id === dishId).reduce((sum, item) => sum + item.quantity, 0);
  };
  const [selectedCategory, setSelectedCategory] = useState('Entradas');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');

  const categories = ['Entradas', 'Platos Fuertes', 'Bebidas', 'Postres', 'Coctelería'];
  const originFilters = [
    { value: 'tierra' as OriginType, label: 'Tierra', icon: 'agriculture' },
    { value: 'mar' as OriginType, label: 'Mar', icon: 'waves' },
    { value: 'aire' as OriginType, label: 'Aire', icon: 'air' },
    { value: 'vegetariano' as OriginType, label: 'Vegetariano', icon: 'local_florist' },
    { value: 'vegano' as OriginType, label: 'Vegano', icon: 'eco' },
  ];

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
    {
      id: 13,
      name: 'Mojito Clásico',
      description: 'Ron, menta fresca, lima y soda',
      price: '$12.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBl3ebO1ujNI2cOt7UgQdU8SBRtMR8VhdFwNdN59-vspiJ1f8ivS0OfXv2Knxc2MkrIH6MAlxm-M00xznZUf4LoCcfkvT61ReVoXM1vgtDq-uakVsGbq6l0XnwrJZrDmhska0ppqrM7n_0eeMy2kVPZlncMY-dH96vspvzCNxvVq4fMjkhdc6YHH2KSOGs30HzAg7BKUN_yH9zNsShcYolnKYWwDl58zPH7e3p5WNDRev80tNxWjaFcb85bqInoEDqBvgWW_4SM6vQ0',
      category: 'Coctelería',
      origin: '' as OriginType,
    },
    {
      id: 14,
      name: 'Margarita Premium',
      description: 'Tequila reposado, triple sec y jugo de lima',
      price: '$14.00',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDWnQaozBCDFMuLKN0rR3j7FcCFRss_DwkvNlFGFSK_IgZiDHMNdhF2FeIYkQ-UrhgHO19I56PLGdIQyK06gaN3RF_PwwSd4H_eOkoloKHfIATMn1ydzlSxmwXWRUTNWYQKWPWmvcwo5co6c1mE9RlFTzFSp2ItqmEHHbIHHnaJI0wINTn8aajX_E1CIYDwOo_K0e1AQbFpXKmqeOGGK2xOGpVWpZVYB9Ac5aKaPujYO73FMNCojATPJD9YTeFs7NeZexnDGCWdrB8D',
      category: 'Coctelería',
      origin: '' as OriginType,
    },
  ];

  // Sugerencias del Chef por categoría
  const chefSuggestions: Record<string, number[]> = {
    'Entradas': [1, 2, 5, 4],
    'Platos Fuertes': [3, 6, 7, 8],
    'Bebidas': [9, 10],
    'Postres': [11, 12],
    'Coctelería': [13, 14],
  };

  // Destacados de hoy por categoría
  const todayHighlights: Record<string, number[]> = {
    'Entradas': [1, 2],
    'Platos Fuertes': [3, 7],
    'Bebidas': [9],
    'Postres': [11],
    'Coctelería': [13],
  };

  // Filtrar platos por categoría, búsqueda y origen
  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      // Filtro por categoría
      if (dish.category !== selectedCategory) return false;
      
      // Filtro por búsqueda
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = dish.name.toLowerCase().includes(query);
        const matchesDescription = dish.description.toLowerCase().includes(query);
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

  const suggestions = chefSuggestions[selectedCategory] || [];
  const highlights = todayHighlights[selectedCategory] || [];

  const hasActiveFilters = selectedOrigin !== '';

  const clearFilters = () => {
    setSelectedOrigin('');
    setSearchQuery('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex items-center gap-2">
            <div className="text-primary flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="material-symbols-outlined">restaurant_menu</span>
            </div>
            <h1 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Don Kamaron Restaurant</h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(true)}
              className={`flex size-10 items-center justify-center rounded-full bg-white dark:bg-[#322a1a] shadow-sm border border-[#f4f3f0] dark:border-[#3d3321] relative ${hasActiveFilters ? 'text-primary' : ''}`}
              title="Filtros"
            >
              <span className="material-symbols-outlined">filter_list</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>
          </div>
        </div>
        
        {/* Categories Chips */}
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
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
      {suggestions.length > 0 && (
        <section className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">Sugerencias del Chef</h3>
          </div>
          
          <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            <div className="flex items-stretch gap-4">
              {suggestions.map((dishId) => {
                const dish = dishes.find(d => d.id === dishId);
                if (!dish) return null;
                return (
                  <div 
                    key={dish.id}
                    onClick={() => navigate(`/dish/${dish.id}`)}
                    className="flex h-full flex-1 flex-col gap-3 rounded-xl min-w-[280px] max-w-[280px] bg-white dark:bg-gray-900 p-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                  >
                    <div 
                      className="w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-lg flex flex-col relative" 
                      style={{ backgroundImage: `url("${dish.image}")` }}
                    >
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">{dish.price}</div>
                    </div>
                    <div className="px-2 pb-2">
                      <p className="text-[#181611] dark:text-white text-base font-bold leading-normal">{dish.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">{dish.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Destacados de hoy */}
      {highlights.length > 0 && (
        <section className="px-4 pb-4">
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2">Destacados de hoy</h3>
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
                    <p className="font-bold dark:text-white">{dish.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{dish.description}</p>
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
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">Menú</h3>
        </div>
        
        {/* Origin Filters Chips */}
        <div className="flex gap-2 pb-4 overflow-x-auto no-scrollbar">
          {originFilters.map((filter) => (
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
                {filter.label}
              </span>
            </button>
          ))}
          {selectedOrigin && (
            <button
              onClick={() => setSelectedOrigin('')}
              className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-full px-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              title="Limpiar filtro"
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
              onClick={() => navigate(`/dish/${dish.id}`)}
              className="group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform active:scale-[0.98] cursor-pointer"
            >
            <div className="flex flex-[2_2_0px] flex-col justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-[#181611] dark:text-white text-base font-bold leading-tight">{dish.name}</p>
                  {dish.badges?.includes('vegano') && (
                    <span className="material-symbols-outlined text-xs text-green-500" title="Vegano">eco</span>
                  )}
                  {dish.badges?.includes('especialidad') && (
                    <span className="material-symbols-outlined text-xs text-orange-500" title="Especialidad">star</span>
                  )}
                </div>
                <p className="text-[#897c61] dark:text-stone-400 text-sm font-normal leading-snug">{dish.description}</p>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const price = parseFloat(dish.price.replace('$', ''));
                    addToCart({
                      id: dish.id,
                      name: dish.name,
                      price: price,
                      notes: '',
                    });
                  }}
                  className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors active:scale-95"
                  title="Agregar a la orden"
                >
                  <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  {getCartQuantity(dish.id) > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {getCartQuantity(dish.id)}
                    </span>
                  )}
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
                  ? 'No se encontraron platos con los filtros aplicados'
                  : 'No hay platos disponibles en esta categoría'}
              </p>
              {(searchQuery || hasActiveFilters) && (
                <button
                  onClick={clearFilters}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm"
                >
                  Limpiar filtros
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
              <h3 className="text-xl font-bold text-[#181611] dark:text-white">Filtros</h3>
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
                  Origen de la Proteína
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {originFilters.map((filter) => (
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
                          {filter.label}
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
                      {hasActiveFilters ? `Filtro: ${originFilters.find(f => f.value === selectedOrigin)?.label}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={clearFilters}
                    className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuScreen;
