import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CartContextType {
  cart: Record<number, number>;
  addToCart: (dishId: number) => void;
  removeFromCart: (dishId: number) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Record<number, number>>({});

  const addToCart = (dishId: number) => {
    setCart(prev => ({
      ...prev,
      [dishId]: (prev[dishId] || 0) + 1
    }));
  };

  const removeFromCart = (dishId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[dishId] > 1) {
        newCart[dishId] = newCart[dishId] - 1;
      } else {
        delete newCart[dishId];
      }
      return newCart;
    });
  };

  const clearCart = () => {
    setCart({});
  };

  const getCartItemCount = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, getCartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
