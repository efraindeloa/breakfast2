import React, { useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

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
  media: string[]; // URLs de archivos
  timestamp: string;
  updatedAt?: string;
}

type FilterType = 'recent' | 'with-photo' | 'modified';

const ProductReviewsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { dishId } = useParams<{ dishId: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  
  const productId = dishId ? parseInt(dishId) : (location.state as any)?.productId;
  const productName = (location.state as any)?.productName || 'Producto';

  const [activeFilter, setActiveFilter] = useState<FilterType>('recent');

  // Cargar todas las reviews del producto
  const productReviews = useMemo<Review[]>(() => {
    if (!productId) return [];

    try {
      const reviewsData = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (reviewsData) {
        const allReviews: Review[] = JSON.parse(reviewsData);
        return allReviews.filter(r => r.type === 'dish' && r.itemId === productId);
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    }
    return [];
  }, [productId]);

  // Filtrar reviews según el filtro activo
  const filteredReviews = useMemo(() => {
    let filtered = [...productReviews];

    switch (activeFilter) {
      case 'recent':
        // Ordenar por timestamp más reciente
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'with-photo':
        // Solo reviews con media
        filtered = filtered.filter(r => r.media && r.media.length > 0);
        filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        break;
      case 'modified':
        // Solo reviews modificadas
        filtered = filtered.filter(r => r.updatedAt);
        filtered.sort((a, b) => {
          const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
          return dateB - dateA;
        });
        break;
    }

    return filtered;
  }, [productReviews, activeFilter]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    if (productReviews.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = productReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = total / productReviews.length;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    productReviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating as keyof typeof distribution]++;
      }
    });

    return {
      averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
      totalReviews: productReviews.length,
      distribution
    };
  }, [productReviews]);

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return t('productReviews.today') || 'Hoy';
    } else if (diffInDays === 1) {
      return t('productReviews.yesterday') || 'Ayer';
    } else if (diffInDays < 7) {
      return (t('productReviews.daysAgo') || 'Hace {days} días').replace('{days}', diffInDays.toString());
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    }
  };

  const getPercentage = (count: number): number => {
    if (stats.totalReviews === 0) return 0;
    return Math.round((count / stats.totalReviews) * 100);
  };

  const renderStars = (rating: number, size: 'xs' | 'xl' = 'xs') => {
    const sizeClass = size === 'xl' ? 'text-xl' : 'text-xs';
    return (
      <div className={`flex gap-0.5 text-primary`}>
        {[1, 2, 3, 4, 5].map((value) => (
          <span
            key={value}
            className={`material-symbols-outlined ${sizeClass} ${value <= rating ? 'fill-icon' : ''}`}
          >
            star
          </span>
        ))}
      </div>
    );
  };

  if (!productId) {
    return (
      <div className="bg-background-light dark:bg-background-dark min-h-screen flex items-center justify-center">
        <p className="text-[#181411] dark:text-white">Producto no encontrado</p>
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-[#181411]/95 backdrop-blur-md border-b border-zinc-50 dark:border-zinc-800">
        <div className="flex items-center p-4 pb-2 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-start"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios</span>
          </button>
          <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display">
            {t('productReviews.title') || 'Opiniones Verificadas'}
          </h2>
          <div className="flex w-12 items-center justify-end">
            <button className="flex items-center justify-center rounded-lg h-12 bg-transparent text-[#181411] dark:text-white">
              <span className="material-symbols-outlined text-2xl">more_horiz</span>
            </button>
          </div>
        </div>
      </header>

      {/* Estadísticas */}
      {productReviews.length > 0 && (
        <section className="p-4">
          <div className="flex flex-wrap gap-x-8 gap-y-6 bg-[#fffcf5] dark:bg-primary/5 p-5 rounded-3xl border border-primary/10">
            <div className="flex flex-col gap-1 items-center justify-center">
              <p className="text-[#181411] dark:text-white text-5xl font-black leading-tight tracking-[-0.033em] font-display">
                {stats.averageRating.toFixed(1)}
              </p>
              {renderStars(Math.round(stats.averageRating), 'xl')}
              <p className="text-[#887563] dark:text-[#cec4bb] text-xs font-semibold leading-normal mt-1">
                {stats.totalReviews} {stats.totalReviews === 1 ? (t('productReviews.review') || 'reseña') : (t('productReviews.reviews') || 'reseñas')}
              </p>
            </div>
            <div className="grid min-w-[180px] flex-1 grid-cols-[20px_1fr_40px] items-center gap-y-2">
              {[5, 4, 3].map((rating) => {
                const count = stats.distribution[rating as keyof typeof stats.distribution];
                const percentage = getPercentage(count);
                return (
                  <React.Fragment key={rating}>
                    <p className="text-[#181411] dark:text-white text-[10px] font-bold">{rating}</p>
                    <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-[#e5e0dc] dark:bg-zinc-700">
                      <div
                        className="rounded-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[#887563] dark:text-[#cec4bb] text-[10px] font-medium text-right">
                      {percentage}%
                    </p>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Filtros */}
      {productReviews.length > 0 && (
        <section className="overflow-x-auto no-scrollbar">
          <div className="flex gap-3 px-4 py-2">
            <button
              onClick={() => setActiveFilter('recent')}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-all ${
                activeFilter === 'recent'
                  ? 'bg-primary text-white shadow-primary/20'
                  : 'bg-[#f4f2f0] dark:bg-zinc-800 text-[#181411] dark:text-[#f8f7f6]'
              }`}
            >
              <p className="text-xs font-bold">
                {t('productReviews.mostRecent') || 'Más Recientes'}
              </p>
            </button>
            <button
              onClick={() => setActiveFilter('with-photo')}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${
                activeFilter === 'with-photo'
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-[#f4f2f0] dark:bg-zinc-800 text-[#181411] dark:text-[#f8f7f6]'
              }`}
            >
              <p className="text-xs font-semibold">
                {t('productReviews.withPhoto') || 'Con Foto'}
              </p>
            </button>
            <button
              onClick={() => setActiveFilter('modified')}
              className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${
                activeFilter === 'modified'
                  ? 'bg-primary text-white shadow-sm shadow-primary/20'
                  : 'bg-[#f4f2f0] dark:bg-zinc-800 text-[#181411] dark:text-[#f8f7f6]'
              }`}
            >
              <p className="text-xs font-semibold">
                {t('productReviews.modified') || 'Modificados'}
              </p>
            </button>
          </div>
        </section>
      )}

      {/* Lista de opiniones */}
      <main className="flex flex-col gap-6 p-4 mb-32">
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#887563] dark:text-[#cec4bb] text-sm">
              {t('productReviews.noReviews') || 'No hay opiniones disponibles para este producto.'}
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-4 bg-white dark:bg-zinc-900/50 p-5 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              {/* Header de la review */}
              <div className="flex items-start gap-3">
                <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12 shadow-inner border-2 border-white dark:border-zinc-800 bg-gradient-to-br from-primary/20 to-primary/10"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[#181411] dark:text-white text-base font-bold leading-tight">
                      {t('productReviews.reviewer') || 'Comensal'} #{review.id.slice(-6)}
                    </p>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                      <span className="material-symbols-outlined text-[14px] fill-icon">verified</span>
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        {t('productReviews.verified') || 'Verificado'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[#887563] dark:text-[#cec4bb] text-[11px] font-medium mt-0.5">
                    {formatDate(review.timestamp)}
                    {review.updatedAt && ` • ${t('productReviews.modified') || 'Modificado'}`}
                  </p>
                </div>
                <div className="flex gap-0.5 text-primary">
                  {renderStars(review.rating)}
                </div>
              </div>

              {/* Comentario */}
              {review.comment && (
                <p className="text-[#181411] dark:text-[#f8f7f6] text-sm font-medium leading-relaxed">
                  {review.comment}
                </p>
              )}

              {/* Chips */}
              {review.chips && review.chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.chips.map((chip, index) => (
                    <div
                      key={index}
                      className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-[11px] font-bold border border-primary/20 flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">add_circle</span>
                      {chip}
                    </div>
                  ))}
                </div>
              )}

              {/* Media */}
              {review.media && review.media.length > 0 && (
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {review.media.map((mediaUrl, index) => (
                    <div
                      key={index}
                      className="w-32 h-32 shrink-0 rounded-2xl bg-center bg-cover border border-zinc-100 dark:border-zinc-800"
                      style={{ backgroundImage: `url(${mediaUrl})` }}
                    ></div>
                  ))}
                </div>
              )}

              {/* Footer de la review */}
              <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex gap-6 text-[#887563] dark:text-[#cec4bb]">
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">favorite</span>
                    <p className="text-xs font-bold">0</p>
                  </button>
                  <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined text-lg">chat_bubble</span>
                    <p className="text-xs font-bold">0</p>
                  </button>
                </div>
                <button className="text-zinc-400 dark:text-zinc-500 text-xs font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">translate</span>
                  {t('productReviews.translatedByAI') || 'Traducido por IA'}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default ProductReviewsScreen;
