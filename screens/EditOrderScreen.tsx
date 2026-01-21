import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useCart, CartItem } from '../contexts/CartContext';
import { Order, ORDERS_STORAGE_KEY } from '../types/order';
import { allDishes } from './DishDetailScreen';

// Función helper para obtener la imagen de un platillo por su ID
const getDishImage = (dishId: number): string => {
  const dish = allDishes.find(d => d.id === dishId);
  return dish?.image || 'https://via.placeholder.com/150'; // Fallback image
};

const EditOrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { 
    cart, 
    updateCartItemQuantity, 
    removeFromCart,
    clearCart,
    addToCart,
    updateCartItemNotes,
    setCartItems
  } = useCart();
  
  const [lastMinuteNotes, setLastMinuteNotes] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const itemsLoadedRef = useRef(false);

  // Cargar la orden desde la URL o localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('orderId');
    
    if (id) {
      setOrderId(id);
      // Cargar todas las órdenes
      try {
        const savedData = localStorage.getItem(ORDERS_STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setOrders(parsed);
          const order = parsed.find((o: Order) => o.orderId === id);
          
          if (order && cart.length === 0 && !itemsLoadedRef.current) {
            // Cargar items de la orden en el carrito
            // Primero, agrupar items por ID y notas para calcular cantidades totales
            const groupedItems = order.items.reduce((acc: CartItem[], item) => {
              const existing = acc.find(i => i.id === item.id && i.notes === (item.notes || ''));
              if (existing) {
                existing.quantity += item.quantity;
              } else {
                acc.push({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  notes: item.notes || '',
                  quantity: item.quantity,
                });
              }
              return acc;
            }, [] as CartItem[]);
            
            // Establecer directamente los items en el carrito con sus cantidades correctas
            setCartItems(groupedItems);
            itemsLoadedRef.current = true;
          }
          
          // Resetear el flag si el orderId cambia
          if (id && orderId !== id) {
            itemsLoadedRef.current = false;
          }
        }
      } catch (error) {
        console.error('Error loading order:', error);
      }
    }
  }, [location.search, addToCart]);

  // Calcular total actualizado
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Función para guardar cambios
  const handleSaveChanges = () => {
    if (!orderId) return;

    // Actualizar la orden
    const updatedOrders = orders.map(order => {
      if (order.orderId === orderId) {
        // Convertir items del carrito a items de la orden
        const orderItems = cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          notes: item.notes || '',
          quantity: item.quantity,
        }));

        return {
          ...order,
          items: orderItems,
          timestamp: new Date().toISOString(), // Actualizar timestamp
        };
      }
      return order;
    });

    // Guardar en localStorage
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updatedOrders));
    setOrders(updatedOrders);

    // Limpiar carrito
    clearCart();

    // Navegar de vuelta
    navigate('/order-detail');
  };

  // Función para eliminar item específico por ID y notas
  const handleRemoveItem = (itemId: number, notes: string = '') => {
    // Remover el item específico usando updateCartItemQuantity con cantidad 0 y notas
    updateCartItemQuantity(itemId, 0, notes);
  };

  // Función para incrementar cantidad
  const handleIncrement = (itemId: number, notes: string = '') => {
    // Buscar el item específico
    const item = cart.find(i => i.id === itemId && i.notes === notes);
    if (item) {
      // Actualizar la cantidad incrementando en 1
      updateCartItemQuantity(itemId, item.quantity + 1, notes);
    } else {
      // Si no existe, buscar en la orden original para obtener los datos
      const order = orders.find(o => o.orderId === orderId);
      if (order) {
        const orderItem = order.items.find(i => i.id === itemId);
        if (orderItem) {
          // Agregar nuevo item con cantidad 1
          addToCart({
            id: itemId,
            name: orderItem.name,
            price: orderItem.price,
            notes: notes,
          });
        }
      }
    }
  };

  // Función para decrementar cantidad
  const handleDecrement = (itemId: number, notes: string = '') => {
    const item = cart.find(i => i.id === itemId && i.notes === notes);
    if (!item) return;
    
    if (item.quantity > 1) {
      // Decrementar cantidad
      updateCartItemQuantity(itemId, item.quantity - 1, notes);
    } else {
      // Eliminar completamente
      updateCartItemQuantity(itemId, 0, notes);
    }
  };

  // Agrupar items del carrito por ID y notas (para mostrar correctamente)
  // El carrito ya agrupa por ID y notas, pero necesitamos asegurarnos de que funcione correctamente
  const groupedCartItems = cart.reduce((acc: any[], item) => {
    const existing = acc.find(i => i.id === item.id && i.notes === (item.notes || ''));
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ 
        ...item,
        notes: item.notes || ''
      });
    }
    return acc;
  }, []);

  return (
    <div className="bg-background-light dark:bg-background-dark text-[#181511] dark:text-white min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-[#e6e1db] dark:border-[#3d3429]">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center justify-center size-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
            </button>
            <h2 className="text-lg font-bold tracking-tight">{t('orderDetail.modifyOrder') || 'Modificar Orden'}</h2>
          </div>
          <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            Desayuno
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full pb-40">
        {/* Banner informativo */}
        <div className="p-4">
          <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 dark:bg-primary/10">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">info</span>
              <p className="text-[#181511] dark:text-white text-base font-bold leading-tight">
                {t('orderDetail.orderStatus') || 'Estado del Pedido'}
              </p>
            </div>
            <p className="text-[#897961] dark:text-gray-400 text-sm font-normal leading-normal">
              {t('orderDetail.canEditUntilKitchenAccepts') || 'Puedes editar hasta que la cocina acepte tu orden. Los precios pueden variar según las modificaciones.'}
            </p>
          </div>
        </div>

        {/* Lista de Items */}
        <div className="px-4 space-y-4">
          <h3 className="text-sm font-bold text-[#897961] uppercase tracking-widest pl-1">
            {t('orderDetail.yourDishes') || 'Tus Platillos'}
          </h3>
          
          {groupedCartItems.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <p className="mb-4">{t('orderDetail.noItems') || 'No hay items en la orden.'}</p>
              <button 
                onClick={() => navigate('/menu')}
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined">add</span>
                {t('orderDetail.addMoreItems') || 'Agregar items'}
              </button>
            </div>
          ) : (
            <>
              {groupedCartItems.map((item, index) => (
                <div 
                  key={`${item.id}-${item.notes || ''}-${index}`} 
                  className="bg-white dark:bg-[#2d2419] rounded-xl p-4 shadow-sm border border-[#e6e1db] dark:border-[#3d3429] flex flex-col gap-4"
                >
                  <div className="flex gap-4 justify-between">
                    <div className="flex items-start gap-4">
                      <div 
                        className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[72px] shrink-0" 
                        style={{ backgroundImage: `url("${getDishImage(item.id)}")` }}
                      />
                      <div className="flex flex-col">
                        <p className="text-base font-bold leading-tight">{item.name}</p>
                        <p className="text-primary text-sm font-bold mt-1">${item.price.toFixed(2)}</p>
                        {item.notes && (
                          <p className="text-[#897961] text-xs font-normal mt-1 italic">"{item.notes}"</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between">
                      <button 
                        onClick={() => handleRemoveItem(item.id, item.notes || '')}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                      <div className="flex items-center gap-3 bg-background-light dark:bg-white/5 rounded-full p-1 border border-[#e6e1db] dark:border-white/10">
                        <button 
                          onClick={() => handleDecrement(item.id, item.notes || '')}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white dark:bg-[#181511] shadow-sm hover:scale-105 transition-transform active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => handleIncrement(item.id, item.notes || '')}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:scale-105 transition-transform active:scale-95"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Botón para agregar más items */}
              <button
                onClick={() => navigate('/menu')}
                className="w-full py-4 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-primary/30 border-dashed"
              >
                <span className="material-symbols-outlined">add_circle</span>
                {t('orderDetail.addMoreItems') || 'Agregar más items'}
              </button>
            </>
          )}
        </div>

        {/* Notas de último minuto */}
        <div className="p-4 mt-2">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-primary text-xl">edit_note</span>
              <p className="text-[#181511] dark:text-white text-base font-bold">
                {t('orderDetail.lastMinuteNotes') || 'Notas de último minuto'}
              </p>
            </div>
            <textarea 
              className="form-input flex w-full resize-none overflow-hidden rounded-xl text-[#181511] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#e6e1db] dark:border-[#3d3429] bg-white dark:bg-[#2d2419] min-h-32 placeholder:text-[#897961] p-4 text-sm font-normal leading-normal" 
              placeholder={t('orderDetail.lastMinuteNotesPlaceholder') || 'Ejem: Por favor, empaque los cubiertos extra...'}
              value={lastMinuteNotes}
              onChange={(e) => setLastMinuteNotes(e.target.value)}
            />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Section */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="bg-white/95 dark:bg-[#181511]/95 backdrop-blur-lg border-t border-[#e6e1db] dark:border-[#3d3429] p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex flex-col gap-4">
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <span className="text-xs text-[#897961] font-medium uppercase tracking-tight">
                  {t('orderDetail.updatedTotal') || 'Total Actualizado'}
                </span>
                <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                  {t('orderDetail.taxesIncluded') || '+ Impuestos incluidos'}
                </span>
              </div>
            </div>
            <button 
              onClick={handleSaveChanges}
              className="w-full bg-primary text-white h-14 rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined">check_circle</span>
              {t('orderDetail.saveChanges') || 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditOrderScreen;
