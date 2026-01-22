import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useGroupOrder } from '../contexts/GroupOrderContext';
import { Order, ORDERS_STORAGE_KEY } from '../types/order';

interface SelectableOrderItem {
  id: string; // ID único para este item (orderId-itemId-index)
  orderId: string;
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isUserItem: boolean; // Si este item fue pedido por el usuario actual
}

const SplitPaymentSelectionScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isGroupOrder, currentUserParticipant } = useGroupOrder();
  
  // Cargar todas las órdenes
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const savedData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch {
      return [];
    }
    return [];
  });

  // Crear lista de items seleccionables
  const selectableItems: SelectableOrderItem[] = useMemo(() => {
    const items: SelectableOrderItem[] = [];
    
    orders.forEach(order => {
      order.items.forEach((item, itemIndex) => {
        // Crear un item por cada unidad (quantity)
        for (let i = 0; i < item.quantity; i++) {
          const uniqueId = `${order.orderId}-${item.id}-${itemIndex}-${i}`;
          
          // Verificar si este item pertenece al usuario actual
          let isUserItem = false;
          if (isGroupOrder && currentUserParticipant) {
            // Buscar si este item está en los items del usuario
            isUserItem = currentUserParticipant.orderItems.some(
              userItem => userItem.id === item.id && 
              userItem.notes === item.notes
            );
          } else {
            // Si no es orden grupal, asumir que todos los items son del usuario
            isUserItem = true;
          }
          
          items.push({
            id: uniqueId,
            orderId: order.orderId,
            itemId: item.id,
            name: item.name,
            price: item.price,
            quantity: 1, // Cada item en la lista representa 1 unidad
            notes: item.notes,
            isUserItem,
          });
        }
      });
    });
    
    return items;
  }, [orders, isGroupOrder, currentUserParticipant]);

  // Estado de items seleccionados (por defecto, los del usuario)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(() => {
    const defaultSelected = new Set<string>();
    selectableItems.forEach(item => {
      if (item.isUserItem) {
        defaultSelected.add(item.id);
      }
    });
    return defaultSelected;
  });

  // Actualizar selección por defecto cuando cambien los items
  useEffect(() => {
    const defaultSelected = new Set<string>();
    selectableItems.forEach(item => {
      if (item.isUserItem) {
        defaultSelected.add(item.id);
      }
    });
    setSelectedItems(defaultSelected);
  }, [selectableItems]);

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const selectedItemsList = useMemo(() => {
    return selectableItems.filter(item => selectedItems.has(item.id));
  }, [selectableItems, selectedItems]);

  const subtotal = useMemo(() => {
    return selectedItemsList.reduce((sum, item) => sum + item.price, 0);
  }, [selectedItemsList]);

  const handleContinue = () => {
    if (selectedItemsList.length === 0) {
      alert(t('splitPayment.selectAtLeastOneItem'));
      return;
    }
    
    // Guardar items seleccionados para la siguiente pantalla
    const paymentData = {
      selectedItems: selectedItemsList,
      subtotal,
    };
    localStorage.setItem('splitPaymentData', JSON.stringify(paymentData));
    
    navigate('/split-payment-summary');
  };

  // Agrupar items por nombre y notas para mostrar mejor
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: { item: SelectableOrderItem; count: number; selected: number } } = {};
    
    selectableItems.forEach(item => {
      const key = `${item.itemId}-${item.notes || ''}`;
      if (!groups[key]) {
        groups[key] = {
          item,
          count: 0,
          selected: 0,
        };
      }
      groups[key].count++;
      if (selectedItems.has(item.id)) {
        groups[key].selected++;
      }
    });
    
    return Object.values(groups);
  }, [selectableItems, selectedItems]);

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payments')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[#181411] dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#181411] dark:text-white flex-1">
            {t('splitPayment.selectItems')}
          </h1>
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 py-4">
        <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4 border border-primary/20">
          <p className="text-sm text-[#181411] dark:text-white">
            {t('splitPayment.instructions')}
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="px-4 space-y-3">
        {groupedItems.map((group, index) => {
          const isFullySelected = group.selected === group.count;
          const isPartiallySelected = group.selected > 0 && group.selected < group.count;
          const isSelected = isFullySelected || isPartiallySelected;
          
          return (
            <div
              key={`${group.item.itemId}-${index}`}
              className={`bg-white dark:bg-[#2d2516] rounded-xl p-4 border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => {
                    // Toggle todos los items de este grupo
                    const itemIds = selectableItems
                      .filter(item => item.itemId === group.item.itemId && item.notes === group.item.notes)
                      .map(item => item.id);
                    
                    setSelectedItems(prev => {
                      const newSet = new Set(prev);
                      const allSelected = itemIds.every(id => newSet.has(id));
                      
                      if (allSelected) {
                        itemIds.forEach(id => newSet.delete(id));
                      } else {
                        itemIds.forEach(id => newSet.add(id));
                      }
                      return newSet;
                    });
                  }}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                    isFullySelected
                      ? 'border-primary bg-primary'
                      : isPartiallySelected
                      ? 'border-primary bg-primary/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#181511]'
                  }`}
                >
                  {isFullySelected && (
                    <span className="material-symbols-outlined text-white text-sm">check</span>
                  )}
                  {isPartiallySelected && (
                    <span className="text-primary text-xs font-bold">{group.selected}</span>
                  )}
                </button>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#181411] dark:text-white">
                        {group.item.name}
                      </h3>
                      {group.item.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                          {group.item.notes}
                        </p>
                      )}
                      {group.item.isUserItem && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
                          {t('splitPayment.yourItem')}
                        </span>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-[#181411] dark:text-white">
                        ${group.item.price.toFixed(2)}
                      </p>
                      {group.count > 1 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('splitPayment.quantity')}: {group.count}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#2d2516] border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-[#181411] dark:text-white">
              {t('splitPayment.selectedItems')}: {selectedItemsList.length}
            </span>
            <span className="text-xl font-bold text-primary">
              {t('splitPayment.subtotal')}: ${subtotal.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleContinue}
            disabled={selectedItemsList.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              selectedItemsList.length > 0
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98]'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('splitPayment.continue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitPaymentSelectionScreen;
