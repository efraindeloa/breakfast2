import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';
import { getFavorites, addFavorite as addFavoriteDB, removeFavorite as removeFavoriteDB } from '../services/database';
import { useRestaurant } from './RestaurantContext';

export interface FavoriteDish {
  id: number;
  name: string;
  description: string;
  price: string;
  image: string;
  category: string;
  origin: string;
  badges?: string[];
}

export interface SavedCombination {
  id: string;
  name: string;
  items: CartItem[];
  createdAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface FavoritePromotion {
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
}

interface FavoritesContextType {
  favoriteDishes: FavoriteDish[];
  savedCombinations: SavedCombination[];
  favoritePromotions: FavoritePromotion[];
  addFavorite: (dish: FavoriteDish) => void;
  removeFavorite: (dishId: number) => void;
  isFavorite: (dishId: number) => boolean;
  addFavoritePromotion: (promotion: FavoritePromotion) => void;
  removeFavoritePromotion: (promotionId: string) => void;
  isPromotionFavorite: (promotionId: string) => boolean;
  saveCombination: (name: string, items: CartItem[]) => string;
  deleteCombination: (combinationId: string) => void;
  loadCombination: (combinationId: string) => CartItem[];
  updateCombinationUse: (combinationId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = 'favorite_dishes';
const COMBINATIONS_STORAGE_KEY = 'saved_combinations';
const PROMOTIONS_STORAGE_KEY = 'favorite_promotions';

// Función helper para cargar favoritos desde localStorage
const loadFavoritesFromStorage = (storageKey?: string): FavoriteDish[] => {
  try {
    const key = storageKey || FAVORITES_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading favorites:', error);
  }
  return [];
};

// Función helper para cargar combinaciones desde localStorage
const loadCombinationsFromStorage = (): SavedCombination[] => {
  try {
    const stored = localStorage.getItem(COMBINATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convertir fechas de string a Date
      return parsed.map((comb: any) => ({
        ...comb,
        createdAt: new Date(comb.createdAt),
        lastUsed: comb.lastUsed ? new Date(comb.lastUsed) : undefined,
      }));
    }
  } catch (error) {
    console.error('Error loading combinations:', error);
  }
  return [];
};

// Función helper para cargar promociones favoritas desde localStorage
const loadPromotionsFromStorage = (): FavoritePromotion[] => {
  try {
    const stored = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading favorite promotions:', error);
  }
  return [];
};

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { selectedRestaurantId } = useRestaurant();
  
  // Inicializar estado directamente desde localStorage (fallback)
  const [favoriteDishes, setFavoriteDishes] = useState<FavoriteDish[]>(() => loadFavoritesFromStorage());
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>(() => loadCombinationsFromStorage());
  const [favoritePromotions, setFavoritePromotions] = useState<FavoritePromotion[]>(() => loadPromotionsFromStorage());
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar favoritos desde la base de datos cuando cambia el restaurante seleccionado
  useEffect(() => {
    const loadFavoritesFromDB = async () => {
      try {
        setIsLoading(true);
        // Cargar favoritos filtrados por restaurant_id
        const favorites = await getFavorites(selectedRestaurantId);
        if (favorites && favorites.length > 0) {
          setFavoriteDishes(favorites);
          // También guardar en localStorage como backup (con clave por restaurante)
          const storageKey = selectedRestaurantId 
            ? `${FAVORITES_STORAGE_KEY}_${selectedRestaurantId}`
            : FAVORITES_STORAGE_KEY;
          localStorage.setItem(storageKey, JSON.stringify(favorites));
        } else {
          // Si no hay favoritos en la BD para este restaurante, intentar cargar desde localStorage
          const storageKey = selectedRestaurantId 
            ? `${FAVORITES_STORAGE_KEY}_${selectedRestaurantId}`
            : FAVORITES_STORAGE_KEY;
          const localFavorites = loadFavoritesFromStorage(storageKey);
          if (localFavorites.length > 0) {
            setFavoriteDishes(localFavorites);
            // Intentar sincronizar con la BD
            for (const favorite of localFavorites) {
              await addFavoriteDB(favorite);
            }
          } else {
            // Si no hay favoritos locales para este restaurante, limpiar
            setFavoriteDishes([]);
          }
        }
      } catch (error) {
        console.error('[FavoritesContext] Error loading favorites from DB:', error);
        // Fallback a localStorage
        const storageKey = selectedRestaurantId 
          ? `${FAVORITES_STORAGE_KEY}_${selectedRestaurantId}`
          : FAVORITES_STORAGE_KEY;
        const localFavorites = loadFavoritesFromStorage(storageKey);
        if (localFavorites.length > 0) {
          setFavoriteDishes(localFavorites);
        } else {
          setFavoriteDishes([]);
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    loadFavoritesFromDB();
  }, [selectedRestaurantId]);

  // Guardar favoritos en localStorage cuando cambian (solo después de la inicialización, como backup)
  // Usar una clave específica por restaurante
  useEffect(() => {
    if (isInitialized && !isLoading) {
      const storageKey = selectedRestaurantId 
        ? `${FAVORITES_STORAGE_KEY}_${selectedRestaurantId}`
        : FAVORITES_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(favoriteDishes));
    }
  }, [favoriteDishes, isInitialized, isLoading, selectedRestaurantId]);

  // Guardar combinaciones en localStorage cuando cambian (solo después de la inicialización)
  useEffect(() => {
    if (isInitialized) {
      const toStore = savedCombinations.map(comb => ({
        ...comb,
        createdAt: comb.createdAt.toISOString(),
        lastUsed: comb.lastUsed?.toISOString(),
      }));
      localStorage.setItem(COMBINATIONS_STORAGE_KEY, JSON.stringify(toStore));
    }
  }, [savedCombinations, isInitialized]);

  // Guardar promociones favoritas en localStorage cuando cambian (solo después de la inicialización)
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(favoritePromotions));
    }
  }, [favoritePromotions, isInitialized]);

