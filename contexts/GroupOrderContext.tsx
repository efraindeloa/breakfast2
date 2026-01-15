import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface GroupOrderParticipant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isFavorite?: boolean;
  orderItems: Array<{
    id: number;
    name: string;
    notes: string;
    price: number;
    quantity: number;
  }>;
  specialInstructions: string;
  status: 'pending' | 'joined' | 'ordered';
  isReady: boolean; // Indica si el participante terminó de seleccionar sus alimentos
}

interface GroupOrderContextType {
  isGroupOrder: boolean;
  isConfirmed: boolean; // Indica si la orden grupal ya fue confirmada
  participants: GroupOrderParticipant[];
  currentUserParticipant: GroupOrderParticipant | null;
  setIsGroupOrder: (value: boolean) => void;
  addParticipant: (participant: Omit<GroupOrderParticipant, 'orderItems' | 'specialInstructions' | 'status' | 'isReady'>) => void;
  removeParticipant: (participantId: string) => void;
  updateParticipantOrder: (participantId: string, orderItems: GroupOrderParticipant['orderItems']) => void;
  updateParticipantInstructions: (participantId: string, instructions: string) => void;
  setParticipantStatus: (participantId: string, status: GroupOrderParticipant['status']) => void;
  setParticipantReady: (participantId: string, isReady: boolean) => void;
  setCurrentUserParticipant: (participant: GroupOrderParticipant | null) => void;
  confirmGroupOrder: () => void;
  clearGroupOrder: () => void;
  canConfirmOrder: () => boolean; // Verifica si todos están listos
}

const GroupOrderContext = createContext<GroupOrderContextType | undefined>(undefined);

export const GroupOrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isGroupOrder, setIsGroupOrder] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [participants, setParticipants] = useState<GroupOrderParticipant[]>([]);
  const [currentUserParticipant, setCurrentUserParticipant] = useState<GroupOrderParticipant | null>(null);

  const addParticipant = (participantData: Omit<GroupOrderParticipant, 'orderItems' | 'specialInstructions' | 'status' | 'isReady'>) => {
    const newParticipant: GroupOrderParticipant = {
      ...participantData,
      orderItems: [],
      specialInstructions: '',
      status: 'pending',
      isReady: false,
    };
    setParticipants(prev => [...prev, newParticipant]);
  };

  const removeParticipant = (participantId: string) => {
    setParticipants(prev => prev.filter(p => p.id !== participantId));
    if (currentUserParticipant?.id === participantId) {
      setCurrentUserParticipant(null);
    }
  };

  const updateParticipantOrder = (participantId: string, orderItems: GroupOrderParticipant['orderItems']) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, orderItems } : p
      )
    );
    if (currentUserParticipant?.id === participantId) {
      setCurrentUserParticipant(prev => prev ? { ...prev, orderItems } : null);
    }
  };

  const updateParticipantInstructions = (participantId: string, instructions: string) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, specialInstructions: instructions } : p
      )
    );
    if (currentUserParticipant?.id === participantId) {
      setCurrentUserParticipant(prev => prev ? { ...prev, specialInstructions: instructions } : null);
    }
  };

  const setParticipantStatus = (participantId: string, status: GroupOrderParticipant['status']) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, status } : p
      )
    );
    if (currentUserParticipant?.id === participantId) {
      setCurrentUserParticipant(prev => prev ? { ...prev, status } : null);
    }
  };

  const setParticipantReady = (participantId: string, isReady: boolean) => {
    setParticipants(prev =>
      prev.map(p =>
        p.id === participantId ? { ...p, isReady } : p
      )
    );
    if (currentUserParticipant?.id === participantId) {
      setCurrentUserParticipant(prev => prev ? { ...prev, isReady } : null);
    }
  };

  const canConfirmOrder = () => {
    if (!isGroupOrder || !currentUserParticipant) return true; // Si no es orden grupal, siempre puede confirmar
    if (isConfirmed) return false; // Si ya está confirmada, no se puede confirmar de nuevo
    
    const allParticipants = [currentUserParticipant, ...participants];
    // Todos deben estar listos y tener al menos un item en su orden
    return allParticipants.every(p => p.isReady && p.orderItems.length > 0);
  };

  const confirmGroupOrder = () => {
    if (canConfirmOrder()) {
      setIsConfirmed(true);
      // Cambiar el estado de todos los participantes a 'ordered'
      setParticipants(prev =>
        prev.map(p => ({ ...p, status: 'ordered' as const }))
      );
      if (currentUserParticipant) {
        setCurrentUserParticipant(prev => prev ? { ...prev, status: 'ordered' } : null);
      }
    }
  };

  const clearGroupOrder = () => {
    setIsGroupOrder(false);
    setIsConfirmed(false);
    setParticipants([]);
    setCurrentUserParticipant(null);
  };

  return (
    <GroupOrderContext.Provider
      value={{
        isGroupOrder,
        isConfirmed,
        participants,
        currentUserParticipant,
        setIsGroupOrder,
        addParticipant,
        removeParticipant,
        updateParticipantOrder,
        updateParticipantInstructions,
        setParticipantStatus,
        setParticipantReady,
        setCurrentUserParticipant,
        confirmGroupOrder,
        clearGroupOrder,
        canConfirmOrder,
      }}
    >
      {children}
    </GroupOrderContext.Provider>
  );
};

export const useGroupOrder = () => {
  const context = useContext(GroupOrderContext);
  if (!context) {
    throw new Error('useGroupOrder must be used within GroupOrderProvider');
  }
  return context;
};
