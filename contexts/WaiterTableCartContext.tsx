import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface WaiterCartItem {
  id: number;
  name: string;
  price: number;
  notes: string;
  quantity: number;
}

interface WaiterTableCartContextType {
  tableNumber: number | null;
  tableLabel: string | null;
  items: WaiterCartItem[];
  setTable: (number: number, label: string) => void;
  clearTable: () => void;
  addItem: (item: Omit<WaiterCartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (itemId: number, notes: string) => void;
  updateQuantity: (itemId: number, notes: string, quantity: number) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

const WaiterTableCartContext = createContext<WaiterTableCartContextType | undefined>(undefined);

export const WaiterTableCartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tableNumber, setTableNumberState] = useState<number | null>(null);
  const [tableLabel, setTableLabelState] = useState<string | null>(null);
  const [items, setItems] = useState<WaiterCartItem[]>([]);

  const setTable = useCallback((number: number, label: string) => {
    setTableNumberState((prevNum) => {
      if (prevNum !== number) setItems([]);
      return number;
    });
    setTableLabelState(label);
  }, []);

  const clearTable = useCallback(() => {
    setTableNumberState(null);
    setTableLabelState(null);
    setItems([]);
  }, []);

  const addItem = useCallback((item: Omit<WaiterCartItem, 'quantity'>, quantity: number = 1) => {
    const newItem: WaiterCartItem = { ...item, quantity };
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.notes === (item.notes || ''));
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id && i.notes === existing.notes
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((itemId: number, notes: string) => {
    setItems((prev) => prev.filter((i) => !(i.id === itemId && i.notes === notes)));
  }, []);

  const updateQuantity = useCallback((itemId: number, notes: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId, notes);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === itemId && i.notes === notes ? { ...i, quantity } : i
      )
    );
  }, [removeItem]);

  const getTotal = useCallback(() => {
    return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }, [items]);

  const getItemCount = useCallback(() => {
    return items.reduce((sum, i) => sum + i.quantity, 0);
  }, [items]);

  return (
    <WaiterTableCartContext.Provider
      value={{
        tableNumber,
        tableLabel,
        items,
        setTable,
        clearTable,
        addItem,
        removeItem,
        updateQuantity,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </WaiterTableCartContext.Provider>
  );
};

export const useWaiterTableCart = (): WaiterTableCartContextType => {
  const context = useContext(WaiterTableCartContext);
  if (context === undefined) {
    throw new Error('useWaiterTableCart must be used within a WaiterTableCartProvider');
  }
  return context;
};
