import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { HistoricalOrder, HistoricalOrderItem } from '../types/order';
import { getOrderHistoryById } from '../services/database';

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
  media: string[]; // URLs de archivos (en producción)
  timestamp: string;
  updatedAt?: string;
}

interface ReviewScreenProps {}

const ReviewScreen: React.FC<ReviewScreenProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Obtener el orderId desde location.state
  const orderId = (location.state as any)?.orderId || null;
  
  // Estados principales
  const [selectedReviewType, setSelectedReviewType] = useState<'experience' | 'dish' | null>(null);
  const [selectedDishId, setSelectedDishId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [chipInput, setChipInput] = useState('');
  const [showChipSuggestions, setShowChipSuggestions] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [linkPhotoToDish, setLinkPhotoToDish] = useState(false);
  const [reviewsRefreshKey, setReviewsRefreshKey] = useState(0); // Para forzar actualización de reviews
  
  // Cargar la última orden pagada desde Supabase
  const [lastOrder, setLastOrder] = useState<HistoricalOrder | null>(null);
  
  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setLastOrder(null);
        return;
      }
      
      try {
        const order = await getOrderHistoryById(orderId);
        setLastOrder(order);
      } catch (error) {
        console.error('Error loading order:', error);
        setLastOrder(null);
      }
    };
    
    loadOrder();
  }, [orderId]);
  
  // Cargar opiniones existentes para esta orden
  const existingReviews = useMemo<Review[]>(() => {
    if (!orderId) return [];
    
    try {
      const reviewsData = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (reviewsData) {
        const allReviews: Review[] = JSON.parse(reviewsData);
        return allReviews.filter(r => r.orderId === orderId);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    return [];
  }, [orderId, reviewsRefreshKey]); // Agregar reviewsRefreshKey como dependencia
  
  // Función para obtener el nombre correcto del item
  const getItemName = (item: HistoricalOrderItem): string => {
    // Si el nombre es una clave de traducción inválida (como "dishes.10001.name"), 
    // y es un combo (ID > 10000), intentar corregirlo
    if (item.id > 10000 && item.name && (item.name.startsWith('dishes.') || item.name.includes('.'))) {
      // Intentar extraer el nombre de las notas si están disponibles
      // El formato es: "Promoción: [subtitle]. Incluye: ..."
      if (item.notes) {
        // Buscar el patrón "Promoción: [texto]" antes de ". Incluye:"
        const promoMatch = item.notes.match(/Promoción:\s*([^\.]+?)(?:\.\s*Incluye:|$)/);
        if (promoMatch && promoMatch[1]) {
          return promoMatch[1].trim();
        }
        // Si no funciona, intentar buscar cualquier texto después de "Promoción:" hasta el punto
        const altMatch = item.notes.match(/Promoción:\s*([^\.]+)/);
        if (altMatch && altMatch[1]) {
          return altMatch[1].trim();
        }
      }
      // Si no se puede extraer, usar un nombre genérico basado en el ID
      return `Combo Promocional #${item.id - 10000}`;
    }
    // Para items normales o combos con nombre correcto, usar el nombre directamente
    return item.name;
  };

  // Obtener productos únicos de la orden (sin duplicados por id)
  const uniqueOrderItems = useMemo<HistoricalOrderItem[]>(() => {
    if (!lastOrder) return [];
    
    const uniqueItems = new Map<number, HistoricalOrderItem>();
    lastOrder.items.forEach(item => {
      if (!uniqueItems.has(item.id)) {
        // Corregir el nombre si es necesario
        const correctedItem = {
          ...item,
          name: getItemName(item)
        };
        uniqueItems.set(item.id, correctedItem);
      }
    });
    return Array.from(uniqueItems.values());
  }, [lastOrder]);
  
  // Opciones de chips según el tipo de review
  const chipOptions = {
    experience: [
      t('review.chips.excellentService'),
      t('review.chips.deliciousFood'),
      t('review.chips.pleasantAtmosphere'),
      t('review.chips.perfectCoffee'),
      t('review.chips.quickService')
    ],
    dish: [
      t('review.chips.excellentService'),
      t('review.chips.deliciousFood'),
      t('review.chips.perfectTemperature'),
      t('review.chips.goodPortion'),
      t('review.chips.wellPresented')
    ]
  };
  
  const currentChipOptions = selectedReviewType ? chipOptions[selectedReviewType] : [];
  
  const getRatingLabel = (rating: number): string => {
    if (rating === 0) return '';
    if (rating === 1) return t('review.ratingLabels.veryBad');
    if (rating === 2) return t('review.ratingLabels.bad');
    if (rating === 3) return t('review.ratingLabels.okay');
    if (rating === 4) return t('review.ratingLabels.good');
    if (rating === 5) return t('review.ratingLabels.excellent');
    return '';
  };
  
  // Inicializar formulario con opinión existente si se está editando
  useEffect(() => {
    if (editingReviewId) {
      const reviewToEdit = existingReviews.find(r => r.id === editingReviewId);
      if (reviewToEdit) {
        setSelectedReviewType(reviewToEdit.type);
        if (reviewToEdit.type === 'dish' && reviewToEdit.itemId) {
          setSelectedDishId(reviewToEdit.itemId);
        }
        setRating(reviewToEdit.rating);
        setSelectedChips(reviewToEdit.chips);
        setComment(reviewToEdit.comment);
        setSelectedMedia([]); // Los archivos no se pueden restaurar desde localStorage
      }
    } else {
      // Resetear formulario si no se está editando
      setSelectedReviewType(null);
      setSelectedDishId(null);
      setRating(0);
      setSelectedChips([]);
      setComment('');
      setSelectedMedia([]);
    }
  }, [editingReviewId, existingReviews]);

  
  const handleStarClick = (value: number) => {
    setRating(value);
  };
  
  const handleStarHover = (value: number) => {
    setHoveredRating(value);
  };
  
  const handleStarLeave = () => {
    setHoveredRating(0);
  };
  
  const toggleChip = (chip: string) => {
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip)
        : [...prev, chip]
    );
    setChipInput('');
    setShowChipSuggestions(false);
  };
  
  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files).slice(0, 5 - selectedMedia.length);
      setSelectedMedia(prev => [...prev, ...newFiles]);
    }
  };
  
  const removeMedia = (index: number) => {
    setSelectedMedia(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = () => {
    if (!orderId || !selectedReviewType || rating === 0) return;
    
    // Obtener nombre del producto si es una opinión de platillo
    let itemName: string | undefined;
    if (selectedReviewType === 'dish' && selectedDishId) {
      const item = uniqueOrderItems.find(i => i.id === selectedDishId);
      itemName = item?.name;
    }
    
    // Crear la review
    const reviewData: Review = {
      id: editingReviewId || `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderId,
      type: selectedReviewType,
      itemId: selectedReviewType === 'dish' ? selectedDishId || undefined : undefined,
      itemName,
      rating,
      chips: selectedChips,
      comment,
      media: [], // En producción, aquí se subirían los archivos y se guardarían las URLs
      timestamp: editingReviewId ? existingReviews.find(r => r.id === editingReviewId)?.timestamp || new Date().toISOString() : new Date().toISOString(),
      updatedAt: editingReviewId ? new Date().toISOString() : undefined,
    };
    
    // Guardar review en localStorage
    try {
      const reviewsData = localStorage.getItem(REVIEWS_STORAGE_KEY);
      let allReviews: Review[] = [];
      
      if (reviewsData) {
        allReviews = JSON.parse(reviewsData);
      }
      
      if (editingReviewId) {
        // Actualizar review existente
        const index = allReviews.findIndex(r => r.id === editingReviewId);
        if (index >= 0) {
          allReviews[index] = reviewData;
        }
      } else {
        // Agregar nueva review
        allReviews.push(reviewData);
      }
      
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(allReviews));
      
      // Forzar actualización de existingReviews
      setReviewsRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving review:', error);
    }
    
    // Resetear formulario
    setEditingReviewId(null);
    setSelectedReviewType(null);
    setSelectedDishId(null);
    setRating(0);
    setSelectedChips([]);
    setComment('');
    setSelectedMedia([]);
  };
  
  const handleEditReview = (reviewId: string) => {
    setEditingReviewId(reviewId);
  };
  
  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setSelectedReviewType(null);
    setSelectedDishId(null);
    setRating(0);
    setSelectedChips([]);
    setComment('');
    setSelectedMedia([]);
  };
  
  const handleSelectReviewType = (type: 'experience' | 'dish', dishId?: number) => {
    // Verificar si ya existe una review para este producto o experiencia
    // Leer directamente de localStorage para evitar problemas de timing
    let existingReview: Review | undefined;
    try {
      const reviewsData = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (reviewsData && orderId) {
        const allReviews: Review[] = JSON.parse(reviewsData);
        const orderReviews = allReviews.filter(r => r.orderId === orderId);
        
        if (type === 'dish' && dishId !== undefined) {
          existingReview = orderReviews.find(r => r.type === 'dish' && r.itemId === dishId);
        } else if (type === 'experience') {
          existingReview = orderReviews.find(r => r.type === 'experience');
        }
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    
    // Si existe una review, cargar sus datos directamente (modo edición)
    if (existingReview) {
      setEditingReviewId(existingReview.id);
      setSelectedReviewType(type);
      if (type === 'experience') {
        setSelectedDishId(null);
      } else if (dishId !== undefined) {
        setSelectedDishId(dishId);
      }
      // Cargar los datos de la review directamente
      setRating(existingReview.rating);
      setHoveredRating(0);
      setSelectedChips(existingReview.chips);
      setComment(existingReview.comment);
      setSelectedMedia([]); // Los archivos no se pueden restaurar desde localStorage
      setChipInput('');
      setLinkPhotoToDish(false);
      return;
    }
    
    // Si no existe review, verificar si se está cambiando de producto o tipo
    const currentType = selectedReviewType;
    const currentDishId = selectedDishId;
    
    // Verificar si hay un cambio real
    const isChangingType = currentType !== type;
    const isChangingProduct = currentType === 'dish' && type === 'dish' && currentDishId !== null && dishId !== undefined && currentDishId !== dishId;
    const isSelectingSameItem = currentType === type && (type === 'experience' || (type === 'dish' && currentDishId === dishId));
    
    // Limpiar todos los campos si se está cambiando de producto o tipo (pero no si se selecciona el mismo item)
    if (!isSelectingSameItem && (isChangingType || isChangingProduct)) {
      setRating(0);
      setHoveredRating(0);
      setSelectedChips([]);
      setComment('');
      setSelectedMedia([]);
      setChipInput('');
      setLinkPhotoToDish(false);
      setEditingReviewId(null);
    }
    
    setSelectedReviewType(type);
    if (type === 'experience') {
      setSelectedDishId(null);
    } else if (dishId !== undefined) {
      setSelectedDishId(dishId);
    }
  };
  
  const canSubmit = orderId && selectedReviewType && rating > 0 && 
    (selectedReviewType === 'experience' || (selectedReviewType === 'dish' && selectedDishId !== null));
  
  const displayRating = hoveredRating > 0 ? hoveredRating : rating;
  
  // Si no hay orderId, redirigir
  useEffect(() => {
    if (!orderId || !lastOrder) {
      navigate('/home');
    }
  }, [orderId, lastOrder, navigate]);
  
  if (!orderId || !lastOrder) {
    return null;
  }
  
  // Verificar si ya hay una opinión para un producto específico
  const hasReviewForDish = (dishId: number) => {
    return existingReviews.some(r => r.type === 'dish' && r.itemId === dishId);
  };
  
  const hasReviewForExperience = () => {
    return existingReviews.some(r => r.type === 'experience');
  };
  
  // Obtener el item seleccionado
  const selectedItem = selectedDishId ? uniqueOrderItems.find(i => i.id === selectedDishId) : null;
  
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-stone-200/60 dark:border-stone-800">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button
            onClick={() => {
              if (editingReviewId) {
                handleCancelEdit();
              } else {
                navigate(-1);
              }
            }}
            className="flex size-10 items-center justify-center rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl">close</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-bold tracking-tight text-[#1c1917] dark:text-stone-100">
              {editingReviewId ? t('review.editTitle') : (t('review.title.restaurant') || 'Calificar Consumo')}
            </h1>
            <div className="flex items-center gap-1">
              <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                {t('orderHistory.completed') || 'Pedido Finalizado'}
              </span>
            </div>
          </div>
          <div className="size-10"></div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-md mx-auto pb-36 overflow-y-auto">
        {/* Sección inicial - Siempre visible */}
        <section className="p-6 text-center">
          <div className="inline-flex items-center justify-center size-14 bg-[#fef3e2] dark:bg-primary/20 rounded-2xl mb-4">
            <span className="material-symbols-outlined text-primary text-3xl">restaurant_menu</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight mb-1 text-[#1c1917] dark:text-stone-100">
            {t('review.question.restaurant') || '¿Qué tal estuvo tu desayuno?'}
          </h2>
          <p className="text-stone-500 dark:text-stone-400 text-sm">
            {(t('review.basedOnOrder') || 'Basado en tu orden de {date} a las {time}').replace('{date}', lastOrder.date).replace('{time}', lastOrder.time)}
          </p>
        </section>
        
        {/* Selector de platillos horizontal - Siempre visible */}
        <section className="px-4 mb-6">
          <h3 className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-3 px-2">
            {t('review.selectWhatToReview') || 'Selecciona un platillo para calificar'}
          </h3>
            <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 px-1">
              {/* Opción Experiencia General */}
              <button
                onClick={() => handleSelectReviewType('experience')}
                disabled={hasReviewForExperience()}
                className={`flex-shrink-0 w-48 p-3 rounded-2xl border-2 transition-all text-left ${
                  selectedReviewType === 'experience'
                    ? 'bg-white dark:bg-stone-800 border-primary shadow-sm'
                    : hasReviewForExperience()
                    ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 opacity-60'
                    : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  {selectedReviewType === 'experience' ? (
                    <span className="material-symbols-outlined text-primary">check_circle</span>
                  ) : (
                    <div className="size-5 rounded-full border-2 border-stone-200 dark:border-stone-600"></div>
                  )}
                </div>
                <p className="font-bold text-sm leading-tight mb-1 text-[#1c1917] dark:text-stone-100">
                  {t('review.experienceGeneral') || 'Experiencia General'}
                </p>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                  {t('review.experienceGeneralDesc') || 'Deja una opinión general'}
                </p>
              </button>
              
              {/* Productos individuales */}
              {uniqueOrderItems.map((item) => {
                const isSelected = selectedReviewType === 'dish' && selectedDishId === item.id;
                const hasReview = hasReviewForDish(item.id);
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectReviewType('dish', item.id)}
                    className={`flex-shrink-0 w-48 p-3 rounded-2xl border-2 transition-all text-left ${
                      isSelected
                        ? 'bg-white dark:bg-stone-800 border-primary shadow-sm'
                        : hasReview
                        ? 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      {isSelected ? (
                        <span className="material-symbols-outlined text-primary">check_circle</span>
                      ) : (
                        <div className="size-5 rounded-full border-2 border-stone-200 dark:border-stone-600"></div>
                      )}
                      {isSelected && item.notes && (
                        <span className="text-[10px] font-bold bg-[#fef3e2] text-primary px-2 py-0.5 rounded-full">
                          {t('review.customized') || 'Personalizado'}
                        </span>
                      )}
                      {hasReview && !isSelected && (
                        <span className="text-[10px] font-bold bg-[#fef3e2] text-primary px-2 py-0.5 rounded-full">
                          {t('review.reviewed') || 'Revisado'}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm leading-tight mb-1 text-[#1c1917] dark:text-stone-100">
                      {item.name}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                        {item.notes}
                      </p>
                    )}
                    {!item.notes && (
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1">
                        {t('review.traditional') || 'Tradicional'}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        
        {/* Formulario de opinión - Se muestra cuando hay tipo seleccionado */}
        {selectedReviewType && (
          <>
            {/* Sección de calificación de estrellas */}
            <section className="px-4 mb-8">
              <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800/50">
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => handleStarClick(value)}
                      onMouseEnter={() => handleStarHover(value)}
                      onMouseLeave={handleStarLeave}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <span
                        className={`material-symbols-outlined text-5xl ${
                          value <= displayRating
                            ? 'text-primary'
                            : 'text-stone-200 dark:text-stone-700'
                        }`}
                        style={{
                          fontVariationSettings: value <= displayRating ? "'FILL' 1" : "'FILL' 0"
                        }}
                      >
                        star
                      </span>
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm font-bold text-stone-400">
                    {rating}.0 - {getRatingLabel(rating)}
                  </p>
                )}
              </div>
            </section>
            
            {/* Chips de características */}
            <section className="px-6 mb-8">
              <h3 className="text-sm font-bold mb-4 text-[#1c1917] dark:text-stone-100">
                {t('review.whatDidYouLike') || '¿Qué destacarías?'}
              </h3>
              <div className="flex gap-2 flex-wrap">
                {currentChipOptions.map((chip, index) => {
                  const isSelected = selectedChips.includes(chip);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleChip(chip)}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#fef3e2] text-primary border border-primary/20 font-bold'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200'
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>
            </section>
            
            {/* Media Uploader */}
            <section className="px-6 mb-8">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#1c1917] dark:text-stone-100">
                    {t('review.evidenceTitle') || 'Evidencia de tu consumo'}
                  </h3>
                  <p className="text-[11px] text-stone-400">
                    {t('review.evidenceSubtitle') || 'Víncula fotos reales del platillo'}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">
                  {selectedMedia.length} / 5
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {/* Media preview - Las fotos se muestran primero */}
                {selectedMedia.map((file, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 group"
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-100 dark:bg-stone-800">
                        <span className="material-symbols-outlined text-stone-300 dark:text-stone-700">videocam</span>
                      </div>
                    )}
                    {linkPhotoToDish && selectedItem && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl drop-shadow-md">link</span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-1 right-1 size-5 bg-white/90 rounded-full flex items-center justify-center shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[14px] text-red-500 font-bold">close</span>
                    </button>
                  </div>
                ))}
                
                {/* Botón agregar - Se muestra en el siguiente espacio disponible si hay menos de 5 fotos */}
                {selectedMedia.length < 5 && (
                  <label className="aspect-square rounded-2xl border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center bg-white dark:bg-stone-800 hover:border-primary/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleMediaSelect}
                      className="hidden"
                    />
                    <span className="material-symbols-outlined text-stone-400 text-2xl">add_a_photo</span>
                  </label>
                )}
              </div>
              
              {/* Toggle para vincular foto al platillo */}
              {selectedReviewType === 'dish' && selectedItem && selectedMedia.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 rounded-xl bg-[#e0f2fe]/30 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600 dark:text-sky-400 text-xl">camera_enhance</span>
                    <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">
                      {(t('review.linkPhotoToDish') || 'Vincular esta foto a "{dishName}"').replace('{dishName}', selectedItem.name)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLinkPhotoToDish(!linkPhotoToDish)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${
                      linkPhotoToDish ? 'bg-primary' : 'bg-stone-300 dark:bg-stone-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 size-4 bg-white rounded-full shadow-sm transition-all ${
                      linkPhotoToDish ? 'left-0.5' : 'right-0.5'
                    }`}></div>
                  </button>
                </div>
              )}
            </section>
            
            {/* Comentarios */}
            <section className="px-6 mb-8">
              <h3 className="text-sm font-bold mb-3 text-[#1c1917] dark:text-stone-100">
                {t('review.commentsTitle') || 'Comentarios adicionales'}
              </h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full h-32 p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-sm placeholder:text-stone-400 text-[#1c1917] dark:text-stone-100"
                placeholder={t('review.commentPlaceholder')}
              />
            </section>
            
            {/* Lista de opiniones existentes */}
            {!editingReviewId && existingReviews.length > 0 && (
              <section className="px-6 mb-8 border-t border-stone-200 dark:border-stone-700 pt-6">
                <h3 className="text-sm font-bold mb-3 text-[#1c1917] dark:text-stone-100">
                  {t('review.yourReviews') || 'Tus Opiniones'}
                </h3>
                <div className="space-y-3">
                  {existingReviews.map((review) => (
                    <div
                      key={review.id}
                      onClick={() => handleEditReview(review.id)}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 cursor-pointer hover:border-primary transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <span
                                key={value}
                                className={`material-symbols-outlined text-lg ${
                                  value <= review.rating
                                    ? 'text-primary'
                                    : 'text-stone-300 dark:text-stone-600'
                                }`}
                                style={{
                                  fontVariationSettings: value <= review.rating ? "'FILL' 1" : "'FILL' 0"
                                }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-[#1c1917] dark:text-stone-100 mb-1">
                            {review.type === 'experience' 
                              ? t('review.experienceGeneral') || 'Experiencia General'
                              : review.itemName || t('review.product')}
                          </p>
                          {review.comment && (
                            <p className="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
                              {review.comment}
                            </p>
                          )}
                          {review.chips.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {review.chips.slice(0, 3).map((chip, index) => (
                                <span
                                  key={index}
                                  className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                                >
                                  {chip}
                                </span>
                              ))}
                              {review.chips.length > 3 && (
                                <span className="text-xs px-2 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400">
                                  +{review.chips.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditReview(review.id);
                          }}
                          className="ml-2 p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors"
                          title={t('common.edit')}
                        >
                          <span className="material-symbols-outlined text-stone-600 dark:text-stone-400 text-lg">
                            edit
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Botón de publicación */}
            <section className="px-6 mb-8">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                  canSubmit
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/25'
                    : 'bg-stone-300 dark:bg-stone-700 text-stone-500 dark:text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>{editingReviewId ? t('review.updateReview') || 'Actualizar Opinión' : t('review.publishReview')}</span>
                <span className="material-symbols-outlined text-xl">send</span>
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default ReviewScreen;
