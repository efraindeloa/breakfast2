import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface Card {
  id: number;
  color: string;
  textColor: string;
  number: string;
  exp: string;
  name: string;
  brand: string;
  isMastercard?: boolean;
  isDisabled?: boolean;
}

interface SelectedItem {
  id: string;
  orderId: string;
  itemId: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  isUserItem: boolean;
}

const SplitPaymentSummaryScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config } = useRestaurant();
  
  const [paymentData, setPaymentData] = useState<{
    selectedItems: SelectedItem[];
    subtotal: number;
  } | null>(null);

  const [includeTip, setIncludeTip] = useState(true);
  const [tipMode, setTipMode] = useState<'percentage' | 'fixed'>('percentage');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [tipFixedAmount, setTipFixedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Cargar datos de items seleccionados
  useEffect(() => {
    const savedData = localStorage.getItem('splitPaymentData');
    if (savedData) {
      try {
        setPaymentData(JSON.parse(savedData));
      } catch {
        navigate('/split-payment-selection');
      }
    } else {
      navigate('/split-payment-selection');
    }
  }, [navigate]);

  // Tarjetas guardadas (en producción, esto vendría de una API o localStorage)
  const cards: Card[] = [
    {
      id: 1,
      color: 'from-[#e0f2fe] to-[#bae6fd]',
      textColor: 'text-[#0369a1]',
      number: '**** **** **** 4242',
      exp: '12/26',
      name: 'ALEX GONZALEZ',
      brand: 'VISA',
      isDisabled: false,
    },
    {
      id: 2,
      color: 'from-[#ffedd5] to-[#fed7aa]',
      textColor: 'text-[#9a3412]',
      number: '**** **** **** 8888',
      exp: '09/25',
      name: 'ALEX GONZALEZ',
      brand: 'Mastercard',
      isMastercard: true,
      isDisabled: false,
    },
  ];

  const subtotal = paymentData?.subtotal || 0;
  
  // Calcular impuestos (16% IVA en México, ajustable)
  const taxRate = 0.16;
  const tax = subtotal * taxRate;
  
  const calculateTip = () => {
    if (!includeTip) return 0;
    if (tipMode === 'percentage') {
      return subtotal * (tipPercentage / 100);
    } else {
      const fixed = parseFloat(tipFixedAmount) || 0;
      return fixed;
    }
  };

  const tip = calculateTip();
  const total = subtotal + tax + tip;

  // Agrupar items para mostrar
  const groupedItems = useMemo(() => {
    if (!paymentData) return [];
    
    const groups: { [key: string]: { item: SelectedItem; count: number } } = {};
    
    paymentData.selectedItems.forEach(item => {
      const key = `${item.itemId}-${item.notes || ''}`;
      if (!groups[key]) {
        groups[key] = {
          item,
          count: 0,
        };
      }
      groups[key].count++;
    });
    
    return Object.values(groups);
  }, [paymentData]);

  const handlePayment = () => {
    if (!selectedPaymentMethod) {
      alert(t('splitPayment.selectPaymentMethod'));
      return;
    }

    if (selectedPaymentMethod === 'card' && !selectedCardId) {
      alert(t('splitPayment.selectCard'));
      return;
    }

    // Procesar pago
    // En producción, aquí se haría la llamada a la API de pago
    alert(t('splitPayment.processingPayment'));
    
    // Limpiar datos temporales
    localStorage.removeItem('splitPaymentData');
    
    // Navegar a pantalla de éxito
    navigate('/payment-success', {
      state: {
        amount: total,
        method: selectedPaymentMethod,
        cardId: selectedCardId,
      }
    });
  };

  if (!paymentData) {
    return null;
  }

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/split-payment-selection')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[#181411] dark:text-white">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#181411] dark:text-white flex-1">
            {t('splitPayment.paymentSummary')}
          </h1>
        </div>
      </div>

      {/* Items Summary */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
          {t('splitPayment.selectedItems')}
        </h2>
        <div className="space-y-3">
          {groupedItems.map((group, index) => (
            <div
              key={`${group.item.itemId}-${index}`}
              className="bg-white dark:bg-[#2d2516] rounded-xl p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-[#181411] dark:text-white">
                    {group.item.name}
                  </h3>
                  {group.item.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-1">
                      {group.item.notes}
                    </p>
                  )}
                  {group.count > 1 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {t('splitPayment.quantity')}: {group.count}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#181411] dark:text-white">
                    ${(group.item.price * group.count).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Summary */}
      <div className="px-4 py-4">
        <div className="bg-white dark:bg-[#2d2516] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3d3321]">
          <h2 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
            {t('splitPayment.paymentDetails')}
          </h2>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('splitPayment.subtotal')}:</span>
              <span className="text-[#181411] dark:text-white font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('splitPayment.tax')}:</span>
              <span className="text-[#181411] dark:text-white font-semibold">${tax.toFixed(2)}</span>
            </div>
            
            {/* Tip Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={includeTip} 
                      onChange={(e) => setIncludeTip(e.target.checked)} 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </label>
                  <div>
                    <span className="text-sm font-semibold text-[#181411] dark:text-white">
                      {t('payment.includeTip')}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                      ({t('payment.optional')})
                    </span>
                  </div>
                </div>
                {includeTip && (
                  <span className="text-sm font-semibold text-primary">
                    ${tip.toFixed(2)}
                  </span>
                )}
              </div>

              {includeTip && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setTipMode('percentage')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        tipMode === 'percentage'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t('payment.percentage')}
                    </button>
                    <button
                      onClick={() => setTipMode('fixed')}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                        tipMode === 'fixed'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {t('payment.fixedAmount')}
                    </button>
                  </div>

                  {tipMode === 'percentage' ? (
                    <div className="flex gap-2">
                      {[10, 15, 18, 20].map(percent => (
                        <button
                          key={percent}
                          onClick={() => setTipPercentage(percent)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                            tipPercentage === percent
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {percent}%
                        </button>
                      ))}
                      <input
                        type="number"
                        placeholder={t('payment.otherPercent')}
                        value={tipPercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= 0 && value <= 100) {
                            setTipPercentage(value);
                          }
                        }}
                        className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      placeholder={t('payment.fixedAmount')}
                      value={tipFixedAmount}
                      onChange={(e) => setTipFixedAmount(e.target.value)}
                      className="w-full py-2 px-3 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-0 focus:ring-2 focus:ring-primary"
                    />
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-[#181411] dark:text-white">{t('splitPayment.total')}:</span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="px-4 py-4">
        <h4 className="text-lg font-bold mb-4 text-[#181411] dark:text-white">{t('payment.paymentMethod')}</h4>
        
        {/* Cash Option */}
        <div className="mb-4">
          <label
            onClick={() => {
              setSelectedPaymentMethod('cash');
              setSelectedCardId(null);
            }}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              selectedPaymentMethod === 'cash'
                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2516] hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectedPaymentMethod === 'cash'
                ? 'border-primary bg-primary'
                : 'border-gray-300 dark:border-gray-600'
            }`}>
              {selectedPaymentMethod === 'cash' && (
                <span className="material-symbols-outlined text-white text-sm">check</span>
              )}
            </div>
            <div className="flex items-center gap-3 flex-1">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary text-xl">payments</span>
              </div>
              <div>
                <p className="font-semibold text-[#181411] dark:text-white">{t('payment.payCash')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('payment.payCashDescription')}</p>
              </div>
            </div>
          </label>
        </div>

        {/* Card Option */}
        {config.allowCardPayment && (
          <div className="mb-4">
            <label
              onClick={() => {
                setSelectedPaymentMethod('card');
                if (cards.length > 0 && !selectedCardId) {
                  setSelectedCardId(cards[0].id);
                }
              }}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all mb-3 ${
                selectedPaymentMethod === 'card'
                  ? 'border-primary bg-primary/5 dark:bg-primary/10'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2516] hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                selectedPaymentMethod === 'card'
                  ? 'border-primary bg-primary'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selectedPaymentMethod === 'card' && (
                  <span className="material-symbols-outlined text-white text-sm">check</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                  <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
                </div>
                <div>
                  <p className="font-semibold text-[#181411] dark:text-white">{t('payment.payCard')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('payment.payCardDescription')}</p>
                </div>
              </div>
            </label>

            {/* Card Selection */}
            {selectedPaymentMethod === 'card' && config.allowCardPayment && (
              <div className="mt-3 space-y-2">
                {cards.filter(card => !card.isDisabled).map((card) => (
                  <label
                    key={card.id}
                    onClick={() => setSelectedCardId(card.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedCardId === card.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2516] hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCardId === card.id
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedCardId === card.id && (
                        <span className="material-symbols-outlined text-white text-xs">check</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="material-symbols-outlined text-primary">credit_card</span>
                      <div>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{card.brand}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{card.number}</p>
                      </div>
                    </div>
                  </label>
                ))}
                <button
                  onClick={() => navigate('/add-card')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                >
                  <span className="material-symbols-outlined text-primary">add</span>
                  <span className="text-sm font-semibold text-primary">{t('payment.addNewCard')}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pay Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#2d2516] border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handlePayment}
            disabled={!selectedPaymentMethod || (selectedPaymentMethod === 'card' && !selectedCardId)}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
              selectedPaymentMethod && (selectedPaymentMethod !== 'card' || selectedCardId)
                ? 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 active:scale-[0.98]'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
          >
            {t('splitPayment.payNow')} ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitPaymentSummaryScreen;
