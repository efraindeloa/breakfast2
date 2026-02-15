import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProducts, Product, getCurrentUserRestaurantId } from '../services/database';
import { useRestaurant } from './RestaurantContext';
import { useLanguage } from './LanguageContext';
import { useAuth } from './AuthContext';

interface ProductsContextType {
  products: Product[];
  isLoading: boolean;
  getProduct: (id: number) => Product | undefined;
  getProductsByCategory: (category: string) => Product[];
  getProductsByOrigin: (origin: string) => Product[];
  refreshProducts: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedRestaurantId } = useRestaurant();
  const { language } = useLanguage(); // Escuchar cambios de idioma
  const { accountType } = useAuth(); // Para saber si es restaurante o comensal

  // Cargar productos desde Supabase (sin fallback hardcodeado para comensales)
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Determinar qué restaurant_id usar:
      // - Si es restaurante: usar su propio restaurant_id
      // - Si es comensal: usar el restaurante seleccionado (selectedRestaurantId)
      let restaurantId: string | undefined = undefined;
      if (accountType === 'restaurant') {
        restaurantId = await getCurrentUserRestaurantId() || undefined;
      } else if (accountType === 'diner' && selectedRestaurantId) {
        // Para comensales, usar el restaurante seleccionado
        restaurantId = selectedRestaurantId;
      }
      
      const supabaseProducts = await getProducts({ 
        isActive: true,
        restaurantId: restaurantId,
      });
      
      if (supabaseProducts.length > 0) {
        setProducts(supabaseProducts);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('[ProductsContext] Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [language, selectedRestaurantId, accountType]); // Recargar cuando cambie el idioma, el restaurante seleccionado o el tipo de cuenta

  const getProduct = (id: number): Product | undefined => {
    return products.find(p => p.id === id);
  };

  const getProductsByCategory = (category: string): Product[] => {
    return products.filter(p => p.category === category);
  };

  const getProductsByOrigin = (origin: string): Product[] => {
    return products.filter(p => p.origin === origin);
  };

  const refreshProducts = async () => {
    await loadProducts();
  };

  return (
    <ProductsContext.Provider value={{
      products,
      isLoading,
      getProduct,
      getProductsByCategory,
      getProductsByOrigin,
      refreshProducts,
    }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider');
  }
  return context;
};
