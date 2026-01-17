import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupOrder } from '../contexts/GroupOrderContext';

const OrderConfirmedScreen: React.FC = () => {
  const navigate = useNavigate();
  const { participants, currentUserParticipant, isGroupOrder } = useGroupOrder();

  const allParticipants = useMemo(() => {
    const all = currentUserParticipant ? [currentUserParticipant, ...participants] : [];
    return all;
  }, [participants, currentUserParticipant]);

  const calculateParticipantTotal = (items: Array<{ id: number; name: string; notes: string; price: number; quantity: number }>) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const groupTotal = useMemo(() => {
    return allParticipants.reduce((sum, p) => sum + calculateParticipantTotal(p.orderItems), 0);
  }, [allParticipants]);

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate('/orders')} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">Orden Confirmada</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Mensaje de éxito */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-[#181411] dark:text-white mb-2">
            ¡Orden Enviada!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            Tu orden ha sido enviada a la cocina y está siendo preparada
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Disfruta tu comida. El pago se realizará cuando termines.
          </p>
        </div>

        {/* Resumen de la orden */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">receipt_long</span>
            Resumen de la Orden
          </h3>
          
          {isGroupOrder && (
            <div className="mb-4 pb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Total de la orden grupal:</span>
                <span className="text-xl font-bold text-primary">${groupTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {allParticipants.length} {allParticipants.length === 1 ? 'persona' : 'personas'}
              </p>
            </div>
          )}

          <div className="space-y-3">
            {allParticipants.map((participant) => {
              const participantTotal = calculateParticipantTotal(participant.orderItems);
              const isCurrentUser = participant.id === 'current-user';

              return (
                <div key={participant.id} className="bg-gray-50 dark:bg-gray-800/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-[#181411] dark:text-white text-sm">
                      {participant.name}
                    </p>
                    {isCurrentUser && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        Tú
                      </span>
                    )}
                  </div>
                  {participant.orderItems.length > 0 ? (
                    <div className="space-y-1 mb-2">
                      {participant.orderItems.map((item) => (
                        <div key={item.id} className="flex items-start justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-[#181411] dark:text-white font-medium ml-2">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic mb-2">
                      Sin artículos
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Subtotal:</span>
                    <span className="text-sm font-bold text-[#181411] dark:text-white">
                      ${participantTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Información importante */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0">info</span>
            <div>
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
                ¿Listo para pagar?
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Cuando termines de comer, podrás proceder al pago desde esta misma orden o desde la sección de pagos.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/order-detail')}
            className="w-full py-3 px-4 rounded-xl bg-primary text-white font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <span className="material-symbols-outlined">receipt_long</span>
            Ver mi orden
          </button>
          
          <button
            onClick={() => navigate('/menu')}
            className="w-full py-3 px-4 rounded-xl bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 text-[#181411] dark:text-white font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">restaurant_menu</span>
            Ver menú
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmedScreen;
