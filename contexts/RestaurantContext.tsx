import React, { createContext, useContext, useState, useEffect } from 'react';

interface RestaurantContextType {
  selectedRestaurant: string;
  setSelectedRestaurant: (restaurant: string) => void;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

export const RestaurantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedRestaurant, setSelectedRestaurantState] = useState<string>('Don Kamaron Restaurant');

  // Cargar restaurante desde localStorage al iniciar
  useEffect(() => {
    const savedRestaurant = localStorage.getItem('selectedRestaurant');
    if (savedRestaurant) {
      setSelectedRestaurantState(savedRestaurant);
    }
  }, []);

  // Guardar restaurante en localStorage cuando cambia
  const setSelectedRestaurant = (restaurant: string) => {
    setSelectedRestaurantState(restaurant);
    localStorage.setItem('selectedRestaurant', restaurant);
  };

  return (
    <RestaurantContext.Provider value={{ selectedRestaurant, setSelectedRestaurant }}>
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
