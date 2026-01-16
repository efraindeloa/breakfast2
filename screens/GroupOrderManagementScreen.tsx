import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupOrder } from '../contexts/GroupOrderContext';

const GroupOrderManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { participants, currentUserParticipant, removeParticipant, isConfirmed, setParticipantReady, canConfirmOrder, confirmGroupOrder } = useGroupOrder();

  const allParticipants = useMemo(() => {
    const all = currentUserParticipant ? [currentUserParticipant, ...participants] : participants;
    return all;
  }, [participants, currentUserParticipant]);

  const calculateParticipantTotal = (items: typeof currentUserParticipant.orderItems) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateGroupTotal = useMemo(() => {
    return allParticipants.reduce((sum, p) => sum + calculateParticipantTotal(p.orderItems), 0);
  }, [allParticipants]);

  const getPendingCount = () => {
    const pendingParticipants = participants.filter(p => !p.isReady).length;
    const pendingCurrentUser = currentUserParticipant && !currentUserParticipant.isReady ? 1 : 0;
    return pendingParticipants + pendingCurrentUser;
  };

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">Orden Grupal</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Resumen Total */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Total de la Orden Grupal</p>
              <p className="text-2xl font-bold text-[#181411] dark:text-white mt-1">
                ${calculateGroupTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/20">
              <span className="material-symbols-outlined text-primary text-2xl">groups</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {allParticipants.length} {allParticipants.length === 1 ? 'persona' : 'personas'} en la orden
          </p>
        </div>

        {/* Lista de Participantes */}
        <div className="space-y-4">
          {allParticipants.map((participant) => {
            const participantTotal = calculateParticipantTotal(participant.orderItems);
            const isCurrentUser = participant.id === 'current-user';

            return (
              <div
                key={participant.id}
                className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4"
              >
                {/* Header del Participante */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                      {participant.avatar ? (
                        <img src={participant.avatar} alt={participant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary">person</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#181411] dark:text-white">{participant.name}</p>
                        {participant.isFavorite && (
                          <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                        )}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            Tú
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{participant.email}</p>
                    </div>
                  </div>
                  {!isCurrentUser && (
                    <button
                      onClick={() => removeParticipant(participant.id)}
                      className="p-2 text-red-500 hover:text-red-600 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  )}
                </div>

                {/* Items del Participante */}
                {participant.orderItems.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {participant.orderItems.map((item) => (
                      <div key={item.id} className="flex items-start justify-between text-sm">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600 dark:text-gray-400">{item.quantity}x</span>
                            <span className="text-[#181411] dark:text-white font-medium">{item.name}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 italic ml-6 mt-0.5">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-[#181411] dark:text-white font-semibold ml-4">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-3 py-2 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      Sin artículos en la orden
                    </p>
                  </div>
                )}

                {/* Instrucciones Especiales */}
                {participant.specialInstructions && (
                  <div className="mb-3 pt-3 border-t border-gray-100 dark:border-white/10">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Instrucciones especiales:</p>
                    <p className="text-sm text-[#181411] dark:text-white italic">
                      {participant.specialInstructions}
                    </p>
                  </div>
                )}

                {/* Total del Participante */}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#181411] dark:text-white">Subtotal:</span>
                  <span className="text-lg font-bold text-primary">${participantTotal.toFixed(2)}</span>
                </div>

                {/* Estado y Listo */}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {participant.isReady ? (
                      <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        Listo
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
                        Seleccionando
                      </span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    participant.status === 'joined'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : participant.status === 'ordered'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {participant.status === 'joined' ? 'Unido' : participant.status === 'ordered' ? 'Ordenó' : 'Pendiente'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones de acción */}
        <div className="mt-6 space-y-3">
          {!isConfirmed && (
            <button
              onClick={() => navigate('/invite-users')}
              className="w-full py-3 px-4 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2 transition-colors border-2 border-dashed border-primary/30"
            >
              <span className="material-symbols-outlined">person_add</span>
              Invitar más personas
            </button>
          )}
          
          {canConfirmOrder() && !isConfirmed && (
            <button
              onClick={() => {
                confirmGroupOrder();
                navigate('/order-confirmed');
              }}
              className="w-full py-4 px-6 rounded-xl bg-primary text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">restaurant</span>
              Confirmar y Enviar Orden
            </button>
          )}
          
          {!canConfirmOrder() && !isConfirmed && (
            <div className="w-full py-4 px-6 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold text-lg flex items-center justify-center gap-2 cursor-not-allowed">
              <span className="material-symbols-outlined">lock</span>
              <span>
                Esperando a que todos terminen ({getPendingCount()} pendiente{getPendingCount() !== 1 ? 's' : ''})
              </span>
            </div>
          )}
          
          {isConfirmed && (
            <div className="w-full py-4 px-6 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-semibold text-lg flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">check_circle</span>
              <span>Orden confirmada</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupOrderManagementScreen;
