import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';

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

const PromotionDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [timeRemaining, setTimeRemaining] = useState(2712); // 45 minutos y 12 segundos en segundos

  // Datos de ejemplo - en producción esto vendría de una API o contexto
  const promotion: PromotionDetail = {
    id: id || '1',
    title: 'Combo de Temporada',
    subtitle: 'Desayuno Completo + Café Americano Grande',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAPk8W1qWt9rmnBnMMPleJ0Vei-6cL4RyFmBsbpQmvYY2qokykJB8OwnD4jsCHtdoH7995WbQJPoPcgHOIYrGGpFSi52EA22IWUHKSJTFRt04q2-4G03w7CNQhgtrkTcHgLe9FfIu7eBUQPmRXjRgczjVY9qTL7CpB6W1Bw9K6xOmx3Ac-TPQ5WCKmc5mJ946V5hpQroEcdXU6v-G7P5URUKtbvTM3_3BY5vHM4yrkqrtTuv0r44_VB61LdgosQcZT5OPgPyPkHZbmC',
    badge: {
      text: 'MODO DESAYUNO',
      icon: 'wb_sunny'
    },
    originalPrice: 20.00,
    currentPrice: 15.00,
    savings: 5.00,
    discountPercent: 25,
    flashOffer: true,
    timeRemaining: 2712,
    conditions: {
      schedule: '7:00 AM - 11:00 AM',
      days: 'Lunes a Viernes'
    },
    includes: [
      'Dos huevos al gusto (revueltos o estrellados)',
      'Porción de frijoles refritos y plátanos fritos',
      'Café americano de especialidad (12oz)',
      'Pan tostado artesanal (2 rodajas)'
    ],
    category: 'breakfast'
  };

  // Contador regresivo
  useEffect(() => {
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
  }, []);

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

  const handleApplyToOrder = () => {
    // TODO: Agregar el combo al carrito
    // Por ahora, solo navegamos al menú
    alert(t('promotions.appliedToOrder'));
    navigate('/menu');
  };

  const handleShare = () => {
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
        <button
          onClick={handleShare}
          className="flex size-12 cursor-pointer items-center justify-center rounded-full bg-transparent text-[#181411] dark:text-white"
        >
          <span className="material-symbols-outlined">share</span>
        </button>
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

      {/* Countdown Section */}
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
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] p-4 pb-8 bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 z-20">
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
