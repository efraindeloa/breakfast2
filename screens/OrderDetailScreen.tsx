import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGroupOrder } from '../contexts/GroupOrderContext';
import { useTranslation, useLanguage } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { Order, OrderStatus } from '../types/order';
import { getOrders, updateOrder } from '../services/database';
import { formatPrice } from '../utils/currency';

interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  label: string;
}

const OrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { t } = useTranslation();
  const { selectedLanguage } = useLanguage();
  const { cart: currentCartItems, clearCart, removeFromCart, updateCartItemQuantity, setCartItems } = useCart();
  const { config } = useRestaurant();
  const { isGroupOrder, participants, currentUserParticipant, isConfirmed } = useGroupOrder();
  const [complementaryOrderInstructions, setComplementaryOrderInstructions] = useState('');

  // Cargar todas las órdenes desde Supabase
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Filtrar órdenes si se especifica un ID en la URL
  const displayedOrders = useMemo(() => {
    if (id) {
      return orders.filter(order => order.orderId === id);
    }
    return orders;
  }, [orders, id]);

  useEffect(() => {
    let isMounted = true;
    let refreshIntervalId: NodeJS.Timeout | null = null;
    
    const loadOrders = async (showLoading = false) => {
      try {
        if (showLoading) {
          setIsLoadingOrders(true);
        }
        const loadedOrders = await getOrders();
        
        if (!isMounted) return;
        
        setOrders(loadedOrders);
      } catch (error) {
        console.error('Error loading orders:', error);
        if (isMounted && showLoading) {
          setOrders([]);
        }
      } finally {
        if (isMounted && showLoading) {
          setIsLoadingOrders(false);
        }
      }
    };
    
    // Carga inicial
    loadOrders(true);
    
    // Recargar órdenes cada 15 segundos para ver actualizaciones de estado
    refreshIntervalId = setInterval(() => {
      if (isMounted && !document.hidden) {
        // Siempre recargar para ver cambios de estado
        loadOrders(false); // No mostrar loading en recargas periódicas
      }
    }, 15000); // Cada 15 segundos
    
    return () => {
      isMounted = false;
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, []); // Sin dependencias para que solo se ejecute una vez al montar

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

  // Función para enviar la orden complementaria o actualizar la orden original
  const handleSendComplementaryOrder = async () => {
    if (currentCartItems.length === 0) return;

    // Buscar si hay una orden enviada
    const sentOrder = orders.find(order => 
      ['orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega'].includes(order.status)
    );

    if (sentOrder) {
      // Si hay una orden enviada, actualizar la orden original agregando los items nuevos
      const newItems = currentCartItems.filter(cartItem => {
        // Verificar si el item ya existe en la orden original
        const existsInOriginal = sentOrder.items.some(
          origItem => origItem.id === cartItem.id && (origItem.notes || '') === (cartItem.notes || '')
        );
        return !existsInOriginal;
      });

      if (newItems.length === 0) {
        alert('No hay items nuevos para agregar. Todos los items ya están en la orden.');
        return;
      }

      // Combinar items originales con items nuevos
      const updatedItems = [
        ...sentOrder.items,
        ...newItems.map(item => ({
          id: item.id,
          name: getDishName(item.id),
          price: item.price,
          notes: item.notes || '',
          quantity: item.quantity,
        }))
      ];

      // Si hay instrucciones especiales, agregarlas al primer item nuevo que no tenga notas
      if (complementaryOrderInstructions.trim() && newItems.length > 0) {
        const firstNewItem = updatedItems.find(item => 
          newItems.some(newItem => newItem.id === item.id && (newItem.notes || '') === (item.notes || ''))
        );
        if (firstNewItem && !firstNewItem.notes) {
          firstNewItem.notes = complementaryOrderInstructions;
        } else if (firstNewItem) {
          firstNewItem.notes = `${firstNewItem.notes}. ${complementaryOrderInstructions}`;
        }
      }

      // Calcular nuevo total
      const newTotal = updatedItems.reduce((sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
        return sum + (price * item.quantity);
      }, 0);

      // Actualizar la orden original en Supabase
      try {
        const { updateOrder } = await import('../services/database');
        const updatedOrder = await updateOrder(sentOrder.orderId, {
          items: updatedItems,
          total: newTotal,
          notes: complementaryOrderInstructions.trim() || sentOrder.notes || undefined,
        } as any);

        if (updatedOrder) {
          // Recargar órdenes desde Supabase inmediatamente para ver el estado actualizado
          const loadedOrders = await getOrders();
          setOrders(loadedOrders);
          
          // Recargar una vez más después de un pequeño delay para asegurar que cualquier cambio de estado se refleje
          setTimeout(async () => {
            const refreshedOrders = await getOrders();
            setOrders(refreshedOrders);
          }, 500);
          
          clearCart();
          setComplementaryOrderInstructions('');

          // Regresar a la misma página de detalles de la orden actualizada
          if (id) {
            navigate(`/order-detail/${id}`, { replace: true });
          } else {
            navigate('/order-detail', { replace: true });
          }
        } else {
          console.error('Failed to update order');
          alert('Error al actualizar la orden. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error updating order:', error);
        alert('Error al actualizar la orden. Por favor, intenta de nuevo.');
      }
    } else {
      // Si no hay orden enviada, crear una nueva orden complementaria
      const orderNumber = getNextOrderNumber();
      
      // Mapear items del carrito a items de la orden
      const orderItems = currentCartItems.map(item => ({
        id: item.id,
        name: getDishName(item.id),
        price: item.price,
        notes: item.notes || '',
        quantity: item.quantity,
      }));

      // Si hay instrucciones especiales, agregarlas al primer item que no tenga notas
      if (complementaryOrderInstructions.trim() && orderItems.length > 0) {
        const itemToAddInstructions = orderItems.find(item => !item.notes) || orderItems[0];
        if (itemToAddInstructions) {
          itemToAddInstructions.notes = itemToAddInstructions.notes 
            ? `${itemToAddInstructions.notes}. ${complementaryOrderInstructions}` 
            : complementaryOrderInstructions;
        }
      }

      // Crear la orden complementaria en Supabase
      try {
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const { createOrder } = await import('../services/database');
        const newOrder = await createOrder({
          restaurant_id: '00000000-0000-0000-0000-000000000001',
          status: 'orden_enviada',
          total: total,
          items: orderItems,
          notes: complementaryOrderInstructions.trim() || undefined,
        } as any);

        if (newOrder) {
          // Recargar órdenes desde Supabase inmediatamente para ver el estado actualizado
          const loadedOrders = await getOrders();
          setOrders(loadedOrders);
          
          // Recargar una vez más después de un pequeño delay para asegurar que cualquier cambio de estado se refleje
          setTimeout(async () => {
            const refreshedOrders = await getOrders();
            setOrders(refreshedOrders);
          }, 500);
          
          clearCart();
          setComplementaryOrderInstructions('');

          // Navegar a la página de confirmación
          navigate('/order-confirmed');
        } else {
          console.error('Failed to create complementary order');
          alert('Error al crear la orden complementaria. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error creating complementary order:', error);
        alert('Error al crear la orden complementaria. Por favor, intenta de nuevo.');
      }
    }
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
  if (displayedOrders.length === 0 && currentCartItems.length === 0 && !isLoadingOrders) {
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

  // Obtener la orden principal (la primera orden enviada)
  const mainOrder = displayedOrders.find(order => 
    ['orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega'].includes(order.status)
  ) || displayedOrders[0];

  // Verificar si la orden puede ser editada (no está en preparación)
  const canEditOrder = mainOrder && !['en_preparacion', 'lista_para_entregar', 'en_entrega', 'entregada', 'orden_cerrada', 'cancelada'].includes(mainOrder.status);

  // Combinar items originales con items del carrito
  const allOrderItems = useMemo(() => {
    if (!mainOrder) return [];
    
    const originalItems = mainOrder.items.map(item => ({
      ...item,
      isFromOriginalOrder: true,
      isFromCart: false,
    }));

    const cartItems = currentCartItems.filter(cartItem => {
      // Solo incluir items del carrito que no están ya en la orden original
      const existsInOriginal = mainOrder.items.some(
        origItem => origItem.id === cartItem.id && (origItem.notes || '') === (cartItem.notes || '')
      );
      return !existsInOriginal;
    }).map(item => ({
      id: item.id,
      name: item.name || getDishName(item.id),
      price: item.price,
      notes: item.notes || '',
      quantity: item.quantity,
      isFromOriginalOrder: false,
      isFromCart: true,
    }));

    return [...originalItems, ...cartItems];
  }, [mainOrder, currentCartItems]);

  // Función para eliminar un item de la orden original
  const handleRemoveItem = async (itemId: number, itemNotes?: string) => {
    if (!mainOrder || !canEditOrder) return;

    // Buscar el índice del item a eliminar usando id y notas
    const itemIndex = mainOrder.items.findIndex(
      (item) =>
        item.id === itemId &&
        (item.notes || '') === (itemNotes || '')
    );

    if (itemIndex === -1) return;

    // Crear nueva lista sin el item eliminado
    const updatedItems = mainOrder.items.filter((_, index) => index !== itemIndex);

    // Calcular nuevo total
    const newTotal = updatedItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
      return sum + (price * item.quantity);
    }, 0);

    try {
      const { updateOrder } = await import('../services/database');
      const updatedOrder = await updateOrder(mainOrder.orderId, {
        items: updatedItems,
        total: newTotal,
        notes: mainOrder.notes || undefined,
      } as any);

      if (updatedOrder) {
        // Recargar órdenes desde Supabase inmediatamente para ver el estado actualizado
        const loadedOrders = await getOrders();
        setOrders(loadedOrders);
        
        // Recargar una vez más después de un pequeño delay para asegurar que cualquier cambio de estado se refleje
        setTimeout(async () => {
          const refreshedOrders = await getOrders();
          setOrders(refreshedOrders);
        }, 500);
        
        if (id) {
          navigate(`/order-detail/${id}`, { replace: true });
        } else {
          navigate('/order-detail', { replace: true });
        }
      } else {
        alert(t('orderDetail.errorUpdatingOrder') || 'Error al actualizar la orden. Por favor, intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error removing item from order:', error);
      alert(t('orderDetail.errorUpdatingOrder') || 'Error al eliminar el producto. Por favor, intenta de nuevo.');
    }
  };

  // Función para eliminar un item del carrito (producto nuevo)
  const handleRemoveCartItem = async (itemId: number, itemNotes?: string) => {
    try {
      // Eliminar del carrito por id y notes para ser precisos
      const updatedCart = currentCartItems.filter(item => 
        !(item.id === itemId && (item.notes || '') === (itemNotes || ''))
      );
      
      // Actualizar el carrito
      await setCartItems(updatedCart);
    } catch (error) {
      console.error('Error removing item from cart:', error);
      alert(t('orderDetail.errorRemovingItem') || 'Error al eliminar el producto. Por favor, intenta de nuevo.');
    }
  };

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
        {/* Lista de Órdenes - Solo mostrar si no hay items en el carrito o si no es la orden principal */}
        {displayedOrders.map((order) => {
          // Solo mostrar órdenes que no son la principal si hay items en el carrito
          if (mainOrder && order.orderId !== mainOrder.orderId && currentCartItems.length > 0) {
            const statusInfo = getStatusInfo(order.status);
            const timestamp = formatTimestamp(order.timestamp);
            const orderTotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return (
              <div key={order.orderId} className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
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

                <div className={`mb-4 p-3 rounded-lg border ${statusInfo.borderColor} bg-opacity-10`}>
                  <p className={`text-sm font-semibold ${statusInfo.color.split(' ')[2]}`}>
                    {statusInfo.label}
                  </p>
                </div>

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
                          {formatPrice(item.price * item.quantity, selectedLanguage)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-semibold text-[#181411] dark:text-white">
                      {t('orderDetail.orderTotal')}:
                    </span>
                    <span className="text-base font-bold text-primary">
                      {formatPrice(orderTotal, selectedLanguage)}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* Orden Principal con todos los items combinados */}
        {mainOrder && (
          <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
            {/* Header de la Orden */}
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg font-bold text-[#181411] dark:text-white">
                    {mainOrder.orderNumber === 1 ? t('orderDetail.mainOrder') : `${t('orderDetail.complementaryOrder')} #${mainOrder.orderNumber}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{formatTimestamp(mainOrder.timestamp).full}</span>
                </div>
              </div>
              <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getStatusInfo(mainOrder.status).color} shrink-0`}>
                <span className="material-symbols-outlined text-xl">{getStatusInfo(mainOrder.status).icon}</span>
              </div>
            </div>

            {/* Estado de la Orden */}
            <div className={`mb-4 p-3 rounded-lg border ${getStatusInfo(mainOrder.status).borderColor} bg-opacity-10`}>
              <p className={`text-sm font-semibold ${getStatusInfo(mainOrder.status).color.split(' ')[2]}`}>
                {getStatusInfo(mainOrder.status).label}
              </p>
            </div>

            {/* Notificación sobre condiciones de edición */}
            {!canEditOrder && mainOrder && (
              <div className="mb-4 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0">info</span>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {t('orderDetail.cannotEditInPreparation') || 'No puedes modificar esta orden porque ya está en preparación. Si necesitas hacer cambios, contacta al personal.'}
                  </p>
                </div>
              </div>
            )}

            {canEditOrder && (
              <div className="mb-4 p-3 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0">info</span>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {t('orderDetail.canEditOrder') || 'Puedes modificar esta orden agregando o eliminando productos antes de que comience la preparación.'}
                  </p>
                </div>
              </div>
            )}

            {/* Items de la Orden (combinados: originales + carrito) */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-[#181411] dark:text-white mb-3">
                {t('orderDetail.items')} ({allOrderItems.length})
              </h4>
              <div className="space-y-2">
                {allOrderItems.map((item, index) => {
                  const isOriginalItem = item.isFromOriginalOrder;

                  return (
                    <div key={`${item.id}-${item.notes || ''}-${index}-${isOriginalItem ? 'orig' : 'cart'}`} className="flex justify-between items-start py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex-1 flex items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#181411] dark:text-white">
                              {item.quantity}x
                            </span>
                            <span className="text-sm text-[#181411] dark:text-white">{item.name}</span>
                            {item.isFromCart && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                {t('orderDetail.new') || 'Nuevo'}
                              </span>
                            )}
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        {/* Botón eliminar para items originales */}
                        {isOriginalItem && canEditOrder && (
                          <button
                            onClick={() => handleRemoveItem(item.id, item.notes || undefined)}
                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                            title={t('orderDetail.removeItem') || 'Eliminar producto'}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                        {/* Botón eliminar para items del carrito (nuevos) */}
                        {item.isFromCart && (
                          <button
                            onClick={() => handleRemoveCartItem(item.id, item.notes || undefined)}
                            className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                            title={t('orderDetail.removeItem') || 'Eliminar producto'}
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#181411] dark:text-white ml-4">
                        {formatPrice(item.price * item.quantity, selectedLanguage)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total de la Orden */}
              <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-[#181411] dark:text-white">
                  {t('orderDetail.orderTotal')}:
                </span>
                <span className="text-base font-bold text-primary">
                  {formatPrice(
                    allOrderItems.reduce((sum, item) => {
                      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                      return sum + (price * item.quantity);
                    }, 0),
                    selectedLanguage
                  )}
                </span>
              </div>
            </div>

            {/* Instrucciones Especiales y Botones de Acción (solo si hay items del carrito) */}
            {currentCartItems.length > 0 && (
              <>
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
              </>
            )}
          </div>
        )}

        {/* Total General */}
        {displayedOrders.length > 0 && (
          <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[#3d3321]">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#181411] dark:text-white">{t('orderDetail.total')}:</span>
              <span className="text-2xl font-bold text-primary">
                {formatPrice(
                  displayedOrders.reduce((sum, order) => {
                    const orderSum = order.items.reduce((itemSum, item) => {
                      const price = typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace(/[^0-9.]/g, '')) || 0;
                      return itemSum + (price * item.quantity);
                    }, 0);
                    return sum + orderSum;
                  }, 0) + complementaryOrderTotal,
                  selectedLanguage
                )}
              </span>
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        {/* Botón para enviar orden pendiente a cocina */}
        {displayedOrders.some(order => order.status === 'pending') && (
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
            {displayedOrders.length > 0 && displayedOrders.some(order => 
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
