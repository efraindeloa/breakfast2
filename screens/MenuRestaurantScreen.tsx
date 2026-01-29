import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useProducts } from '../contexts/ProductsContext';
import TopNavbar from '../components/TopNavbar';
import { formatPrice } from '../utils/currency';
import { useRestaurant } from '../contexts/RestaurantContext';

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

const DEFAULT_CHEF_SUGGESTIONS: PicksByCategory = {
  Entradas: [1, 2, 5, 4],
  'Platos Fuertes': [3, 6, 7, 8],
  Bebidas: [9, 10, 15, 16, 17, 18, 19],
  Postres: [11, 12, 29, 30, 31, 32, 33, 34],
  Coctelería: [13, 14, 20, 21, 22, 23, 24],
};

const DEFAULT_HIGHLIGHTS: PicksByCategory = {
  Entradas: [1, 2],
  'Platos Fuertes': [3, 7],
  Bebidas: [15],
  Postres: [29],
  Coctelería: [20],
};

const DEFAULT_MENU_ITEMS: PicksByCategory = {
  Entradas: [1, 2, 4, 5],
  'Platos Fuertes': [3, 6, 7, 8],
  Bebidas: [9, 10, 15, 16, 17, 18, 19],
  Postres: [11, 12, 29, 30, 31, 32, 33, 34],
  Coctelería: [20, 21, 22, 23, 24],
};

const buildStorageKey = (selectedRestaurant: string) =>
  `restaurant_menu_picks:${selectedRestaurant || 'default'}`;

const MenuRestaurantScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { products } = useProducts();
  const { selectedRestaurant } = useRestaurant();

  const categories = useMemo(
    () => [
      t('menu.categories.appetizers'),
      t('menu.categories.mains'),
      t('menu.categories.drinks'),
      t('menu.categories.desserts'),
      t('menu.categories.cocktails'),
    ],
    [t]
  );

  const categoryMap: Record<string, string> = useMemo(
    () => ({
      Entradas: t('menu.categories.appetizers'),
      'Platos Fuertes': t('menu.categories.mains'),
      Bebidas: t('menu.categories.drinks'),
      Postres: t('menu.categories.desserts'),
      Coctelería: t('menu.categories.cocktails'),
    }),
    [t]
  );

  const getOriginalCategory = (translatedCategory: string): string => {
    for (const [original, translated] of Object.entries(categoryMap)) {
      if (translated === translatedCategory) return original;
    }
    return translatedCategory;
  };

  const [selectedCategory, setSelectedCategory] = useState(() => {
    const initial = location.state?.selectedCategory;
    return initial && categories.includes(initial) ? initial : categories[0];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<OriginType>('');

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
  
  // Productos nuevos creados localmente
  const [newProducts, setNewProducts] = useState<Dish[]>([]);

  // Cargar picks desde localStorage por restaurante
  useEffect(() => {
    const key = buildStorageKey(selectedRestaurant);
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        chefSuggestionsByCategory?: PicksByCategory;
        highlightsByCategory?: PicksByCategory;
        menuItemsByCategory?: PicksByCategory;
      };
      if (parsed.chefSuggestionsByCategory) setChefSuggestionsByCategory(parsed.chefSuggestionsByCategory);
      if (parsed.highlightsByCategory) setHighlightsByCategory(parsed.highlightsByCategory);
      if (parsed.menuItemsByCategory) setMenuItemsByCategory(parsed.menuItemsByCategory);
    } catch {
      // ignore
    }
  }, [selectedRestaurant]);

  // Guardar picks
  useEffect(() => {
    const key = buildStorageKey(selectedRestaurant);
    localStorage.setItem(
      key,
      JSON.stringify({
        chefSuggestionsByCategory,
        highlightsByCategory,
        menuItemsByCategory,
      })
    );
  }, [chefSuggestionsByCategory, highlightsByCategory, menuItemsByCategory, selectedRestaurant]);

  // Recalcular selectedCategory si cambia idioma
  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory(categories[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const dishes: Dish[] = useMemo(() => {
    const productsFromContext = (products || []).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      image: p.image,
      badges: p.badges || [],
      category: p.category,
      origin: (p.origin || '') as OriginType,
    }));
    // Combinar productos del contexto con productos nuevos creados localmente
    return [...productsFromContext, ...newProducts];
  }, [products, newProducts]);

  const originalCategory = getOriginalCategory(selectedCategory);
  const chefIds = chefSuggestionsByCategory[originalCategory] || [];
  const highlightIds = highlightsByCategory[originalCategory] || [];
  const menuIds = menuItemsByCategory[originalCategory] || [];

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

  const categoryDishes = useMemo(() => {
    // Para el modal, limitar a la categoría actual
    return dishes.filter((d) => (d.category || '').trim().toLowerCase() === originalCategory.trim().toLowerCase());
  }, [dishes, originalCategory]);

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
    setProductImages(product?.image ? [product.image] : []);
    setProductImageFiles([]);
    setIsEditingName(false);
    setIsEditingPrice(false);
    setIsEditingDescription(false);
    setAllowSpecialInstructions(true);
    setSpecialInstructions('');
    setAllowCustomComplements(false);
    setComplements([
      { id: '1', name: 'Huevo Estrellado (2)', price: 35 },
      { id: '2', name: 'Pollo Deshebrado', price: 45 },
      { id: '3', name: 'Arrachera Grill', price: 85 },
    ]); // Inicializar con complementos por defecto
    setEditingComplementId(null);
    setNewComplementName('');
    setNewComplementPrice('');
    setShowSinCosto(false);
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

  // Función para guardar el producto y agregarlo a la lista
  const handleSaveProduct = () => {
    if (!editingProductName.trim()) {
      return; // No guardar si no hay nombre
    }

    if (editingProduct) {
      // Estamos editando un producto existente
      const updatedProduct: Dish = {
        ...editingProduct,
        name: editingProductName.trim(),
        description: editingProductDescription.trim(),
        price: parseFloat(editingProductPrice) || 0,
        image: productImages.length > 0 ? productImages[0] : editingProduct.image || '',
        category: originalCategory,
      };

      // Actualizar el producto en la lista de productos nuevos (si es un producto nuevo)
      setNewProducts((prev) => {
        const index = prev.findIndex(p => p.id === editingProduct.id);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = updatedProduct;
          return updated;
        }
        return prev;
      });

      // Actualizar el producto editado en el estado
      setEditingProduct(updatedProduct);
    } else {
      // Estamos creando un nuevo producto
      const maxId = Math.max(...dishes.map(d => d.id), ...products.map(p => p.id), 0);
      const newProductId = maxId + 1;

      const newProduct: Dish = {
        id: newProductId,
        name: editingProductName.trim(),
        description: editingProductDescription.trim(),
        price: parseFloat(editingProductPrice) || 0,
        image: productImages.length > 0 ? productImages[0] : '',
        badges: [],
        category: originalCategory,
        origin: '' as OriginType,
      };

      // Agregar el producto nuevo a la lista de productos nuevos
      setNewProducts((prev) => [...prev, newProduct]);

      // Agregar el producto a la lista de menú de la categoría actual
      setMenuItemsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        if (!current.includes(newProductId)) {
          return { ...prev, [originalCategory]: [...current, newProductId] };
        }
        return prev;
      });
    }

    // Cerrar el modal de edición
    closeEditProduct();
  };

  const addOrReplacePick = (dishId: number) => {
    if (pickerSection === 'chef') {
      setChefSuggestionsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        // evitar duplicados
        const uniq = Array.from(new Set(next));
        return { ...prev, [originalCategory]: uniq };
      });
    } else if (pickerSection === 'highlights') {
      setHighlightsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        const uniq = Array.from(new Set(next));
        return { ...prev, [originalCategory]: uniq };
      });
    } else {
      setMenuItemsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        const next = pickerEditingId
          ? current.map((id) => (id === pickerEditingId ? dishId : id))
          : [...current, dishId];
        const uniq = Array.from(new Set(next));
        return { ...prev, [originalCategory]: uniq };
      });
    }
    closePicker();
  };

  const removePick = (section: 'chef' | 'highlights' | 'menu', dishId: number) => {
    if (section === 'chef') {
      setChefSuggestionsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        return { ...prev, [originalCategory]: current.filter((id) => id !== dishId) };
      });
    } else if (section === 'highlights') {
      setHighlightsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        return { ...prev, [originalCategory]: current.filter((id) => id !== dishId) };
      });
    } else {
      setMenuItemsByCategory((prev) => {
        const current = prev[originalCategory] || [];
        return { ...prev, [originalCategory]: current.filter((id) => id !== dishId) };
      });
    }
  };

  const navigateToDish = (dishId: number) => {
    navigate(`/dish/${dishId}`, {
      state: { selectedCategory, scrollPosition: window.scrollY },
    });
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
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
              {editMode ? 'Modo edición activado' : 'Cambiar a modo de edición'}
            </span>
          </div>
        </button>
      </div>

      {/* Sugerencias del Chef (editable) */}
      {!searchQuery.trim() && (
        <section className="px-4 pt-6 pb-4">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-[#181611] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
              {t('menu.chefSuggestions')}
            </h3>
            {editMode && (
              <button
                type="button"
                onClick={() => openPicker('chef')}
                className="text-primary font-bold text-sm flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Agregar
              </button>
            )}
          </div>

          <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            <div className="flex gap-4">
              {chefIds.map((dishId) => {
                const dish = dishes.find((d) => d.id === dishId);
                if (!dish || dish.category !== originalCategory) return null;
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
                      style={{ backgroundImage: `url("${dish.image}")` }}
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
                          onClick={() => openPicker('chef', dish.id)}
                          className="w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center"
                          title="Cambiar"
                        >
                          <span className="material-symbols-outlined text-primary">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removePick('chef', dish.id)}
                          className="w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md flex items-center justify-center"
                          title="Eliminar"
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
                    <span className="text-sm font-bold">Agregar card</span>
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
              {t('menu.highlights')}
            </h3>
            {editMode && (
              <button
                type="button"
                onClick={() => openPicker('highlights')}
                className="text-primary font-bold text-sm flex items-center gap-1 pb-2"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Agregar
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {highlightIds.map((dishId) => {
              const dish = dishes.find((d) => d.id === dishId);
              if (!dish || dish.category !== originalCategory) return null;
              return (
                <div
                  key={dish.id}
                  className="relative flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
                >
                  <div
                    onClick={() => (!editMode ? navigateToDish(dish.id) : undefined)}
                    className={`size-16 rounded-lg bg-cover bg-center shrink-0 ${!editMode ? 'cursor-pointer' : ''}`}
                    style={{ backgroundImage: `url("${dish.image}")` }}
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
                        onClick={() => openPicker('highlights', dish.id)}
                        className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                        title="Cambiar"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
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

            {editMode && (
              <button
                type="button"
                onClick={() => openPicker('highlights')}
                className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5 py-6"
              >
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                  <span className="text-sm font-bold">Agregar card</span>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Menú (editable) */}
      {!searchQuery.trim() && (
        <section className="px-4 pb-4">
          <div className="flex items-center gap-2 pb-3">
            <span className="material-symbols-outlined text-[#181611] dark:text-white text-xl">restaurant_menu</span>
            <h3 className="text-[#181611] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
              {t('navigation.menu')}
            </h3>
            {editMode && (
              <button
                type="button"
                onClick={() => openPicker('menu')}
                className="text-primary font-bold text-sm flex items-center gap-1 ml-auto"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Agregar
              </button>
            )}
          </div>

          {/* Origin Filters */}
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

          {/* Menu Items */}
          <div className="flex flex-col gap-4">
            {menuIds
              .map((dishId) => dishes.find((d) => d.id === dishId))
              .filter((dish): dish is Dish => {
                if (!dish || dish.category !== originalCategory) return false;
                if (selectedOrigin) {
                  if (selectedOrigin === 'vegano') {
                    return dish.badges?.includes('vegano') || false;
                  }
                  return dish.origin === selectedOrigin;
                }
                return true;
              })
              .map((dish) => (
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
                      {!editMode && (
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary transition-colors cursor-default">
                          <span className="material-symbols-outlined text-lg">note_add</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-32 h-32 bg-center bg-no-repeat bg-cover rounded-xl flex-shrink-0 relative" style={{ backgroundImage: `url("${dish.image}")` }}>
                    {editMode && (
                      <div className="absolute top-2 left-2 flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditProduct(dish);
                          }}
                          className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                          title="Editar"
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
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            
            {editMode && (
              <button
                type="button"
                onClick={() => openEditProduct()}
                className="flex items-center justify-center w-full rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5 py-6"
              >
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                  <span className="text-sm font-bold">Agregar Entrada</span>
                </div>
              </button>
            )}
          </div>
        </section>
      )}

      {/* Modal: seleccionar dish */}
      {pickerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181611] dark:text-white">
                {pickerSection === 'chef' 
                  ? 'Sugerencias del chef' 
                  : pickerSection === 'highlights' 
                  ? 'Destacados' 
                  : 'Menú'} • {originalCategory}
              </h3>
              <button
                onClick={closePicker}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-3">
              <button
                type="button"
                onClick={() => openEditProduct()}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                <span className="font-bold">Crear nuevo producto</span>
              </button>
              
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
                      style={{ backgroundImage: `url("${dish.image}")` }}
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
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}>
              <button 
                onClick={closeEditProduct}
                className="px-4 py-2 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors bg-black/30 text-white hover:bg-black/50">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 0' }}>favorite</span>
                </button>
                <button className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-colors" title="Ver opiniones">
                  <span className="material-symbols-outlined">reviews</span>
                </button>
              </div>
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
                      title="Eliminar imagen"
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
                  <span className="text-xs font-bold text-primary">Agregar</span>
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
                      {editingProductName || 'Nuevo producto'}
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
                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium">
                      <span className="material-symbols-outlined text-sm">restaurant_menu</span>
                      {selectedCategory}
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
                      {editingProductPrice ? formatPrice(parseFloat(editingProductPrice), localStorage.getItem('selectedLanguage')) : '$0.00'}
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
                  {editingProductDescription || 'Descripción del producto'}
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
                              placeholder="Nombre del complemento"
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
                              title="Guardar"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                            </button>
                            <button
                              onClick={cancelEditComplement}
                              className="w-8 h-8 rounded-full bg-gray-500/10 text-gray-500 flex items-center justify-center hover:bg-gray-500/20 transition-colors"
                              title="Cancelar"
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
                                  ? 'Sin costo'
                                  : `+${formatPrice(complement.price, localStorage.getItem('selectedLanguage'))}`}
                              </span>
                              <button
                                onClick={() => startEditComplement(complement)}
                                className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                                title="Editar"
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                              <button
                                onClick={() => deleteComplement(complement.id)}
                                className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                title="Eliminar"
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
                              Sin costo
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
                          title="Agregar"
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
                      className="w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-[#181611] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none" 
                      placeholder="Ej. Sin cebolla, salsa aparte, bien cocido..." 
                      rows={3}
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

          {/* Botón de acción fijo */}
          <div className="fixed left-0 right-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 p-4 z-40" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
            <div className="max-w-md mx-auto">
              <button 
                onClick={handleSaveProduct}
                className="relative w-full h-14 bg-primary text-white font-bold text-lg rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-xl">save</span>
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuRestaurantScreen;

