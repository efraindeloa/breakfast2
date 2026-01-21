
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useCart } from '../contexts/CartContext';
import { Order, OrderStatus, ORDERS_STORAGE_KEY } from '../types/order';

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

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

const PaymentMethodsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config } = useRestaurant();
  const { cart } = useCart();
  const [includeTip, setIncludeTip] = useState(true);
  const [tipMode, setTipMode] = useState<'percentage' | 'fixed'>('percentage');
  const [tipPercentage, setTipPercentage] = useState(10);
  const [tipFixedAmount, setTipFixedAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [showOrderNotSentNotification, setShowOrderNotSentNotification] = useState(false);

  // Función para obtener el nombre traducido del platillo
  const getDishName = (dishId: number): string => {
    try {
      return t(`dishes.${dishId}.name`) || `dish-${dishId}`;
    } catch {
      return `dish-${dishId}`;
    }
  };

  // Cargar todas las órdenes desde localStorage
  const orders: Order[] = useMemo(() => {
    try {
      const savedData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch {
      return [];
    }
    return [];
  }, []);

  const hasOrderBeenSent = useMemo(() => {
    // Verificar si hay alguna orden en un estado válido para pagar
    const validStatuses: OrderStatus[] = [
      'orden_enviada',
      'orden_recibida',
      'en_preparacion',
      'lista_para_entregar',
      'en_entrega',
      'entregada',
      'con_incidencias'
    ];
    return orders.some(order => validStatuses.includes(order.status));
  }, [orders]);

  // Sumar todos los items de todas las órdenes más el carrito actual
  const orderItems: OrderItem[] = useMemo(() => {
    const allItems: OrderItem[] = [];
    
    // Agregar items de todas las órdenes
    orders.forEach(order => {
      order.items.forEach(item => {
        allItems.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes || undefined,
        });
      });
    });
    
    // Agregar items del carrito actual
    cart.forEach(item => {
      allItems.push({
        id: item.id,
        name: getDishName(item.id),
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || undefined,
      });
    });
    
    return allItems;
  }, [orders, cart]);

  // Tarjetas disponibles
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

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
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
  const total = subtotal + tip;

  return (
    <div className="pb-32 overflow-y-auto">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">{t('payment.payBill')}</h2>
        <div className="w-12 flex items-center justify-end">
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>

      <div className="px-4 pt-5 pb-2">
        <h3 className="text-xl font-bold text-primary">{t('payment.enjoyMessage')}</h3>
        <p className="text-[#6b7280] dark:text-gray-400 mt-1">{t('payment.reviewOrder')}</p>
      </div>

      {/* Resumen de la Orden */}
      <div className="px-4 py-4">
        <h4 className="text-lg font-bold mb-4">{t('payment.orderSummary')}</h4>
        <div className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321] space-y-3">
          {orderItems.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              {t('order.empty')}
            </p>
          ) : (
            orderItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#181411] dark:text-white">
                      {item.quantity}x {item.name}
                    </p>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                      {item.notes}
                    </p>
                  )}
                </div>
                <p className="text-sm font-semibold text-[#181411] dark:text-white ml-4">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Método de Pago */}
      <div className="px-4 py-4">
        <h4 className="text-lg font-bold mb-4">{t('payment.paymentMethod')}</h4>
        
        {/* Opción Efectivo */}
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

        {/* Opción Tarjeta */}
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

            {/* Selección de Tarjetas */}
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

      {/* Summary */}
      <div className="px-4 py-4">
        <div className="bg-white dark:bg-[#2d2516] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3d3321]">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">{t('order.subtotal')}:</span>
              <span className="text-[#181411] dark:text-white font-semibold">${subtotal.toFixed(2)}</span>
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
                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">{t('payment.includeTip')}</span>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{t('payment.optional')}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${includeTip ? 'text-[#181411] dark:text-white' : 'text-gray-400'}`}>
                  ${tip.toFixed(2)}
                </span>
              </div>

              {includeTip && (
                <div className="mt-4 space-y-3">
                  {/* Mode Toggle */}
                  <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                      onClick={() => setTipMode('percentage')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                        tipMode === 'percentage'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-[#181411] dark:hover:text-white'
                      }`}
                    >
                      {t('payment.percentage')}
                    </button>
                    <button
                      onClick={() => setTipMode('fixed')}
                      className={`flex-1 py-2 px-3 rounded-md text-sm font-semibold transition-all ${
                        tipMode === 'fixed'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:text-[#181411] dark:hover:text-white'
                      }`}
                    >
                      {t('payment.fixedAmount')}
                    </button>
                  </div>

                  {/* Percentage Mode */}
                  {tipMode === 'percentage' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        {[10, 15, 20].map((percent) => (
                          <button
                            key={percent}
                            onClick={() => setTipPercentage(percent)}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all ${
                              tipPercentage === percent
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white dark:bg-[#2d2516] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50'
                            }`}
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tipPercentage}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setTipPercentage(Math.min(100, Math.max(0, value)));
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2516] text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder={t('payment.otherPercent')}
                        />
                        <span className="text-gray-500 dark:text-gray-400 text-sm">%</span>
                      </div>
                    </div>
                  )}

                  {/* Fixed Amount Mode */}
                  {tipMode === 'fixed' && (
                    <div className="space-y-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-semibold">$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tipFixedAmount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || (!isNaN(parseFloat(value)) && parseFloat(value) >= 0)) {
                              setTipFixedAmount(value);
                            }
                          }}
                          className="w-full pl-8 pr-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#2d2516] text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex gap-2">
                        {[5, 10, 20, 50].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setTipFixedAmount(amount.toString())}
                            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                              tipFixedAmount === amount.toString()
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white dark:bg-[#2d2516] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50'
                            }`}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-[#181411] dark:text-white text-lg font-bold">{t('order.total').toUpperCase()}:</span>
                <span className="text-primary text-xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notificación flotante si la orden no ha sido enviada */}
      {showOrderNotSentNotification && (
        <>
          <style>{`
            @keyframes slideDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="fixed top-20 left-0 right-0 z-[100] px-4 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2" style={{ animation: 'slideDown 0.3s ease-out' }}>
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/30 dark:to-yellow-900/30 border-2 border-orange-200 dark:border-orange-800 rounded-xl p-5 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <span className="material-symbols-outlined text-3xl text-orange-600 dark:text-orange-400">warning</span>
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-base font-bold text-orange-900 dark:text-orange-300">
                    {t('payment.orderNotSent')}
                  </h3>
                  <button
                    onClick={() => setShowOrderNotSentNotification(false)}
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">close</span>
                  </button>
                </div>
                <p className="text-sm text-orange-800 dark:text-orange-400 mb-4 leading-relaxed">
                  {t('payment.orderNotSentMessage')}
                </p>
                <button
                  onClick={() => {
                    setShowOrderNotSentNotification(false);
                    navigate('/orders');
                  }}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-md"
                >
                  <span className="material-symbols-outlined">restaurant_menu</span>
                  <span>{t('payment.goToOrder')}</span>
                </button>
              </div>
            </div>
          </div>
          </div>
        </>
      )}

      {/* Solicitar Asistencia */}
      <div className="px-4 py-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed mb-4">
            {t('payment.assistanceMessage')}
          </p>
          <button
            onClick={() => navigate('/request-assistance')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined">support_agent</span>
            <span>{t('payment.requestAssistance')}</span>
          </button>
        </div>
      </div>

      {/* Botón Confirmar Pago */}
      <div className="px-4 py-4 pb-8">
        <button
          disabled={!selectedPaymentMethod || (selectedPaymentMethod === 'card' && !selectedCardId)}
          onClick={() => {
            // Verificar si la orden ha sido enviada
            if (!hasOrderBeenSent) {
              setShowOrderNotSentNotification(true);
              // Auto-ocultar la notificación después de 5 segundos
              setTimeout(() => {
                setShowOrderNotSentNotification(false);
              }, 5000);
              return;
            }
            
            // Si la orden está enviada y el método de pago es válido, proceder
            if (selectedPaymentMethod && (selectedPaymentMethod === 'cash' || selectedCardId)) {
              navigate('/payment-success');
            }
          }}
          className={`w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform ${
            !selectedPaymentMethod || (selectedPaymentMethod === 'card' && !selectedCardId)
              ? 'opacity-50 cursor-not-allowed'
              : ''
          }`}
        >
          <span>{t('payment.confirmPayment')}</span>
          <span className="material-symbols-outlined">check_circle</span>
        </button>
      </div>
    </div>
  );
};

export default PaymentMethodsScreen;
