import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useProducts } from '../contexts/ProductsContext';
import { useWaiterTableCart } from '../contexts/WaiterTableCartContext';
import { formatPrice } from '../utils/currency';
import TopNavbar from '../components/TopNavbar';

const WaiterDishScreen: React.FC = () => {
  const navigate = useNavigate();
  const { productId } = useParams<{ productId: string }>();
  const location = useLocation();
  const { t } = useTranslation();
  const { getProduct } = useProducts();
  const { addItem } = useWaiterTableCart();

  const state = location.state as { tableNumber?: number; tableLabel?: string } | undefined;
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  const id = productId ? parseInt(productId, 10) : NaN;
  const product = id ? getProduct(id) : undefined;

  if (!product || !state?.tableNumber) {
    navigate('/waiter-tables', { replace: true });
    return null;
  }

  const price = typeof product.price === 'number' ? product.price : parseFloat(String(product.price || 0));

  const handleAddToOrder = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price,
        notes: notes.trim(),
      },
      quantity
    );
    navigate('/waiter-take-order', { state: { tableNumber: state.tableNumber, tableLabel: state.tableLabel } });
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-[480px] mx-auto pb-[140px] bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />
      <div className="px-4 pt-4 flex-1">
        <div
          className="w-full aspect-square rounded-2xl bg-gray-100 dark:bg-gray-800 bg-cover bg-center mb-4"
          style={product.image ? { backgroundImage: `url(${product.image})` } : {}}
        />
        <h1 className="text-xl font-bold text-[#181411] dark:text-white mb-1">{product.name}</h1>
        <p className="text-lg font-bold text-primary mb-4">{formatPrice(price)}</p>
        {product.description ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{product.description}</p>
        ) : null}

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#181411] dark:text-white mb-2">
            {t('waiter.dish.quantity')}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center text-[#181411] dark:text-white"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="text-lg font-bold w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-full border-2 border-primary text-primary flex items-center justify-center"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#181411] dark:text-white mb-2">
            {t('waiter.dish.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t('waiter.dish.notes')}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-[#32281d] text-[#181411] dark:text-white placeholder-gray-400"
            rows={2}
          />
        </div>
      </div>

      <div
        className="fixed left-0 right-0 max-w-[480px] mx-auto px-4 py-3 bg-white dark:bg-[#32281d] border-t border-gray-200 dark:border-gray-700 z-[60]"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={handleAddToOrder}
          className="w-full py-3 rounded-xl bg-primary text-white font-bold"
        >
          {t('waiter.dish.addToOrder')} · {formatPrice(price * quantity)}
        </button>
      </div>
    </div>
  );
};

export default WaiterDishScreen;
