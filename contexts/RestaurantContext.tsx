import React, { createContext, useContext, useState, useEffect } from 'react';
import { restaurantConfig, RestaurantConfig } from '../config/restaurantConfig';

interface RestaurantContextType {
  selectedRestaurant: string;
  selectedRestaurantId: string | null;
  setSelectedRestaurant: (restaurant: string) => void;
  setSelectedRestaurantId: (restaurantId: string | null) => void;
  config: RestaurantConfig;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRestaurant, setSelectedRestaurantState] = useState<string>('DONK RESTAURANT');
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState<string | null>(null);

  // Cargar restaurante desde localStorage al iniciar
  useEffect(() => {
    const savedRestaurant = localStorage.getItem('selectedRestaurant');
    if (savedRestaurant) {
      setSelectedRestaurantState(savedRestaurant);
    }
    
    const savedRestaurantId = localStorage.getItem('selectedRestaurantId');
    if (savedRestaurantId) {
      setSelectedRestaurantIdState(savedRestaurantId);
    }
  }, []);

  // Guardar restaurante en localStorage cuando cambia
  const setSelectedRestaurant = (restaurant: string) => {
    setSelectedRestaurantState(restaurant);
    localStorage.setItem('selectedRestaurant', restaurant);
  };

  // Guardar restaurant_id en localStorage cuando cambia
  const setSelectedRestaurantId = (restaurantId: string | null) => {
    setSelectedRestaurantIdState(restaurantId);
    if (restaurantId) {
      localStorage.setItem('selectedRestaurantId', restaurantId);
    } else {
      localStorage.removeItem('selectedRestaurantId');
    }
  };

  return (
    <RestaurantContext.Provider value={{ 
      selectedRestaurant, 
      selectedRestaurantId,
      setSelectedRestaurant, 
      setSelectedRestaurantId,
      config: restaurantConfig 
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};
