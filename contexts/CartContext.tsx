import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, quantity: number, notes?: string) => void;
  updateCartItemNotes: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  setCartItems: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.id === item.id && cartItem.notes === item.notes
      );
      
      if (existingItem) {
        // Si el item ya existe con las mismas notas, incrementar cantidad
        return prev.map(cartItem =>
          cartItem.id === existingItem.id && cartItem.notes === existingItem.notes
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Si no existe, agregar nuevo item
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartItemQuantity = (itemId: number, quantity: number, notes?: string) => {
    if (quantity <= 0) {
      if (notes !== undefined) {
        // Remover solo el item con este ID y estas notas específicas
        setCart(prev => prev.filter(item => 
          !(item.id === itemId && item.notes === notes)
        ));
      } else {
        // Remover todos los items con este ID (comportamiento original)
        removeFromCart(itemId);
      }
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (notes !== undefined) {
          // Si se especifican notas, solo actualizar el item con esas notas
          return (item.id === itemId && item.notes === notes) 
            ? { ...item, quantity } 
            : item;
        } else {
          // Comportamiento original: actualizar todos los items con este ID
          return item.id === itemId ? { ...item, quantity } : item;
        }
      })
    );
  };

  const updateCartItemNotes = (itemId: number, notes: string) => {
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, notes } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const setCartItems = (items: CartItem[]) => {
    setCart(items);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart, 
      updateCartItemQuantity,
      updateCartItemNotes,
      clearCart, 
      getCartItemCount,
      setCartItems
    }}>
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
