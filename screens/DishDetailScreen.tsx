import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';

const REVIEWS_STORAGE_KEY = 'user_reviews';

interface Review {
  id: string;
  orderId: string;
  type: 'experience' | 'dish';
  itemId?: number;
  itemName?: string;
  rating: number;
  chips: string[];
  comment: string;
  media: string[];
  timestamp: string;
  updatedAt?: string;
}

type OriginType = 'mar' | 'tierra' | 'aire' | 'vegetariano' | 'vegano' | '';

interface Dish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  badges?: string[];
  category: string;
  origin: OriginType;
}

// Datos de ejemplo - en producción vendrían de una API o contexto
export const allDishes: Dish[] = [
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

const DishDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { cart, addToCart } = useCart();
  const { t } = useTranslation();
  const { isFavorite: checkIsFavorite, addFavorite, removeFavorite } = useFavorites();
  const [quantity, setQuantity] = useState(1);
  const [selectedProtein, setSelectedProtein] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<'portion' | 'bottle' | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [showAddedFeedback, setShowAddedFeedback] = useState(false);

  const dish = allDishes.find(d => d.id === parseInt(id || '0'));
  
  // Verificar si el platillo es favorito
  const isFavorite = dish ? checkIsFavorite(dish.id) : false;

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

  // Función para extraer información de porción/botella de la descripción
  const parseSizeOptions = (description: string): { hasSizes: boolean; portionPrice: number | null; bottlePrice: number | null; volume?: string } => {
    // Buscar patrón: "XXX ml - Porción: $XXX.XX / Botella: $X,XXX.XX"
    const portionMatch = description.match(/Porción:\s*\$\s*([\d,]+\.?\d*)/i);
    const bottleMatch = description.match(/Botella:\s*\$\s*([\d,]+\.?\d*)/i);
    const volumeMatch = description.match(/(\d+\s*ml)/i);

    if (portionMatch && bottleMatch) {
      const portionPrice = parseFloat(portionMatch[1].replace(/,/g, ''));
      const bottlePrice = parseFloat(bottleMatch[1].replace(/,/g, ''));
      const volume = volumeMatch ? volumeMatch[1] : undefined;

      return {
        hasSizes: true,
        portionPrice,
        bottlePrice,
        volume
      };
    }

    return { hasSizes: false, portionPrice: null, bottlePrice: null };
  };

  // Obtener opciones de tamaño si existen
  const dishDescription = dish ? (getDishDescription(dish.id) || dish.description) : '';
  const sizeOptions = parseSizeOptions(dishDescription);

  // Cargar reviews del producto y calcular promedio
  const productRating = useMemo(() => {
    if (!dish) return null;

    try {
      const reviewsData = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (reviewsData) {
        const allReviews: Review[] = JSON.parse(reviewsData);
        const productReviews = allReviews.filter(r => r.type === 'dish' && r.itemId === dish.id);
        
        if (productReviews.length === 0) return null;

        const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
        const average = total / productReviews.length;
        
        return {
          average: Math.round(average * 10) / 10, // Redondear a 1 decimal
          count: productReviews.length
        };
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    return null;
  }, [dish]);

  // Scroll al inicio cuando se carga la página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Función helper para regresar al menú preservando el estado
  const navigateBackToMenu = () => {
    const savedState = location.state || {
      selectedCategory: sessionStorage.getItem('menuSelectedCategory'),
      scrollPosition: sessionStorage.getItem('menuScrollPosition')
    };
    
    navigate('/menu', {
      state: savedState
    });
  };

  // Si no se encuentra el plato, redirigir al menú (usando useEffect para evitar warning)
  useEffect(() => {
    if (!dish) {
      navigateBackToMenu();
    }
  }, [dish]);

  // Si no hay platillo, retornar null
  if (!dish) {
    return null;
  }
  
  // Inicializar selectedSize si hay opciones y no está seleccionado
  useEffect(() => {
    if (sizeOptions.hasSizes && selectedSize === null) {
      setSelectedSize('portion'); // Por defecto seleccionar porción
    }
  }, [sizeOptions.hasSizes, selectedSize]);

  const proteins = [
    { id: 'huevo', name: 'Huevo Estrellado (2)', price: 35 },
    { id: 'pollo', name: 'Pollo Deshebrado', price: 45 },
    { id: 'arrachera', name: 'Arrachera Grill', price: 85 },
  ];

  // Calcular precio total
  let basePrice = parseFloat(dish.price.replace('$', ''));
  
  // Si hay opciones de tamaño, usar el precio según la selección
  if (sizeOptions.hasSizes) {
    if (selectedSize === 'bottle' && sizeOptions.bottlePrice !== null) {
      basePrice = sizeOptions.bottlePrice;
    } else if (selectedSize === 'portion' && sizeOptions.portionPrice !== null) {
      basePrice = sizeOptions.portionPrice;
    }
  }
  
  const proteinPrice = selectedProtein ? proteins.find(p => p.id === selectedProtein)?.price || 0 : 0;
  const totalPrice = (basePrice + proteinPrice) * quantity;

  const handleQuantityChange = (delta: number) => {
    setQuantity(Math.max(1, quantity + delta));
  };

  const handleAddToOrder = () => {
    // Calcular precio total
    let basePrice = parseFloat(dish.price.replace('$', ''));
    
    // Si hay opciones de tamaño, usar el precio según la selección
    if (sizeOptions.hasSizes) {
      if (selectedSize === 'bottle' && sizeOptions.bottlePrice !== null) {
        basePrice = sizeOptions.bottlePrice;
      } else if (selectedSize === 'portion' && sizeOptions.portionPrice !== null) {
        basePrice = sizeOptions.portionPrice;
      }
    }
    
    const proteinPrice = selectedProtein ? proteins.find(p => p.id === selectedProtein)?.price || 0 : 0;
    const finalPrice = basePrice + proteinPrice;
    
    // Construir notas con tamaño, proteína e instrucciones especiales
    let notes = '';
    
    // Agregar tamaño si está seleccionado
    if (sizeOptions.hasSizes && selectedSize) {
      if (selectedSize === 'portion') {
        notes += t('dishDetail.portion');
      } else if (selectedSize === 'bottle') {
        notes += t('dishDetail.bottle');
      }
    }
    
    if (selectedProtein) {
      const proteinName = proteins.find(p => p.id === selectedProtein)?.name || '';
      if (notes) notes += '. ';
      notes += proteinName;
    }
    
    if (specialInstructions) {
      if (notes) notes += '. ';
      notes += specialInstructions;
    }
    
    // Agregar la cantidad seleccionada al carrito
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: dish.id,
        name: getDishName(dish.id),
        price: finalPrice,
        notes: notes,
      });
    }
    
    // Regresar al menú después de agregar preservando el estado
    navigateBackToMenu();
  };

  const cartQuantity = cart.filter(item => item.id === dish.id).reduce((sum, item) => sum + item.quantity, 0);

  // Obtener icono según el origen
  const getOriginIcon = (origin: OriginType) => {
    switch (origin) {
      case 'mar': return 'waves';
      case 'tierra': return 'agriculture';
      case 'aire': return 'air';
      case 'vegetariano': return 'local_florist';
      default: return null;
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col pb-32">
      {/* Header con imagen */}
      <div className="relative w-full aspect-[4/3] overflow-hidden">
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: `url("${dish.image}")` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
        </div>
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
          <button
            onClick={() => navigateBackToMenu()}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (dish) {
                  if (isFavorite) {
                    removeFavorite(dish.id);
                  } else {
                    addFavorite({
                      id: dish.id,
                      name: dish.name,
                      description: dish.description,
                      price: dish.price,
                      image: dish.image,
                      category: dish.category,
                      origin: dish.origin,
                      badges: dish.badges,
                    });
                  }
                }
              }}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-red-500/90 text-white'
                  : 'bg-black/30 text-white hover:bg-black/50'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
                favorite
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/product-reviews/${dish?.id}`, { state: { productId: dish?.id, productName: dish?.name } });
              }}
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors"
              title={t('dishDetail.viewReviews') || 'Ver opiniones'}
            >
              <span className="material-symbols-outlined">reviews</span>
            </button>
          </div>
        </div>

        {/* Badges flotantes */}
        {dish.badges && dish.badges.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
            {dish.badges.includes('vegano') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-md text-white text-xs font-bold">
                <span className="material-symbols-outlined text-sm">eco</span>
                {t('dishDetail.vegan')}
              </div>
            )}
            {dish.badges.includes('especialidad') && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/90 backdrop-blur-md text-white text-xs font-bold">
                <span className="material-symbols-outlined text-sm">star</span>
                {t('dishDetail.specialty')}
              </div>
            )}
          </div>
        )}
      </div>

      <main className="flex-1 -mt-6 bg-background-light dark:bg-background-dark rounded-t-3xl relative z-10">
        <div className="px-4 pt-6 pb-4">
          {/* Nombre y Precio */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[#181611] dark:text-white leading-tight mb-2">
                {getDishName(dish.id)}
              </h1>
              {/* Calificación con estrellas */}
              {productRating && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-0.5 text-primary">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <span
                        key={value}
                        className={`material-symbols-outlined text-sm ${
                          value <= Math.round(productRating.average) ? 'fill-icon' : ''
                        }`}
                        style={{ fontVariationSettings: value <= Math.round(productRating.average) ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-semibold text-[#181611] dark:text-white">
                    {productRating.average.toFixed(1)}
                  </span>
                  <button
                    onClick={() => navigate(`/product-reviews/${dish.id}`, { state: { productId: dish.id, productName: dish.name } })}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors underline"
                  >
                    ({productRating.count} {productRating.count === 1 ? t('productReviews.review') || 'reseña' : t('productReviews.reviews') || 'reseñas'})
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                {dish.origin && getOriginIcon(dish.origin) && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    <span className="material-symbols-outlined text-sm">{getOriginIcon(dish.origin)}</span>
                    {dish.origin === 'mar' && t('dishDetail.fromSea')}
                    {dish.origin === 'tierra' && t('dishDetail.fromLand')}
                    {dish.origin === 'aire' && t('dishDetail.fromAir')}
                    {dish.origin === 'vegetariano' && t('dishDetail.vegetarian')}
                  </div>
                )}
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                  <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                  {dish.category}
                </div>
                {cartQuantity > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                    {cartQuantity} {t('dishDetail.inCart')}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              {sizeOptions.hasSizes && selectedSize ? (
                <div>
                  {selectedSize === 'portion' && sizeOptions.portionPrice !== null && (
                    <p className="text-2xl font-bold text-primary">${sizeOptions.portionPrice.toFixed(2)}</p>
                  )}
                  {selectedSize === 'bottle' && sizeOptions.bottlePrice !== null && (
                    <p className="text-2xl font-bold text-primary">${sizeOptions.bottlePrice.toFixed(2)}</p>
                  )}
                </div>
              ) : (
                <p className="text-2xl font-bold text-primary">{dish.price}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
            {getDishDescription(dish.id)}
          </p>

          {/* Personalización */}
          <div className="space-y-6 mb-6">
            {/* Selección de Tamaño - Solo para bebidas con opciones de porción/botella */}
            {sizeOptions.hasSizes && (
              <div>
                <h3 className="text-lg font-bold text-[#181611] dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">water_drop</span>
                  {t('dishDetail.selectSize')}
                </h3>
                <div className="space-y-2">
                  {sizeOptions.portionPrice !== null && (
                    <label
                      onClick={() => setSelectedSize('portion')}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSize === 'portion'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSize === 'portion'
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedSize === 'portion' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-[#181611] dark:text-white block">{t('dishDetail.portion')}</span>
                          {sizeOptions.volume && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{sizeOptions.volume}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">${sizeOptions.portionPrice.toFixed(2)}</span>
                    </label>
                  )}
                  {sizeOptions.bottlePrice !== null && (
                    <label
                      onClick={() => setSelectedSize('bottle')}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedSize === 'bottle'
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSize === 'bottle'
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedSize === 'bottle' && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-[#181611] dark:text-white block">{t('dishDetail.bottle')}</span>
                          {sizeOptions.volume && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">{sizeOptions.volume}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-primary">${sizeOptions.bottlePrice.toFixed(2)}</span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Selección de Proteína - Solo para Platos Fuertes y Entradas */}
            {(dish.category === 'Platos Fuertes' || dish.category === 'Entradas') && (
              <div>
                <h3 className="text-lg font-bold text-[#181611] dark:text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">restaurant</span>
                  {t('dishDetail.addProtein')}
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400">({t('dishDetail.optional')})</span>
                </h3>
                <div className="space-y-2">
                  {proteins.map((protein) => (
                    <label
                      key={protein.id}
                      onClick={() => setSelectedProtein(selectedProtein === protein.id ? null : protein.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedProtein === protein.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedProtein === protein.id
                            ? 'border-primary bg-primary'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {selectedProtein === protein.id && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="font-medium text-[#181611] dark:text-white">{protein.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-primary">+${protein.price}.00</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Instrucciones Especiales - Disponible para todas las categorías */}
            <div>
              <h3 className="text-lg font-bold text-[#181611] dark:text-white mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                {t('dishDetail.specialInstructions')}
              </h3>
              <textarea
                className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-[#181611] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                placeholder={t('dishDetail.specialInstructionsPlaceholder')}
                rows={3}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </div>
          </div>

          {/* Aviso de Alérgenos */}
          {(dish.badges?.includes('vegano') || dish.origin === 'vegetariano') ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex gap-3 mb-6">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
              <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                <span className="font-bold">{t('dishDetail.noAnimalProducts')}</span> {t('dishDetail.suitableForVegans')}
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 mb-6">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">info</span>
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                <span className="font-bold">{t('dishDetail.allergenWarning')}:</span> {t('dishDetail.allergenMessage')}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Action Bar */}
      <div className="fixed left-0 right-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 z-40 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-md mx-auto">
          {/* Botón Agregar */}
          <button
            onClick={handleAddToOrder}
            className={`relative w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all ${
              showAddedFeedback ? 'bg-green-500' : ''
            }`}
          >
            {showAddedFeedback ? (
              <>
                <span className="material-symbols-outlined text-xl">check_circle</span>
                <span>{t('dishDetail.added')}</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">note_add</span>
                <span>{t('dishDetail.add')}</span>
                <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
                {cartQuantity > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[24px] h-6 px-1.5 rounded-full bg-white text-primary text-xs font-bold flex items-center justify-center shadow-lg border-2 border-primary">
                    {cartQuantity > 9 ? '9+' : cartQuantity}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishDetailScreen;
