import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useAuth } from '../contexts/AuthContext';
import TopNavbar from '../components/TopNavbar';
import { 
  getPromotions, 
  createPromotion, 
  updatePromotion, 
  deletePromotion,
  uploadPromotionImage,
  getCurrentUserRestaurantId,
  type Promotion as DBPromotion
} from '../services/api';
import { getImageUrl } from '../services/database';
import { formatPrice } from '../utils/currency';

interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  badge: {
    text: string;
    color: string;
  };
  timeRestriction?: string;
  discount?: string;
  category: string;
  badges?: string[];
}

interface AISuggestion {
  title: string;
  description: string;
  image: string;
  buttonText: string;
}

const PromotionsRestaurantScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addFavoritePromotion, removeFavoritePromotion, isPromotionFavorite } = useFavorites();
  const { selectedRestaurant } = useRestaurant();
  const { accountType } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [promotions, setPromotions] = useState<DBPromotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados para edición de promoción
  const [editPromotionOpen, setEditPromotionOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<DBPromotion | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [editingCategory, setEditingCategory] = useState('Desayuno');
  const [editingDiscountType, setEditingDiscountType] = useState<'percentage' | 'fixed' | '2x1' | 'combo' | 'final'>('percentage');
  const [editingDiscountValue, setEditingDiscountValue] = useState('');
  const [editingOriginalPrice, setEditingOriginalPrice] = useState('');
  const [editingFinalPrice, setEditingFinalPrice] = useState('');
  const [editingValidFrom, setEditingValidFrom] = useState('');
  const [editingValidUntil, setEditingValidUntil] = useState('');
  const [editingIsFeatured, setEditingIsFeatured] = useState(false);
  const [promotionImage, setPromotionImage] = useState<string>('');
  const [promotionImageFile, setPromotionImageFile] = useState<File | null>(null);
  const [promotionBadges, setPromotionBadges] = useState<string[]>([]);
  const [newBadgeName, setNewBadgeName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Nuevos estados para el diseño mejorado
  const [breakfastMode, setBreakfastMode] = useState(false);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('11:00');
  const [selectedDays, setSelectedDays] = useState<string[]>(['L', 'Ma', 'Mi', 'J', 'V']);
  const [clientSegmentation, setClientSegmentation] = useState<'all' | 'new' | 'vip'>('all');
  const [offerType, setOfferType] = useState<'2x1' | 'combo' | 'gift'>('2x1');
  const [flashCounter, setFlashCounter] = useState(false);
  
  const daysOfWeek = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

  // Modal de confirmación
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalMessage, setConfirmModalMessage] = useState('');
  const [confirmModalCallback, setConfirmModalCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  
  // Notificaciones temporales
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Cargar promociones desde la base de datos
  useEffect(() => {
    const loadPromotions = async () => {
      setIsLoading(true);
      try {
        const restaurantIdResult = selectedRestaurant?.id 
          ? { success: true, data: selectedRestaurant.id }
          : await getCurrentUserRestaurantId();
        
        if (!restaurantIdResult.success || !restaurantIdResult.data) {
          console.error('No se pudo obtener el ID del restaurante');
          setIsLoading(false);
          return;
        }

        const promotionsResult = await getPromotions(restaurantIdResult.data);
        if (promotionsResult.success && promotionsResult.data) {
          setPromotions(promotionsResult.data);
        } else {
          console.error('Error loading promotions:', promotionsResult.error);
        }
      } catch (error) {
        console.error('Error loading promotions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPromotions();
  }, [selectedRestaurant]);

  // Convertir promociones de BD al formato esperado por el componente
  const convertedPromotions = useMemo(() => {
    return promotions.map((promo): Promotion => {
      // Determinar el badge basado en el tipo de descuento o etiquetas
      let badgeText = '';
      let badgeColor = 'bg-primary';
      
      if (promo.discount_type === 'percentage' && promo.discount_value) {
        badgeText = `${promo.discount_value}% OFF`;
      } else if (promo.discount_type === '2x1') {
        badgeText = '2x1';
      } else if (promo.badges && promo.badges.length > 0) {
        badgeText = promo.badges[0]; // Usar la primera etiqueta como badge
      } else {
        badgeText = promo.category || 'PROMOCIÓN';
      }

      // Determinar color del badge
      if (promo.is_featured) {
        badgeColor = 'bg-primary';
      } else if (promo.discount_type === 'percentage') {
        badgeColor = 'bg-green-500';
      }

      // Obtener URL de imagen
      let imageUrl = '';
      if (promo.image_url) {
        if (promo.image_url.startsWith('http://') || promo.image_url.startsWith('https://')) {
          imageUrl = promo.image_url;
        } else {
          imageUrl = getImageUrl('promotion-images', promo.image_url);
        }
      }

      // Formatear restricción de tiempo si existe
      let timeRestriction = '';
      if (promo.applicable_hours) {
        const hours = promo.applicable_hours as any;
        if (hours.start && hours.end) {
          timeRestriction = `${hours.start} - ${hours.end}`;
        }
      }

      return {
        id: promo.id,
        title: promo.title,
        description: promo.description || '',
        image: imageUrl,
        badge: {
          text: badgeText,
          color: badgeColor,
        },
        timeRestriction: timeRestriction || undefined,
        discount: promo.discount_type === 'percentage' && promo.discount_value 
          ? `${promo.discount_value}% OFF` 
          : undefined,
        category: promo.category,
        badges: promo.badges || [],
      };
    });
  }, [promotions]);

  // Separar promociones destacadas (featured) de las regulares
  const featuredPromotions = useMemo(() => {
    return convertedPromotions.filter((p) => {
      const originalPromo = promotions.find(pr => pr.id === p.id);
      return originalPromo?.is_featured;
    });
  }, [convertedPromotions, promotions]);

  const regularPromotions = useMemo(() => {
    return convertedPromotions.filter((p) => {
      const originalPromo = promotions.find(pr => pr.id === p.id);
      return !originalPromo?.is_featured;
    });
  }, [convertedPromotions, promotions]);

  const mainPromotions = featuredPromotions;
  const seasonalPromotions = regularPromotions;

  // Sugerencia de IA (mantener hardcodeada por ahora)
  const aiSuggestion: AISuggestion = {
    title: t('promotions.aiGiftTitle'),
    description: t('promotions.aiGiftDescription'),
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPe26_z3cXPLkUipa48N_sO3K9HYSCZDqSVS7rjrXgibOKz2huD_Hn18mR1qXoMnaA8VPxvlF5No5EfH9HdbR4WIIic2UpLGWolt4E9oohzM1QHpK41Vq-3KkJTqt_kEywj5n9y1FNRB5GGI1s3XRGwZEghe_bzVBtdE5ASK-iJ_NSNrw-VVHwnbFoFjWPHD5nLLHaqDiJS23ly7TbsVH5fhq0bEoC2g9mnMeqjwRLhHb7wqr44sANEBEuW1coYqDtugcMQJHxD1ju',
    buttonText: t('promotions.claimNow')
  };

  const handleClaimAIGift = () => {
    // TODO: Implementar lógica para reclamar el regalo de IA
    alert(t('promotions.claimingGift'));
  };

  // Abrir modal de edición/creación de promoción
  const openEditPromotion = (promotion?: DBPromotion) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setEditingTitle(promotion.title);
      setEditingDescription(promotion.description || '');
      setEditingCategory(promotion.category);
      setEditingDiscountType((promotion.discount_type as 'percentage' | 'fixed' | '2x1' | 'combo' | 'final') || 'percentage');
      setEditingDiscountValue(promotion.discount_value?.toString() || '');
      setEditingOriginalPrice(promotion.original_price?.toString() || '');
      setEditingFinalPrice(promotion.final_price?.toString() || '');
      setEditingValidFrom(new Date(promotion.valid_from).toISOString().slice(0, 10));
      setEditingValidUntil(new Date(promotion.valid_until).toISOString().slice(0, 10));
      setEditingIsFeatured(promotion.is_featured);
      setPromotionBadges(promotion.badges || []);
      
      // Cargar configuración de modo desayuno
      if (promotion.applicable_hours) {
        const hours = promotion.applicable_hours as any;
        setBreakfastMode(true);
        if (hours.start) setStartTime(hours.start);
        if (hours.end) setEndTime(hours.end);
      } else {
        setBreakfastMode(false);
      }
      
      // Cargar días aplicables
      if (promotion.applicable_days && promotion.applicable_days.length > 0) {
        setSelectedDays(promotion.applicable_days);
      } else {
        setSelectedDays(['L', 'Ma', 'Mi', 'J', 'V']);
      }
      
      // Cargar segmentación de clientes
      if (promotion.client_segmentation) {
        setClientSegmentation(promotion.client_segmentation as 'all' | 'new' | 'vip');
      } else {
        setClientSegmentation('all');
      }
      
      // Cargar flash counter
      setFlashCounter(promotion.flash_counter || false);
      
      // Cargar imagen
      if (promotion.image_url) {
        if (promotion.image_url.startsWith('http://') || promotion.image_url.startsWith('https://')) {
          setPromotionImage(promotion.image_url);
        } else {
          setPromotionImage(getImageUrl('promotion-images', promotion.image_url));
        }
      } else {
        setPromotionImage('');
      }
      setPromotionImageFile(null);
      
      // Determinar tipo de oferta basado en discount_type
      if (promotion.discount_type === '2x1') {
        setOfferType('2x1');
      } else if (promotion.discount_type === 'combo') {
        setOfferType('combo');
      } else {
        // Para percentage o fixed, usar 'gift' como tipo de oferta visual
        setOfferType('gift');
      }
      
      setFlashCounter(false); // Por defecto
    } else {
      // Nueva promoción
      setEditingPromotion(null);
      setEditingTitle('');
      setEditingDescription('');
      setEditingCategory('Desayuno');
      setEditingDiscountType('percentage');
      setEditingDiscountValue('');
      setEditingOriginalPrice('');
      setEditingFinalPrice('');
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEditingValidFrom(now.toISOString().slice(0, 10));
      setEditingValidUntil(tomorrow.toISOString().slice(0, 10));
      setEditingIsFeatured(false);
      setPromotionBadges([]);
      setPromotionImage('');
      setPromotionImageFile(null);
      setBreakfastMode(false);
      setStartTime('07:00');
      setEndTime('11:00');
      setSelectedDays(['L', 'M', 'M', 'J', 'V']);
      setClientSegmentation('all');
      setOfferType('2x1');
      setFlashCounter(false);
    }
    setEditPromotionOpen(true);
  };
  
  // Toggle día de la semana
  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // Cerrar modal de edición
  const closeEditPromotion = () => {
    setEditPromotionOpen(false);
    setEditingPromotion(null);
  };

  // Agregar etiqueta
  const addBadge = () => {
    if (newBadgeName.trim() && !promotionBadges.includes(newBadgeName.trim())) {
      setPromotionBadges([...promotionBadges, newBadgeName.trim()]);
      setNewBadgeName('');
    }
  };

  // Eliminar etiqueta
  const removeBadge = (badge: string) => {
    setPromotionBadges(promotionBadges.filter(b => b !== badge));
  };

  // Guardar promoción
  const handleSavePromotion = async () => {
    if (!editingTitle.trim()) {
      showNotification(t('restaurant.promotions.errors.titleRequired') || 'El título es requerido', 'error');
      return;
    }

    if (isSaving) return;
    setIsSaving(true);

    try {
      const restaurantIdResult = selectedRestaurant?.id 
        ? { success: true, data: selectedRestaurant.id }
        : await getCurrentUserRestaurantId();
      
      if (!restaurantIdResult.success || !restaurantIdResult.data) {
        throw new Error(((restaurantIdResult as any).error) || 'No se pudo obtener el ID del restaurante');
      }
      
      const restaurantId = restaurantIdResult.data;

      // Subir imagen si hay una nueva
      let imageUrl = editingPromotion?.image_url || '';
      if (promotionImageFile) {
        const uploadResult = await uploadPromotionImage(
          promotionImageFile,
          promotionImageFile.name
        );
        if (!uploadResult.success || !uploadResult.data) {
          const errorMsg = promotionImageFile.type === 'image/avif' 
            ? 'Error: El formato AVIF no está permitido. Por favor, ejecuta el script SQL fix-promotion-images-avif.sql en Supabase o convierte la imagen a otro formato (JPEG, PNG, WebP).'
            : uploadResult.error || 'Error al subir la imagen. Por favor, intenta de nuevo.';
          showNotification(errorMsg, 'error');
          setIsSaving(false);
          return;
        }
        imageUrl = uploadResult.data;
      }

      // Determinar discount_type: el dropdown "Tipo de Descuento" tiene prioridad
      // Solo usar offerType si editingDiscountType no está definido o es incompatible
      let finalDiscountType: 'percentage' | 'fixed' | '2x1' | 'combo' | 'final' = editingDiscountType;
      
      // Si editingDiscountType es 'final', 'fixed', o 'percentage', mantenerlo (tiene prioridad)
      if (editingDiscountType === 'final' || editingDiscountType === 'fixed' || editingDiscountType === 'percentage') {
        finalDiscountType = editingDiscountType;
      } else {
        // Solo usar offerType si editingDiscountType es '2x1' o 'combo' (que vienen de offerType)
        // o si no está definido
        if (offerType === '2x1') {
          finalDiscountType = '2x1';
        } else if (offerType === 'combo') {
          finalDiscountType = 'combo';
        } else if (offerType === 'gift') {
          // Para regalo, usar el tipo de descuento del dropdown o percentage por defecto
          finalDiscountType = editingDiscountType || 'percentage';
        }
      }
      
      const promotionData: any = {
        restaurant_id: restaurantId,
        title: editingTitle.trim(),
        description: editingDescription.trim() || null,
        image_url: imageUrl || null,
        category: editingCategory,
        discount_type: finalDiscountType,
        discount_value: editingDiscountValue ? parseFloat(editingDiscountValue) : null,
        original_price: editingOriginalPrice ? parseFloat(editingOriginalPrice) : null,
        final_price: editingFinalPrice ? parseFloat(editingFinalPrice) : null,
        valid_from: new Date(editingValidFrom).toISOString(),
        valid_until: new Date(editingValidUntil).toISOString(),
        is_featured: editingIsFeatured,
        badges: promotionBadges,
        is_active: true,
        applicable_hours: breakfastMode ? {
          start: startTime,
          end: endTime
        } : null,
        applicable_days: breakfastMode ? selectedDays : null,
        client_segmentation: clientSegmentation,
        flash_counter: flashCounter,
      };

      if (editingPromotion) {
        // Actualizar promoción existente
        const updateResult = await updatePromotion(editingPromotion.id, promotionData);
        if (updateResult.success && updateResult.data) {
          // Recargar promociones
          const promotionsResult = await getPromotions(restaurantId);
          if (promotionsResult.success && promotionsResult.data) {
            setPromotions(promotionsResult.data);
          }
          closeEditPromotion();
          showNotification(t('restaurant.promotions.success.updated') || 'Promoción actualizada correctamente', 'success');
        } else {
          throw new Error(updateResult.error || 'Error al actualizar la promoción');
        }
      } else {
        // Crear nueva promoción
        const createResult = await createPromotion(promotionData);
        if (createResult.success && createResult.data) {
          // Recargar promociones
          const promotionsResult = await getPromotions(restaurantId);
          if (promotionsResult.success && promotionsResult.data) {
            setPromotions(promotionsResult.data);
          }
          closeEditPromotion();
          showNotification(t('restaurant.promotions.success.created') || 'Promoción creada correctamente', 'success');
        } else {
          throw new Error(createResult.error || 'Error al crear la promoción');
        }
      }
    } catch (error) {
      console.error('Error saving promotion:', error);
      showNotification(t('restaurant.promotions.errors.saveFailed') || 'Error al guardar la promoción', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar promoción
  const handleDeletePromotion = (promotionId: string) => {
    console.log('[PromotionsRestaurantScreen] handleDeletePromotion called for:', promotionId);
    // Solo establecer el estado, NO ejecutar la eliminación
    setPendingDeleteId(promotionId);
    setConfirmModalMessage(t('restaurant.promotions.confirmDelete') || '¿Estás seguro de que deseas eliminar esta promoción?');
    setConfirmModalOpen(true);
  };

  const handleConfirm = async () => {
    console.log('[PromotionsRestaurantScreen] handleConfirm called');
    if (!pendingDeleteId) {
      console.log('[PromotionsRestaurantScreen] No pending delete ID');
      setConfirmModalOpen(false);
      setPendingDeleteId(null);
      return;
    }

    const promotionIdToDelete = pendingDeleteId;
    console.log('[PromotionsRestaurantScreen] Executing delete for:', promotionIdToDelete);
    
    try {
      const success = await deletePromotion(promotionIdToDelete);
      if (success) {
        // Recargar promociones
        const restaurantId = selectedRestaurant?.id || await getCurrentUserRestaurantId();
        const loadedPromotions = await getPromotions(restaurantId);
        setPromotions(loadedPromotions);
        showNotification(t('restaurant.promotions.success.deleted') || 'Promoción eliminada correctamente', 'success');
      } else {
        throw new Error('Error al eliminar la promoción');
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
      showNotification(t('restaurant.promotions.errors.deleteFailed') || 'Error al eliminar la promoción', 'error');
    }
    
    setConfirmModalOpen(false);
    setPendingDeleteId(null);
  };
  
  // Mostrar notificación temporal
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleCancel = () => {
    setConfirmModalOpen(false);
    setPendingDeleteId(null);
  };

  if (isLoading) {
    return (
      <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
        <TopNavbar 
          title={t('restaurant.promotions.title')}
          showBackButton={true}
          showAvatar={true}
        />
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading') || 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) translateX(-50%);
          }
          to {
            opacity: 1;
            transform: translateY(0) translateX(-50%);
          }
        }
      `}</style>
      <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
        {/* TopAppBar */}
        <TopNavbar 
          title={t('restaurant.promotions.title')}
          showBackButton={true}
          showAvatar={true}
        />

        {/* Botón para activar/desactivar modo de edición */}
        <div className="px-4 pt-2">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className="w-full rounded-xl border px-4 py-3 flex items-center justify-between border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] text-[#181611] dark:text-white"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined">{editMode ? 'check' : 'edit'}</span>
              <span className="text-sm font-bold">
                {editMode ? (t('restaurant.menu.editModeActive') || 'Modo edición activado') : (t('restaurant.menu.switchToEditMode') || 'Cambiar a modo de edición')}
              </span>
            </div>
          </button>
        </div>

        {/* Carousel: Main Offers */}
        <div className="flex overflow-x-auto scroll-smooth [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex items-stretch p-4 gap-4">
            {mainPromotions.map((promotion) => {
              const isFavorite = isPromotionFavorite(promotion.id);
              return (
                <div
                  key={promotion.id}
                  className="relative flex h-full flex-1 flex-col gap-3 rounded-xl min-w-[280px] text-left"
                >
                  {editMode && (
                    <div className="absolute top-2 right-2 z-10 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const originalPromo = promotions.find(p => p.id === promotion.id);
                          if (originalPromo) openEditPromotion(originalPromo);
                        }}
                        className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                        title={t('restaurant.menu.edit') || 'Editar'}
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          handleDeletePromotion(promotion.id);
                        }}
                        className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
                        title={t('restaurant.menu.delete') || 'Eliminar'}
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => !editMode && navigate(`/promotion-detail/${promotion.id}`)}
                    className="flex h-full flex-1 flex-col gap-3 rounded-xl min-w-[280px] text-left cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <div 
                      className="relative w-full aspect-[16/9] bg-center bg-no-repeat bg-cover rounded-xl shadow-lg"
                      style={{ backgroundImage: `url("${promotion.image}")` }}
                    >
                      {!editMode && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isFavorite) {
                              removeFavoritePromotion(promotion.id);
                            } else {
                              addFavoritePromotion(promotion);
                            }
                          }}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                        >
                          <span 
                            className={`material-symbols-outlined text-sm ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                            style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}
                          >
                            favorite
                          </span>
                        </div>
                      )}
                      <div className={`absolute top-3 left-3 ${promotion.badge.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider`}>
                        {promotion.badge.text}
                      </div>
                    </div>
                    <div>
                      <p className="text-[#181411] dark:text-white text-base font-bold leading-normal">
                        {promotion.title}
                      </p>
                      {promotion.timeRestriction && (
                        <p className="text-[#887563] dark:text-gray-400 text-sm font-medium leading-normal flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          {promotion.timeRestriction}
                        </p>
                      )}
                      {promotion.description && !promotion.timeRestriction && (
                        <p className="text-[#887563] dark:text-gray-400 text-sm font-medium leading-normal">
                          {promotion.description}
                        </p>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
            {editMode && (
              <button
                type="button"
                onClick={() => openEditPromotion()}
                className="flex items-center justify-center min-w-[280px] aspect-[16/9] rounded-xl border-2 border-dashed border-primary/40 text-primary bg-primary/5"
              >
                <div className="flex flex-col items-center">
                  <span className="material-symbols-outlined text-3xl">add</span>
                  <span className="text-sm font-bold">{t('restaurant.promotions.addPromotion') || 'Agregar Promoción'}</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* SectionHeader: IA Suggestion */}
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-[#181411] dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em]">
            {t('promotions.aiSuggestion')}
          </h2>
          <span className="material-symbols-outlined text-primary">auto_awesome</span>
        </div>

        {/* Card: Personalized Reward */}
        <div className="px-4 py-2">
          <div className="flex items-stretch justify-between gap-4 rounded-2xl bg-gradient-to-br from-orange-50 to-white dark:from-[#32281d] dark:to-background-dark p-5 border border-primary/20 shadow-xl shadow-primary/5">
            <div className="flex flex-[3_3_0px] flex-col justify-between gap-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-primary text-[10px] font-extrabold uppercase tracking-widest">
                  <span className="material-symbols-outlined text-[14px]">psychology</span>
                  {t('promotions.personalizedRecommendation')}
                </div>
                <p className="text-[#181411] dark:text-white text-lg font-extrabold leading-tight">
                  {aiSuggestion.title}
                </p>
                <p className="text-[#887563] dark:text-gray-400 text-sm font-normal leading-tight">
                  {aiSuggestion.description}
                </p>
              </div>
              <button
                onClick={handleClaimAIGift}
                className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-6 bg-primary text-white text-sm font-bold shadow-lg shadow-primary/30 active:scale-95 transition-transform"
              >
                <span className="truncate">{aiSuggestion.buttonText}</span>
              </button>
            </div>
            <div 
              className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl flex-1 shadow-md border-2 border-white dark:border-[#4a3b2b]"
              style={{ backgroundImage: `url("${aiSuggestion.image}")` }}
            />
          </div>
        </div>

        {/* SectionHeader: Seasonal */}
        <h2 className="text-[#181411] dark:text-white text-[20px] font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">
          {t('promotions.seasonalSpecials')}
        </h2>

        {/* Simple Grid for more items */}
        <div className="px-4 grid grid-cols-2 gap-4 pb-24">
          {seasonalPromotions.map((promotion) => {
            const isFavorite = isPromotionFavorite(promotion.id);
            return (
              <div key={promotion.id} className="relative">
                {editMode && (
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const originalPromo = promotions.find(p => p.id === promotion.id);
                        if (originalPromo) openEditPromotion(originalPromo);
                      }}
                      className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                      title={t('restaurant.menu.edit') || 'Editar'}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeletePromotion(promotion.id);
                      }}
                      className="w-9 h-9 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center"
                      title={t('restaurant.menu.delete') || 'Eliminar'}
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                )}
                <button
                  onClick={() => !editMode && navigate(`/promotion-detail/${promotion.id}`)}
                  className="bg-white dark:bg-[#32281d] p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-none text-left cursor-pointer hover:opacity-90 transition-opacity w-full"
                >
                  <div 
                    className="relative w-full aspect-square bg-cover bg-center rounded-xl mb-2"
                    style={{ backgroundImage: `url('${promotion.image}')` }}
                  >
                    {!editMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFavorite) {
                            removeFavoritePromotion(promotion.id);
                          } else {
                            addFavoritePromotion(promotion);
                          }
                        }}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
                      >
                        <span 
                          className={`material-symbols-outlined text-xs ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                          style={isFavorite ? { fontVariationSettings: "'FILL' 1" } : {}}
                        >
                          favorite
                        </span>
                      </div>
                    )}
                  </div>
                  <p className={`text-xs font-bold mb-1 ${promotion.badge.color === 'bg-primary' ? 'text-primary' : 'text-primary'}`}>
                    {promotion.discount || promotion.badge.text}
                  </p>
                  <p className="text-sm font-bold dark:text-white">{promotion.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{promotion.description}</p>
                </button>
              </div>
            );
          })}
          {editMode && (
            <button
              type="button"
              onClick={() => openEditPromotion()}
              className="bg-[#F7F2ED] dark:bg-[#F7F2ED] p-3 rounded-2xl shadow-sm border-2 border-dashed border-primary/40 text-primary bg-primary/5"
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="material-symbols-outlined text-3xl">add</span>
                <span className="text-sm font-bold">{t('restaurant.promotions.addSpecial') || 'Agregar Especial'}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Modal de edición/creación de promoción */}
      {editPromotionOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-background-light dark:bg-background-dark flex flex-col overflow-y-auto"
          style={{ 
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))'
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
            <div className="flex items-center p-4 pb-4 justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={closeEditPromotion}
                  className="text-[#181411] flex size-10 items-center justify-center cursor-pointer bg-gray-50 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
                <h2 className="text-[#181411] text-lg font-bold leading-tight">
                  {editingPromotion ? (t('restaurant.promotions.editPromotion') || 'Editar Promoción') : (t('restaurant.promotions.newPromotion') || 'Nueva Promoción')}
                </h2>
              </div>
              <button
                onClick={handleSavePromotion}
                disabled={isSaving || !editingTitle.trim()}
                className="bg-primary text-white px-4 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (t('common.saving') || 'Guardando...') : (t('restaurant.menu.save') || 'Guardar')}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Imagen de la Promoción */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider">Imagen de la Promoción</label>
              <div 
                className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2 overflow-hidden group cursor-pointer"
                onClick={() => document.getElementById('promotion-image-input')?.click()}
              >
                {promotionImage ? (
                  <>
                    <img src={promotionImage} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPromotionImage('');
                        setPromotionImageFile(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-gray-400 text-4xl">add_a_photo</span>
                    <span className="text-xs font-medium text-gray-500">Subir banner promocional (16:9)</span>
                  </>
                )}
                <input
                  id="promotion-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setPromotionImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setPromotionImage(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Información General */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">info</span>
                <h3 className="font-bold text-lg">Información General</h3>
              </div>
              <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Nombre de la Promoción</label>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    placeholder={t('restaurant.promotions.titlePlaceholder') || 'Ej: Combo Desayuno Real'}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Descripción</label>
                  <textarea
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    placeholder={t('restaurant.promotions.descriptionPlaceholder') || 'Describe el beneficio principal...'}
                    rows={2}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Tipo de Descuento</label>
                  <select
                    value={editingDiscountType === '2x1' || editingDiscountType === 'combo' ? 'final' : editingDiscountType === 'final' ? 'final' : editingDiscountType === 'fixed' ? 'fixed' : 'percentage'}
                    onChange={(e) => {
                      const value = e.target.value as 'percentage' | 'fixed' | 'final';
                      setEditingDiscountType(value);
                      // Si se cambia el dropdown a 'percentage' o 'fixed', actualizar offerType a 'gift'
                      // para mantener sincronización (solo si no es 'final')
                      if (value === 'percentage' || value === 'fixed') {
                        setOfferType('gift');
                      }
                    }}
                    className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                    <option value="final">Precio Final Promocional</option>
                  </select>
                  {editingDiscountType === 'percentage' && (
                    <input
                      type="number"
                      value={editingDiscountValue}
                      onChange={(e) => setEditingDiscountValue(e.target.value)}
                      placeholder="Ej: 20"
                      min="0"
                      max="100"
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm mt-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  )}
                  {(editingDiscountType === 'fixed' || editingDiscountType === '2x1' || editingDiscountType === 'combo') && editingDiscountType !== 'final' && (
                    <input
                      type="number"
                      value={editingDiscountValue}
                      onChange={(e) => setEditingDiscountValue(e.target.value)}
                      placeholder="Ej: 50.00"
                      min="0"
                      step="0.01"
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm mt-2 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  )}
                  {(editingDiscountType === 'final' || editingDiscountType === 'combo') && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <input
                        type="number"
                        value={editingOriginalPrice}
                        onChange={(e) => setEditingOriginalPrice(e.target.value)}
                        placeholder="Precio Original"
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                      <input
                        type="number"
                        value={editingFinalPrice}
                        onChange={(e) => setEditingFinalPrice(e.target.value)}
                        placeholder="Precio Final"
                        min="0"
                        step="0.01"
                        className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modo Desayuno */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary">
                  <span className="material-symbols-outlined text-xl">wb_sunny</span>
                  <h3 className="font-bold text-lg">Modo Desayuno</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setBreakfastMode(!breakfastMode)}
                  className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors ${breakfastMode ? 'bg-primary' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute transition-transform ${breakfastMode ? 'right-1' : 'left-1'}`}></div>
                </button>
              </div>
              {breakfastMode && (
                <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500">Hora Inicio</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500">Hora Fin</label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Días de la semana</label>
                    <div className="flex justify-between gap-1">
                      {daysOfWeek.map((day, index) => (
                        <button
                          key={`${day}-${index}`}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`size-9 rounded-full text-xs font-bold transition-colors ${
                            selectedDays.includes(day)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          {day === 'Ma' ? 'M' : day === 'Mi' ? 'M' : day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Segmentación de Clientes</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setClientSegmentation('all')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          clientSegmentation === 'all'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientSegmentation('new')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          clientSegmentation === 'new'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        Nuevos Usuarios
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientSegmentation('vip')}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          clientSegmentation === 'vip'
                            ? 'bg-primary/10 text-primary border-primary/20'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}
                      >
                        VIP
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tipo de Oferta */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">local_offer</span>
                <h3 className="font-bold text-lg">Tipo de Oferta</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOfferType('2x1')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl gap-2 transition-colors ${
                    offerType === '2x1'
                      ? 'bg-white border-primary'
                      : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  <span className={`material-symbols-outlined ${offerType === '2x1' ? 'text-primary' : ''}`}>filter_2</span>
                  <span className="text-[10px] font-bold uppercase">2x1</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfferType('combo')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl gap-2 transition-colors ${
                    offerType === 'combo'
                      ? 'bg-white border-primary'
                      : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  <span className={`material-symbols-outlined ${offerType === 'combo' ? 'text-primary' : ''}`}>restaurant_menu</span>
                  <span className="text-[10px] font-bold uppercase">Combo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOfferType('gift')}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl gap-2 transition-colors ${
                    offerType === 'gift'
                      ? 'bg-white border-primary'
                      : 'bg-gray-50 border-transparent text-gray-400'
                  }`}
                >
                  <span className={`material-symbols-outlined ${offerType === 'gift' ? 'text-primary' : ''}`}>featured_seasonal_and_gifts</span>
                  <span className="text-[10px] font-bold uppercase">Regalo</span>
                </button>
              </div>
            </div>

            {/* Vigencia y Restricciones */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-xl">event_busy</span>
                <h3 className="font-bold text-lg">Vigencia y Restricciones</h3>
              </div>
              <div className="space-y-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">Fecha Inicio</label>
                    <input
                      type="date"
                      value={editingValidFrom}
                      onChange={(e) => setEditingValidFrom(e.target.value)}
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500">Fecha Fin</label>
                    <input
                      type="date"
                      value={editingValidUntil}
                      onChange={(e) => setEditingValidUntil(e.target.value)}
                      className="w-full bg-gray-50 border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-red-500">bolt</span>
                    <span className="text-sm font-semibold">Activar Contador Flash</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={flashCounter}
                    onChange={(e) => setFlashCounter(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-5 w-5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación */}
      {confirmModalOpen && (
        <div 
          className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4"
          onClick={handleCancel}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[#181611] dark:text-white mb-4">
              {t('common.confirm') || 'Confirmar'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {confirmModalMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#322a1a] text-[#181611] dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('restaurant.menu.cancel') || 'Cancelar'}
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                {t('restaurant.menu.delete') || 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificación temporal */}
      {notification && (
        <div 
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-xl shadow-2xl max-w-sm w-full mx-4 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">
              {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="font-semibold text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PromotionsRestaurantScreen;
