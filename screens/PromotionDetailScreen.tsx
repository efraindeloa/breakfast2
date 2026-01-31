import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { getPromotionById } from '../services/api';
import { type Promotion } from '../services/database';
import { getImageUrl } from '../services/database';

interface PromotionDetail {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  badge: {
    text: string;
    icon: string;
  };
  originalPrice: number;
  currentPrice: number;
  savings: number;
  discountPercent: number;
  flashOffer: boolean;
  timeRemaining: number; // en segundos
  conditions: {
    schedule: string;
    days: string;
  };
  includes: string[];
  category: string;
}

// Función para validar si un string es un UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const PromotionDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { addFavoritePromotion, removeFavoritePromotion, isPromotionFavorite } = useFavorites();
  const [promotionData, setPromotionData] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Obtener promoción desde la base de datos
  useEffect(() => {
    const loadPromotion = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      // Validar que el ID sea un UUID válido antes de intentar cargarlo desde la BD
      if (!isValidUUID(id)) {
        console.warn(`Promotion ID "${id}" is not a valid UUID. This might be a hardcoded promotion.`);
        setLoading(false);
        return;
      }

      try {
        const promoResult = await getPromotionById(id);
        if (promoResult.success && promoResult.data) {
          const promo = promoResult.data;
          setPromotionData(promo);
          
          // Calcular tiempo restante si flash_counter está activado
          if (promo.flash_counter) {
            const now = new Date().getTime();
            const validUntil = new Date(promo.valid_until).getTime();
            const remaining = Math.max(0, Math.floor((validUntil - now) / 1000));
            setTimeRemaining(remaining);
          }
        }
      } catch (error) {
        console.error('Error loading promotion:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPromotion();
  }, [id]);

  // Contador regresivo (solo si flash_counter está activado)
  useEffect(() => {
    if (!promotionData?.flash_counter || timeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [promotionData?.flash_counter, timeRemaining]);

  // Convertir datos de BD al formato esperado por el componente
  const promotion: PromotionDetail | null = promotionData ? {
    id: promotionData.id,
    title: promotionData.title,
    subtitle: promotionData.description || '',
    image: promotionData.image_url ? getImageUrl('promotion-images', promotionData.image_url) : '',
    badge: {
      text: promotionData.badges && promotionData.badges.length > 0 
        ? promotionData.badges[0].toUpperCase()
        : promotionData.category?.toUpperCase() || 'PROMOCIÓN',
      icon: promotionData.applicable_hours ? 'wb_sunny' : 'local_offer'
    },
    originalPrice: promotionData.original_price || 0,
    currentPrice: promotionData.final_price || promotionData.original_price || 0,
    savings: (promotionData.original_price || 0) - (promotionData.final_price || promotionData.original_price || 0),
    discountPercent: promotionData.discount_type === 'percentage' && promotionData.discount_value
      ? promotionData.discount_value
      : promotionData.original_price && promotionData.final_price
        ? Math.round(((promotionData.original_price - promotionData.final_price) / promotionData.original_price) * 100)
        : 0,
    flashOffer: promotionData.flash_counter || false,
    timeRemaining: timeRemaining,
    conditions: {
      schedule: promotionData.applicable_hours
        ? `${promotionData.applicable_hours.start} - ${promotionData.applicable_hours.end}`
        : 'Todo el día',
      days: promotionData.applicable_days && promotionData.applicable_days.length > 0
        ? promotionData.applicable_days.join(', ')
        : 'Todos los días'
    },
    includes: Array.isArray(promotionData.included_items) 
      ? promotionData.included_items 
      : [],
    category: promotionData.category || 'general'
  } : null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  // Verificar si la promoción existe antes de continuar
  if (loading) {
    return (
      <div className="relative w-full max-w-[430px] bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center mx-auto">
        <div className="text-center px-4">
          <p className="text-[#181411] dark:text-white text-lg mb-4">{t('common.loading') || 'Cargando...'}</p>
        </div>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="relative w-full max-w-[430px] bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center mx-auto">
        <div className="text-center px-4">
          <p className="text-[#181411] dark:text-white text-lg mb-4">{t('common.notFound') || 'Promoción no encontrada'}</p>
          <p className="text-[#181411]/60 dark:text-white/60 text-sm mb-4">
            {id && !isValidUUID(id) 
              ? 'Esta promoción no está disponible en este momento.'
              : 'La promoción que buscas no existe o ha sido eliminada.'}
          </p>
          <button
            onClick={() => navigate('/promotions')}
            className="bg-primary text-white px-6 py-2 rounded-full"
          >
            {t('common.goBack') || 'Volver a Promociones'}
          </button>
        </div>
      </div>
    );
  }

  // Funciones que usan promotion (solo se ejecutan si promotion existe)
  const handleApplyToOrder = () => {
    if (!promotion) return;
    
    try {
      // Agregar la promoción como un item especial de combo al carrito
      // Usamos un ID especial muy alto (10000 + id de promoción) para identificar combos
      // Esto evita conflictos con IDs de productos reales (que van del 1 al ~34)
      const comboId = 10000 + parseInt(promotion.id);
      
      // Asegurar que el precio sea un número
      const price = typeof promotion.currentPrice === 'number' 
        ? promotion.currentPrice
        : parseFloat(String(promotion.currentPrice).replace(/[^0-9.]/g, '')) || 0;
      
      const comboItem = {
        id: comboId,
        name: promotion.title,
        price: price,
        notes: `Promoción: ${promotion.subtitle}. Incluye: ${promotion.includes.join(', ')}`,
        image: promotion.image,
      };

      // Usar addToCart del contexto, que maneja automáticamente el fallback a localStorage
      // para items con IDs especiales (combos) que no existen en la base de datos
      addToCart(comboItem);
      
      // Mostrar confirmación y navegar a la orden
      setTimeout(() => {
        alert(t('promotions.appliedToOrder'));
        navigate('/orders');
      }, 100);
    } catch (error) {
      console.error('Error adding promotion to cart:', error);
      alert('Error al agregar la promoción. Por favor, intenta de nuevo.');
    }
  };

  const handleShare = () => {
    if (!promotion) return;
    
    if (navigator.share) {
      navigator.share({
        title: promotion.title,
        text: promotion.subtitle,
        url: window.location.href
      }).catch(() => {
        // Si el usuario cancela o hay un error, no hacer nada
      });
    } else {
      // Fallback: copiar al portapapeles
      navigator.clipboard.writeText(window.location.href);
      alert(t('promotions.linkCopied'));
    }
  };

  const time = formatTime(timeRemaining);

  return (
    <div className="relative w-full max-w-[430px] bg-background-light dark:bg-background-dark min-h-screen flex flex-col pb-32 overflow-x-hidden mx-auto">
      {/* Top App Bar */}
      <div className="flex items-center bg-transparent p-4 pb-2 justify-between z-10 sticky top-0 backdrop-blur-md bg-white/70 dark:bg-background-dark/70">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {t('promotions.offerDetail')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const isFavorite = isPromotionFavorite(promotion.id);
              if (isFavorite) {
                removeFavoritePromotion(promotion.id);
              } else {
                // Convertir PromotionDetail a FavoritePromotion
                addFavoritePromotion({
                  id: promotion.id,
                  title: promotion.title,
                  description: promotion.subtitle,
                  image: promotion.image,
                  badge: {
                    text: promotion.badge.text,
                    color: 'bg-primary'
                  },
                  category: promotion.category
                });
              }
            }}
            className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#181411] dark:text-white"
          >
            <span 
              className={`material-symbols-outlined ${isPromotionFavorite(promotion.id) ? 'text-red-500' : ''}`}
              style={isPromotionFavorite(promotion.id) ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              favorite
            </span>
          </button>
          <button
            onClick={handleShare}
            className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#181411] dark:text-white"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
      </div>

      {/* Header Image with Badge */}
      <div className="px-4 py-3 relative">
        <div
          className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-white rounded-xl min-h-80 shadow-lg"
          style={{ backgroundImage: `url("${promotion.image}")` }}
        >
          <div className="m-4 self-start bg-primary text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-md">
            <span className="material-symbols-outlined text-sm">{promotion.badge.icon}</span>
            {promotion.badge.text}
          </div>
        </div>
      </div>

      {/* Headline & Savings Section */}
      <div className="px-4 flex flex-col gap-1">
        <div className="flex justify-between items-start pt-4">
          <h1 className="text-[#181411] dark:text-white tracking-light text-[28px] font-extrabold leading-tight">
            {promotion.title}
          </h1>
          {promotion.flashOffer && (
            <div className="bg-primary/10 dark:bg-primary/20 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
              {t('promotions.flashOffer')}
            </div>
          )}
        </div>
        <p className="text-[#181411]/60 dark:text-white/60 text-base">{promotion.subtitle}</p>
      </div>

      {/* Stats Card */}
      <div className="flex flex-wrap gap-4 p-4">
        <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#2d241b] shadow-sm border border-black/5 dark:border-white/5">
          <p className="text-[#181411]/70 dark:text-white/70 text-sm font-medium leading-normal uppercase tracking-wider">
            {t('promotions.realSavings')}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="text-[#181411] dark:text-white tracking-light text-4xl font-extrabold leading-tight">
              ${promotion.savings.toFixed(2)}
            </p>
            <p className="text-[#07880e] text-lg font-bold leading-normal">
              +{promotion.discountPercent}% OFF
            </p>
          </div>
          <p className="text-xs text-[#181411]/50 dark:text-white/50">
            {t('promotions.before')}: ${promotion.originalPrice.toFixed(2)} • {t('promotions.now')}: ${promotion.currentPrice.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Countdown Section - Solo mostrar si flash_counter está activado */}
      {promotion.flashOffer && timeRemaining > 0 && (
        <div className="px-4 py-2">
          <div className="bg-background-dark text-white rounded-xl p-4 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">timer</span>
              <h3 className="text-sm font-bold uppercase tracking-tight">
                {t('promotions.offerEndsIn')}:
              </h3>
            </div>
            <div className="flex gap-2 text-xl font-black font-mono">
              <span className="bg-white/10 px-2 py-1 rounded">{time.hours}</span>:
              <span className="bg-white/10 px-2 py-1 rounded">{time.minutes}</span>:
              <span className="bg-white/10 px-2 py-1 rounded text-primary">{time.seconds}</span>
            </div>
          </div>
        </div>
      )}

      {/* Conditions & Schedule */}
      <div className="mt-4">
        <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-3">
          {t('promotions.applicationConditions')}
        </h3>
        <div className="px-4 space-y-3">
          <div className="flex items-center gap-4 bg-white dark:bg-[#2d241b] p-4 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">{t('promotions.breakfastHours')}</p>
              <p className="text-xs text-[#181411]/60 dark:text-white/60">{promotion.conditions.schedule}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-[#2d241b] p-4 rounded-xl shadow-sm border border-black/5 dark:border-white/5">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <p className="text-sm font-bold dark:text-white">{t('promotions.applicableDays')}</p>
              <p className="text-xs text-[#181411]/60 dark:text-white/60">{promotion.conditions.days}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Included Items */}
      <div className="mt-6 px-4">
        <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
          {t('promotions.whatIncludes')}
        </h3>
        <ul className="space-y-2">
          {promotion.includes.map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-[#181411]/80 dark:text-white/80">
              <span className="material-symbols-outlined text-primary text-lg">check_circle</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Sticky Bottom CTA Area */}
      <div className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 z-[60]" style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleApplyToOrder}
          className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-full font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">shopping_cart_checkout</span>
          {t('promotions.applyToOrder')}
        </button>
      </div>
    </div>
  );
};

export default PromotionDetailScreen;
