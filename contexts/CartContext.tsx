import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCart, setCart as setCartDB, addToCart as addToCartDB, removeFromCart as removeFromCartDB, clearCart as clearCartDB, CartItem } from '../services/database';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
  image?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (itemId: number) => void;
  updateCartItemQuantity: (itemId: number, quantity: number, notes?: string) => void;
  updateCartItemNotes: (itemId: number, notes: string) => void;
  clearCart: () => void;
  getCartItemCount: () => number;
  setCartItems: (items: CartItem[]) => void;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar carrito desde Supabase/localStorage al iniciar
  useEffect(() => {
    const loadCart = async () => {
      try {
        const cartData = await getCart();
        setCart(cartData);
      } catch (error) {
        console.error('Error loading cart:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCart();
  }, []);

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    // Llamar directamente a addToCartDB con la cantidad para evitar duplicados
    // addToCartDB maneja el upsert correctamente en la base de datos
    const itemWithQuantity: CartItem = { ...item, quantity };
    await addToCartDB(itemWithQuantity);
    
    // Actualizar el estado local después de la operación en la BD
    setCart(prev => {
      const existingItem = prev.find(cartItem => 
        cartItem.id === item.id && cartItem.notes === item.notes
      );
      
      if (existingItem) {
        // Si el item ya existe con las mismas notas, incrementar cantidad
        return prev.map(cartItem =>
          cartItem.id === existingItem.id && cartItem.notes === existingItem.notes
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        // Si no existe, agregar nuevo item
        return [...prev, itemWithQuantity];
      }
    });
  };

  const removeFromCart = async (itemId: number) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== itemId);
      // Guardar en Supabase/localStorage
      setCartDB(updated).catch(console.error);
      return updated;
    });
  };

  const updateCartItemQuantity = async (itemId: number, quantity: number, notes?: string) => {
    if (quantity <= 0) {
      if (notes !== undefined) {
        // Remover solo el item con este ID y estas notas específicas
        setCart(prev => {
          const updated = prev.filter(item => 
            !(item.id === itemId && item.notes === notes)
          );
          // Guardar en Supabase/localStorage
          setCartDB(updated).catch(console.error);
          return updated;
        });
      } else {
        // Remover todos los items con este ID (comportamiento original)
        removeFromCart(itemId);
      }
      return;
    }
    setCart(prev => {
      const updated = prev.map(item => {
        if (notes !== undefined) {
          // Si se especifican notas, solo actualizar el item con esas notas
          return (item.id === itemId && item.notes === notes) 
            ? { ...item, quantity } 
            : item;
        } else {
          // Comportamiento original: actualizar todos los items con este ID
          return item.id === itemId ? { ...item, quantity } : item;
        }
      });
      // Guardar en Supabase/localStorage
      setCartDB(updated).catch(console.error);
      return updated;
    });
  };

  const updateCartItemNotes = async (itemId: number, notes: string) => {
    setCart(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, notes } : item
      );
      // Guardar en Supabase/localStorage
      setCartDB(updated).catch(console.error);
      return updated;
    });
  };

  const clearCart = async () => {
    setCart([]);
    // Guardar en Supabase/localStorage
    clearCartDB().catch(console.error);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const setCartItems = async (items: CartItem[]) => {
    setCart(items);
    // Guardar en Supabase/localStorage
    setCartDB(items).catch(console.error);
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
      setCartItems,
      isLoading
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
