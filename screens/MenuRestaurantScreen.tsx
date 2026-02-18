import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toTitleCase } from '../utils/text';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useProducts } from '../contexts/ProductsContext';
import TopNavbar from '../components/TopNavbar';
import { formatPrice } from '../utils/currency';
import { useRestaurant } from '../contexts/RestaurantContext';
import { 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getCurrentUserRestaurantId, 
  uploadProductImage,
  getMenuSections,
  saveMenuSections as saveMenuSectionsAPI
} from '../services/api';
import { getProductImageUrl, uploadImage } from '../services/database';
import { useAuth } from '../contexts/AuthContext';

type OriginType =
  | 'mar'
  | 'tierra'
  | 'aire'
  | 'vegetariano'
  | 'vegano'
  | 'cafe'
  | 'digestivos'
  | 'refrescos'
  | 'agua_mineralizada'
  | 'aguas_frescas'
  | 'electrolit'
  | 'energizantes'
  | 'pastel'
  | 'pay_de_queso'
  | 'flan'
  | 'nieve'
  | 'fruta'
  | 'rum'
  | 'vodka'
  | 'tequila'
  | 'gin'
  | '';

type Dish = {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  badges?: string[];
  category: string;
  subcategories?: string[]; // Array de subcategorías
};

type PicksByCategory = Record<string, number[]>;

// Valores por defecto vacíos - ya no se usan productos hardcodeados
const DEFAULT_CHEF_SUGGESTIONS: PicksByCategory = {};
const DEFAULT_HIGHLIGHTS: PicksByCategory = {};
const DEFAULT_MENU_ITEMS: PicksByCategory = {};

const MenuRestaurantScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { products, refreshProducts } = useProducts();
  const { selectedRestaurant, selectedRestaurantId } = useRestaurant();
  const { user, accountType } = useAuth();

  // Nota: Las categorías ahora se usan directamente desde el campo 'category' de los productos
  // Los badges solo se usan para etiquetas informativas (vegano, especialidad, etc.)

  // Función helper para obtener la categoría original (actualmente solo devuelve la categoría tal cual)
  const getOriginalCategory = (category: string): string => {
    return category; // Las categorías ahora son las etiquetas directamente
  };

  // Convertir productos a formato Dish (debe estar antes de los useMemo que usan dishes)
  const dishes: Dish[] = useMemo(() => {
    const productsFromContext = (products || []).map((p) => {
      // Usar image_urls[0] como imagen principal, o fallback a image (compatibilidad)
      let imageUrl = '';
      if (p.image_urls && p.image_urls.length > 0) {
        // Si tenemos image_urls, usar la primera imagen
        imageUrl = getProductImageUrl(p.image_urls[0]);
      } else if (p.image) {
        // Si no hay image_urls pero hay image, usar image (ya viene procesado del contexto)
        imageUrl = p.image;
      }

      // Debug: log para productos sin imagen
      if (!imageUrl && p.id) {
        console.warn(`[MenuRestaurantScreen] Product ${p.id} (${p.name}) has no image. image: "${p.image}", image_urls: "${p.image_urls}"`);
      }

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: imageUrl,
        badges: p.badges || [],
        category: p.category,
        subcategories: p.subcategories || [],
      };
    });
    // Los productos vienen del contexto (Supabase), no hay productos locales
    return productsFromContext;
  }, [products]);

  // Obtener categorías dinámicamente desde los productos
  const mainCategories = useMemo(() => {
    const categoriesSet = new Set<string>();
    dishes.forEach((dish) => {
      if (dish.category && dish.category.trim() !== '') {
        categoriesSet.add(dish.category.trim());
      }
    });
    return Array.from(categoriesSet).sort();
  }, [dishes]);

  // Clave para localStorage
  const STORAGE_KEY_CATEGORY = 'menuRestaurant_selectedCategory';
  const STORAGE_KEY_SUBCATEGORY = 'menuRestaurant_selectedSubcategory';

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');

  // Obtener subcategorías dinámicamente desde los productos de la categoría seleccionada
  const foodSubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    const subcategoriesSet = new Set<string>();
    dishes.forEach((dish) => {
      if (dish.category === selectedCategory && dish.subcategories && dish.subcategories.length > 0) {
        dish.subcategories.forEach((subcat) => {
          if (subcat && subcat.trim() !== '') {
            subcategoriesSet.add(subcat.trim());
          }
        });
      }
    });
    return Array.from(subcategoriesSet).sort();
  }, [dishes, selectedCategory]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const [chefSuggestionsByCategory, setChefSuggestionsByCategory] =
    useState<PicksByCategory>(DEFAULT_CHEF_SUGGESTIONS);
  const [highlightsByCategory, setHighlightsByCategory] =
    useState<PicksByCategory>(DEFAULT_HIGHLIGHTS);
  const [menuItemsByCategory, setMenuItemsByCategory] =
    useState<PicksByCategory>(DEFAULT_MENU_ITEMS);

  // Modal selector (para agregar/editar)
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSection, setPickerSection] = useState<'chef' | 'highlights' | 'menu'>('chef');
  const [pickerEditingId, setPickerEditingId] = useState<number | null>(null); // dishId actual a reemplazar
  
  // Pantalla de edición de producto
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Dish | null>(null);
  const [editingProductName, setEditingProductName] = useState('');
  const [editingProductPrice, setEditingProductPrice] = useState('');
  const [editingProductDescription, setEditingProductDescription] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [allowSpecialInstructions, setAllowSpecialInstructions] = useState(true);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [allowCustomComplements, setAllowCustomComplements] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);
  const [productImageFiles, setProductImageFiles] = useState<File[]>([]);
  
  // Complementos
  type Complement = {
    id: string;
    name: string;
    price: number;
  };
  const [complements, setComplements] = useState<Complement[]>([]);
  const [editingComplementId, setEditingComplementId] = useState<string | null>(null);
  const [newComplementName, setNewComplementName] = useState('');
  const [newComplementPrice, setNewComplementPrice] = useState('');
  const [showSinCosto, setShowSinCosto] = useState(false);
  
  // Categoría del producto (una sola)
  const [productCategory, setProductCategory] = useState<string>('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);

  // Subcategorías del producto (estructura jerárquica)
  const [productSubcategories, setProductSubcategories] = useState<string[]>([]);
  const [selectedSubcategoryPath, setSelectedSubcategoryPath] = useState<string>(''); // Ruta de la última subcategoría seleccionada
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [isCreatingNewSubcategory, setIsCreatingNewSubcategory] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [modalCurrentPath, setModalCurrentPath] = useState<string>(''); // Path actual en el modal
  
  // Modal de confirmación
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalCallback, setConfirmModalCallback] = useState<(() => void) | null>(null);
  
  // Estado para prevenir múltiples guardados simultáneos
  const [isSaving, setIsSaving] = useState(false);
  
  // Los productos ahora se guardan en Supabase, no localmente

  
  // Cargar picks desde la base de datos (cualquier tipo de cuenta: restaurante usa su id, resto usa restaurante seleccionado)
  useEffect(() => {
    const loadMenuSections = async () => {
      let restaurantId: string | null = null;
      if (accountType === 'restaurant') {
        const restaurantIdResult = await getCurrentUserRestaurantId();
        restaurantId = restaurantIdResult.success && restaurantIdResult.data ? restaurantIdResult.data : null;
      } else {
        restaurantId = selectedRestaurantId;
      }
      if (!restaurantId) {
        setChefSuggestionsByCategory(DEFAULT_CHEF_SUGGESTIONS);
        setHighlightsByCategory(DEFAULT_HIGHLIGHTS);
        setMenuItemsByCategory(DEFAULT_MENU_ITEMS);
        return;
      }

      try {
        const sectionsResult = await getMenuSections(restaurantId);
        if (sectionsResult.success && sectionsResult.data) {
          const [chefSuggestions, highlights, menuItems] = sectionsResult.data;
          setChefSuggestionsByCategory(chefSuggestions);
          setHighlightsByCategory(highlights);
          setMenuItemsByCategory(menuItems);
        } else {
          console.error('[MenuRestaurantScreen] Error loading menu sections:', sectionsResult.error);
        }
        console.log('[MenuRestaurantScreen] Menu sections loaded from database');
      } catch (error) {
        console.error('[MenuRestaurantScreen] Error loading menu sections:', error);
        // En caso de error, usar valores por defecto vacíos
        setChefSuggestionsByCategory(DEFAULT_CHEF_SUGGESTIONS);
        setHighlightsByCategory(DEFAULT_HIGHLIGHTS);
        setMenuItemsByCategory(DEFAULT_MENU_ITEMS);
      }
    };

    loadMenuSections();
  }, [selectedRestaurantId, accountType]);

  // Guardar picks en la base de datos (solo cuentas restaurante pueden guardar)
  useEffect(() => {
    if (accountType !== 'restaurant') return;

    let timeoutId: NodeJS.Timeout;
    const saveMenuSectionsToDB = async () => {
      try {
        const restaurantIdResult = await getCurrentUserRestaurantId();
        if (!restaurantIdResult.success || !restaurantIdResult.data) {
          console.warn('[MenuRestaurantScreen] No se pudo obtener el restaurant_id para guardar');
          return;
        }

        const restaurantId = restaurantIdResult.data;
        // Usar un timeout para debounce (guardar después de 1 segundo de inactividad)
        timeoutId = setTimeout(async () => {
          const saveResult = await saveMenuSectionsAPI(
            restaurantId,
            chefSuggestionsByCategory,
            highlightsByCategory,
            menuItemsByCategory
          );
          const success = saveResult.success && saveResult.data;
          if (success) {
            console.log('[MenuRestaurantScreen] Menu sections saved to database');
          } else {
            console.error('[MenuRestaurantScreen] Failed to save menu sections:', saveResult.error);
          }
        }, 1000);
      } catch (error) {
        console.error('[MenuRestaurantScreen] Error saving menu sections:', error);
      }
    };

    saveMenuSectionsToDB();
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [chefSuggestionsByCategory, highlightsByCategory, menuItemsByCategory, accountType]);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    if (selectedCategory) {
      localStorage.setItem(STORAGE_KEY_CATEGORY, selectedCategory);
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (selectedSubcategory) {
      localStorage.setItem(STORAGE_KEY_SUBCATEGORY, selectedSubcategory);
    }
  }, [selectedSubcategory]);

  const subcategoriesScrollRef = useRef<HTMLDivElement>(null);
  const subcategoriesScrollRafRef = useRef(0);
  const subcategoriesScrollStoppedRef = useRef(false);
  const scrollAnimationRanOnceRef = useRef(false);
  useEffect(() => {
    const list = mainCategories.length > 0 && !selectedCategory ? mainCategories : null;
    if (list) {
      const savedCategory = localStorage.getItem(STORAGE_KEY_CATEGORY);
      const categoryToSelect = (savedCategory && list.includes(savedCategory))
        ? savedCategory
        : list[0];
      setSelectedCategory(categoryToSelect);
    }
  }, [mainCategories, selectedCategory]);

  // La categoría seleccionada ahora es directamente la etiqueta
  const selectedTagAsCategory = selectedCategory || '';
  const chefIds = chefSuggestionsByCategory[selectedTagAsCategory] || [];
  const highlightIds = highlightsByCategory[selectedTagAsCategory] || [];
  const menuIds = menuItemsByCategory[selectedTagAsCategory] || [];

  // Calcular si hay productos visibles en cada sección después del filtrado
  // Los productos sin subcategoría se muestran siempre que coincida la categoría
  const hasVisibleChefSuggestions = useMemo(() => {
    return chefIds.some((dishId) => {
      const dish = dishes.find((d) => d.id === dishId);
      if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
      // Si hay subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
      if (selectedSubcategory) {
        return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
      }
      return true;
    });
  }, [chefIds, dishes, selectedTagAsCategory, selectedSubcategory]);

  const hasVisibleHighlights = useMemo(() => {
    return highlightIds.some((dishId) => {
      const dish = dishes.find((d) => d.id === dishId);
      if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
      // Si hay subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
      if (selectedSubcategory) {
        return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
      }
      return true;
    });
  }, [highlightIds, dishes, selectedTagAsCategory, selectedSubcategory]);

  // Función para obtener el texto del botón según la categoría seleccionada
  const getAddButtonText = useMemo(() => {
    return (category: string): string => {
      const categoryMap: Record<string, string> = {
        [t('menu.categories.appetizers')]: t('restaurant.menu.addEntry'),
        [t('menu.categories.mains')]: t('restaurant.menu.addMain'),
        [t('menu.categories.drinks')]: t('restaurant.menu.addDrink'),
        [t('menu.categories.desserts')]: t('restaurant.menu.addDessert'),
        [t('menu.categories.cocktails')]: t('restaurant.menu.addCocktail'),
      };
      return categoryMap[category] || t('restaurant.menu.addProduct');
    };
  }, [t]);

  // Extraer todas las etiquetas informativas (badges) únicas de los productos de la categoría seleccionada
  // Estas son solo para etiquetas informativas como "vegano", "especialidad", etc.
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    dishes.forEach((dish) => {
      if (dish.badges && dish.badges.length > 0) {
        // Si el producto pertenece a la categoría seleccionada, mostrar sus etiquetas informativas
        if (selectedTagAsCategory && dish.category === selectedTagAsCategory) {
        dish.badges.forEach((tag) => tagsSet.add(tag));
        }
      }
    });
    return Array.from(tagsSet).sort();
  }, [dishes, selectedTagAsCategory]);

  // Función para obtener los filtros según la categoría seleccionada
  const getFiltersForCategory = (category: string): Array<{ value: OriginType; icon: string }> => {
    const origCat = getOriginalCategory(category);
    
    if (origCat === 'Entradas' || origCat === 'Platos Fuertes') {
      return [
        { value: 'tierra' as OriginType, icon: 'agriculture' },
        { value: 'mar' as OriginType, icon: 'waves' },
        { value: 'aire' as OriginType, icon: 'air' },
        { value: 'vegetariano' as OriginType, icon: 'local_florist' },
        { value: 'vegano' as OriginType, icon: 'eco' },
      ];
    }
    
    if (origCat === 'Bebidas') {
      return [
        { value: 'cafe' as OriginType, icon: 'local_cafe' },
        { value: 'refrescos' as OriginType, icon: 'sports_bar' },
        { value: 'agua_mineralizada' as OriginType, icon: 'water_drop' },
        { value: 'aguas_frescas' as OriginType, icon: 'local_drink' },
        { value: 'electrolit' as OriginType, icon: 'fitness_center' },
        { value: 'energizantes' as OriginType, icon: 'bolt' },
      ];
    }
    
    if (origCat === 'Postres') {
      return [
        { value: 'pastel' as OriginType, icon: 'cake' },
        { value: 'pay_de_queso' as OriginType, icon: 'pie_chart' },
        { value: 'flan' as OriginType, icon: 'egg' },
        { value: 'nieve' as OriginType, icon: 'icecream' },
        { value: 'fruta' as OriginType, icon: 'apple' },
      ];
    }
    
    if (origCat === 'Coctelería') {
      return [
        { value: 'digestivos' as OriginType, icon: 'liquor' },
        { value: 'rum' as OriginType, icon: 'local_bar' },
        { value: 'vodka' as OriginType, icon: 'local_bar' },
        { value: 'tequila' as OriginType, icon: 'local_bar' },
        { value: 'gin' as OriginType, icon: 'local_bar' },
      ];
    }
    
    return [
      { value: 'tierra' as OriginType, icon: 'agriculture' },
      { value: 'mar' as OriginType, icon: 'waves' },
      { value: 'aire' as OriginType, icon: 'air' },
      { value: 'vegetariano' as OriginType, icon: 'local_florist' },
      { value: 'vegano' as OriginType, icon: 'eco' },
    ];
  };

  const getFilterTranslationKey = (value: OriginType): string => {
    const keyMap: Record<string, string> = {
      'tierra': 'menu.filters.land',
      'mar': 'menu.filters.sea',
      'aire': 'menu.filters.air',
      'vegetariano': 'menu.filters.vegetarian',
      'vegano': 'menu.filters.vegan',
      'cafe': 'menu.filters.cafe',
      'refrescos': 'menu.filters.refrescos',
      'agua_mineralizada': 'menu.filters.aguaMineralizada',
      'aguas_frescas': 'menu.filters.aguasFrescas',
      'electrolit': 'menu.filters.electrolit',
      'energizantes': 'menu.filters.energizantes',
      'pastel': 'menu.filters.pastel',
      'pay_de_queso': 'menu.filters.payDeQueso',
      'flan': 'menu.filters.flan',
      'nieve': 'menu.filters.nieve',
      'fruta': 'menu.filters.fruta',
      'digestivos': 'menu.filters.digestivos',
      'rum': 'menu.filters.rum',
      'vodka': 'menu.filters.vodka',
      'tequila': 'menu.filters.tequila',
      'gin': 'menu.filters.gin',
    };
    return keyMap[value] || '';
  };

  // Filtrar productos que tienen la etiqueta seleccionada como badge
  // Obtener productos filtrados por categoría (usando el campo 'category', no 'badges')
  const categoryDishes = useMemo(() => {
    if (!selectedTagAsCategory) return [];
    return dishes.filter((d) => {
      // Filtrar por categoría
      if (d.category !== selectedTagAsCategory) return false;
      
      // Si hay una subcategoría seleccionada, filtrar por subcategoría
      if (selectedSubcategory) {
        // Mostrar productos que tienen la subcategoría seleccionada O que no tienen subcategorías
        if (d.subcategories && d.subcategories.length > 0) {
          return d.subcategories.includes(selectedSubcategory);
        }
        // Si no tiene subcategorías, no mostrarlo cuando hay una subcategoría seleccionada
        return false;
      }
      
      // Si no hay subcategoría seleccionada, mostrar todos los productos de la categoría
      return true;
    });
  }, [dishes, selectedTagAsCategory, selectedSubcategory]);

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
    if (normalizedText === normalizedQuery) return true;
    if (normalizedText.includes(normalizedQuery)) return true;
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length >= 2);
    if (queryWords.length > 1 && queryWords.every(word => normalizedText.includes(word))) return true;
    return false;
  };

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

  // Filtrar productos por búsqueda (buscar en todas las categorías cuando hay búsqueda)
  const filteredDishes = useMemo(() => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    
    if (!hasSearchQuery) {
      // Sin búsqueda, retornar todos los productos (se filtrarán por categoría en la renderización)
      return dishes;
    }

    const query = searchQuery.trim();
    return dishes.filter((dish) => {
      const matchesName = searchMatchesText(dish.name || '', query);
      const matchesDescription = searchMatchesText(dish.description || '', query);
      return matchesName || matchesDescription;
    });
  }, [dishes, searchQuery]);

  // Con búsqueda activa, los filtros muestran solo categorías/subcategorías presentes en los resultados
  const displayCategories = useMemo(() => {
    if (searchQuery.trim()) {
      const set = new Set<string>();
      filteredDishes.forEach((d) => {
        if (d.category && d.category.trim() !== '') set.add(d.category.trim());
      });
      return Array.from(set).sort();
    }
    return mainCategories;
  }, [searchQuery, filteredDishes, mainCategories]);

  const displaySubcategories = useMemo(() => {
    if (!selectedCategory) return [];
    if (searchQuery.trim()) {
      const set = new Set<string>();
      filteredDishes.forEach((d) => {
        if (d.category === selectedCategory && d.subcategories && d.subcategories.length > 0) {
          d.subcategories.forEach((sub) => {
            if (sub && sub.trim() !== '') set.add(sub.trim());
          });
        }
      });
      return Array.from(set).sort();
    }
    return foodSubcategories;
  }, [searchQuery, filteredDishes, selectedCategory, foodSubcategories]);

  // Efectos que usan displayCategories/displaySubcategories (definidos después de filteredDishes)
  useEffect(() => {
    const list = searchQuery.trim() ? displayCategories : mainCategories;
    if (list.length > 0 && !selectedCategory) {
      const savedCategory = localStorage.getItem(STORAGE_KEY_CATEGORY);
      const categoryToSelect = (savedCategory && list.includes(savedCategory))
        ? savedCategory
        : list[0];
      setSelectedCategory(categoryToSelect);
    }
  }, [mainCategories, displayCategories, searchQuery, selectedCategory]);

  useEffect(() => {
    if (!searchQuery.trim() || displayCategories.length === 0) return;
    if (selectedCategory && !displayCategories.includes(selectedCategory)) {
      setSelectedCategory(displayCategories[0]);
      setSelectedSubcategory('');
      localStorage.setItem(STORAGE_KEY_CATEGORY, displayCategories[0]);
      localStorage.removeItem(STORAGE_KEY_SUBCATEGORY);
    }
  }, [searchQuery, displayCategories, selectedCategory]);

  useEffect(() => {
    if (selectedCategory && displaySubcategories.length > 0) {
      const valid = selectedSubcategory && displaySubcategories.includes(selectedSubcategory);
      if (!valid) {
        const saved = localStorage.getItem(STORAGE_KEY_SUBCATEGORY);
        const next = (saved && displaySubcategories.includes(saved)) ? saved : displaySubcategories[0];
        setSelectedSubcategory(next);
        localStorage.setItem(STORAGE_KEY_SUBCATEGORY, next);
      }
    } else if (selectedSubcategory) {
      setSelectedSubcategory('');
      localStorage.removeItem(STORAGE_KEY_SUBCATEGORY);
    }
  }, [selectedCategory, displaySubcategories, selectedSubcategory]);

  // Animación de scroll: una sola vez al entrar a la página; al salir y volver se repite una vez
  useEffect(() => {
    if (scrollAnimationRanOnceRef.current) return;
    subcategoriesScrollStoppedRef.current = false;
    const el = subcategoriesScrollRef.current;
    if (!el || !selectedCategory || displaySubcategories.length === 0) return;
    const ROW_HEIGHT_APPROX = 40;
    const VISIBLE_ROWS = 3;
    if (el.scrollHeight <= ROW_HEIGHT_APPROX * VISIBLE_ROWS) return;

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
        if (t >= 1) { phase = 'hold-down'; startTime = now; }
      } else if (phase === 'hold-down') {
        if (now - startTime >= hold) { phase = 'up'; startTime = now; startScrollTop = el.scrollTop; }
      } else if (phase === 'up') {
        const t = Math.min(1, (now - startTime) / duration);
        el.scrollTop = startScrollTop + easeInOutCubic(t) * (0 - startScrollTop);
        if (t >= 1) { phase = 'hold-up'; startTime = now; }
      } else {
        if (now - startTime >= hold) { phase = 'down'; startTime = 0; startScrollTop = 0; }
      }
      rafId = requestAnimationFrame(tick);
      subcategoriesScrollRafRef.current = rafId;
    };
    rafId = requestAnimationFrame(tick);
    subcategoriesScrollRafRef.current = rafId;
    return () => cancelAnimationFrame(rafId);
  }, [selectedCategory, displaySubcategories]);

  // Calcular cuántos productos hay en la categoría actual
  const menuItemsCount = useMemo(() => {
    if (searchQuery.trim()) {
      return filteredDishes.length;
    }
    if (menuIds.length > 0) {
      return menuIds
        .map((dishId) => dishes.find((d) => d.id === dishId))
        .filter((dish): dish is Dish => {
          if (!dish) return false;
          // Filtrar por la categoría seleccionada
          if (!selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
          // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
          if (selectedSubcategory) {
            return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
          }
          // Si hay un filtro de etiqueta adicional, aplicarlo
          if (selectedTag) {
            return dish.badges?.includes(selectedTag) || false;
          }
          return true;
        }).length;
    }
    return dishes.filter((dish) => {
      // Filtrar por la categoría seleccionada
      if (!selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
      // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
      if (selectedSubcategory) {
        return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
      }
      // Si hay un filtro de etiqueta adicional, aplicarlo
      if (selectedTag) {
        return dish.badges?.includes(selectedTag) || false;
      }
      return true;
    }).length;
  }, [dishes, menuIds, selectedTagAsCategory, selectedSubcategory, selectedTag, searchQuery, filteredDishes]);

  const openPicker = (section: 'chef' | 'highlights' | 'menu', editingId?: number) => {
    setPickerSection(section);
    setPickerEditingId(typeof editingId === 'number' ? editingId : null);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setPickerOpen(false);
    setPickerEditingId(null);
  };

  const openEditProduct = (product?: Dish) => {
    setEditingProduct(product || null);
    setEditingProductName(product?.name || '');
    setEditingProductPrice(product?.price ? product.price.toString() : '0');
    setEditingProductDescription(product?.description || '');
    
    // Cargar todas las imágenes del producto
    if (product?.id) {
      const fullProduct = products?.find(p => p.id === product.id);
      if (fullProduct?.image_urls && fullProduct.image_urls.length > 0) {
        // Si hay image_urls, convertir cada path a URL completa para mostrar
        const imageUrls = fullProduct.image_urls.map(path => getProductImageUrl(path));
        setProductImages(imageUrls);
      } else if (product?.image) {
        // Fallback: usar image si no hay image_urls
        setProductImages([product.image]);
      } else {
        setProductImages([]);
      }
    } else {
      setProductImages([]);
    }
    setProductImageFiles([]);
    setIsEditingName(false);
    setIsEditingPrice(false);
    setIsEditingDescription(false);
    setAllowSpecialInstructions(true);
    setSpecialInstructions('');
    setAllowCustomComplements(false);
    
    // Cargar complementos desde el producto si existe, o usar array vacío
    // Necesitamos obtener el producto completo desde la base de datos para tener los complementos
    if (product?.id) {
      // Buscar el producto completo en la lista de productos del contexto
      const fullProduct = products?.find(p => p.id === product.id);
      if (fullProduct?.complements && Array.isArray(fullProduct.complements) && fullProduct.complements.length > 0) {
        // Convertir los complementos del formato de la BD al formato del componente
        const loadedComplements: Complement[] = fullProduct.complements.map((comp: any) => ({
          id: comp.id || Date.now().toString() + Math.random().toString(),
          name: comp.name || '',
          price: typeof comp.price === 'number' ? comp.price : parseFloat(comp.price) || 0,
        }));
        setComplements(loadedComplements);
        setAllowCustomComplements(fullProduct.allow_custom_complements || false);
        setAllowSpecialInstructions(fullProduct.allow_special_instructions !== undefined ? fullProduct.allow_special_instructions : true);
      } else {
        // Si no hay complementos guardados, usar array vacío
        setComplements([]);
        setAllowCustomComplements(false);
        setAllowSpecialInstructions(true);
      }
    } else {
      // Producto nuevo, usar valores por defecto vacíos
      setComplements([]);
      setAllowCustomComplements(false);
      setAllowSpecialInstructions(true);
    }
    
    setEditingComplementId(null);
    setNewComplementName('');
    setNewComplementPrice('');
    setShowSinCosto(false);
    
    // Cargar categoría del producto
    const fullProduct = product?.id ? products?.find(p => p.id === product.id) : null;
    if (fullProduct?.category) {
      setProductCategory(fullProduct.category.trim());
      setIsCreatingNewCategory(false);
    } else {
      setProductCategory('');
      setIsCreatingNewCategory(false);
    }
    setNewCategoryName('');
    
    // Cargar subcategorías del producto
    if (fullProduct?.subcategories && Array.isArray(fullProduct.subcategories) && fullProduct.subcategories.length > 0) {
      setProductSubcategories(fullProduct.subcategories.map(sub => sub.trim()).filter(sub => sub !== ''));
      // Establecer la última subcategoría como ruta seleccionada si hay alguna
      const lastSubcategory = fullProduct.subcategories[fullProduct.subcategories.length - 1];
      if (lastSubcategory) {
        setSelectedSubcategoryPath(lastSubcategory.trim());
      } else {
        setSelectedSubcategoryPath('');
      }
    } else {
      setProductSubcategories([]);
      setSelectedSubcategoryPath('');
    }
    setNewSubcategoryName('');
    setIsCreatingNewSubcategory(false);
    setEditProductOpen(true);
    closePicker(); // Cerrar el picker si está abierto
  };
  
  // Leer parámetros de URL para prellenar categoría y subcategoría (después de definir openEditProduct)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const createParam = searchParams.get('create');
    const editParam = searchParams.get('edit');
    
    // Si hay parámetro create=true, abrir el diálogo de creación con categoría y subcategoría prellenadas
    if (createParam === 'true' && categoryParam) {
      setProductCategory(categoryParam);
      if (subcategoryParam) {
        setProductSubcategories([subcategoryParam]);
        setSelectedSubcategoryPath(subcategoryParam);
      }
      // Abrir el diálogo de creación después de un pequeño delay para asegurar que el componente esté listo
      setTimeout(() => {
        openEditProduct();
        // Limpiar los parámetros de URL
        navigate(location.pathname, { replace: true });
      }, 100);
      return;
    }
    
    // Si hay parámetro edit, abrir el diálogo de edición
    if (editParam && dishes.length > 0) {
      const productId = parseInt(editParam, 10);
      if (!isNaN(productId)) {
        const product = dishes.find(d => d.id === productId);
        if (product) {
          setTimeout(() => {
            openEditProduct(product);
            // Limpiar los parámetros de URL
            navigate(location.pathname, { replace: true });
          }, 100);
        }
      }
    }
  }, [location.search]);

  const closeEditProduct = () => {
    setEditProductOpen(false);
    setEditingProduct(null);
    setEditingProductName('');
    setEditingProductPrice('');
    setEditingProductDescription('');
    setProductImages([]);
    setProductImageFiles([]);
    setIsEditingName(false);
    setIsEditingPrice(false);
    setIsEditingDescription(false);
    setAllowSpecialInstructions(true);
    setSpecialInstructions('');
    setAllowCustomComplements(false);
    setComplements([]);
    setEditingComplementId(null);
    setNewComplementName('');
    setNewComplementPrice('');
    setShowSinCosto(false);
    setProductCategory('');
    setNewCategoryName('');
    setIsCreatingNewCategory(false);
    setProductSubcategories([]);
    setSelectedSubcategoryPath('');
    setNewSubcategoryName('');
    setIsCreatingNewSubcategory(false);
  };

  const handleSaveName = () => {
    setIsEditingName(false);
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, name: editingProductName });
    }
  };

  const handleSavePrice = () => {
    setIsEditingPrice(false);
    const priceValue = parseFloat(editingProductPrice) || 0;
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, price: priceValue });
    }
  };

  const handleSaveDescription = () => {
    setIsEditingDescription(false);
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, description: editingProductDescription });
    }
  };

  // Funciones CRUD para complementos
  const addComplement = () => {
    if (!newComplementName.trim()) {
      return; // No hacer nada si no hay nombre
    }
    
    const priceValue = parseFloat(newComplementPrice) || 0;
    const isEmptyOrZero = !newComplementPrice.trim() || newComplementPrice.trim() === '0' || newComplementPrice.trim() === '0.00' || priceValue === 0 || isNaN(priceValue);
    
    // Agregar complemento (con precio 0 si está vacío o es 0)
    const newComplement: Complement = {
      id: Date.now().toString(),
      name: newComplementName.trim(),
      price: isEmptyOrZero ? 0 : priceValue,
    };
    setComplements([...complements, newComplement]);
    setNewComplementName('');
    setNewComplementPrice('');
    setShowSinCosto(false); // Siempre volver al campo numérico después de agregar
  };

  const startEditComplement = (complement: Complement) => {
    setEditingComplementId(complement.id);
    setNewComplementName(complement.name);
    setNewComplementPrice(complement.price.toString());
  };

  const saveEditComplement = () => {
    if (editingComplementId && newComplementName.trim() && newComplementPrice.trim()) {
      setComplements(complements.map(c => 
        c.id === editingComplementId 
          ? { ...c, name: newComplementName.trim(), price: parseFloat(newComplementPrice) || 0 }
          : c
      ));
      setEditingComplementId(null);
      setNewComplementName('');
      setNewComplementPrice('');
    }
  };

  const cancelEditComplement = () => {
    setEditingComplementId(null);
    setNewComplementName('');
    setNewComplementPrice('');
    setShowSinCosto(false);
  };

  const deleteComplement = (id: string) => {
    setComplements(complements.filter(c => c.id !== id));
  };

  // Función helper para convertir texto a Title Case
  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Funciones para categoría
  const selectCategory = (category: string) => {
    setProductCategory(category);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
    // Limpiar subcategorías y ruta cuando cambia la categoría
    setProductSubcategories([]);
    setSelectedSubcategoryPath('');
  };

  const createNewCategory = () => {
    if (!newCategoryName.trim()) return;
    const categoryName = toTitleCase(newCategoryName.trim());
    setProductCategory(categoryName);
    setIsCreatingNewCategory(false);
    setNewCategoryName('');
  };

  // Obtener todas las subcategorías existentes para la categoría seleccionada (sin filtrar por jerarquía)
  const allAvailableSubcategories = useMemo(() => {
    if (!productCategory) return [];
    const subcategoriesSet = new Set<string>();

    // Subcategorías que ya existen en la base de datos (a partir de los platos actuales)
    dishes.forEach((dish) => {
      if (dish.category === productCategory && dish.subcategories && dish.subcategories.length > 0) {
        dish.subcategories.forEach((subcat) => {
          if (subcat && subcat.trim() !== '') {
            subcategoriesSet.add(subcat.trim());
          }
        });
      }
    });

    // Subcategorías que el usuario ha agregado en el formulario actual (productSubcategories)
    productSubcategories.forEach((subcat) => {
      if (subcat && subcat.trim() !== '') {
        subcategoriesSet.add(subcat.trim());
      }
    });

    return Array.from(subcategoriesSet).sort();
  }, [dishes, productCategory, productSubcategories]);

  // Obtener subcategorías disponibles en el nivel actual (basado en la ruta seleccionada)
  const availableSubcategories = useMemo(() => {
    if (!productCategory) return [];
    
    // Si no hay ruta seleccionada, mostrar todas las subcategorías de nivel raíz
    if (!selectedSubcategoryPath) {
      // Subcategorías de nivel raíz: las que no tienen " > " (no son hijas de otras)
      return allAvailableSubcategories.filter(sub => !sub.includes(' > '));
    }
    
    // Si hay una ruta seleccionada, mostrar solo las subcategorías hijas directas
    // Una subcategoría hija directa es aquella que empieza con "ruta > " y no tiene más niveles
    const parentPath = selectedSubcategoryPath + ' > ';
    const children = allAvailableSubcategories.filter(sub => {
      // Debe empezar con la ruta del padre
      if (!sub.startsWith(parentPath)) return false;
      // Debe ser hija directa (solo un nivel más profundo)
      const remaining = sub.substring(parentPath.length);
      return !remaining.includes(' > ');
    });
    
    return children;
  }, [allAvailableSubcategories, selectedSubcategoryPath]);

  // Funciones CRUD para subcategorías (con soporte jerárquico)
  const selectSubcategory = (subcategoryNameOrPath: string) => {
    // Si la subcategoría ya tiene " > ", es una ruta completa, usarla directamente
    // Si no, construir la ruta completa basándose en la ruta seleccionada actual
    let fullPath: string;
    if (subcategoryNameOrPath.includes(' > ')) {
      fullPath = subcategoryNameOrPath;
    } else {
      fullPath = selectedSubcategoryPath 
        ? `${selectedSubcategoryPath} > ${subcategoryNameOrPath}`
        : subcategoryNameOrPath;
    }
    
    // Agregar a la lista de subcategorías si no existe
    if (!productSubcategories.some(sub => sub.toLowerCase() === fullPath.toLowerCase())) {
      setProductSubcategories([...productSubcategories, fullPath]);
    }
    
    // Actualizar la ruta seleccionada para mostrar las subcategorías hijas
    setSelectedSubcategoryPath(fullPath);
    setIsCreatingNewSubcategory(false);
    setNewSubcategoryName('');
  };

  const addSubcategory = () => {
    if (!newSubcategoryName.trim()) {
      return;
    }
    const subcategoryName = toTitleCase(newSubcategoryName.trim());
    // Construir la ruta completa basada en el path actual
    const fullPath = selectedSubcategoryPath 
      ? `${selectedSubcategoryPath} > ${subcategoryName}`
      : subcategoryName;
    
    // Evitar duplicados (case-insensitive)
    if (!productSubcategories.some(sub => sub.toLowerCase() === fullPath.toLowerCase())) {
      setProductSubcategories([...productSubcategories, fullPath]);
      // Actualizar selectedSubcategoryPath al nuevo path para que los dropdowns muestren correctamente la selección
      setSelectedSubcategoryPath(fullPath);
    }
    setNewSubcategoryName('');
    setIsCreatingNewSubcategory(false);
  };

  const deleteSubcategory = (subcategoryToDelete: string) => {
    const normalizedSubcategoryToDelete = subcategoryToDelete.trim().toLowerCase();
    const updated = productSubcategories.filter(sub => sub.trim().toLowerCase() !== normalizedSubcategoryToDelete);
    setProductSubcategories(updated);
    
    // Si la subcategoría eliminada era la seleccionada, volver al nivel padre
    if (selectedSubcategoryPath.toLowerCase() === normalizedSubcategoryToDelete) {
      const parentPath = selectedSubcategoryPath.includes(' > ')
        ? selectedSubcategoryPath.substring(0, selectedSubcategoryPath.lastIndexOf(' > '))
        : '';
      setSelectedSubcategoryPath(parentPath);
    }
  };

  const navigateToSubcategoryLevel = (path: string) => {
    setSelectedSubcategoryPath(path);
    setIsCreatingNewSubcategory(false);
    setNewSubcategoryName('');
  };

  const navigateToParentLevel = () => {
    if (selectedSubcategoryPath.includes(' > ')) {
      const parentPath = selectedSubcategoryPath.substring(0, selectedSubcategoryPath.lastIndexOf(' > '));
      setSelectedSubcategoryPath(parentPath);
    } else {
      setSelectedSubcategoryPath('');
    }
    setIsCreatingNewSubcategory(false);
    setNewSubcategoryName('');
  };

  // Función para manejar la selección de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        if (file instanceof File) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setProductImages((prev) => [...prev, reader.result as string]);
            setProductImageFiles((prev) => [...prev, file]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
    // Resetear el input para permitir seleccionar la misma imagen de nuevo
    e.target.value = '';
  };

  // Función para eliminar una imagen
  const handleRemoveImage = (index: number, isOriginalImage: boolean = false) => {
    if (isOriginalImage) {
      // Si es la imagen original del producto, limpiarla
      if (editingProduct) {
        const updatedProduct = { ...editingProduct, image: '' };
        setEditingProduct(updatedProduct);
      }
    } else {
      // Si es una imagen nueva (en productImages)
      // Necesitamos encontrar el índice correcto en productImages
      const allImages = [...productImages];
      if (editingProduct?.image && !productImages.includes(editingProduct.image)) {
        allImages.push(editingProduct.image);
      }
      
      // Si el índice está dentro de productImages
      if (index < productImages.length) {
        setProductImages((prev) => prev.filter((_, i) => i !== index));
        setProductImageFiles((prev) => prev.filter((_, i) => i !== index));
      }
    }
  };

  // Función para guardar el producto en Supabase
  const handleSaveProduct = async () => {
    console.log('[MenuRestaurantScreen] ===== handleSaveProduct INICIADO =====');
    console.log('[MenuRestaurantScreen] handleSaveProduct llamado');
    console.log('[MenuRestaurantScreen] editingProductName:', editingProductName);
    console.log('[MenuRestaurantScreen] editingProduct:', editingProduct);
    console.log('[MenuRestaurantScreen] isSaving:', isSaving);
    
    // Prevenir múltiples ejecuciones simultáneas
    if (isSaving) {
      console.warn('[MenuRestaurantScreen] Ya se está guardando, ignorando click duplicado');
      return;
    }
    
    if (!editingProductName.trim()) {
      console.warn('[MenuRestaurantScreen] No se puede guardar: el nombre está vacío');
      alert(t('restaurant.menu.errors.emptyName'));
      return; // No guardar si no hay nombre
    }

    setIsSaving(true);
    console.log('[MenuRestaurantScreen] isSaving establecido a true');

    try {
      console.log('[MenuRestaurantScreen] Iniciando guardado de producto...');
      // Obtener el restaurant_id del usuario actual
      console.log('[MenuRestaurantScreen] Obteniendo restaurant_id...');
      const restaurantIdResult = await getCurrentUserRestaurantId();
      console.log('[MenuRestaurantScreen] restaurantId obtenido:', restaurantIdResult);
      if (!restaurantIdResult.success || !restaurantIdResult.data) {
        console.error('[MenuRestaurantScreen] No se pudo obtener el restaurant_id del usuario actual:', restaurantIdResult.error);
        console.error('[MenuRestaurantScreen] User:', user);
        console.error('[MenuRestaurantScreen] Account type:', accountType);
        alert(t('restaurant.menu.errors.invalidRestaurant'));
        return;
      }
      
      const restaurantId = restaurantIdResult.data;
      console.log('[MenuRestaurantScreen] Restaurant ID:', restaurantId);

      // Subir todas las imágenes a Supabase Storage si hay archivos nuevos
      console.log('[MenuRestaurantScreen] Procesando imágenes...');
      console.log('[MenuRestaurantScreen] productImageFiles.length:', productImageFiles.length);
      console.log('[MenuRestaurantScreen] productImages.length:', productImages.length);
      const uploadedImageUrls: string[] = [];
      
      if (productImageFiles.length > 0) {
        console.log('[MenuRestaurantScreen] Subiendo', productImageFiles.length, 'imágenes...');
        // Subir todas las imágenes nuevas
        for (const file of productImageFiles) {
          const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const uploadResult = await uploadProductImage(file, file.name);
          if (uploadResult.success && uploadResult.data) {
            const uploadedUrl = uploadResult.data;
            // Extraer solo el path relativo de la URL completa
            const urlParts = uploadedUrl.split('/storage/v1/object/public/product-images/');
            const imagePath = urlParts.length > 1 ? urlParts[1] : file.name;
            uploadedImageUrls.push(imagePath);
          } else {
            console.error('[MenuRestaurantScreen] Error uploading image:', uploadResult.error);
          }
        }
      }
      
      // Combinar imágenes: si estamos editando, combinar las existentes con las nuevas
      let allImageUrls: string[] = [];
      
      if (editingProduct && editingProduct.id) {
        // Al editar: obtener imágenes existentes del producto
        const existingProduct = products?.find(p => p.id === editingProduct.id);
        const existingImageUrls = existingProduct?.image_urls || [];
        
        // Filtrar las imágenes existentes que el usuario NO eliminó
        // productImageFiles contiene SOLO las imágenes nuevas (archivos subidos)
        // Las imágenes en productImages que no estén en productImageFiles son las existentes que se mantienen
        const existingImagesToKeep: string[] = [];
        
        // Convertir existingImageUrls a URLs completas para comparación
        const existingUrlsComplete = existingImageUrls.map(path => getProductImageUrl(path));

        // Filtrar las imágenes existentes que están en productImages (las que NO fueron eliminadas)
        productImages.forEach((img) => {
          // Si la imagen es una URL completa de Supabase y está en las existentes, mantenerla
          if (img.startsWith('http') && existingUrlsComplete.includes(img)) {
            // Extraer el path relativo de la URL completa
            const urlParts = img.split('/storage/v1/object/public/product-images/');
            const imagePath = urlParts.length > 1 ? urlParts[1] : '';
            if (imagePath) {
              existingImagesToKeep.push(imagePath);
            }
            }
        });
        
        // Combinar: primero las existentes que se mantienen, luego las nuevas subidas
        allImageUrls = [...existingImagesToKeep, ...uploadedImageUrls];
      } else {
        // Al crear: solo usar las imágenes nuevas subidas
        allImageUrls = uploadedImageUrls;
      }
      
      // Si no hay imágenes en allImageUrls pero hay en productImages, significa que son base64 sin subir
      // (lo cual no debería pasar porque ya se subieron, pero por si acaso)
      if (allImageUrls.length === 0 && productImages.length > 0) {
        productImages.forEach((img) => {
          if (img.startsWith('http')) {
            const urlParts = img.split('/storage/v1/object/public/product-images/');
            const imagePath = urlParts.length > 1 ? urlParts[1] : '';
            if (imagePath) allImageUrls.push(imagePath);
          }
        });
      }
      
      // Usar image_urls (array) como única fuente de imágenes

      const priceValue = parseFloat(editingProductPrice) || 0;
      
      // Validar que el precio sea válido
      if (isNaN(priceValue) || priceValue < 0) {
        console.error('[MenuRestaurantScreen] Precio inválido:', editingProductPrice);
        alert(t('restaurant.menu.errors.invalidPrice'));
        return;
      }
      
      // Validar que haya una categoría seleccionada
      if (!productCategory || productCategory.trim() === '') {
        console.error('[MenuRestaurantScreen] No hay categoría definida');
        alert(t('restaurant.menu.errors.emptyCategory') || 'Debes seleccionar o crear una categoría para el producto.');
        return;
      }

      console.log('[MenuRestaurantScreen] Guardando producto:', {
        restaurantId,
        name: editingProductName.trim(),
        description: editingProductDescription.trim(),
        price: priceValue,
        category: productCategory,
        subcategories: productSubcategories,
        complements: complements,
      });

      console.log('[MenuRestaurantScreen] Verificando si es edición o creación...');
      console.log('[MenuRestaurantScreen] editingProduct:', editingProduct);
      console.log('[MenuRestaurantScreen] editingProduct?.id:', editingProduct?.id);
      
      if (editingProduct && editingProduct.id) {
        console.log('[MenuRestaurantScreen] Modo: EDITAR producto existente');
        // Estamos editando un producto existente
        if (!productCategory || productCategory.trim() === '') {
          alert(t('restaurant.menu.errors.emptyCategory'));
          return;
        }
        const categoryName = toTitleCase(productCategory.trim());
        console.log('[MenuRestaurantScreen] Guardando producto con categoría:', categoryName);
        const updateResult = await updateProduct(editingProduct.id, {
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_urls: allImageUrls, // Enviar todas las URLs de imágenes
          category: categoryName,
          badges: [], // Ya no usamos badges para categorías
          subcategories: productSubcategories.length > 0 ? productSubcategories.map(sub => toTitleCase(sub.trim())) : [],
          complements: complements, // Siempre enviar el array, incluso si está vacío
          allow_custom_complements: allowCustomComplements,
          allow_special_instructions: allowSpecialInstructions,
        });

        if (updateResult.success && updateResult.data) {
          console.log('Producto actualizado en Supabase:', updateResult.data);
          // Refrescar los productos del contexto
          await refreshProducts();
        } else {
          console.error('Error al actualizar el producto:', updateResult.error);
          alert(t('restaurant.menu.errors.updateFailed'));
          return;
        }
      } else {
        // Estamos creando un nuevo producto
        if (!productCategory || productCategory.trim() === '') {
          alert(t('restaurant.menu.errors.emptyCategory'));
          return;
        }
        const categoryName = toTitleCase(productCategory.trim());
        console.log('[MenuRestaurantScreen] Modo: CREAR nuevo producto');
        console.log('[MenuRestaurantScreen] Creando producto con categoría:', categoryName);
        console.log('[MenuRestaurantScreen] Datos del producto a crear:', {
          restaurant_id: restaurantId,
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_urls: allImageUrls,
          category: categoryName,
          is_active: true,
          badges: [], // Ya no usamos badges para categorías
          complements: complements || [],
          allow_custom_complements: allowCustomComplements,
          allow_special_instructions: allowSpecialInstructions,
        });
        const createResult = await createProduct({
          restaurant_id: restaurantId,
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_urls: allImageUrls, // Enviar todas las URLs de imágenes
          category: categoryName,
          subcategories: productSubcategories.length > 0 ? productSubcategories : undefined,
          badges: [], // Ya no usamos badges para categorías
          complements: complements, // Siempre enviar el array, incluso si está vacío
          allow_custom_complements: allowCustomComplements,
          allow_special_instructions: allowSpecialInstructions,
        });

        if (createResult.success && createResult.data) {
          const created = createResult.data;
          console.log('[MenuRestaurantScreen] Producto creado en Supabase:', created);
          // Refrescar los productos del contexto
          await refreshProducts();
          
          // Agregar el producto solo a la sección "Menú" (no a "Sugerencias del chef" ni "Destacados")
          if (created.id) {
            // Si el producto está en "Sugerencias del chef" o "Destacados" (por valores por defecto o localStorage), eliminarlo
            // Usar la categoría del producto para las secciones
            const productCategoryForSections = productCategory || '';
            if (productCategoryForSections) {
            setChefSuggestionsByCategory((prev) => {
                const current = prev[productCategoryForSections] || [];
              if (current.includes(created.id)) {
                console.log('[MenuRestaurantScreen] Producto removido de Sugerencias del chef (estaba presente)');
                  return { ...prev, [productCategoryForSections]: current.filter((id) => id !== created.id) };
              }
              return prev;
            });
            
            setHighlightsByCategory((prev) => {
                const current = prev[productCategoryForSections] || [];
              if (current.includes(created.id)) {
                console.log('[MenuRestaurantScreen] Producto removido de Destacados (estaba presente)');
                  return { ...prev, [productCategoryForSections]: current.filter((id) => id !== created.id) };
              }
              return prev;
            });
            
            // Agregar solo a "Menú" si no está ya presente
            setMenuItemsByCategory((prev) => {
                const current = prev[productCategoryForSections] || [];
              if (!current.includes(created.id)) {
                console.log('[MenuRestaurantScreen] Producto agregado a Menú');
                  return { ...prev, [productCategoryForSections]: [...current, created.id] };
              }
              return prev;
            });
            }
          }
        } else {
          console.error('[MenuRestaurantScreen] Error al crear el producto:', createResult.error);
          // Revisar la consola para más detalles del error
          alert(t('restaurant.menu.errors.createFailed'));
          return;
        }
      }

      // Cerrar el modal de edición
      console.log('[MenuRestaurantScreen] ===== GUARDADO EXITOSO, cerrando modal =====');
      closeEditProduct();
    } catch (error: any) {
      console.error('[MenuRestaurantScreen] ===== ERROR AL GUARDAR =====');
      console.error('[MenuRestaurantScreen] Error al guardar el producto:', error);
      console.error('[MenuRestaurantScreen] Error details:', {
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });
      const errorMessage = error?.message || t('restaurant.menu.errors.saveFailed').replace('{message}', '');
      alert(t('restaurant.menu.errors.saveFailed').replace('{message}', errorMessage));
    } finally {
      console.log('[MenuRestaurantScreen] ===== FINALIZANDO handleSaveProduct =====');
      setIsSaving(false);
      console.log('[MenuRestaurantScreen] isSaving establecido a false');
    }
  };

  const addOrReplacePick = (dishId: number) => {
    // Usar la etiqueta seleccionada como categoría
    const categoryKey = selectedTagAsCategory || '';
    if (!categoryKey) {
      console.warn('[MenuRestaurantScreen] No hay categoría seleccionada para agregar producto');
      return;
    }

    if (pickerSection === 'chef') {
      setChefSuggestionsByCategory((prev) => {
        const current = prev[categoryKey] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        // evitar duplicados
        const uniq = Array.from(new Set(next));
        return { ...prev, [categoryKey]: uniq };
      });
    } else if (pickerSection === 'highlights') {
      setHighlightsByCategory((prev) => {
        const current = prev[categoryKey] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        const uniq = Array.from(new Set(next));
        return { ...prev, [categoryKey]: uniq };
      });
    } else {
      setMenuItemsByCategory((prev) => {
        const current = prev[categoryKey] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        const uniq = Array.from(new Set(next));
        return { ...prev, [categoryKey]: uniq };
      });
    }
    closePicker();
  };

  const removePick = async (section: 'chef' | 'highlights' | 'menu', dishId: number) => {
    try {
      if (section === 'menu') {
        // Si se elimina desde "Menú": eliminar de todas las secciones Y de la base de datos
        showConfirmModal(
          t('restaurant.menu.deleteProductConfirm'),
          async () => {
            try {
              // Eliminar el producto de la base de datos (soft delete)
              const deleteResult = await deleteProduct(dishId);
              if (!deleteResult.success || !deleteResult.data) {
                console.error('[MenuRestaurantScreen] Error al eliminar el producto de la base de datos:', deleteResult.error);
                alert(t('restaurant.menu.errors.deleteFailed'));
                return;
              }

              // Eliminar de todas las secciones del menú (chef, highlights, menu)
              setChefSuggestionsByCategory((prev) => {
                const updated: PicksByCategory = {};
                Object.keys(prev).forEach((category) => {
                  updated[category] = (prev[category] || []).filter((id) => id !== dishId);
                });
                return updated;
              });
              
              setHighlightsByCategory((prev) => {
                const updated: PicksByCategory = {};
                Object.keys(prev).forEach((category) => {
                  updated[category] = (prev[category] || []).filter((id) => id !== dishId);
                });
                return updated;
              });
              
              setMenuItemsByCategory((prev) => {
                const updated: PicksByCategory = {};
                Object.keys(prev).forEach((category) => {
                  updated[category] = (prev[category] || []).filter((id) => id !== dishId);
                });
                return updated;
              });

              // Refrescar los productos para actualizar la lista
              await refreshProducts();
              
              console.log('[MenuRestaurantScreen] Producto eliminado completamente de todas las secciones');
            } catch (error) {
              console.error('[MenuRestaurantScreen] Error al eliminar el producto:', error);
              alert(t('restaurant.menu.errors.deleteFailed'));
            }
          }
        );
        return;
      } else {
        // Si se elimina desde "chef" o "highlights": solo remover de esa sección específica
        // NO eliminar de la base de datos ni de "menu"
        // Encontrar la categoría del producto eliminado para removerlo de la sección correcta
        const dishToRemove = dishes.find((d) => d.id === dishId);
        if (dishToRemove && dishToRemove.category) {
          // Usar el campo 'category' del producto
          const productCategory = dishToRemove.category;

        if (section === 'chef') {
          setChefSuggestionsByCategory((prev) => {
              const current = prev[productCategory] || [];
              return { ...prev, [productCategory]: current.filter((id) => id !== dishId) };
          });
          console.log('[MenuRestaurantScreen] Producto removido de Sugerencias del chef');
        } else if (section === 'highlights') {
          setHighlightsByCategory((prev) => {
              const current = prev[productCategory] || [];
              return { ...prev, [productCategory]: current.filter((id) => id !== dishId) };
          });
          console.log('[MenuRestaurantScreen] Producto removido de Destacados');
          }
        }
      }
    } catch (error) {
      console.error('[MenuRestaurantScreen] Error al eliminar el producto:', error);
      alert(t('restaurant.menu.errors.deleteFailed'));
    }
  };

  const navigateToDish = (dishId: number) => {
    navigate(`/dish/${dishId}`, {
      state: { selectedCategory, scrollPosition: window.scrollY },
    });
  };

  // Helper para obtener el estilo de imagen con fallback
  const getImageStyle = (imageUrl: string | undefined | null) => {
    if (!imageUrl || imageUrl.trim() === '') {
      return {
        backgroundColor: '#f5f0e8',
      };
    }
    // Usar la misma lógica que MenuScreen para mantener consistencia
    return {
      backgroundImage: `url("${imageUrl}")`,
    };
  };

  // Función helper para mostrar el modal de confirmación
  const showConfirmModal = (message: string, onConfirm: () => void) => {
    setConfirmModalMessage(message);
    setConfirmModalCallback(() => onConfirm);
    setConfirmModalOpen(true);
  };

  // Función para confirmar la acción
  const handleConfirm = () => {
    if (confirmModalCallback) {
      confirmModalCallback();
    }
    setConfirmModalOpen(false);
    setConfirmModalMessage('');
    setConfirmModalCallback(null);
  };

  // Función para cancelar la acción
  const handleCancel = () => {
    setConfirmModalOpen(false);
    setConfirmModalMessage('');
    setConfirmModalCallback(null);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden overflow-y-scroll bg-background-light dark:bg-background-dark" style={{ height: '100vh' }}>
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />

      {/* Categories */}
      <div className="sticky top-[73px] z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        {/* Categorías (tiles estilo screenshot) */}
        {displayCategories.length > 0 && (
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between pb-3">
              <p className="text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase">
                {t('menu.categoriesLabel') || 'Categorías'}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {displayCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      if (selectedCategory !== cat) {
                        setSelectedCategory(cat);
                        setSelectedOrigin('');
                        setSelectedTag('');
                      }
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
                      {getCategoryTileIcon(cat)}
                    </span>
                    <p className={`text-[11px] leading-tight text-center px-1 ${
                      isSelected ? 'font-bold text-white' : 'font-semibold text-[#181611] dark:text-stone-300'
                    }`}>
                      {cat}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Subcategorías: etiqueta fija, solo los botones hacen scroll */}
        {selectedCategory && displaySubcategories.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <p className="px-4 pt-3 pb-2 text-xs font-bold tracking-wide text-gray-500 dark:text-gray-400 uppercase shrink-0">
              {t('menu.subcategoriesLabel') || 'Subcategorías'}
            </p>
            <div
              ref={subcategoriesScrollRef}
              className="max-h-[100px] overflow-y-auto overflow-x-hidden px-4 pb-2"
            >
              <div className="flex flex-wrap gap-2">
              {displaySubcategories.map((subcat) => (
                <button
                  key={subcat}
                  type="button"
                  onClick={() => {
                    subcategoriesScrollStoppedRef.current = true;
                    if (subcategoriesScrollRafRef.current) {
                      cancelAnimationFrame(subcategoriesScrollRafRef.current);
                      subcategoriesScrollRafRef.current = 0;
                    }
                    if (selectedSubcategory !== subcat) {
                      setSelectedSubcategory(subcat);
                      setSelectedOrigin('');
                      setSelectedTag('');
                    }
                  }}
                  className={`flex h-8 shrink-0 items-center justify-center rounded-full px-3 text-xs ${
                    selectedSubcategory === subcat
                      ? 'bg-primary/80 shadow-md shadow-primary/15 text-white font-semibold'
                      : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 font-medium text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {subcat}
                </button>
              ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      {!editMode && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
      )}

      {/* Toggle edit mode */}
      <div className="px-4 pt-2">
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={`w-full rounded-xl border px-4 py-3 flex items-center justify-between ${editMode
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] text-[#181611] dark:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">{editMode ? 'edit_off' : 'edit'}</span>
            <span className="text-sm font-bold">
              {editMode ? t('restaurant.menu.editModeActive') : t('restaurant.menu.switchToEditMode')}
            </span>
          </div>
        </button>
      </div>

      {/* Sugerencias del Chef (editable) */}
      {!searchQuery.trim() && (editMode || hasVisibleChefSuggestions) && (
        <section className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              {t('restaurant.menu.chefSuggestions')}
            </h3>
          </div>

          <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            <div className="flex gap-4">
              {chefIds.map((dishId) => {
                const dish = dishes.find((d) => d.id === dishId);
                // Filtrar por la categoría seleccionada
                if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return null;
                // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
                if (selectedSubcategory && dish.subcategories && !dish.subcategories.includes(selectedSubcategory)) return null;
                return (
                  <div
                    key={dish.id}
                    className="relative flex flex-col gap-3 rounded-xl min-w-[200px] max-w-[280px] w-[200px] bg-white dark:bg-gray-900 p-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0"
                  >
                    <div
                      onClick={() => (!editMode ? navigateToDish(dish.id) : undefined)}
                      className={`w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-lg flex flex-col relative ${!editMode ? 'cursor-pointer' : ''
                      }`}
                      style={getImageStyle(dish.image)}
                    >
                      <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                        {formatPrice(dish.price, localStorage.getItem('selectedLanguage'))}
                      </div>
                    </div>
                    <div className="px-2 pb-2 flex-1 flex flex-col">
                      <p className="text-[#181611] dark:text-white text-base font-bold leading-tight mb-1 line-clamp-2">
                        {dish.name}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal line-clamp-2">
                        {dish.description}
                      </p>
                    </div>

                    {editMode && (
                      <div className="absolute top-2 left-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => removePick('chef', dish.id)}
                          className="w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center"
                          title={t('restaurant.menu.delete')}
                        >
                          <span className="material-symbols-outlined text-red-500">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {editMode && (
                <button
                  type="button"
                  onClick={() => openPicker('chef')}
                  className="flex items-center justify-center min-w-[200px] w-[200px] aspect-[16/10] rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5"
                >
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl">add</span>
                    <span className="text-sm font-bold">
                      {t('restaurant.menu.addSuggestion')}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Destacados (editable) */}
      {!searchQuery.trim() && (editMode || hasVisibleHighlights) && (
        <section className="px-4 pb-4">
          <div className="flex items-end justify-between">
            <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2">
              {t('restaurant.menu.highlights')}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {highlightIds.map((dishId) => {
              const dish = dishes.find((d) => d.id === dishId);
              // Filtrar por la categoría seleccionada
              if (!dish || !selectedTagAsCategory || dish.category !== selectedTagAsCategory) return null;
              // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
              if (selectedSubcategory && dish.subcategories && !dish.subcategories.includes(selectedSubcategory)) return null;
              return (
                <div
                  key={dish.id}
                  className="relative flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div
                    onClick={() => (!editMode ? navigateToDish(dish.id) : undefined)}
                    className={`size-16 rounded-lg bg-cover bg-center shrink-0 ${!editMode ? 'cursor-pointer' : ''}`}
                    style={getImageStyle(dish.image)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold dark:text-white line-clamp-1">{dish.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{dish.description}</p>
                  </div>
                  {!editMode ? (
                    <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => removePick('highlights', dish.id)}
                        className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
                        title="Eliminar"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {editMode && highlightIds.length === 0 && (
              <button
                type="button"
                onClick={() => openPicker('highlights')}
                className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5 py-6"
              >
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                  <span className="text-sm font-bold">{t('restaurant.menu.addHighlight')}</span>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Menú (editable) - Siempre mostrar, pero con contenido diferente según búsqueda */}
      <section className="px-4 pb-4">
        <div className="flex items-center gap-2 pb-3">
          <span className="material-symbols-outlined text-[#181611] dark:text-white text-xl">restaurant_menu</span>
          <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
            {searchQuery.trim() ? t('menu.searchResults') || 'Resultados de búsqueda' : t('navigation.menu')}
          </h3>
        </div>


          {/* Menu Items */}
          <div className="flex flex-col gap-4">
            {(searchQuery.trim() 
              ? filteredDishes 
              : (menuIds.length > 0
                  ? menuIds
                      .map((dishId) => dishes.find((d) => d.id === dishId))
                      .filter((dish): dish is Dish => {
                  if (!dish) return false;
                  // Filtrar por la categoría seleccionada
                  if (!selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
                  // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
                  if (selectedSubcategory) {
                    return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
                  }
                  // Si hay un filtro de etiqueta adicional, aplicarlo
                        if (selectedTag) {
                          return dish.badges?.includes(selectedTag) || false;
                        }
                        return true;
                      })
                  : dishes.filter((dish) => {
                // Si no hay productos en menuItemsByCategory, mostrar todos los que tienen la categoría seleccionada
                if (!selectedTagAsCategory || dish.category !== selectedTagAsCategory) return false;
                // Si hay una subcategoría seleccionada, mostrar productos con esa subcategoría O sin subcategorías
                if (selectedSubcategory) {
                  return !dish.subcategories || dish.subcategories.length === 0 || dish.subcategories.includes(selectedSubcategory);
                }
                // Si hay un filtro de etiqueta adicional, aplicarlo
                      if (selectedTag) {
                        return dish.badges?.includes(selectedTag) || false;
                      }
                      return true;
                    })
                )
            ).map((dish) => (
                <div
                  key={dish.id}
                  onClick={() => (!editMode ? navigateToDish(dish.id) : undefined)}
              className={`group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform ${!editMode ? 'active:scale-[0.98] cursor-pointer' : ''
                  }`}
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
                          if (!editMode) navigateToDish(dish.id);
                        }}
                        className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-8 px-4 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                      >
                        <span className="truncate">{formatPrice(dish.price, localStorage.getItem('selectedLanguage'))}</span>
                      </button>
                      {editMode && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProduct(dish);
                            }}
                            className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                            title={t('restaurant.menu.edit')}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removePick('menu', dish.id);
                            }}
                            className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
                            title={t('restaurant.menu.delete')}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-32 h-32 bg-center bg-no-repeat bg-cover rounded-xl flex-shrink-0 relative" style={getImageStyle(dish.image)}>
                  </div>
                </div>
              ))}
            
            {searchQuery.trim() && filteredDishes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                <p className="text-sm text-center">{t('menu.noDishesFound')}</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm"
                >
                  {t('menu.clearFilters')}
                </button>
              </div>
            )}
            
            {editMode && !searchQuery.trim() && (
              <button
                type="button"
                onClick={() => openEditProduct()}
                className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5 py-6"
              >
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                  <span className="text-sm font-bold">{getAddButtonText(selectedCategory)}</span>
                </div>
              </button>
            )}
          </div>
        </section>

      {/* Modal: seleccionar dish */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181611] dark:text-white">
                {pickerSection === 'chef' 
                  ? t('restaurant.menu.chefSuggestions')
                  : pickerSection === 'highlights' 
                  ? t('restaurant.menu.highlights')
                    : t('restaurant.menu.menu')} • {selectedTagAsCategory || 'Sin categoría'}
              </h3>
              <button
                onClick={closePicker}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {categoryDishes.length === 0 ? (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No hay platillos en esta categoría para seleccionar.
                </p>
              ) : (
                categoryDishes.map((dish) => (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => addOrReplacePick(dish.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-left"
                  >
                    <div
                      className="size-12 rounded-lg bg-cover bg-center shrink-0"
                      style={getImageStyle(dish.image)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-[#181611] dark:text-white line-clamp-1">{dish.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{dish.description}</p>
                    </div>
                    <span className="text-xs font-bold text-primary">
                      {formatPrice(dish.price, localStorage.getItem('selectedLanguage'))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pantalla de edición de producto */}
      {editProductOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col overflow-y-auto"
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))'
          }}
        >
          {/* Header con imagen */}
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <div 
              className="absolute inset-0 bg-center bg-cover bg-no-repeat" 
              style={{ 
                backgroundImage: (productImages.length > 0 ? `url("${productImages[0]}")` : (editingProduct?.image ? `url("${editingProduct.image}")` : 'none')), 
                backgroundColor: '#f5f0e8' 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60"></div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
              {editingProduct?.badges?.includes('vegano') && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/90 backdrop-blur-md text-white text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">eco</span>Vegano
                </div>
              )}
            </div>
          </div>

          {/* Galería de imágenes editable */}
          <div className="px-4 py-4 bg-background-light dark:bg-background-dark">
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {/* Imágenes existentes */}
              {(() => {
                // Combinar imágenes: primero las nuevas (productImages), luego la original si existe y no está duplicada
                const allImages = [...productImages];
                if (editingProduct?.image && !productImages.includes(editingProduct.image)) {
                  allImages.push(editingProduct.image);
                }
                return allImages;
              })().map((image, index) => {
                const isOriginalImage = editingProduct?.image === image && !productImages.includes(image);
                return (
                  <div key={index} className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                    <img 
                      src={image} 
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(index, isOriginalImage)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                      title={t('restaurant.menu.deleteImage')}
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                );
              })}
              
              {/* Botón para agregar imagen */}
              <label className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center justify-center cursor-pointer hover:bg-primary/10 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  multiple
                />
                <div className="flex flex-col items-center gap-1">
                  <span className="material-symbols-outlined text-primary text-2xl">add</span>
                  <span className="text-xs font-bold text-primary">{t('restaurant.menu.add')}</span>
                </div>
              </label>
            </div>
          </div>

          {/* Contenido principal */}
          <main className="flex-1 -mt-6 bg-background-light dark:bg-background-dark rounded-t-3xl relative z-10">
            <div className="px-4 pt-6 pb-4">
              {/* Nombre y precio */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {isEditingName ? (
                    <div className="mb-2">
                      <input
                        type="text"
                        value={editingProductName}
                        onChange={(e) => setEditingProductName(e.target.value)}
                        onBlur={handleSaveName}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveName();
                          } else if (e.key === 'Escape') {
                            setEditingProductName(editingProduct?.name || '');
                            setIsEditingName(false);
                          }
                        }}
                        className="w-full text-2xl font-bold text-[#181611] dark:text-white leading-tight bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary-dark"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <h1 
                      onClick={() => setIsEditingName(true)}
                      className="text-2xl font-bold text-[#181611] dark:text-white leading-tight mb-2 cursor-pointer hover:opacity-70 transition-opacity"
                    >
                      {editingProductName || t('restaurant.menu.newProduct')}
                    </h1>
                  )}
                  {/* Categoría del producto */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-[#181611] dark:text-white mb-2">
                      {t('restaurant.menu.category') || 'Categoría'} <span className="text-red-500">*</span>
                    </label>
                    {!isCreatingNewCategory ? (
                      <div className="space-y-2">
                        {/* Selector de categoría existente */}
                        <select
                          value={productCategory}
                          onChange={(e) => {
                            if (e.target.value === '__create_new__') {
                              setIsCreatingNewCategory(true);
                              setNewCategoryName('');
                            } else {
                              selectCategory(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        >
                          <option value="">{t('restaurant.menu.selectCategory') || 'Seleccionar categoría...'}</option>
                          {mainCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="__create_new__" className="font-semibold">
                            + {t('restaurant.menu.createNewCategory') || 'Crear nueva categoría'}
                          </option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              createNewCategory();
                            } else if (e.key === 'Escape') {
                              setIsCreatingNewCategory(false);
                              setNewCategoryName('');
                            }
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border-2 border-primary bg-white dark:bg-gray-900 text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder={t('restaurant.menu.newCategoryName') || 'Nombre de la nueva categoría'}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={createNewCategory}
                          className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                          disabled={!newCategoryName.trim()}
                        >
                          <span className="material-symbols-outlined">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewCategory(false);
                            setNewCategoryName('');
                          }}
                          className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subcategorías del producto (estructura jerárquica) */}
                  {productCategory && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#181611] dark:text-white mb-2">
                        {t('restaurant.menu.subcategories') || 'Subcategorías'} <span className="text-gray-500 text-xs">({t('restaurant.menu.optional') || 'Opcional'})</span>
                      </label>
                      <div className="space-y-3">
                        {/* Botón para abrir el modal de subcategorías */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalCurrentPath('');
                            setSubcategoryModalOpen(true);
                          }}
                          className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#181611] dark:text-white hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm">
                            {productSubcategories.length > 0 
                              ? `${productSubcategories.length} ${productSubcategories.length === 1 ? 'subcategoría seleccionada' : 'subcategorías seleccionadas'}`
                              : t('restaurant.menu.selectSubcategory') || 'Seleccionar subcategorías...'}
                          </span>
                          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                        </button>
                        
                        {/* Mostrar subcategorías seleccionadas como badges */}
                        {productSubcategories.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {productSubcategories.map((subcat) => (
                              <div
                                key={subcat}
                                className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-sm"
                              >
                                <span className="text-primary">{subcat}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductSubcategories(productSubcategories.filter(s => s !== subcat));
                                  }}
                                  className="text-primary hover:text-primary-dark transition-colors"
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  {isEditingPrice ? (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">$</span>
                      <input
                        type="number"
                        value={editingProductPrice}
                        onChange={(e) => setEditingProductPrice(e.target.value)}
                        onBlur={handleSavePrice}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSavePrice();
                          } else if (e.key === 'Escape') {
                            setEditingProductPrice(editingProduct?.price ? editingProduct.price.toString() : '0');
                            setIsEditingPrice(false);
                          }
                        }}
                        className="w-24 text-2xl font-bold text-primary bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary-dark text-right"
                        min="0"
                        step="0.01"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <p 
                      onClick={() => setIsEditingPrice(true)}
                      className="text-2xl font-bold text-primary cursor-pointer hover:opacity-70 transition-opacity"
                    >
                      {(() => {
                        const priceValue = editingProductPrice ? parseFloat(editingProductPrice) : 0;
                        return !isNaN(priceValue) && isFinite(priceValue) 
                          ? formatPrice(priceValue, localStorage.getItem('selectedLanguage')) 
                          : '$0.00';
                      })()}
                    </p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              {isEditingDescription ? (
                <div className="mb-6">
                  <textarea
                    value={editingProductDescription}
                    onChange={(e) => setEditingProductDescription(e.target.value)}
                    onBlur={handleSaveDescription}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setEditingProductDescription(editingProduct?.description || '');
                        setIsEditingDescription(false);
                      }
                    }}
                    className="w-full text-base text-gray-600 dark:text-gray-300 leading-relaxed bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary-dark resize-none"
                    rows={3}
                    autoFocus
                  />
                </div>
              ) : (
                <p 
                  onClick={() => setIsEditingDescription(true)}
                  className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6 cursor-pointer hover:opacity-70 transition-opacity"
                >
                  {editingProductDescription || t('restaurant.menu.productDescription')}
                </p>
              )}

              {/* Opciones adicionales */}
              <div className="space-y-6 mb-6">
                {/* Complementos */}
                <div>
                  <h3 className="text-lg font-bold text-[#181611] dark:text-white mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">restaurant</span>
                    Complementos
                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400">(Opcional)</span>
                  </h3>
                  <div className="space-y-2">
                    {complements.map((complement) => (
                      <div key={complement.id} className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        {editingComplementId === complement.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={newComplementName}
                              onChange={(e) => setNewComplementName(e.target.value)}
                              className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#181611] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder={t('restaurant.menu.complementName')}
                            />
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-semibold text-primary">+$</span>
                              <input
                                type="number"
                                value={newComplementPrice}
                                onChange={(e) => setNewComplementPrice(e.target.value)}
                                className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-[#181611] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <button
                              onClick={saveEditComplement}
                              className="w-8 h-8 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                              title={t('restaurant.menu.save')}
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                            <button
                              onClick={cancelEditComplement}
                              className="w-8 h-8 rounded-full bg-gray-500/10 text-gray-500 flex items-center justify-center hover:bg-gray-500/20 transition-colors"
                              title={t('restaurant.menu.cancel')}
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center border-gray-300 dark:border-gray-600"></div>
                              <span className="font-medium text-[#181611] dark:text-white">{complement.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-primary">
                                {complement.price === 0 || complement.price === null || complement.price === undefined
                                  ? t('restaurant.menu.noCost')
                                  : `+${formatPrice(complement.price, localStorage.getItem('selectedLanguage'))}`}
                              </span>
                              <button
                                onClick={() => startEditComplement(complement)}
                                className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                title={t('restaurant.menu.edit')}
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => deleteComplement(complement.id)}
                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                title={t('restaurant.menu.delete')}
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                    
                    {/* Formulario para agregar nuevo complemento */}
                    {editingComplementId === null && (
                      <div className="flex items-center gap-2 p-4 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                        <input
                          type="text"
                          value={newComplementName}
                          onChange={(e) => setNewComplementName(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#181611] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nombre del complemento"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addComplement();
                            }
                          }}
                        />
                        <div className="flex items-center gap-1">
                          {showSinCosto ? (
                            <div 
                              onClick={() => {
                                setShowSinCosto(false);
                                setNewComplementPrice('');
                              }}
                              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#181611] dark:text-white text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                              {t('restaurant.menu.noCost')}
                            </div>
                          ) : (
                            <>
                              <span className="text-sm font-semibold text-primary">+$</span>
                              <input
                                type="number"
                                value={newComplementPrice}
                                onChange={(e) => setNewComplementPrice(e.target.value)}
                                className="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-[#181611] dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    addComplement();
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                        <button
                          onClick={addComplement}
                          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                          title={t('restaurant.menu.add')}
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Permitir complementos personalizados */}
                <div>
                  <label className="text-sm text-[#181611] dark:text-white mb-3 flex items-center justify-between gap-2 cursor-pointer w-full">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">add_circle</span>
                      <span>Permitir que el comensal agregue complementos no listados aqui</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowCustomComplements}
                      onChange={(e) => setAllowCustomComplements(e.target.checked)}
                      className="w-5 h-5 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                </div>

                {/* Instrucciones especiales */}
                <div>
                  <label className="text-sm text-[#181611] dark:text-white mb-3 flex items-center justify-between gap-2 cursor-pointer w-full">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">edit_note</span>
                      <span>Permitir instrucciones especiales</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowSpecialInstructions}
                      onChange={(e) => setAllowSpecialInstructions(e.target.checked)}
                      className="w-5 h-5 shrink-0 rounded border-2 border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                  </label>
                  {allowSpecialInstructions && (
                    <textarea 
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      readOnly={editingProduct === null}
                      className={`w-full bg-white dark:bg-gray-900 border-2 rounded-xl p-4 text-sm text-[#181611] dark:text-white placeholder:text-gray-400 outline-none transition-all resize-none ${editingProduct === null
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-60' 
                          : 'border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary focus:border-primary'
                      }`}
                      placeholder="Ej. Sin cebolla, salsa aparte, bien cocido..." 
                      rows={1}
                    ></textarea>
                  )}
                </div>
              </div>

              {/* Badge de vegano */}
              {editingProduct?.badges?.includes('vegano') && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex gap-3 mb-6">
                  <span className="material-symbols-outlined text-green-600 dark:text-green-400">check_circle</span>
                  <p className="text-xs text-green-700 dark:text-green-300 leading-relaxed">
                    <span className="font-bold">Sin productos de origen animal.</span> Este plato es apto para dietas vegetarianas y veganas.
                  </p>
                </div>
              )}
            </div>
          </main>

          {/* Botones de acción fijos */}
          <div className="fixed left-0 right-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
            <div className="max-w-md mx-auto flex gap-3">
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  closeEditProduct();
                }}
                className="relative flex-1 h-14 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-lg rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                <span className="material-symbols-outlined text-xl">close</span>
                <span>{t('restaurant.menu.cancel')}</span>
              </button>
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('[MenuRestaurantScreen] Botón Guardar clickeado');
                  handleSaveProduct();
                }}
                className="relative flex-1 h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                <span>{t('restaurant.menu.save')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {/* Modal de gestión de subcategorías */}
      {subcategoryModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white dark:bg-[#322a1a] rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181611] dark:text-white">
                {t('restaurant.menu.subcategories') || 'Subcategorías'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSubcategoryModalOpen(false);
                  setModalCurrentPath('');
                  setIsCreatingNewSubcategory(false);
                  setNewSubcategoryName('');
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-gray-600 dark:text-gray-300">close</span>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Subcategorías seleccionadas */}
              {productSubcategories.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('restaurant.menu.selectedSubcategories') || 'Subcategorías seleccionadas'} ({productSubcategories.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {productSubcategories.map((subcat) => (
                      <div
                        key={subcat}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20"
                      >
                        <span className="text-sm text-primary">{subcat}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProductSubcategories(productSubcategories.filter(s => s !== subcat));
                          }}
                          className="text-primary hover:text-primary-dark transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Breadcrumb de navegación */}
              {modalCurrentPath && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      const pathParts = modalCurrentPath.split(' > ');
                      if (pathParts.length > 1) {
                        setModalCurrentPath(pathParts.slice(0, -1).join(' > '));
                      } else {
                        setModalCurrentPath('');
                      }
                      setIsCreatingNewSubcategory(false);
                      setNewSubcategoryName('');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>{t('restaurant.menu.back') || 'Atrás'}</span>
                  </button>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    {modalCurrentPath.split(' > ').map((part, index, arr) => (
                      <React.Fragment key={index}>
                        {index > 0 && <span className="mx-1">/</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setModalCurrentPath(arr.slice(0, index + 1).join(' > '));
                            setIsCreatingNewSubcategory(false);
                            setNewSubcategoryName('');
                          }}
                          className="hover:text-primary transition-colors"
                        >
                          {part}
                        </button>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de subcategorías disponibles en el nivel actual */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {modalCurrentPath ? t('restaurant.menu.subcategories') || 'Subcategorías' : t('restaurant.menu.rootSubcategories') || 'Subcategorías principales'}
                </h4>
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 max-h-64 overflow-y-auto">
                  <div className="p-2 space-y-1">
                    {(() => {
                      // Obtener subcategorías del nivel actual
                      let currentLevelOptions: string[] = [];
                      
                      if (!modalCurrentPath) {
                        // Nivel raíz: mostrar todas las subcategorías de nivel raíz
                        currentLevelOptions = allAvailableSubcategories
                          .filter(sub => !sub.includes(' > '))
                          .sort();
                      } else {
                        // Nivel anidado: mostrar las hijas directas del nivel actual
                        currentLevelOptions = allAvailableSubcategories
                          .filter(sub => {
                            const searchPath = `${modalCurrentPath} > `;
                            if (!sub.startsWith(searchPath)) return false;
                            const remaining = sub.substring(searchPath.length);
                            return !remaining.includes(' > '); // Solo hijas directas
                          })
                          .map(sub => {
                            const searchPath = `${modalCurrentPath} > `;
                            return sub.substring(searchPath.length);
                          })
                          .filter((name, index, arr) => arr.indexOf(name) === index) // Eliminar duplicados
                          .sort();
                      }

                      return currentLevelOptions.length > 0 ? (
                        currentLevelOptions.map((optionName) => {
                          const fullPath = modalCurrentPath 
                            ? `${modalCurrentPath} > ${optionName}`
                            : optionName;
                          const isSelected = productSubcategories.includes(fullPath);
                          const hasChildren = allAvailableSubcategories.some(sub => 
                            sub.startsWith(fullPath + ' > ')
                          );

                          return (
                            <div
                              key={optionName}
                              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      if (!productSubcategories.includes(fullPath)) {
                                        setProductSubcategories([...productSubcategories, fullPath]);
                                      }
                                    } else {
                                      setProductSubcategories(productSubcategories.filter(s => s !== fullPath));
                                    }
                                  }}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <span className="text-sm font-medium text-[#181611] dark:text-white">
                                  {optionName}
                                </span>
                              </div>
                              {hasChildren && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalCurrentPath(fullPath);
                                    setIsCreatingNewSubcategory(false);
                                    setNewSubcategoryName('');
                                  }}
                                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-sm">
                                    chevron_right
                                  </span>
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          {t('restaurant.menu.noSubcategories') || 'No hay subcategorías disponibles'}
                        </div>
                      );
                    })()}

                    {/* Botón para crear nueva subcategoría */}
                    {!isCreatingNewSubcategory ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingNewSubcategory(true);
                          setNewSubcategoryName('');
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 transition-colors text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span>{t('restaurant.menu.createNewSubcategory') || 'Crear nueva subcategoría'}</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="text"
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const subcategoryName = toTitleCase(newSubcategoryName.trim());
                              const fullPath = modalCurrentPath 
                                ? `${modalCurrentPath} > ${subcategoryName}`
                                : subcategoryName;
                              
                              if (!productSubcategories.some(sub => sub.toLowerCase() === fullPath.toLowerCase())) {
                                setProductSubcategories([...productSubcategories, fullPath]);
                              }
                              setNewSubcategoryName('');
                              setIsCreatingNewSubcategory(false);
                            } else if (e.key === 'Escape') {
                              setIsCreatingNewSubcategory(false);
                              setNewSubcategoryName('');
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border-2 border-primary bg-white dark:bg-gray-900 text-[#181611] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                          placeholder={t('restaurant.menu.newSubcategoryName') || 'Nombre de la nueva subcategoría'}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const subcategoryName = toTitleCase(newSubcategoryName.trim());
                            const fullPath = modalCurrentPath 
                              ? `${modalCurrentPath} > ${subcategoryName}`
                              : subcategoryName;
                            
                            if (!productSubcategories.some(sub => sub.toLowerCase() === fullPath.toLowerCase())) {
                              setProductSubcategories([...productSubcategories, fullPath]);
                            }
                            setNewSubcategoryName('');
                            setIsCreatingNewSubcategory(false);
                          }}
                          className="px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                          disabled={!newSubcategoryName.trim()}
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsCreatingNewSubcategory(false);
                            setNewSubcategoryName('');
                          }}
                          className="px-3 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSubcategoryModalOpen(false);
                  setModalCurrentPath('');
                  setIsCreatingNewSubcategory(false);
                  setNewSubcategoryName('');
                }}
                className="px-6 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors font-medium"
              >
                {t('restaurant.menu.done') || 'Listo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#322a1a] rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                </div>
                <h3 className="text-xl font-bold text-[#181611] dark:text-white">
                  {t('restaurant.menu.confirmDeletion')}
                </h3>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                {confirmModalMessage}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 h-12 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                  <span>{t('restaurant.menu.cancel')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 h-12 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  <span>{t('restaurant.menu.delete')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Safe area bottom para navbar - Espacio adicional para scroll */}
      <div className="pb-48" style={{ paddingBottom: 'calc(200px + env(safe-area-inset-bottom))' }}></div>
    </div>
  );
};

export default MenuRestaurantScreen;

