import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useProducts } from '../contexts/ProductsContext';
import { useWaiterTableCart } from '../contexts/WaiterTableCartContext';
import { getCurrentUserRestaurantId } from '../services/database';
import { createOrder } from '../services/api';
import { formatPrice } from '../utils/currency';
import TopNavbar from '../components/TopNavbar';

const WaiterTakeOrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { products, isLoading: productsLoading } = useProducts();
  const {
    tableNumber,
    tableLabel,
    items,
    setTable,
    getTotal,
    getItemCount,
    clearTable,
  } = useWaiterTableCart();

  const state = location.state as { tableNumber?: number; tableLabel?: string } | undefined;
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state?.tableNumber || !state?.tableLabel) {
      navigate('/waiter-tables', { replace: true });
      return;
    }
    setTable(state.tableNumber, state.tableLabel);
  }, [state?.tableNumber, state?.tableLabel, setTable, navigate]);

  const mainCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim() !== '') set.add(p.category.trim());
    });
    return Array.from(set).sort();
  }, [products]);

  useEffect(() => {
    if (mainCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(mainCategories[0]);
    } else if (mainCategories.length > 0 && selectedCategory && !mainCategories.includes(selectedCategory)) {
      setSelectedCategory(mainCategories[0]);
    }
  }, [mainCategories, selectedCategory]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return [];
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  const handleConfirmOrder = async () => {
    if (items.length === 0 || tableNumber === null) return;
    const restaurantIdResult = await getCurrentUserRestaurantId();
    const restaurantId = restaurantIdResult;
    if (!restaurantId) {
      alert(t('waiter.takeOrder.errorRestaurant') || 'No se pudo obtener el restaurante.');
      return;
    }
    setIsSubmitting(true);
    try {
      const total = getTotal();
      const orderItems = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        notes: i.notes || '',
        quantity: i.quantity,
      }));
      const result = await createOrder({
        restaurant_id: restaurantId,
        status: 'orden_enviada',
        items: orderItems,
        total,
        table_number: String(tableNumber),
      });
      if (result.success && result.data) {
        clearTable();
        navigate('/waiter-tables', { state: { orderSent: true } });
      } else {
        alert(result.error || 'Error al enviar la orden.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al enviar la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!state?.tableNumber) {
    return null;
  }

  const itemCount = getItemCount();
  const total = getTotal();

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-[480px] mx-auto pb-[140px] bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />
      <div className="px-4 pt-4">
        <h1 className="text-lg font-bold text-[#181411] dark:text-white">
          {t('waiter.takeOrder.title', { table: tableLabel || `Mesa ${tableNumber}` })}
        </h1>
      </div>

      {mainCategories.length > 0 && (
        <div className="sticky top-[73px] z-10 flex gap-2 overflow-x-auto px-4 py-2 bg-background-light dark:bg-background-dark border-b border-gray-100 dark:border-gray-800 no-scrollbar">
          {mainCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 px-4 py-4">
        {productsLoading ? (
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">{t('waiter.takeOrder.emptyOrder')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const imageUrl = product.image || '';
              const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0));
              return (
                <button
                  key={product.id}
                  type="button"
                  onClick={() =>
                    navigate(`/waiter-dish/${product.id}`, {
                      state: { tableNumber, tableLabel },
                    })
                  }
                  className="text-left rounded-xl bg-white dark:bg-[#32281d] border border-gray-100 dark:border-gray-700 p-3 shadow-sm hover:border-primary/40 transition-colors"
                >
                  <div
                    className="w-full aspect-square rounded-lg bg-gray-100 dark:bg-gray-800 mb-2 bg-cover bg-center"
                    style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
                  />
                  <p className="text-xs font-bold text-primary">{formatPrice(price)}</p>
                  <p className="text-sm font-bold text-[#181411] dark:text-white line-clamp-2">{product.name}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div
        className="fixed left-0 right-0 max-w-[480px] mx-auto px-4 py-3 bg-white dark:bg-[#32281d] border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4 z-[60]"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {itemCount} {itemCount === 1 ? 'ítem' : 'ítems'}
          </p>
          <p className="text-lg font-bold text-[#181411] dark:text-white">{formatPrice(total)}</p>
        </div>
        <button
          type="button"
          onClick={handleConfirmOrder}
          disabled={items.length === 0 || isSubmitting}
          className="px-6 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? t('common.saving') : t('waiter.takeOrder.confirmOrder')}
        </button>
      </div>
    </div>
  );
};

export default WaiterTakeOrderScreen;
