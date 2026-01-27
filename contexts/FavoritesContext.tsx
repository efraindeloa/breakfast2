import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem } from './CartContext';

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

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [favoriteDishes, setFavoriteDishes] = useState<FavoriteDish[]>([]);
  const [savedCombinations, setSavedCombinations] = useState<SavedCombination[]>([]);
  const [favoritePromotions, setFavoritePromotions] = useState<FavoritePromotion[]>([]);

  // Cargar favoritos desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavoriteDishes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  }, []);

  // Cargar combinaciones desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COMBINATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convertir fechas de string a Date
        const combinations = parsed.map((comb: any) => ({
          ...comb,
          createdAt: new Date(comb.createdAt),
          lastUsed: comb.lastUsed ? new Date(comb.lastUsed) : undefined,
        }));
        setSavedCombinations(combinations);
      }
    } catch (error) {
      console.error('Error loading combinations:', error);
    }
  }, []);

  // Cargar promociones favoritas desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PROMOTIONS_STORAGE_KEY);
      if (stored) {
        setFavoritePromotions(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorite promotions:', error);
    }
  }, []);

  // Guardar favoritos en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteDishes));
  }, [favoriteDishes]);

  // Guardar combinaciones en localStorage cuando cambian
  useEffect(() => {
    const toStore = savedCombinations.map(comb => ({
      ...comb,
      createdAt: comb.createdAt.toISOString(),
      lastUsed: comb.lastUsed?.toISOString(),
    }));
    localStorage.setItem(COMBINATIONS_STORAGE_KEY, JSON.stringify(toStore));
  }, [savedCombinations]);

  // Guardar promociones favoritas en localStorage cuando cambian
  useEffect(() => {
    localStorage.setItem(PROMOTIONS_STORAGE_KEY, JSON.stringify(favoritePromotions));
  }, [favoritePromotions]);

  const addFavorite = (dish: FavoriteDish) => {
    setFavoriteDishes(prev => {
      if (prev.find(f => f.id === dish.id)) {
        return prev; // Ya existe
      }
      return [...prev, dish];
    });
  };

  const removeFavorite = (dishId: number) => {
    setFavoriteDishes(prev => prev.filter(f => f.id !== dishId));
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
