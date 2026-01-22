import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';

export type LoyaltyLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface LoyaltyBenefit {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export interface LoyaltyEarning {
  id: string;
  icon: string;
  title: string;
  description: string;
  points: number | string; // number for points, string like "x2" for multipliers
  type: 'points' | 'multiplier';
  completed?: boolean;
}

export interface LoyaltyData {
  totalPoints: number;
  currentLevel: LoyaltyLevel;
  pointsHistory: Array<{
    id: string;
    date: string;
    points: number;
    description: string;
  }>;
}

const LOYALTY_STORAGE_KEY = 'loyalty_data';

// Niveles y puntos requeridos
const LEVEL_THRESHOLDS: Record<LoyaltyLevel, { points: number; nextLevel?: LoyaltyLevel }> = {
  bronze: { points: 0, nextLevel: 'silver' },
  silver: { points: 500, nextLevel: 'gold' },
  gold: { points: 1500, nextLevel: 'platinum' },
  platinum: { points: 3000 }
};

interface LoyaltyContextType {
  loyaltyData: LoyaltyData;
  currentLevel: LoyaltyLevel;
  totalPoints: number;
  pointsToNextLevel: number;
  progressToNextLevel: number;
  nextLevel: LoyaltyLevel | null;
  addPoints: (points: number, description: string) => void;
  completeEarning: (earningId: string) => void;
  getMonthlyGrowth: () => number;
}

const LoyaltyContext = createContext<LoyaltyContextType | undefined>(undefined);

export const LoyaltyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData>(() => {
    const saved = localStorage.getItem(LOYALTY_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Si hay error al parsear, usar valores por defecto
      }
    }
    // Valores por defecto
    return {
      totalPoints: 1250,
      currentLevel: 'silver',
      pointsHistory: []
    };
  });

  // Guardar en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem(LOYALTY_STORAGE_KEY, JSON.stringify(loyaltyData));
  }, [loyaltyData]);

  // Calcular nivel actual basado en puntos
  const currentLevel = useMemo(() => {
    const points = loyaltyData.totalPoints;
    if (points >= LEVEL_THRESHOLDS.platinum.points) return 'platinum';
    if (points >= LEVEL_THRESHOLDS.gold.points) return 'gold';
    if (points >= LEVEL_THRESHOLDS.silver.points) return 'silver';
    return 'bronze';
  }, [loyaltyData.totalPoints]);

  // Actualizar nivel si ha cambiado
  useEffect(() => {
    if (currentLevel !== loyaltyData.currentLevel) {
      setLoyaltyData(prev => ({ ...prev, currentLevel }));
    }
  }, [currentLevel, loyaltyData.currentLevel]);

  // Calcular puntos hasta el próximo nivel
  const pointsToNextLevel = useMemo(() => {
    const next = LEVEL_THRESHOLDS[currentLevel].nextLevel;
    if (!next) return 0; // Ya está en el nivel más alto
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel].points;
    const nextThreshold = LEVEL_THRESHOLDS[next].points;
    return nextThreshold - loyaltyData.totalPoints;
  }, [currentLevel, loyaltyData.totalPoints]);

  // Calcular progreso porcentual al próximo nivel
  const progressToNextLevel = useMemo(() => {
    const next = LEVEL_THRESHOLDS[currentLevel].nextLevel;
    if (!next) return 100; // Ya está en el nivel más alto
    const currentThreshold = LEVEL_THRESHOLDS[currentLevel].points;
    const nextThreshold = LEVEL_THRESHOLDS[next].points;
    const progress = ((loyaltyData.totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(100, Math.max(0, Math.round(progress)));
  }, [currentLevel, loyaltyData.totalPoints]);

  const nextLevel = LEVEL_THRESHOLDS[currentLevel].nextLevel || null;

  // Agregar puntos
  const addPoints = (points: number, description: string) => {
    setLoyaltyData(prev => ({
      ...prev,
      totalPoints: prev.totalPoints + points,
      pointsHistory: [
        ...prev.pointsHistory,
        {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          points,
          description
        }
      ]
    }));
  };

  // Completar una acción de ganancia de puntos
  const completeEarning = (earningId: string) => {
    // Esta función se puede usar para marcar acciones como completadas
    // Por ahora solo agregamos puntos si corresponde
    // Se puede extender para evitar duplicados
  };

  // Calcular crecimiento mensual
  const getMonthlyGrowth = (): number => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const thisMonthPoints = loyaltyData.pointsHistory
      .filter(entry => new Date(entry.date) >= firstDayOfMonth)
      .reduce((sum, entry) => sum + entry.points, 0);

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const lastMonthPoints = loyaltyData.pointsHistory
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= lastMonth && entryDate <= lastMonthEnd;
      })
      .reduce((sum, entry) => sum + entry.points, 0);

    if (lastMonthPoints === 0) return thisMonthPoints > 0 ? 100 : 0;
    return Math.round(((thisMonthPoints - lastMonthPoints) / lastMonthPoints) * 100);
  };

  return (
    <LoyaltyContext.Provider value={{
      loyaltyData,
      currentLevel,
      totalPoints: loyaltyData.totalPoints,
      pointsToNextLevel,
      progressToNextLevel,
      nextLevel,
      addPoints,
      completeEarning,
      getMonthlyGrowth
    }}>
      {children}
    </LoyaltyContext.Provider>
  );
};

export const useLoyalty = () => {
  const context = useContext(LoyaltyContext);
  if (!context) {
    throw new Error('useLoyalty must be used within a LoyaltyProvider');
  }
  return context;
};