  const addFavorite = async (dish: FavoriteDish) => {
    // Verificar si ya existe localmente
    if (favoriteDishes.find(f => f.id === dish.id)) {
      return; // Ya existe
    }

    // Agregar a la base de datos (el formato ya es correcto: price es string)
    const success = await addFavoriteDB(dish);
    
    if (success) {
      // Si se guardó en la BD, actualizar el estado local
      setFavoriteDishes(prev => [...prev, dish]);
    } else {
      // Si falló la BD, agregar solo localmente (fallback)
      setFavoriteDishes(prev => [...prev, dish]);
    }
  };

  const removeFavorite = async (dishId: number) => {
    // Eliminar de la base de datos
    const success = await removeFavoriteDB(dishId);
    
    // Actualizar el estado local independientemente del resultado de la BD
    setFavoriteDishes(prev => prev.filter(f => f.id !== dishId));
    
    if (!success) {
      console.warn('[FavoritesContext] Error removing favorite from DB, but removed from local state');
    }
  };

  const isFavorite = (dishId: number): boolean => {
    return favoriteDishes.some(f => f.id === dishId);
  };

  const addFavoritePromotion = (promotion: FavoritePromotion) => {
    setFavoritePromotions(prev => {
      if (prev.find(p => p.id === promotion.id)) {
        return prev; // Ya existe
      }
      return [...prev, promotion];
    });
  };

  const removeFavoritePromotion = (promotionId: string) => {
    setFavoritePromotions(prev => prev.filter(p => p.id !== promotionId));
  };

  const isPromotionFavorite = (promotionId: string): boolean => {
    return favoritePromotions.some(p => p.id === promotionId);
  };

  const saveCombination = (name: string, items: CartItem[]): string => {
    const id = Date.now().toString();
    const newCombination: SavedCombination = {
      id,
      name,
      items: items.map(item => ({ ...item })), // Copiar items
      createdAt: new Date(),
      useCount: 0,
    };
    setSavedCombinations(prev => [newCombination, ...prev]);
    return id;
  };

  const deleteCombination = (combinationId: string) => {
    setSavedCombinations(prev => prev.filter(c => c.id !== combinationId));
  };

  const loadCombination = (combinationId: string): CartItem[] => {
    const combination = savedCombinations.find(c => c.id === combinationId);
    if (combination) {
      updateCombinationUse(combinationId);
      return combination.items.map(item => ({ ...item })); // Retornar copia
    }
    return [];
  };

  const updateCombinationUse = (combinationId: string) => {
    setSavedCombinations(prev =>
      prev.map(comb =>
        comb.id === combinationId
          ? { ...comb, lastUsed: new Date(), useCount: comb.useCount + 1 }
          : comb
      )
    );
  };

  return (
    <FavoritesContext.Provider
      value={{
        favoriteDishes,
        savedCombinations,
        favoritePromotions,
        addFavorite,
        removeFavorite,
        isFavorite,
        addFavoritePromotion,
        removeFavoritePromotion,
        isPromotionFavorite,
        saveCombination,
        deleteCombination,
        loadCombination,
        updateCombinationUse,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
