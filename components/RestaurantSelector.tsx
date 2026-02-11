import React, { useState, useEffect } from 'react';
import { useRestaurant } from '../contexts/RestaurantContext';
import { getRestaurants, Restaurant } from '../services/database';
import { useTranslation } from '../contexts/LanguageContext';
import { playClickSound } from '../utils/sound';

const RestaurantSelector: React.FC = () => {
  const { selectedRestaurantId, setSelectedRestaurantId, setSelectedRestaurant } = useRestaurant();
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadRestaurants = async () => {
      try {
        setIsLoading(true);
        const data = await getRestaurants({ isActive: true });
        setRestaurants(data);
        
        // No seleccionar automáticamente un restaurante - el usuario debe seleccionarlo manualmente
      } catch (error) {
        console.error('[RestaurantSelector] Error loading restaurants:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo cargar una vez al montar el componente

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);

  const handleSelect = (restaurant: Restaurant) => {
    playClickSound();
    setSelectedRestaurantId(restaurant.id);
    setSelectedRestaurant(restaurant.name);
    setIsOpen(false);
  };

  if (isLoading) {
    return (
      <div className="px-4 py-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (restaurants.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-3 relative">
      <button
        onClick={() => {
          playClickSound();
          setIsOpen(!isOpen);
        }}
        className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 hover:border-primary dark:hover:border-primary transition-colors flex items-center gap-3"
      >
        {selectedRestaurant?.image ? (
          <img 
            src={selectedRestaurant.image} 
            alt={selectedRestaurant.name}
            className="w-10 h-10 rounded-lg object-contain bg-white"
            //className="w-10 h-10 rounded-lg object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary">restaurant</span>
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-[#111813] dark:text-white truncate">
            {selectedRestaurant?.name || t('restaurant.selectRestaurant') || 'Seleccionar restaurante'}
          </p>
          {selectedRestaurant?.city ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {selectedRestaurant.city}
            </p>
          ) : !selectedRestaurant && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {t('restaurant.selectRestaurantHint') || 'Elige un restaurante para ver el menú'}
            </p>
          )}
        </div>
        <span className={`material-symbols-outlined text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-4 right-4 mt-2 z-50 max-h-64 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
            {restaurants.map((restaurant) => (
              <button
                key={restaurant.id}
                onClick={() => handleSelect(restaurant)}
                className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedRestaurantId === restaurant.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                }`}
              >
                {restaurant.image ? (
                  <img 
                    src={restaurant.image} 
                    alt={restaurant.name}
                    className="w-10 h-10 rounded-lg object-contain bg-white"
                    //className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">restaurant</span>
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-[#111813] dark:text-white truncate">
                    {restaurant.name}
                  </p>
                  {restaurant.city && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {restaurant.city}
                    </p>
                  )}
                </div>
                {selectedRestaurantId === restaurant.id && (
                  <span className="material-symbols-outlined text-primary">check</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default RestaurantSelector;
