import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useGroupOrder } from '../contexts/GroupOrderContext';

type OrderStatus = 
  | 'orden_enviada' 
  | 'orden_recibida' 
  | 'en_preparacion' 
  | 'lista_para_entregar' 
  | 'en_entrega' 
  | 'entregada' 
  | 'con_incidencias' 
  | 'orden_cerrada' 
  | 'cancelada';

interface OrderStatusWithTimestamp {
  status: OrderStatus;
  timestamp: string;
}

interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  label: string;
}

const OrderDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { cart: orderItems } = useCart();
  const { isGroupOrder, participants, currentUserParticipant, isConfirmed } = useGroupOrder();

  // Obtener estado actual desde localStorage
  const orderStatusData: OrderStatusWithTimestamp | null = useMemo(() => {
    const savedData = localStorage.getItem('orderStatusData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Calcular total
  const orderTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [orderItems]);

  // Historial de estados (simulado - en producción vendría del backend)
  const statusHistory: StatusHistory[] = useMemo(() => {
    if (!orderStatusData) return [];
    
    const history: StatusHistory[] = [];
    const statusLabels: Record<OrderStatus, string> = {
      'orden_enviada': 'Orden Enviada',
      'orden_recibida': 'Orden Recibida',
      'en_preparacion': 'En Preparación',
      'lista_para_entregar': 'Lista para Entregar',
      'en_entrega': 'En Entrega',
      'entregada': 'Entregada',
      'con_incidencias': 'Con Incidencias',
      'orden_cerrada': 'Orden Cerrada',
      'cancelada': 'Cancelada',
    };

    // Agregar estado actual
    history.push({
      status: orderStatusData.status,
      timestamp: orderStatusData.timestamp,
      label: statusLabels[orderStatusData.status],
    });

    // Simular estados anteriores (en producción vendrían del backend)
    if (orderStatusData.status !== 'orden_enviada') {
      const sentTime = new Date(orderStatusData.timestamp);
      sentTime.setMinutes(sentTime.getMinutes() - 10);
      history.unshift({
        status: 'orden_enviada',
        timestamp: sentTime.toISOString(),
        label: 'Orden Enviada',
      });
    }

    return history.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [orderStatusData]);

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case 'orden_enviada':
        return {
          label: 'Orden Enviada',
          icon: 'send',
          color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'orden_recibida':
        return {
          label: 'Orden Recibida',
          icon: 'check_circle',
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'en_preparacion':
        return {
          label: 'En Preparación',
          icon: 'restaurant',
          color: 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400',
          borderColor: 'border-orange-200 dark:border-orange-800',
        };
      case 'lista_para_entregar':
        return {
          label: 'Lista para Entregar',
          icon: 'check',
          color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
          borderColor: 'border-purple-200 dark:border-purple-800',
        };
      case 'en_entrega':
        return {
          label: 'En Entrega',
          icon: 'delivery_dining',
          color: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400',
          borderColor: 'border-indigo-200 dark:border-indigo-800',
        };
      case 'entregada':
        return {
          label: 'Entregada',
          icon: 'done_all',
          color: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
          borderColor: 'border-green-200 dark:border-green-800',
        };
      case 'con_incidencias':
        return {
          label: 'Con Incidencias',
          icon: 'warning',
          color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      case 'orden_cerrada':
        return {
          label: 'Orden Cerrada',
          icon: 'receipt_long',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
      case 'cancelada':
        return {
          label: 'Cancelada',
          icon: 'cancel',
          color: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
          borderColor: 'border-red-200 dark:border-red-800',
        };
      default:
        return {
          label: 'Sin Estado',
          icon: 'help',
          color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400',
          borderColor: 'border-gray-200 dark:border-gray-700',
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      full: date.toLocaleString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  if (!orderStatusData) {
    return (
      <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
        <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center">Detalles de la Orden</h2>
          <div className="w-12"></div>
        </header>
        <div className="px-4 py-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">No hay orden activa</p>
        </div>
      </div>
    );
  }

  const currentStatusInfo = getStatusInfo(orderStatusData.status);
  const timestamp = formatTimestamp(orderStatusData.timestamp);

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">Detalles de la Orden</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Estado Actual */}
        <div className="mb-6">
          <div className={`bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border-2 ${currentStatusInfo.borderColor}`}>
            <div className="flex items-start gap-3">
              <div className={`flex items-center justify-center w-16 h-16 rounded-full ${currentStatusInfo.color} shrink-0`}>
                <span className="material-symbols-outlined text-2xl">{currentStatusInfo.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${currentStatusInfo.color.split(' ')[2]}`}>
                  {currentStatusInfo.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Estado actual de tu orden
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>{timestamp.full}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer sobre modificaciones */}
        {orderStatusData.status === 'orden_enviada' || orderStatusData.status === 'orden_recibida' ? (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">info</span>
              <div className="flex-1">
                <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">
                  Modificaciones a tu orden
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                  Tu orden puede ser modificada mientras la cocina no haya iniciado su preparación. 
                  Si necesitas realizar cambios, utiliza el botón "Cambiar mi orden" disponible en esta pantalla.
                </p>
              </div>
            </div>
          </div>
        ) : orderStatusData.status === 'en_preparacion' || 
            orderStatusData.status === 'lista_para_entregar' || 
            orderStatusData.status === 'en_entrega' ? (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">restaurant</span>
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-200 font-medium mb-1">
                  Orden en preparación
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  Tu orden ya está siendo preparada por nuestra cocina. En este momento no es posible 
                  realizar modificaciones. Si necesitas asistencia, por favor contacta a nuestro personal.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Información de la Orden */}
        <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Información de la Orden
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mesa:</span>
              <span className="text-sm font-semibold text-[#181411] dark:text-white">#04</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de envío:</span>
              <span className="text-sm font-semibold text-[#181411] dark:text-white">{timestamp.date}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Hora de envío:</span>
              <span className="text-sm font-semibold text-[#181411] dark:text-white">{timestamp.time}</span>
            </div>
            {isGroupOrder && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tipo:</span>
                <span className="text-sm font-semibold text-primary">Orden Grupal</span>
              </div>
            )}
          </div>
        </div>

        {/* Resumen de Items */}
        <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">restaurant_menu</span>
            Items de la Orden
          </h3>
          
          {orderItems.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No hay items en la orden
            </p>
          ) : (
            <div className="space-y-3">
              {orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-start pb-3 border-b border-gray-100 dark:border-gray-800 last:border-0 last:pb-0">
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
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-base font-bold text-[#181411] dark:text-white">Total:</span>
                <span className="text-xl font-bold text-primary">${orderTotal.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Historial de Estados */}
        {statusHistory.length > 0 && (
          <div className="mb-6 bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">history</span>
              Historial de Estados
            </h3>
            
            <div className="space-y-4">
              {statusHistory.map((statusItem, index) => {
                const statusInfo = getStatusInfo(statusItem.status);
                const itemTimestamp = formatTimestamp(statusItem.timestamp);
                const isLast = index === statusHistory.length - 1;
                
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full ${statusInfo.color} flex items-center justify-center shrink-0 ${isLast ? 'ring-2 ring-primary' : ''}`}>
                        <span className="material-symbols-outlined text-sm">{statusInfo.icon}</span>
                      </div>
                      {!isLast && (
                        <div className="w-0.5 h-8 bg-gray-200 dark:bg-gray-700 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`text-sm font-semibold ${statusInfo.color.split(' ')[2]}`}>
                        {statusItem.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {itemTimestamp.full}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        {orderStatusData.status === 'orden_enviada' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/menu')}
              className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-primary/30"
            >
              <span className="material-symbols-outlined">edit</span>
              Cambiar mi orden
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailScreen;
