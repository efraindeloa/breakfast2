import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGroupOrder } from '../contexts/GroupOrderContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { Order, OrderStatus } from '../types/order';
import { getOrders, updateOrder } from '../services/database';

interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  label: string;
}

const OrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { cart: currentCartItems, clearCart } = useCart();
  const { config } = useRestaurant();
  const { isGroupOrder, participants, currentUserParticipant, isConfirmed } = useGroupOrder();
  const [complementaryOrderInstructions, setComplementaryOrderInstructions] = useState('');

  // Cargar todas las órdenes desde Supabase
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const loadedOrders = await getOrders();
        setOrders(loadedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        setOrders([]);
      } finally {
        setIsLoadingOrders(false);
      }
    };
    
    loadOrders();
    
    // Recargar órdenes periódicamente para ver actualizaciones
    const interval = setInterval(loadOrders, 5000); // Cada 5 segundos
    return () => clearInterval(interval);
  }, []);

  // Función para obtener el nombre traducido del platillo
  const getDishName = (dishId: number): string => {
    try {
      return t(`dishes.${dishId}.name`) || `dish-${dishId}`;
    } catch {
      return `dish-${dishId}`;
    }
  };

  // Calcular total de la orden complementaria (carrito actual)
  const complementaryOrderTotal = useMemo(() => {
    return currentCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [currentCartItems]);

  // Calcular total de todas las órdenes
  const orderTotal = useMemo(() => {
    const ordersTotal = orders.reduce((sum, order) => {
      const orderSum = order.items.reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
      return sum + orderSum;
    }, 0);
    // También incluir items del carrito actual si hay
    return ordersTotal + complementaryOrderTotal;
  }, [orders, complementaryOrderTotal]);

  // Función para obtener el número de la próxima orden complementaria
  const getNextOrderNumber = (): number => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.orderNumber)) + 1;
  };

  // Función para enviar la orden complementaria
  const handleSendComplementaryOrder = () => {
    if (currentCartItems.length === 0) return;

    const orderNumber = getNextOrderNumber();
    
    // Mapear items del carrito a items de la orden
    const orderItems = currentCartItems.map(item => ({
      id: item.id,
      name: getDishName(item.id),
      price: item.price,
      notes: item.notes || '', // Mantener las notas individuales del item
      quantity: item.quantity,
    }));

    // Si hay instrucciones especiales, agregarlas al primer item que no tenga notas
    // o al primer item en general
    if (complementaryOrderInstructions.trim() && orderItems.length > 0) {
      // Buscar el primer item sin notas, o usar el primero
      const itemToAddInstructions = orderItems.find(item => !item.notes) || orderItems[0];
      if (itemToAddInstructions) {
        itemToAddInstructions.notes = itemToAddInstructions.notes 
          ? `${itemToAddInstructions.notes}. ${complementaryOrderInstructions}` 
          : complementaryOrderInstructions;
      }
    }

    const newOrder: Order = {
      orderId: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      orderNumber,
      items: orderItems,
      status: 'orden_enviada',
      timestamp: new Date().toISOString(),
    };

    // Actualizar el estado de órdenes (el useEffect se encargará de guardar en localStorage)
    setOrders(prev => [...prev, newOrder]);

    // Limpiar el carrito y las instrucciones
    clearCart();
    setComplementaryOrderInstructions('');

    // Navegar a la página de confirmación
    navigate('/order-confirmed');
  };

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: 'pending',
          label: t('orderDetail.pending') || 'Pendiente',
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
          borderColor: 'border-yellow-300 dark:border-yellow-700',
        };
      case 'orden_enviada':
        return {
          icon: 'send',
          label: t('orderDetail.orderSent'),
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700',
        };
      case 'orden_recibida':
        return {
          icon: 'inbox',
          label: t('orderDetail.orderReceived'),
          color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
          borderColor: 'border-blue-300 dark:border-blue-700',
        };
      case 'en_preparacion':
        return {
          icon: 'restaurant',
          label: t('orderDetail.inPreparation'),
          color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
          borderColor: 'border-amber-300 dark:border-amber-700',
        };
      case 'lista_para_entregar':
        return {
          icon: 'check_circle',
          label: t('orderDetail.readyToDeliver'),
          color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
        };
      case 'en_entrega':
        return {
          icon: 'local_shipping',
          label: t('orderDetail.inDelivery'),
          color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
          borderColor: 'border-purple-300 dark:border-purple-700',
        };
      case 'entregada':
        return {
          icon: 'done_all',
          label: t('orderDetail.delivered'),
          color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
          borderColor: 'border-green-300 dark:border-green-700',
        };
      case 'con_incidencias':
        return {
          icon: 'warning',
          label: t('orderDetail.withIssues'),
          color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          borderColor: 'border-red-300 dark:border-red-700',
        };
      case 'orden_cerrada':
        return {
          icon: 'lock',
          label: t('orderDetail.orderClosed'),
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
      case 'cancelada':
        return {
          icon: 'cancel',
          label: t('orderDetail.cancelled'),
          color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
          borderColor: 'border-red-300 dark:border-red-700',
        };
      default:
        return {
          icon: 'help',
          label: t('orderDetail.unknown'),
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
          borderColor: 'border-gray-300 dark:border-gray-700',
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    };
  };

  // Si no hay órdenes, mostrar mensaje
  if (orders.length === 0 && currentCartItems.length === 0) {
    return (
      <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
        <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">{t('orderDetail.title')}</h2>
          <div className="w-12"></div>
        </header>

        <div className="px-4 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
              <span className="material-symbols-outlined text-primary text-4xl">receipt_long</span>
            </div>
            <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-2">{t('orderDetail.noOrders')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('orderDetail.noOrdersMessage')}</p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-primary-dark transition-colors"
            >
              <span className="material-symbols-outlined">restaurant_menu</span>
              <span>{t('order.exploreMenu')}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calcular si hay alguna orden enviada (para mostrar opción de agregar productos)
  const hasSentOrder = orders.length > 0 && orders.some(order => 
    ['orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega', 'entregada', 'con_incidencias'].includes(order.status)
  );

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">{t('orderDetail.title')}</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Lista de Órdenes */}
        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          const timestamp = formatTimestamp(order.timestamp);
          const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          return (
            <div key={order.orderId} className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              {/* Header de la Orden */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-[#181411] dark:text-white">
                      {order.orderNumber === 1 ? t('orderDetail.mainOrder') : `${t('orderDetail.complementaryOrder')} #${order.orderNumber}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    <span>{timestamp.full}</span>
                  </div>
                </div>
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${statusInfo.color} shrink-0`}>
                  <span className="material-symbols-outlined text-xl">{statusInfo.icon}</span>
                </div>
              </div>

              {/* Estado de la Orden */}
              <div className={`mb-4 p-3 rounded-lg border ${statusInfo.borderColor} bg-opacity-10`}>
                <p className={`text-sm font-semibold ${statusInfo.color.split(' ')[2]}`}>
                  {statusInfo.label}
                </p>
              </div>

              {/* Items de la Orden */}
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-[#181411] dark:text-white mb-3">
                  {t('orderDetail.items')} ({order.items.length})
                </h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={`${item.id}-${item.notes || ''}-${index}`} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#181411] dark:text-white">
                            {item.quantity}x
                          </span>
                          <span className="text-sm text-[#181411] dark:text-white">{item.name}</span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                            {item.notes}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#181411] dark:text-white ml-4">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-[#181411] dark:text-white">
                    {t('orderDetail.orderTotal')}:
                  </span>
                  <span className="text-base font-bold text-primary">
                    ${orderTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Items del Carrito Actual (si hay) - Mostrar como Orden Complementaria */}
        {currentCartItems.length > 0 && (
          <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border-2 border-primary/30 border-dashed">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">receipt_long</span>
              <h3 className="text-lg font-bold text-[#181411] dark:text-white">
                {orders.length > 0 ? `${t('orderDetail.complementaryOrder')} #${orders.length + 1}` : t('orderDetail.complementaryOrder')}
              </h3>
            </div>
            <div className="space-y-2 mb-4">
              {currentCartItems.map((item, index) => (
                <div key={`current-${item.id}-${item.notes || ''}-${index}`} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#181411] dark:text-white">
                        {item.quantity}x
                      </span>
                      <span className="text-sm text-[#181411] dark:text-white">{item.name}</span>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                        {item.notes}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-[#181411] dark:text-white ml-4">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total de la Orden Complementaria */}
            <div className="flex justify-between items-center pt-3 mb-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-base font-semibold text-[#181411] dark:text-white">
                {t('orderDetail.orderTotal')}:
              </span>
              <span className="text-xl font-bold text-primary">
                ${complementaryOrderTotal.toFixed(2)}
              </span>
            </div>

            {/* Instrucciones Especiales */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[#181411] dark:text-white mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">edit_note</span>
                {t('order.specialInstructions')}
              </h4>
              <textarea
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl p-3 text-sm text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
                placeholder={t('order.specialInstructionsPlaceholder')}
                rows={3}
                value={complementaryOrderInstructions}
                onChange={(e) => setComplementaryOrderInstructions(e.target.value)}
              />
            </div>

            {/* Botones de Acción */}
            <div className="space-y-2">
              <button
                onClick={handleSendComplementaryOrder}
                className="w-full bg-primary text-white font-bold py-3 rounded-xl text-base shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-primary/90"
              >
                <span className="material-symbols-outlined">restaurant</span>
                <span>{t('order.confirmAndSendOrder')}</span>
              </button>
              <button
                onClick={() => navigate('/menu')}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>{t('orderDetail.addMoreItems')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Total General */}
        <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3d3321]">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-[#181411] dark:text-white">{t('orderDetail.total')}:</span>
            <span className="text-2xl font-bold text-primary">${orderTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Botones de Acción */}
        {/* Botón para enviar orden pendiente a cocina */}
        {orders.some(order => order.status === 'pending') && (
          <div className="mb-6">
            <button
              onClick={async () => {
                const pendingOrder = orders.find(order => order.status === 'pending');
                if (pendingOrder) {
                  try {
                    const updatedOrder = await updateOrder(pendingOrder.orderId, { status: 'orden_enviada' });
                    if (updatedOrder) {
                      // Recargar órdenes
                      const loadedOrders = await getOrders();
                      setOrders(loadedOrders);
                      // Navegar a order-confirmed después de enviar
                      navigate('/order-confirmed');
                    }
                  } catch (error) {
                    console.error('Error sending order to kitchen:', error);
                    alert('Error al enviar la orden a cocina. Por favor, intenta de nuevo.');
                  }
                }
              }}
              className="w-full py-4 px-4 rounded-xl bg-primary text-white font-bold flex items-center justify-center gap-2 transition-colors hover:bg-primary/90 shadow-lg"
            >
              <span className="material-symbols-outlined">restaurant</span>
              <span>{t('orderDetail.sendToKitchen') || 'Enviar a Cocina'}</span>
            </button>
          </div>
        )}

        {hasSentOrder && config.allowOrderModification && currentCartItems.length === 0 && (
          <div className="space-y-3">
            {orders.length > 0 && orders.some(order => 
              ['orden_enviada', 'orden_recibida'].includes(order.status)
            ) && (
              <button
                onClick={() => {
                  const editableOrder = orders.find(order => 
                    ['orden_enviada', 'orden_recibida'].includes(order.status)
                  );
                  if (editableOrder) {
                    navigate(`/edit-order?orderId=${editableOrder.orderId}`);
                  }
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-primary/30"
              >
                <span className="material-symbols-outlined">edit</span>
                {t('orderDetail.changeOrder')}
              </button>
            )}
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-primary/30"
            >
              <span className="material-symbols-outlined">add</span>
              {t('orderDetail.addComplementaryOrder')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailScreen;
