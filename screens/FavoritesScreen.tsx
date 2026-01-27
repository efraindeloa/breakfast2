import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useCart } from '../contexts/CartContext';

const FavoritesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { favoriteDishes, savedCombinations, favoritePromotions, removeFavorite, removeFavoritePromotion, deleteCombination, loadCombination } = useFavorites();
  const { addToCart, clearCart } = useCart();
  const [activeTab, setActiveTab] = useState<'dishes' | 'combinations' | 'promotions'>('dishes');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [combinationName, setCombinationName] = useState('');

  // Funciones auxiliares para obtener nombres y descripciones traducidas
  const getDishName = (dishId: number, storedName?: string): string => {
    try {
      // Primero intentar traducir usando el ID
      const translated = t(`dishes.${dishId}.name`);
      // Si la traducción devuelve la misma clave o una clave de traducción, intentar traducir el nombre guardado si es una clave
      if (!translated || translated === `dishes.${dishId}.name` || translated.startsWith('dishes.')) {
        // Si el nombre guardado es una clave de traducción, intentar traducirla
        if (storedName && storedName.startsWith('dishes.')) {
          const storedTranslated = t(storedName);
          if (storedTranslated && storedTranslated !== storedName && !storedTranslated.startsWith('dishes.')) {
            return storedTranslated;
          }
        }
        return `dish-${dishId}`;
      }
      return translated;
    } catch {
      return `dish-${dishId}`;
    }
  };

  const getDishDescription = (dishId: number, storedDescription?: string): string => {
    try {
      // Primero intentar traducir usando el ID
      const translated = t(`dishes.${dishId}.description`);
      // Si la traducción devuelve la misma clave o una clave de traducción, intentar traducir la descripción guardada si es una clave
      if (!translated || translated === `dishes.${dishId}.description` || translated.startsWith('dishes.')) {
        // Si la descripción guardada es una clave de traducción, intentar traducirla
        if (storedDescription && storedDescription.startsWith('dishes.')) {
          const storedTranslated = t(storedDescription);
          if (storedTranslated && storedTranslated !== storedDescription && !storedTranslated.startsWith('dishes.')) {
            return storedTranslated;
          }
        }
        return '';
      }
      return translated;
    } catch {
      return '';
    }
  };

  const handleAddFavoriteToCart = (dish: typeof favoriteDishes[0]) => {
    const price = parseFloat(dish.price.replace('$', ''));
    addToCart({
      id: dish.id,
      name: getDishName(dish.id),
      price: price,
      notes: '',
    });
  };

  const handleLoadCombination = (combinationId: string) => {
    clearCart();
    const items = loadCombination(combinationId);
    items.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart({
          id: item.id,
          name: item.name,
          price: item.price,
          notes: item.notes,
        });
      }
    });
    navigate('/orders');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 w-10 h-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px] text-[#8a7560] dark:text-[#d4c4a8]">chevron_left</span>
            </button>
          </div>
          <h1 className="text-[#181411] dark:text-white text-lg font-semibold tracking-tight">{t('favorites.title')}</h1>
          <div className="w-10"></div>
        </div>
        {/* Tabs */}
        <div className="bg-background-light dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('dishes')}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'dishes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {t('favorites.dishes')}
            </button>
            <button
              onClick={() => setActiveTab('combinations')}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'combinations'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {t('favorites.combinations')}
            </button>
            <button
              onClick={() => setActiveTab('promotions')}
              className={`flex-1 py-2 text-center font-semibold border-b-2 transition-colors ${
                activeTab === 'promotions'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
            >
              {t('favorites.promotions')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Content */}
        <div className="p-4">
          {activeTab === 'promotions' ? (
            <>
              {favoritePromotions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                    local_offer
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-2">{t('favorites.noPromotions')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center">{t('favorites.noPromotionsDesc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoritePromotions.map((promotion) => (
                    <div
                      key={promotion.id}
                      className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/promotion-detail/${promotion.id}`)}
                    >
                      <div className="relative w-full aspect-[16/9] bg-cover bg-center rounded-t-xl overflow-hidden" style={{ backgroundImage: `url("${promotion.image}")` }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavoritePromotion(promotion.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors z-10"
                        >
                          <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            favorite
                          </span>
                        </button>
                        <div className={`absolute top-2 left-2 ${promotion.badge.color} text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider z-10`}>
                          {promotion.badge.text}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-[#181411] dark:text-white mb-1">
                          {promotion.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {promotion.description}
                        </p>
                        {promotion.timeRestriction && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1 mb-2">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            {promotion.timeRestriction}
                          </p>
                        )}
                        {promotion.discount && (
                          <p className="text-sm font-bold text-primary">{promotion.discount}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'dishes' ? (
            <>
              {favoriteDishes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                    favorite_border
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-2">{t('favorites.noFavorites')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center">{t('favorites.noFavoritesDesc')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {favoriteDishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/dish/${dish.id}`)}
                    >
                      <div
                        className="w-full h-40 bg-cover bg-center relative"
                        style={{ backgroundImage: `url("${dish.image}")` }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(dish.id);
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors"
                        >
                          <span className="material-symbols-outlined text-red-500 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                            favorite
                          </span>
                        </button>
                        {dish.badges?.includes('vegano') && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {t('dishDetail.vegan')}
                          </div>
                        )}
                        {dish.badges?.includes('especialidad') && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {t('dishDetail.specialty')}
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-base font-bold text-[#181411] dark:text-white mb-1">
                          {getDishName(dish.id, dish.name)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {getDishDescription(dish.id, dish.description)}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">{dish.price}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dish/${dish.id}`);
                            }}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                          >
                            {t('favorites.addToCart')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {savedCombinations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">
                    restaurant_menu
                  </span>
                  <p className="text-gray-500 dark:text-gray-400 text-center mb-2">{t('favorites.noCombinations')}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 text-center">{t('favorites.noCombinationsDesc')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedCombinations.map((combination) => {
                    const total = combination.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                    return (
                      <div
                        key={combination.id}
                        className="bg-white dark:bg-[#2d241c] rounded-xl border border-[#e6e0db] dark:border-[#3d3228] p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-1">
                              {combination.name}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{t('favorites.created')}: {formatDate(combination.createdAt)}</span>
                              {combination.lastUsed && (
                                <span>{t('favorites.lastUsed')}: {formatDate(combination.lastUsed)}</span>
                              )}
                              <span>{t('favorites.used')}: {combination.useCount} {t('favorites.times')}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteConfirm(combination.id)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <span className="material-symbols-outlined text-gray-400 text-lg">delete</span>
                          </button>
                        </div>

                        <div className="mb-4 space-y-2">
                          {combination.items.map((item, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                                <span className="text-[#181411] dark:text-white">{item.name}</span>
                              </div>
                              <span className="text-[#181411] dark:text-white font-semibold">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                          <span className="text-base font-bold text-[#181411] dark:text-white">
                            {t('favorites.total')}: <span className="text-primary">${total.toFixed(2)}</span>
                          </span>
                          <button
                            onClick={() => handleLoadCombination(combination.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
                          >
                            {t('favorites.orderAgain')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">
              {t('favorites.deleteConfirm')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('favorites.deleteConfirmDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  deleteCombination(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritesScreen;
