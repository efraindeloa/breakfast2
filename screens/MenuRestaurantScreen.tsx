import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  origin: OriginType;
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
  const { selectedRestaurant } = useRestaurant();
  const { user, accountType } = useAuth();

  // Obtener categorías dinámicamente desde las etiquetas (badges) de los productos
  const categories = useMemo(() => {
    const tagsSet = new Set<string>();
    products?.forEach((product) => {
      if (product.badges && Array.isArray(product.badges)) {
        product.badges.forEach((badge) => {
          if (typeof badge === 'string' && badge.trim() !== '') {
            tagsSet.add(badge.trim());
          }
        });
      }
    });
    // Convertir a array y ordenar alfabéticamente
    return Array.from(tagsSet).sort();
  }, [products]);

  const categoryMap: Record<string, string> = useMemo(
    () => ({
      Entradas: t('menu.categories.appetizers'),
      'Platos Fuertes': t('menu.categories.mains'),
      Bebidas: t('menu.categories.drinks'),
      Postres: t('menu.categories.desserts'),
      Coctelería: t('menu.categories.cocktails'),
      Misceláneos: t('menu.categories.miscellaneous'),
    }),
    [t]
  );

  // Ya no necesitamos getOriginalCategory porque las categorías ahora son las etiquetas directamente
  const getOriginalCategory = (category: string): string => {
    return category; // Las categorías ahora son las etiquetas directamente
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('');
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
  
  // Etiquetas del producto
  const [productTags, setProductTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');
  
  // Modal de confirmación
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalCallback, setConfirmModalCallback] = useState<(() => void) | null>(null);
  
  // Estado para prevenir múltiples guardados simultáneos
  const [isSaving, setIsSaving] = useState(false);
  
  // Los productos ahora se guardan en Supabase, no localmente

  // Cargar picks desde la base de datos
  useEffect(() => {
    const loadMenuSections = async () => {
      if (!selectedRestaurant || accountType !== 'restaurant') {
        // Si no hay restaurante seleccionado o no es restaurante, usar valores por defecto vacíos
        setChefSuggestionsByCategory(DEFAULT_CHEF_SUGGESTIONS);
        setHighlightsByCategory(DEFAULT_HIGHLIGHTS);
        setMenuItemsByCategory(DEFAULT_MENU_ITEMS);
        return;
      }

      try {
        const restaurantIdResult = await getCurrentUserRestaurantId();
        if (!restaurantIdResult.success || !restaurantIdResult.data) {
          console.warn('[MenuRestaurantScreen] No se pudo obtener el restaurant_id');
          return;
        }

        const restaurantId = restaurantIdResult.data;
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
  }, [selectedRestaurant, accountType]);

  // Guardar picks en la base de datos (con debounce para evitar demasiadas llamadas)
  useEffect(() => {
    if (!selectedRestaurant || accountType !== 'restaurant') return;

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
  }, [chefSuggestionsByCategory, highlightsByCategory, menuItemsByCategory, selectedRestaurant, accountType]);

  // Establecer la primera categoría disponible si no hay ninguna seleccionada
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const dishes: Dish[] = useMemo(() => {
    const productsFromContext = (products || []).map((p) => {
      // Priorizar image_url sobre image, ya que image_url es el campo de la BD
      // y image puede estar vacío o tener una ruta relativa incorrecta
      let imageUrl = '';
      if (p.image_url) {
        // Si tenemos image_url, procesarlo para obtener la URL completa de Supabase Storage
        imageUrl = getProductImageUrl(p.image_url);
      } else if (p.image) {
        // Si no hay image_url pero hay image, usar image (ya viene procesado del contexto)
        imageUrl = p.image;
      }
      
      // Debug: log para productos sin imagen
      if (!imageUrl && p.id) {
        console.warn(`[MenuRestaurantScreen] Product ${p.id} (${p.name}) has no image. image: "${p.image}", image_url: "${p.image_url}"`);
      }
      
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: imageUrl,
        badges: p.badges || [],
        category: p.category,
        origin: (p.origin || '') as OriginType,
      };
    });
    // Los productos vienen del contexto (Supabase), no hay productos locales
    return productsFromContext;
  }, [products]);

  // La categoría seleccionada ahora es directamente la etiqueta
  const selectedTagAsCategory = selectedCategory || '';
  const chefIds = chefSuggestionsByCategory[selectedTagAsCategory] || [];
  const highlightIds = highlightsByCategory[selectedTagAsCategory] || [];
  const menuIds = menuItemsByCategory[selectedTagAsCategory] || [];

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

  // Extraer todas las etiquetas únicas de los productos que tienen la etiqueta seleccionada como categoría
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    dishes.forEach((dish) => {
      if (dish.badges && dish.badges.length > 0) {
        // Si el producto tiene la etiqueta seleccionada, mostrar todas sus etiquetas
        if (selectedTagAsCategory && dish.badges.includes(selectedTagAsCategory)) {
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
  const categoryDishes = useMemo(() => {
    if (!selectedTagAsCategory) return [];
    return dishes.filter((d) => d.badges && d.badges.includes(selectedTagAsCategory));
  }, [dishes, selectedTagAsCategory]);

  // Función de búsqueda fuzzy (igual que en MenuScreen)
  const fuzzyMatch = (text: string, query: string): boolean => {
    if (!text || !query) return false;
    
    const normalizedText = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
    const normalizedQuery = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    if (!normalizedText || !normalizedQuery) return false;

    // Coincidencia exacta
    if (normalizedText === normalizedQuery) return true;

    // Coincidencia de subcadena (esta debería encontrar "torta" en "torta ahogada")
    if (normalizedText.includes(normalizedQuery)) return true;

    // Coincidencia por palabras (todas las palabras del query deben aparecer)
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    if (queryWords.length > 1) {
      const allWordsMatch = queryWords.every(word => normalizedText.includes(word));
      if (allWordsMatch) return true;
    }

    // Coincidencia parcial de caracteres (≥70% de caracteres coinciden en orden)
    if (normalizedQuery.length >= 3) {
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

      if (maxConsecutive >= Math.min(3, normalizedQuery.length)) return true;
    }

    return false;
  };

  // Filtrar productos por búsqueda (buscar en todas las categorías cuando hay búsqueda)
  const filteredDishes = useMemo(() => {
    const hasSearchQuery = searchQuery.trim().length > 0;
    
    if (!hasSearchQuery) {
      // Sin búsqueda, retornar todos los productos (se filtrarán por categoría en la renderización)
      return dishes;
    }

    // Con búsqueda, buscar en todos los productos de todas las categorías
    const query = searchQuery.trim().toLowerCase();
    const filtered = dishes.filter((dish) => {
      const productName = (dish.name || '').toLowerCase();
      const productDescription = (dish.description || '').toLowerCase();
      
      const matchesName = fuzzyMatch(productName, query);
      const matchesDescription = fuzzyMatch(productDescription, query);
      
      // Debug en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('[MenuRestaurantScreen] Filtering dish:', {
          dishName: dish.name,
          productName,
          query,
          matchesName,
          matchesDescription,
          result: matchesName || matchesDescription
        });
      }
      
      return matchesName || matchesDescription;
    });
    
    // Debug en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[MenuRestaurantScreen] Filtered dishes:', {
        totalDishes: dishes.length,
        query,
        filteredCount: filtered.length,
        filteredNames: filtered.map(d => d.name)
      });
    }
    
    return filtered;
  }, [dishes, searchQuery]);

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
          // Filtrar por la etiqueta seleccionada como categoría
          if (!selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return false;
          // Si hay un filtro de etiqueta adicional, aplicarlo
          if (selectedTag) {
            return dish.badges?.includes(selectedTag) || false;
          }
          return true;
        }).length;
    }
    return dishes.filter((dish) => {
      // Filtrar por la etiqueta seleccionada como categoría
      if (!selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return false;
      // Si hay un filtro de etiqueta adicional, aplicarlo
      if (selectedTag) {
        return dish.badges?.includes(selectedTag) || false;
      }
      return true;
    }).length;
  }, [dishes, menuIds, selectedTagAsCategory, selectedTag, searchQuery, filteredDishes]);

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
    // Normalizar las etiquetas del producto (asegurar que sean strings y estén normalizadas)
    const normalizedBadges = product?.badges 
      ? product.badges
          .filter((badge): badge is string => typeof badge === 'string' && badge.trim() !== '')
          .map(badge => badge.trim().toLowerCase())
      : [];
    setProductTags(normalizedBadges); // Inicializar con las etiquetas del producto normalizadas
    setNewTagName('');
    setEditProductOpen(true);
    closePicker(); // Cerrar el picker si está abierto
  };

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
    setProductTags([]);
    setNewTagName('');
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

  // Funciones CRUD para etiquetas
  const addTag = () => {
    console.log('[MenuRestaurantScreen] addTag llamado, newTagName:', newTagName);
    if (!newTagName.trim()) {
      console.warn('[MenuRestaurantScreen] No se puede agregar etiqueta: el nombre está vacío');
      return; // No hacer nada si no hay nombre
    }
    const tagName = toTitleCase(newTagName.trim());
    // Evitar duplicados (case-insensitive)
    if (!productTags.some(tag => tag.toLowerCase() === tagName.toLowerCase())) {
      console.log('[MenuRestaurantScreen] Agregando etiqueta:', tagName);
      setProductTags([...productTags, tagName]);
      setNewTagName('');
    } else {
      console.warn('[MenuRestaurantScreen] Etiqueta duplicada:', tagName);
    }
  };

  const deleteTag = (tagToDelete: string) => {
    // Normalizar la etiqueta a eliminar para comparación case-insensitive
    const normalizedTagToDelete = tagToDelete.trim().toLowerCase();
    setProductTags(productTags.filter(tag => tag.trim().toLowerCase() !== normalizedTagToDelete));
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
        
        // Filtrar las imágenes que no fueron eliminadas (las que están en productImages)
        // productImages contiene las imágenes que el usuario quiere mantener (nuevas + existentes no eliminadas)
        const existingImagesToKeep: string[] = [];
        
        // Crear un mapa de paths a URLs completas para comparación
        const pathToFullUrl = new Map<string, string>();
        existingImageUrls.forEach(path => {
          pathToFullUrl.set(path, getProductImageUrl(path));
        });
        
        productImages.forEach((img) => {
          // Si la imagen es una URL completa de Supabase, extraer el path y verificar si está en las existentes
          if (img.startsWith('http')) {
            const urlParts = img.split('/storage/v1/object/public/product-images/');
            const imagePath = urlParts.length > 1 ? urlParts[1] : '';
            if (imagePath && existingImageUrls.includes(imagePath)) {
              existingImagesToKeep.push(imagePath);
            }
          } else if (img && !img.startsWith('data:')) {
            // Si es un path relativo (no base64), verificar si está en las existentes
            if (existingImageUrls.includes(img)) {
              existingImagesToKeep.push(img);
            }
          }
          // Si es base64 (data:), es una imagen nueva que se subirá, no la agregamos aquí
        });
        
        // Combinar: primero las existentes que se mantienen, luego las nuevas
        allImageUrls = [...existingImagesToKeep, ...uploadedImageUrls];
      } else {
        // Al crear: solo usar las imágenes nuevas subidas
        allImageUrls = uploadedImageUrls;
      }
      
      // Si no hay imágenes nuevas pero hay imágenes en productImages que no son archivos (URLs existentes)
      if (allImageUrls.length === 0 && productImages.length > 0) {
        productImages.forEach((img) => {
          if (img.startsWith('http')) {
            const urlParts = img.split('/storage/v1/object/public/product-images/');
            const imagePath = urlParts.length > 1 ? urlParts[1] : '';
            if (imagePath) allImageUrls.push(imagePath);
          } else if (img) {
            allImageUrls.push(img);
          }
        });
      }
      
      // image_url es la primera imagen para compatibilidad
      const imageUrl = allImageUrls.length > 0 ? allImageUrls[0] : '';

      const priceValue = parseFloat(editingProductPrice) || 0;
      
      // Validar que el precio sea válido
      if (isNaN(priceValue) || priceValue < 0) {
        console.error('[MenuRestaurantScreen] Precio inválido:', editingProductPrice);
        alert(t('restaurant.menu.errors.invalidPrice'));
        return;
      }
      
      // Validar que haya al menos una etiqueta (categoría)
      console.log('[MenuRestaurantScreen] Validando etiquetas:', productTags);
      if (!productTags || productTags.length === 0) {
        console.error('[MenuRestaurantScreen] No hay etiquetas definidas');
        alert('Debes agregar al menos una etiqueta al producto. Las etiquetas funcionan como categorías.');
        return;
      }

        console.log('[MenuRestaurantScreen] Guardando producto:', {
        restaurantId,
        name: editingProductName.trim(),
        description: editingProductDescription.trim(),
        price: priceValue,
        image_url: imageUrl || 'sin imagen',
        badges: productTags, // Las etiquetas ahora son las categorías
        complements: complements,
      });

      console.log('[MenuRestaurantScreen] Verificando si es edición o creación...');
      console.log('[MenuRestaurantScreen] editingProduct:', editingProduct);
      console.log('[MenuRestaurantScreen] editingProduct?.id:', editingProduct?.id);
      
      if (editingProduct && editingProduct.id) {
        console.log('[MenuRestaurantScreen] Modo: EDITAR producto existente');
        // Estamos editando un producto existente
        console.log('[MenuRestaurantScreen] Guardando producto con badges:', productTags);
        const updateResult = await updateProduct(editingProduct.id, {
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_url: imageUrl || undefined,
          image_urls: allImageUrls, // Enviar todas las URLs de imágenes
          category: productTags && productTags.length > 0 ? productTags[0] : '', // Usar la primera etiqueta como categoría para compatibilidad
          origin: '', // Ya no usamos origin
          badges: productTags || [], // Las etiquetas son las categorías
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
        console.log('[MenuRestaurantScreen] Modo: CREAR nuevo producto');
        console.log('[MenuRestaurantScreen] Creando producto con badges:', productTags);
        console.log('[MenuRestaurantScreen] Datos del producto a crear:', {
          restaurant_id: restaurantId,
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_url: imageUrl || undefined,
          image_urls: allImageUrls,
          category: productTags && productTags.length > 0 ? productTags[0] : '', // Usar la primera etiqueta como categoría para compatibilidad
          origin: '', // Ya no usamos origin
          is_active: true,
          badges: productTags || [], // Las etiquetas son las categorías
          complements: complements || [],
          allow_custom_complements: allowCustomComplements,
          allow_special_instructions: allowSpecialInstructions,
        });
        const createResult = await createProduct({
          restaurant_id: restaurantId,
          name: editingProductName.trim(),
          description: editingProductDescription.trim(),
          price: priceValue,
          image_url: imageUrl || undefined,
          image_urls: allImageUrls, // Enviar todas las URLs de imágenes
          category: productTags && productTags.length > 0 ? productTags[0] : '', // Usar la primera etiqueta como categoría para compatibilidad
          origin: '', // Ya no usamos origin
          badges: productTags || [], // Las etiquetas son las categorías
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
            // Usar la primera etiqueta del producto como categoría para las secciones
            const productCategory = productTags && productTags.length > 0 ? productTags[0] : '';
            if (productCategory) {
              setChefSuggestionsByCategory((prev) => {
                const current = prev[productCategory] || [];
                if (current.includes(created.id)) {
                  console.log('[MenuRestaurantScreen] Producto removido de Sugerencias del chef (estaba presente)');
                  return { ...prev, [productCategory]: current.filter((id) => id !== created.id) };
                }
                return prev;
              });
              
              setHighlightsByCategory((prev) => {
                const current = prev[productCategory] || [];
                if (current.includes(created.id)) {
                  console.log('[MenuRestaurantScreen] Producto removido de Destacados (estaba presente)');
                  return { ...prev, [productCategory]: current.filter((id) => id !== created.id) };
                }
                return prev;
              });
              
              // Agregar solo a "Menú" si no está ya presente
              setMenuItemsByCategory((prev) => {
                const current = prev[productCategory] || [];
                if (!current.includes(created.id)) {
                  console.log('[MenuRestaurantScreen] Producto agregado a Menú');
                  return { ...prev, [productCategory]: [...current, created.id] };
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
        if (dishToRemove && dishToRemove.badges && dishToRemove.badges.length > 0) {
          // Usar la primera etiqueta del producto como categoría
          const productCategory = dishToRemove.badges[0];
          
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
      <TopNavbar title={selectedRestaurant || 'RESTAURANT'} showAvatar={true} />

      {/* Categories */}
      <div className="sticky top-[73px] z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex gap-3 p-4 overflow-x-auto no-scrollbar">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedOrigin(''); // Limpiar filtro al cambiar categoría
                setSelectedTag(''); // Limpiar filtro de etiqueta al cambiar categoría
              }}
              className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 ${
                !searchQuery.trim() && selectedCategory === category
                  ? 'bg-primary shadow-md shadow-primary/20'
                  : 'bg-white dark:bg-[#322a1a] border border-[#f4f3f0] dark:border-[#3d3321]'
              }`}
            >
              <p
                className={`text-sm font-${
                  !searchQuery.trim() && selectedCategory === category ? 'semibold' : 'medium'
                } ${
                  !searchQuery.trim() && selectedCategory === category ? 'text-white' : 'text-[#181611] dark:text-stone-300'
                }`}
              >
                {category}
              </p>
            </button>
          ))}
        </div>
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
          className={`w-full rounded-xl border px-4 py-3 flex items-center justify-between ${
            editMode
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
      {!searchQuery.trim() && (
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
                // Filtrar por la etiqueta seleccionada como categoría
                if (!dish || !selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return null;
                return (
                  <div
                    key={dish.id}
                    className="relative flex flex-col gap-3 rounded-xl min-w-[200px] max-w-[280px] w-[200px] bg-white dark:bg-gray-900 p-2 shadow-sm border border-gray-100 dark:border-gray-800 shrink-0"
                  >
                    <div
                      onClick={() => (!editMode ? navigateToDish(dish.id) : undefined)}
                      className={`w-full bg-center bg-no-repeat aspect-[16/10] bg-cover rounded-lg flex flex-col relative ${
                        !editMode ? 'cursor-pointer' : ''
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

              {editMode && chefIds.length === 0 && (
                <button
                  type="button"
                  onClick={() => openPicker('chef')}
                  className="flex items-center justify-center min-w-[200px] w-[200px] aspect-[16/10] rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5"
                >
                  <div className="flex flex-col items-center">
                    <span className="material-symbols-outlined text-3xl">add</span>
                    <span className="text-sm font-bold">{t('restaurant.menu.addSuggestion')}</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Destacados (editable) */}
      {!searchQuery.trim() && (
        <section className="px-4 pb-4">
          <div className="flex items-end justify-between">
            <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-2">
              {t('restaurant.menu.highlights')}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {highlightIds.map((dishId) => {
              const dish = dishes.find((d) => d.id === dishId);
              // Filtrar por la etiqueta seleccionada como categoría
              if (!dish || !selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return null;
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
                        // Filtrar por la etiqueta seleccionada como categoría
                        if (!selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return false;
                        // Si hay un filtro de etiqueta adicional, aplicarlo
                        if (selectedTag) {
                          return dish.badges?.includes(selectedTag) || false;
                        }
                        return true;
                      })
                  : dishes.filter((dish) => {
                      // Si no hay productos en menuItemsByCategory, mostrar todos los que tienen la etiqueta seleccionada
                      if (!selectedTagAsCategory || !dish.badges || !dish.badges.includes(selectedTagAsCategory)) return false;
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
                  className={`group relative flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-[#2d2516] p-4 shadow-[0_2px_15px_rgba(0,0,0,0.05)] border border-[#f4f3f0] dark:border-[#3d3321] transition-transform ${
                    !editMode ? 'active:scale-[0.98] cursor-pointer' : ''
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
                      {!editMode && (
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary transition-colors cursor-default">
                          <span className="material-symbols-outlined text-lg">note_add</span>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingProduct?.origin && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">
                          {getFiltersForCategory(selectedCategory).find(f => f.value === editingProduct.origin)?.icon || 'restaurant_menu'}
                        </span>
                        {t(getFilterTranslationKey(editingProduct.origin))}
                      </div>
                    )}
                    {productTags.map((tag) => (
                      <div key={tag} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
                        <span className="material-symbols-outlined text-sm">label</span>
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteTag(tag);
                          }}
                          className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors flex-shrink-0"
                          title={t('restaurant.menu.deleteTag')}
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                    ))}
                    {/* Input para agregar nueva etiqueta */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => {
                          e.stopPropagation();
                          const value = e.target.value;
                          console.log('[MenuRestaurantScreen] Input onChange, value:', value);
                          setNewTagName(value);
                        }}
                        onFocus={(e) => {
                          e.stopPropagation();
                          console.log('[MenuRestaurantScreen] Input onFocus');
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('[MenuRestaurantScreen] Input onClick');
                        }}
                        className="w-24 px-1 py-0.5 rounded border-0 bg-transparent text-[#181611] dark:text-white text-xs focus:outline-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder={t('restaurant.menu.tag')}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            console.log('[MenuRestaurantScreen] Enter presionado en input de etiqueta');
                            addTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addTag();
                        }}
                        className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
                        title={t('restaurant.menu.addTag')}
                      >
                        <span className="material-symbols-outlined text-xs">add</span>
                      </button>
                    </div>
                  </div>
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
                      className={`w-full bg-white dark:bg-gray-900 border-2 rounded-xl p-4 text-sm text-[#181611] dark:text-white placeholder:text-gray-400 outline-none transition-all resize-none ${
                        editingProduct === null 
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

