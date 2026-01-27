import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupOrder } from '../contexts/GroupOrderContext';
import { useCart, CartItem } from '../contexts/CartContext';
import { useTranslation } from '../contexts/LanguageContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { Order, OrderStatus } from '../types/order';
import { getOrders, createOrder as createOrderDB, updateOrder } from '../services/database';
import { formatPrice } from '../utils/currency';
import TopNavbar from '../components/TopNavbar';

const OrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const selectedLanguage = localStorage.getItem('selectedLanguage');
  const {
    isGroupOrder,
    isConfirmed,
    participants,
    currentUserParticipant,
    setIsGroupOrder,
    setCurrentUserParticipant,
    updateParticipantOrder,
    updateParticipantInstructions,
    setParticipantReady,
    confirmGroupOrder,
    canConfirmOrder,
  } = useGroupOrder();
  
  const { 
    cart: orderItems, 
    updateCartItemQuantity, 
    removeFromCart, 
    updateCartItemNotes,
    clearCart
  } = useCart();
  const { saveCombination } = useFavorites();
  const { config } = useRestaurant();
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [orderSpecialInstructions, setOrderSpecialInstructions] = useState('');
  const [isEditingOrderInstructions, setIsEditingOrderInstructions] = useState(false);
  const [isGroupOrderCollapsed, setIsGroupOrderCollapsed] = useState(false);
  const [showSaveCombinationModal, setShowSaveCombinationModal] = useState(false);
  const [combinationName, setCombinationName] = useState('');
  
  // Función para obtener el nombre traducido del platillo
  const getDishName = (dishId: number): string => {
    try {
      return t(`dishes.${dishId}.name`) || `dish-${dishId}`;
    } catch {
      return `dish-${dishId}`;
    }
  };

  // Cargar órdenes desde Supabase
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const loadOrders = async () => {
      try {
        setIsLoadingOrders(true);
        const loadedOrders = await getOrders();
        
        if (!isMounted) return;
        
        setOrders(loadedOrders);
      } catch (error) {
        console.error('[OrderScreen] Error loading orders:', error);
        if (isMounted) {
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingOrders(false);
        }
      }
    };
    
    // Carga inicial
    loadOrders();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Verificar si hay alguna orden enviada
  const hasSentOrder = orders.length > 0 && orders.some(order => 
    ['orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega', 'con_incidencias'].includes(order.status)
  );

  // Obtener el número de la próxima orden complementaria
  const getNextOrderNumber = (): number => {
    if (orders.length === 0) return 1;
    return Math.max(...orders.map(o => o.orderNumber || 0)) + 1;
  };

  // Sincronizar orden del usuario actual con el contexto de orden grupal
  const prevOrderItemsRef = useRef<CartItem[]>([]);
  const prevInstructionsRef = useRef<string>('');

  useEffect(() => {
    if (isGroupOrder && currentUserParticipant) {
      // Solo actualizar si realmente cambió
      const orderItemsChanged = JSON.stringify(orderItems) !== JSON.stringify(prevOrderItemsRef.current);
      if (orderItemsChanged) {
        updateParticipantOrder(currentUserParticipant.id, orderItems);
        prevOrderItemsRef.current = orderItems;
      }
    }
  }, [orderItems, isGroupOrder, currentUserParticipant?.id, updateParticipantOrder]);

  useEffect(() => {
    if (isGroupOrder && currentUserParticipant) {
      // Solo actualizar si realmente cambió
      if (orderSpecialInstructions !== prevInstructionsRef.current) {
        updateParticipantInstructions(currentUserParticipant.id, orderSpecialInstructions);
        prevInstructionsRef.current = orderSpecialInstructions;
      }
    }
  }, [orderSpecialInstructions, isGroupOrder, currentUserParticipant?.id, updateParticipantInstructions]);

  const handleConvertToGroupOrder = () => {
    setIsGroupOrder(true);
    // Crear participante para el usuario actual
    const currentUser: typeof currentUserParticipant = {
      id: 'current-user',
      name: t('order.you'),
      email: 'usuario@email.com',
      orderItems: orderItems,
      specialInstructions: orderSpecialInstructions,
      status: 'joined',
      isReady: false,
    };
    setCurrentUserParticipant(currentUser);
    navigate('/invite-users');
  };

  const handleToggleReady = () => {
    if (currentUserParticipant) {
      const newReadyState = !currentUserParticipant.isReady;
      setParticipantReady(currentUserParticipant.id, newReadyState);
    }
  };

  const handleConfirmOrder = async () => {
    if (canConfirmOrder()) {
      confirmGroupOrder();
      // Crear nueva orden con el carrito actual en Supabase
      try {
        const orderNumber = getNextOrderNumber();
        const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const newOrder = await createOrderDB({
          restaurant_id: '00000000-0000-0000-0000-000000000001', // ID del restaurante por defecto
          status: 'pending',
          total: total,
          items: orderItems.map(item => ({
            id: item.id,
            name: item.name || getDishName(item.id),
            price: item.price,
            notes: item.notes || '',
            quantity: item.quantity,
          })),
          notes: orderSpecialInstructions || undefined,
        } as any);
        
        if (newOrder) {
          // Recargar órdenes desde Supabase inmediatamente
          const loadedOrders = await getOrders();
          setOrders(loadedOrders);
          // Limpiar carrito después de crear la orden
          await clearCart();
          // La orden se crea con status 'pending', el usuario puede enviarla a cocina después
          // Se queda en la pantalla de órdenes y se actualiza automáticamente cada 5 segundos
        } else {
          console.error('Failed to create order: createOrderDB returned null');
          alert('Error al crear la orden. Por favor, intenta de nuevo.');
        }
      } catch (error) {
        console.error('Error creating order:', error);
        alert('Error al crear la orden. Por favor, intenta de nuevo.');
      }
    }
  };

  // Función para obtener la información del estatus
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return {
          label: t('order.status.pending') || 'Pendiente',
          icon: 'schedule',
          color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          description: t('order.status.pendingDescription') || 'Tu orden está lista para ser enviada a cocina',
        };
      case 'orden_enviada':
        return {
          label: t('order.status.sent'),
          icon: 'send',
          color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-800',
          description: t('order.status.sentDescription'),
        };
      case 'orden_recibida':
        return {
          label: t('order.status.received'),
          icon: 'check_circle',
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          description: t('order.status.receivedDescription'),
        };
      case 'en_preparacion':
        return {
          label: t('order.status.preparing'),
          icon: 'restaurant',
          color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-200 dark:border-orange-800',
          description: t('order.status.preparingDescription'),
        };
      case 'lista_para_entregar':
        return {
          label: t('order.status.readyToDeliver'),
          icon: 'check',
          color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-200 dark:border-purple-800',
          description: t('order.status.readyToDeliverDescription'),
        };
      case 'en_entrega':
        return {
          label: t('order.status.delivering'),
          icon: 'delivery_dining',
          color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
          borderColor: 'border-indigo-200 dark:border-indigo-800',
          description: t('order.status.deliveringDescription'),
        };
      case 'entregada':
        return {
          label: t('order.status.delivered'),
          icon: 'done_all',
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
          description: t('order.status.deliveredDescription'),
        };
      case 'con_incidencias':
        return {
          label: t('order.status.withIssues'),
          icon: 'warning',
          color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
          description: t('order.status.withIssuesDescription'),
        };
      case 'orden_cerrada':
        return {
          label: t('order.status.closed'),
          icon: 'receipt_long',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-700',
          description: t('order.status.closedDescription'),
        };
      case 'cancelada':
        return {
          label: t('order.status.cancelled'),
          icon: 'cancel',
          color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
          description: t('order.status.cancelledDescription'),
        };
      default:
        return {
          label: t('order.status.noStatus'),
          icon: 'help',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-700',
          description: '',
        };
    }
  };

  const getPendingCount = () => {
    if (!isGroupOrder) return 0;
    const pendingParticipants = participants.filter(p => !p.isReady).length;
    const pendingCurrentUser = currentUserParticipant && !currentUserParticipant.isReady ? 1 : 0;
    return pendingParticipants + pendingCurrentUser;
  };

  // Calcular el total de la orden
  const orderTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleQuantityChange = (id: number, delta: number) => {
    const item = orderItems.find(i => i.id === id);
    if (item) {
      const newQuantity = Math.max(1, item.quantity + delta);
      updateCartItemQuantity(id, newQuantity);
    }
  };

  const handleRemoveItem = (id: number) => {
    removeFromCart(id);
  };

  const handleEditNotes = (id: number) => {
    const item = orderItems.find(i => i.id === id);
    if (item) {
      setEditingNotesId(id);
      setEditingNotesText(item.notes || '');
    }
  };

  const handleSaveNotes = (id: number) => {
    updateCartItemNotes(id, editingNotesText);
    setEditingNotesId(null);
    setEditingNotesText('');
  };

  const handleCancelEdit = () => {
    setEditingNotesId(null);
    setEditingNotesText('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-32 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <TopNavbar 
        title={isGroupOrder ? t('order.groupOrder') : t('order.title')}
        showBackButton={true}
        showAvatar={false}
        showFavorites={false}
      />

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Order Info */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-[#181411] dark:text-white text-sm font-semibold">Mesa #04</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">24 Oct, 2023</p>
          </div>
          {!isGroupOrder && orderItems.length > 0 && (
            <button
              onClick={handleConvertToGroupOrder}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-base">group_add</span>
              {t('order.groupOrder')}
            </button>
          )}
        </div>

        {/* Group Order Participants Section */}
        {isGroupOrder && (
          <div className="mb-6">
            <div className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              {isConfirmed && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-green-600 dark:text-green-400 shrink-0">check_circle</span>
                    <div className="flex-1">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium mb-1">
                        {t('order.confirmedAndSent')}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {t('order.enjoyMeal')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setIsGroupOrderCollapsed(!isGroupOrderCollapsed)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <span className={`material-symbols-outlined text-[#8a7560] dark:text-[#d4c4a8] transition-transform ${isGroupOrderCollapsed ? '' : 'rotate-90'}`}>
                    chevron_right
                  </span>
                  <h3 className="text-[#181411] dark:text-white text-base font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">groups</span>
                  </h3>
                </button>
                {!isConfirmed && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/group-order-management')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      Ver todo
                    </button>
                    <button
                      onClick={() => navigate('/invite-users')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold transition-colors hover:bg-primary/90"
                    >
                      <span className="material-symbols-outlined text-sm">person_add</span>
                      Invitar
                    </button>
                  </div>
                )}
              </div>
              
              {!isGroupOrderCollapsed && (
                <>
              
              {/* Current User */}
              {currentUserParticipant && (
                <div className="mb-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#181411] dark:text-white text-sm">{currentUserParticipant.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {currentUserParticipant.orderItems.length} {currentUserParticipant.orderItems.length === 1 ? t('order.item') : t('order.items')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentUserParticipant.isReady ? (
                        <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          {t('order.ready')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                          {t('order.selecting')}
                        </span>
                      )}
                      <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium">
                        {t('order.you')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Participants */}
              {participants.length > 0 && (
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-gray-400 text-sm">person</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-[#181411] dark:text-white text-sm">{participant.name}</p>
                          {participant.isFavorite && (
                            <span className="material-symbols-outlined text-yellow-500 text-xs">star</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {participant.orderItems.length} {participant.orderItems.length === 1 ? t('order.item') : t('order.items')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.isReady ? (
                          <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">check_circle</span>
                            {t('order.ready')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                            {t('order.selecting')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Active Orders Section */}
        {(isLoadingOrders || orders.length > 0) && (
          <div className="mb-6">
            <h2 className="text-[#181411] dark:text-white text-lg font-bold mb-4">{t('order.activeOrders') || 'Órdenes Activas'}</h2>
            {isLoadingOrders ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Cargando órdenes...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-[#2d2516] rounded-xl border border-gray-100 dark:border-[#3d3321]">
                <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">receipt_long</span>
                <p className="text-gray-500 dark:text-gray-400 text-sm">No hay órdenes activas</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Las órdenes aparecerán aquí cuando las confirmes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                return (
                  <div
                    key={order.orderId}
                    onClick={() => navigate(`/order-detail/${order.orderId}`)}
                    className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321] cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[#181411] dark:text-white font-bold text-base">
                            {t('order.orderNumber') || 'Orden'} #{order.orderNumber || order.orderId.slice(0, 8)}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color} ${statusInfo.borderColor} border`}>
                            {statusInfo.label}
                          </span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(order.timestamp).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {order.items?.length || 0} {order.items?.length === 1 ? t('order.item') : t('order.items')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-primary font-bold text-lg">
                          {(() => {
                            if (!order.items || order.items.length === 0) return formatPrice(0, selectedLanguage);
                            const total = order.items.reduce((sum: number, item: any) => {
                              let price = 0;
                              if (typeof item.price === 'number') {
                                price = item.price;
                              } else if (typeof item.price === 'string') {
                                price = parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0;
                              }
                              return sum + (price * (item.quantity || 1));
                            }, 0);
                            return formatPrice(total, selectedLanguage);
                          })()}
                        </p>
                      </div>
                    </div>
                    {statusInfo.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{statusInfo.description}</p>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>
        )}

        {/* Continue Exploring Section */}
        {orderItems.length > 0 && !isConfirmed && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-dashed border-primary/30 rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
                </div>
                <div className="text-left">
                  <p className="text-[#181411] dark:text-white font-bold text-base">{t('order.continueExploring')}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{t('order.addMoreProducts')}</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-4 mb-6">
          {orderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">receipt_long</span>
              </div>
              <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-2">{t('order.empty')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{t('order.addItems')}</p>
              <button
                onClick={() => navigate('/menu')}
                className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined">restaurant_menu</span>
                <span>{t('order.exploreMenu')}</span>
              </button>
            </div>
          ) : (
            orderItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-[#181411] dark:text-white text-base font-bold leading-tight">{item.name}</h3>
                  {editingNotesId === item.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        placeholder={t('order.notesPlaceholder')}
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Guardar
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 mt-1">
                      <span className="material-symbols-outlined text-xs text-gray-400 mt-0.5">edit_note</span>
                      <div className="flex-1">
                        {item.notes ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{item.notes}</p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 text-sm italic">Sin instrucciones especiales</p>
                        )}
                        {!isConfirmed && (
                          <button
                            onClick={() => handleEditNotes(item.id)}
                            className="mt-1 text-primary text-xs font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">edit</span>
                            {item.notes ? 'Editar' : 'Agregar'} instrucciones
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-[#181411] dark:text-white text-base font-bold">{formatPrice(item.price, selectedLanguage)}</p>
                </div>
              </div>
              {!isConfirmed && (
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center text-primary hover:scale-110 transition-transform"
                      >
                        <span className="material-symbols-outlined text-lg">remove</span>
                      </button>
                      <span className="text-[#181411] dark:text-white text-base font-semibold w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center text-primary hover:scale-110 transition-transform"
                      >
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 hover:text-red-600 p-2"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              )}
            </div>
            ))
          )}
        </div>

        {/* Order Special Instructions */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <div className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <span className="material-symbols-outlined text-primary">info</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#181411] dark:text-white text-base font-bold mb-2 flex items-center gap-2">
                    {t('order.specialInstructions')}
                  </h3>
                  {isEditingOrderInstructions ? (
                    <div className="space-y-3">
                      <textarea
                        value={orderSpecialInstructions}
                        onChange={(e) => setOrderSpecialInstructions(e.target.value)}
                        placeholder={t('order.specialInstructionsPlaceholder')}
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingOrderInstructions(false)}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          {t('common.save')}
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingOrderInstructions(false);
                            setOrderSpecialInstructions('');
                          }}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          {t('common.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {orderSpecialInstructions ? (
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                          <p className="text-[#181411] dark:text-white text-sm leading-relaxed">{orderSpecialInstructions}</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm italic mb-2">
                          {t('order.noSpecialInstructions')}
                        </p>
                      )}
                      {!isConfirmed && (
                        <button
                          onClick={() => setIsEditingOrderInstructions(true)}
                          className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          {orderSpecialInstructions ? t('order.edit') : t('order.add')} {t('order.instructions')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Total */}
        {orderItems.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">receipt_long</span>
                <span className="text-[#181411] dark:text-white text-base font-semibold">{t('order.total')}</span>
              </div>
              <span className="text-primary text-2xl font-bold">{formatPrice(orderTotal, selectedLanguage)}</span>
            </div>
          </div>
        )}

        {/* Suggested Products */}
        {orderItems.length > 0 && !isConfirmed && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#181411] dark:text-white text-lg font-bold">{t('order.suggestions')}</h2>
              <button 
                onClick={() => navigate('/menu')}
                className="text-primary text-sm font-semibold flex items-center gap-1"
              >
                {t('order.viewAll')}
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 5, name: 'Jugo Natural', price: '$8.00', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g' },
                { id: 6, name: 'Pan Dulce', price: '$6.50', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL' },
              ].map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => navigate(`/dish/${suggestion.id}`)}
                  className="bg-white dark:bg-[#2d2516] rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#3d3321] cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div
                    className="w-full h-32 bg-cover bg-center"
                    style={{ backgroundImage: `url("${suggestion.image}")` }}
                  />
                  <div className="p-3">
                    <h3 className="text-[#181411] dark:text-white text-sm font-bold mb-1 line-clamp-1">{suggestion.name}</h3>
                    <p className="text-primary text-sm font-semibold">{suggestion.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Ready Button for Group Orders */}
        {isGroupOrder && currentUserParticipant && !isConfirmed && (
          <div className="mb-6">
            <div className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[#181411] dark:text-white font-semibold text-sm mb-1">
                    {t('order.finishedSelecting')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUserParticipant.isReady 
                      ? t('order.canUnmark')
                      : t('order.markWhenFinished')}
                  </p>
                </div>
                <button
                  onClick={handleToggleReady}
                  className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
                    currentUserParticipant.isReady
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {currentUserParticipant.isReady ? (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>{t('order.ready')}</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">radio_button_unchecked</span>
                      <span>{t('order.markAsReady')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Order Button or Pay Button - Removed from here, now fixed at bottom */}
      </main>

      {/* Botón Confirmar Orden - Siempre visible en la parte inferior, justo arriba de la navbar */}
      {orderItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 z-40 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 px-4 py-3 shadow-lg md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
          {isConfirmed ? (
            <button
              onClick={() => navigate('/payments')}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-primary/90"
            >
              <span>{t('order.checkout')}</span>
              <span className="material-symbols-outlined">payment</span>
            </button>
          ) : isGroupOrder ? (
            <>
              {canConfirmOrder() ? (
                <button
                  onClick={handleConfirmOrder}
                  className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-primary/90"
                >
                  <span>{t('order.confirmAndSendOrder')}</span>
                  <span className="material-symbols-outlined">restaurant</span>
                </button>
              ) : (
                <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-4 rounded-xl text-lg flex items-center justify-center gap-3 cursor-not-allowed">
                  <span className="material-symbols-outlined">lock</span>
                  <span>
                    {t('order.waitingForAll')} ({getPendingCount()} {getPendingCount() !== 1 ? t('order.pending') : t('order.pendingSingular')})
                  </span>
                </div>
              )}
            </>
          ) : (
            <button
              onClick={async () => {
                try {
                  // Crear orden en Supabase
                  const orderNumber = getNextOrderNumber();
                  const total = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  
                  const newOrder = await createOrderDB({
                    restaurant_id: '00000000-0000-0000-0000-000000000001',
                    status: 'orden_enviada',
                    total: total,
                    items: orderItems.map(item => ({
                      id: item.id,
                      name: item.name || getDishName(item.id),
                      price: item.price,
                      notes: item.notes || '',
                      quantity: item.quantity,
                    })),
                    notes: orderSpecialInstructions || undefined,
                  } as any);
                  
                  if (newOrder) {
                    // Recargar órdenes desde Supabase inmediatamente
                    const loadedOrders = await getOrders();
                    setOrders(loadedOrders);
                    await clearCart();
                  } else {
                    console.error('Failed to create order: createOrderDB returned null');
                    alert('Error al crear la orden. Por favor, intenta de nuevo.');
                  }
                } catch (error) {
                  console.error('Error creating order:', error);
                  alert('Error al crear la orden. Por favor, intenta de nuevo.');
                }
              }}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-primary/90"
            >
              <span>{t('order.confirmAndSendOrder')}</span>
              <span className="material-symbols-outlined">restaurant</span>
            </button>
          )}
        </div>
      )}

      {/* Modal para guardar combinación */}
      {showSaveCombinationModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">
              {t('order.saveCombinationTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('order.saveCombinationDesc')}
            </p>
            <input
              type="text"
              value={combinationName}
              onChange={(e) => setCombinationName(e.target.value)}
              placeholder={t('order.combinationNamePlaceholder')}
              className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSaveCombinationModal(false);
                  setCombinationName('');
                }}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  if (combinationName.trim() && orderItems.length > 0) {
                    saveCombination(combinationName.trim(), orderItems);
                    setShowSaveCombinationModal(false);
                    setCombinationName('');
                    // Mostrar feedback de éxito (opcional)
                    alert(t('order.combinationSaved'));
                  }
                }}
                disabled={!combinationName.trim()}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderScreen;
