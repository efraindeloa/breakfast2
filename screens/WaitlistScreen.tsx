import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const WAITLIST_STORAGE_KEY = 'restaurant_waitlist';

interface WaitlistEntry {
  id: string;
  zone: string;
  timestamp: string;
  position: number;
  confirmed: boolean;
  estimatedWaitMinutes: number;
  numberOfPeople: number;
  userEntryGroupId?: string; // ID común para agrupar entradas del mismo usuario en múltiples zonas
}

const ZONES = [
  { id: 'interior', labelKey: 'waitlist.interior', maxCapacity: 8 },
  { id: 'terrace', labelKey: 'waitlist.terrace', maxCapacity: 6 },
  { id: 'garden', labelKey: 'waitlist.garden', maxCapacity: 4 },
  { id: 'patio', labelKey: 'waitlist.patio', maxCapacity: 6 },
  { id: 'rooftop', labelKey: 'waitlist.rooftop', maxCapacity: 4 },
];

// Zonas deshabilitadas por el restaurante (simulado)
// En producción, esto vendría de una API o configuración del restaurante
const DISABLED_ZONES = ['terrace', 'garden']; // Deshabilitar terraza y jardín como ejemplo

const WaitlistScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [scannedTimestamp, setScannedTimestamp] = useState<string>('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [userEntryGroupId, setUserEntryGroupId] = useState<string | null>(null);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [showChangeZoneModal, setShowChangeZoneModal] = useState(false);
  const [newZonesSelected, setNewZonesSelected] = useState<string[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNewDesign, setShowNewDesign] = useState(false);

  // Función para formatear hora en formato de 12 horas
  const formatTime12Hour = (date: Date): string => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Cargar lista de espera existente al iniciar
  useEffect(() => {
    loadWaitlist();
    
    // Si el usuario ya está confirmado, cargar sus zonas seleccionadas
    const saved = localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (saved) {
      try {
        const entries: WaitlistEntry[] = JSON.parse(saved);
        // Buscar si hay una entrada del usuario confirmada
        const userGroupId = entries.find(e => e.confirmed && e.userEntryGroupId)?.userEntryGroupId;
        if (userGroupId) {
          const userZones = entries
            .filter(e => e.userEntryGroupId === userGroupId && e.confirmed)
            .map(e => e.zone);
          if (userZones.length > 0) {
            setUserEntryGroupId(userGroupId);
            setSelectedZones(userZones);
            setIsConfirmed(true);
            setScannedTimestamp(entries.find(e => e.userEntryGroupId === userGroupId)?.timestamp || '');
          }
        }
      } catch (error) {
        console.error('Error loading user waitlist state:', error);
      }
    }
  }, []);

  // Cargar lista de espera desde localStorage
  const loadWaitlist = () => {
    try {
      const saved = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (saved) {
        const entries: WaitlistEntry[] = JSON.parse(saved);
        // Simular avance de la lista (eliminar algunas entradas aleatoriamente)
        const updatedEntries = entries
          .filter(entry => {
            // Simular que algunas mesas ya fueron atendidas (probabilidad del 5% cada actualización)
            return Math.random() > 0.05;
          })
          .map((entry, index) => ({
            ...entry,
            position: index + 1,
            estimatedWaitMinutes: Math.max(5, (index + 1) * 5 - Math.floor(Math.random() * 10)),
          }));
        setWaitlist(updatedEntries);
        localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updatedEntries));
      }
    } catch (error) {
      console.error('Error loading waitlist:', error);
    }
  };

  // Actualizar lista en tiempo real cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      loadWaitlist();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Mostrar nuevo diseño después de 10 segundos de confirmación
  useEffect(() => {
    if (isConfirmed) {
      const timer = setTimeout(() => {
        setShowNewDesign(true);
      }, 10000); // 10 segundos

      return () => clearTimeout(timer);
    } else {
      setShowNewDesign(false);
    }
  }, [isConfirmed]);

  // Calcular estadísticas por zona
  const zoneStats = useMemo(() => {
    const stats: { [key: string]: { count: number; positions: number[] } } = {};
    ZONES.forEach(zone => {
      const zoneEntries = waitlist.filter(entry => entry.zone === zone.id && entry.confirmed);
      stats[zone.id] = {
        count: zoneEntries.length,
        positions: zoneEntries.map(e => e.position).sort((a, b) => a - b),
      };
    });
    return stats;
  }, [waitlist]);

  // Obtener todas las entradas del usuario
  const userEntries = useMemo(() => {
    if (!isConfirmed || !userEntryGroupId) return [];
    return waitlist.filter(entry => entry.userEntryGroupId === userEntryGroupId && entry.confirmed);
  }, [waitlist, isConfirmed, userEntryGroupId]);

  // Detectar cuando la mesa está lista (posición 0 o 1)
  useEffect(() => {
    if (isConfirmed && userEntries.length > 0) {
      // Verificar si alguna entrada del usuario tiene posición 0 o 1 (mesa lista)
      const tableReady = userEntries.some(entry => entry.position <= 1);
      
      if (tableReady) {
        // Obtener la zona de la entrada con posición más baja
        const readyEntry = userEntries.find(entry => entry.position <= 1) || userEntries[0];
        const zoneLabel = ZONES.find(z => z.id === readyEntry.zone)?.labelKey 
          ? t(ZONES.find(z => z.id === readyEntry.zone)!.labelKey)
          : readyEntry.zone;
        
        // Guardar datos de mesa lista
        const tableReadyData = {
          zone: zoneLabel,
          timeRemaining: 300, // 5 minutos por defecto
          numberOfPeople: readyEntry.numberOfPeople
        };
        localStorage.setItem('tableReadyData', JSON.stringify(tableReadyData));
        
        // Navegar a la pantalla de mesa lista
        navigate('/table-ready', { state: tableReadyData });
      }
    }
  }, [userEntries, isConfirmed, navigate, t]);

  // Calcular posiciones del usuario por zona
  const userPositionsByZone = useMemo(() => {
    const positions: { [zone: string]: { position: number; totalInZone: number; estimatedWait: number } } = {};
    userEntries.forEach(entry => {
      const zoneEntries = waitlist.filter(e => e.zone === entry.zone && e.confirmed);
      const position = zoneEntries.filter(e => e.position < entry.position).length + 1;
      positions[entry.zone] = {
        position,
        totalInZone: zoneEntries.length,
        estimatedWait: entry.estimatedWaitMinutes,
      };
    });
    return positions;
  }, [userEntries, waitlist]);

  // Calcular total en las zonas seleccionadas (para mostrar antes de confirmar)
  const totalInSelectedZones = useMemo(() => {
    if (selectedZones.length === 0) return {};
    const totals: { [zone: string]: number } = {};
    selectedZones.forEach(zone => {
      totals[zone] = waitlist.filter(entry => entry.zone === zone && entry.confirmed).length;
    });
    return totals;
  }, [selectedZones, waitlist]);

  const handleConfirm = () => {
    if (selectedZones.length === 0 || numberOfPeople < 1) return;

    // Generar timestamp al confirmar
    const now = new Date();
    const timestamp = formatTime12Hour(now);
    setScannedTimestamp(timestamp);

    // Generar un ID común para agrupar todas las entradas del usuario
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Crear una entrada por cada zona seleccionada
    const newEntries: WaitlistEntry[] = selectedZones.map(zone => {
      const totalInZone = waitlist.filter(entry => entry.zone === zone && entry.confirmed).length;
      return {
        id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zone: zone,
        timestamp: timestamp,
        position: totalInZone + 1,
        confirmed: true,
        estimatedWaitMinutes: Math.max(5, (totalInZone + 1) * 5),
        numberOfPeople: numberOfPeople,
        userEntryGroupId: groupId,
      };
    });

    const updatedWaitlist = [...waitlist, ...newEntries];
    setWaitlist(updatedWaitlist);
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updatedWaitlist));
    setUserEntryGroupId(groupId);
    setIsConfirmed(true);
  };

  const handleChangeZoneClick = () => {
    setShowChangeZoneModal(true);
    setNewZonesSelected([...selectedZones]);
  };

  const handleConfirmZoneChange = () => {
    if (newZonesSelected.length === 0 || !userEntryGroupId) {
      setShowChangeZoneModal(false);
      return;
    }

    // Actualizar timestamp al cambiar de zona
    const now = new Date();
    const newTimestamp = formatTime12Hour(now);
    setScannedTimestamp(newTimestamp);

    // Eliminar todas las entradas actuales del usuario
    let updatedWaitlist = waitlist.filter(entry => entry.userEntryGroupId !== userEntryGroupId);
    
    // Recalcular posiciones en todas las zonas antiguas
    selectedZones.forEach(zone => {
      const oldZoneEntries = updatedWaitlist
        .filter(entry => entry.zone === zone && entry.confirmed)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      updatedWaitlist = updatedWaitlist.map(entry => {
        if (entry.zone === zone && entry.confirmed) {
          const index = oldZoneEntries.findIndex(e => e.id === entry.id);
          if (index !== -1) {
            return {
              ...entry,
              position: index + 1,
              estimatedWaitMinutes: Math.max(5, (index + 1) * 5),
            };
          }
        }
        return entry;
      });
    });
    
    // Obtener número de personas de una entrada actual
    const currentEntry = userEntries[0];
    const peopleCount = currentEntry?.numberOfPeople || numberOfPeople;

    // Crear nuevas entradas para cada zona seleccionada
    const newEntries: WaitlistEntry[] = newZonesSelected.map(zone => {
      const newZoneTotal = updatedWaitlist.filter(entry => entry.zone === zone && entry.confirmed).length;
      return {
        id: `waitlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        zone: zone,
        timestamp: newTimestamp,
        position: newZoneTotal + 1,
        confirmed: true,
        estimatedWaitMinutes: Math.max(5, (newZoneTotal + 1) * 5),
        numberOfPeople: peopleCount,
        userEntryGroupId: userEntryGroupId, // Mantener el mismo group ID
      };
    });

    const finalWaitlist = [...updatedWaitlist, ...newEntries];
    setWaitlist(finalWaitlist);
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(finalWaitlist));
    setSelectedZones(newZonesSelected);
    setShowChangeZoneModal(false);
    setNewZonesSelected([]);
  };

  const handleCancelRequest = () => {
    if (!userEntryGroupId) return;

    // Eliminar todas las entradas del usuario de la lista de espera
    let updatedWaitlist = waitlist.filter(entry => entry.userEntryGroupId !== userEntryGroupId);
    
    // Recalcular posiciones en todas las zonas afectadas
    selectedZones.forEach(zone => {
      const zoneEntries = updatedWaitlist
        .filter(entry => entry.zone === zone && entry.confirmed)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      updatedWaitlist = updatedWaitlist.map(entry => {
        if (entry.zone === zone && entry.confirmed) {
          const index = zoneEntries.findIndex(e => e.id === entry.id);
          if (index !== -1) {
            return {
              ...entry,
              position: index + 1,
              estimatedWaitMinutes: Math.max(5, (index + 1) * 5),
            };
          }
        }
        return entry;
      });
    });

    setWaitlist(updatedWaitlist);
    localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(updatedWaitlist));
    
    // Resetear estado
    setIsConfirmed(false);
    setUserEntryGroupId(null);
    setSelectedZones([]);
    setNumberOfPeople(1);
    setScannedTimestamp('');
    setShowCancelModal(false);
  };


  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className={`sticky top-0 z-50 ${showNewDesign ? 'bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-xl border-b border-neutral-100 dark:border-neutral-800' : 'bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md'} safe-top`}>
        <div className={`flex items-center ${showNewDesign ? 'p-4' : 'p-4 pb-2'} justify-between`}>
          {showNewDesign ? (
            <>
              <div className="flex size-10 items-center justify-start">
                <button onClick={() => navigate(-1)} className="text-[#181511] dark:text-white">
                  <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
                </button>
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-lg font-bold leading-tight tracking-tight font-display text-[#181511] dark:text-white">{t('waitlist.title')}</h2>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-success/10 rounded-full mt-1">
                  <span className="material-symbols-outlined text-[14px] text-success" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
                  <span className="text-[10px] font-bold text-success uppercase tracking-wider">{t('waitlist.qrEntry')}</span>
                </div>
              </div>
              <div className="flex w-10 items-center justify-end">
                <button className="relative">
                  <span className="material-symbols-outlined text-2xl text-[#181511] dark:text-white">notifications</span>
                  <span className="absolute top-0 right-0 size-2 bg-red-500 rounded-full border-2 border-white dark:border-neutral-900"></span>
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate(-1)}
                className="text-[#181511] dark:text-white flex size-12 shrink-0 items-center justify-start"
              >
                <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
              </button>
              <h2 className="text-[#181511] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center font-display">
                {t('waitlist.title')}
              </h2>
              <div className="flex w-12 items-center justify-end">
                <button className="flex items-center justify-center rounded-lg h-12 bg-transparent text-[#181511] dark:text-white">
                  <span className="material-symbols-outlined text-2xl">notifications</span>
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <div className="px-4 py-6">
        {!isConfirmed ? (
          <>
            {/* Selección de número de personas - PRIMERO */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4">{t('waitlist.selectNumberOfPeople')}</h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setNumberOfPeople(num);
                      // Limpiar zonas seleccionadas que no pueden acomodar este número de personas
                      setSelectedZones(prev => prev.filter(zoneId => {
                        const zone = ZONES.find(z => z.id === zoneId);
                        return zone && zone.maxCapacity >= num;
                      }));
                    }}
                    className={`py-3 px-4 rounded-xl border-2 transition-all ${
                      numberOfPeople === num
                        ? 'border-primary bg-primary/10 text-primary font-bold'
                        : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Selección de zona - SEGUNDO */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4">{t('waitlist.selectZone')}</h3>
              
              {/* Aviso sobre zonas deshabilitadas */}
              {DISABLED_ZONES.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400 text-sm mt-0.5">info</span>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      {t('waitlist.disabledZonesNotice')}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Aviso si no hay zonas disponibles para el número de personas */}
              {numberOfPeople > 0 && ZONES.filter(zone => 
                !DISABLED_ZONES.includes(zone.id) && zone.maxCapacity >= numberOfPeople
              ).length === 0 && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-sm mt-0.5">warning</span>
                    <p className="text-xs text-red-700 dark:text-red-400">
                      {t('waitlist.noZonesAvailableForCapacity').replace('{count}', numberOfPeople.toString())}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                {ZONES.map((zone) => {
                  const stats = zoneStats[zone.id] || { count: 0, positions: [] };
                  const isSelected = selectedZones.includes(zone.id);
                  const isDisabledByRestaurant = DISABLED_ZONES.includes(zone.id);
                  const isDisabledByCapacity = zone.maxCapacity < numberOfPeople;
                  const isDisabled = isDisabledByRestaurant || isDisabledByCapacity;
                  
                  return (
                    <button
                      key={zone.id}
                      onClick={() => {
                        if (isDisabled) return;
                        if (isSelected) {
                          // Deseleccionar zona
                          setSelectedZones(selectedZones.filter(z => z !== zone.id));
                        } else {
                          // Seleccionar zona
                          setSelectedZones([...selectedZones, zone.id]);
                        }
                      }}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        isDisabled
                          ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:border-primary/50'
                      }`}
                    >
                      {isDisabled && (
                        <div className="absolute top-2 right-2">
                          <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-sm">block</span>
                        </div>
                      )}
                      {!isDisabled && isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                          </div>
                        </div>
                      )}
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`font-semibold ${isDisabled ? 'text-gray-400 dark:text-gray-500' : isSelected ? 'text-primary' : 'text-[#181411] dark:text-white'}`}>
                            {t(zone.labelKey)}
                          </p>
                        </div>
                        {isDisabledByRestaurant ? (
                          <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                            {t('waitlist.zoneDisabled')}
                          </p>
                        ) : isDisabledByCapacity ? (
                          <p className="text-xs text-orange-500 dark:text-orange-400 font-medium">
                            {t('waitlist.capacityExceeded').replace('{max}', zone.maxCapacity.toString())}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {stats.count} {stats.count === 1 ? 'mesa' : 'mesas'} en espera • {t('waitlist.maxCapacity')} {zone.maxCapacity}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Posición estimada por zona */}
            {selectedZones.length > 0 && numberOfPeople > 0 && (
              <div className="mb-6 space-y-3">
                {selectedZones.map((zone) => {
                  const totalInZone = totalInSelectedZones[zone] || 0;
                  return (
                    <div key={zone} className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                      <div className="text-center">
                        <p className="text-sm font-semibold text-primary mb-1">
                          {t(`waitlist.${zone}`)}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          {t('waitlist.yourPosition')} {totalInZone + 1} {t('waitlist.of')} {totalInZone + 1}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {totalInZone} {totalInZone === 1 ? 'mesa' : 'mesas'} en espera
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botón de confirmar */}
            <button
              onClick={handleConfirm}
              disabled={selectedZones.length === 0 || numberOfPeople < 1}
              className={`w-full py-4 px-6 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-colors ${
                selectedZones.length > 0 && numberOfPeople >= 1
                  ? 'bg-primary text-white hover:bg-primary/90 shadow-lg'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined">check_circle</span>
              {t('waitlist.confirmRequest')}
            </button>
          </>
        ) : showNewDesign ? (
          <>
            {/* Banner informativo */}
            <div className="px-4 pt-4">
              <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="bg-primary p-2 rounded-full">
                  <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                </div>
                <div>
                    <h4 className="font-bold text-sm text-[#181511] dark:text-white">{t('waitlist.tableAlmostReady')}</h4>
                  <p className="text-xs text-[#897961] dark:text-gray-400">
                    {selectedZones.length > 0 
                      ? `${t('waitlist.finishingCleaning').replace('{zone}', selectedZones.map(z => t(`waitlist.${z}`)).join(', '))}`
                      : t('waitlist.finishingCleaning').replace('{zone}', '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Header principal */}
            <header className="pt-8 px-4 text-center">
              {(() => {
                const hour = new Date().getHours();
                let greeting = t('waitlist.goodMorning');
                if (hour >= 12 && hour < 18) {
                  greeting = t('waitlist.goodAfternoon');
                } else if (hour >= 18) {
                  greeting = t('waitlist.goodEvening');
                }
                let userName = 'Usuario';
                try {
                  const savedUserData = localStorage.getItem('userData');
                  if (savedUserData) {
                    const parsed = JSON.parse(savedUserData);
                    userName = parsed.name || 'Usuario';
                  }
                } catch {
                  userName = 'Usuario';
                }
                const userEntry = userEntries[0];
                const peopleCount = userEntry?.numberOfPeople || numberOfPeople;
                const zonesList = selectedZones.map(z => t(`waitlist.${z}`)).join(', ');
                return (
                  <>
                    <p className="text-primary font-bold text-sm uppercase tracking-[0.2em] mb-2">
                      {greeting.replace('{name}', userName).split(',')[0]}
                    </p>
                    <h1 className="text-4xl font-extrabold tracking-tight font-display mb-2">
                      {t('waitlist.yourTurn')} <span className="text-primary">
                        {Object.keys(userPositionsByZone).length > 0 
                          ? `#${Math.min(...Object.values(userPositionsByZone).map(p => p.position))}`
                          : '#1'}
                      </span>
                    </h1>
                    <p className="text-[#897961] dark:text-gray-400 text-sm max-w-[240px] mx-auto mb-2">
                      {t('waitlist.confirmedViaQR')
                        .replace('{count}', peopleCount.toString())
                        .replace('{people}', peopleCount === 1 ? t('waitlist.person') : t('waitlist.people'))}
                    </p>
                    {selectedZones.length > 0 && (
                      <p className="text-[#897961] dark:text-gray-400 text-xs max-w-[280px] mx-auto">
                        {t('waitlist.waitingInZones')}: {zonesList}
                      </p>
                    )}
                  </>
                );
              })()}
            </header>

            {/* Cards de progreso por zona */}
            {Object.keys(userPositionsByZone).length > 0 && (
              <div className="px-4 mt-8 space-y-4">
                {selectedZones.map((zone) => {
                  const zoneInfo = userPositionsByZone[zone];
                  if (!zoneInfo) return null;
                  
                  const progressPercentage = zoneInfo.totalInZone > 0 
                    ? Math.round(((zoneInfo.totalInZone - zoneInfo.position + 1) / zoneInfo.totalInZone) * 100) 
                    : 0;
                  const tablesBefore = zoneInfo.position - 1;
                  
                  return (
                    <div key={zone} className="bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-neutral-800">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                          <h3 className="text-lg font-bold text-[#181511] dark:text-white">{t(`waitlist.${zone}`)}</h3>
                        </div>
                        <span className="text-primary text-xs font-bold bg-primary/10 px-2 py-1 rounded-lg">
                          {t('waitlist.position')} #{zoneInfo.position}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-end mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-[#897961] dark:text-gray-500 uppercase tracking-widest mb-1">
                            {t('waitlist.queueStatus')}
                          </span>
                          <span className="text-2xl font-black font-display">
                            {t('waitlist.progressAdvanced').replace('{percentage}', progressPercentage.toString())}
                          </span>
                        </div>
                      </div>
                      <div className="relative h-4 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-6">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                          style={{ width: `${progressPercentage}%`, boxShadow: '0 0 12px rgba(240, 167, 66, 0.4)' }}
                        ></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-background-light dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-50 dark:border-neutral-700">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-lg">group</span>
                            <span className="text-[10px] font-bold text-[#897961] uppercase tracking-tighter">
                              {t('waitlist.tablesBefore')}
                            </span>
                          </div>
                          <p className="text-2xl font-bold font-display">
                            {tablesBefore} {tablesBefore === 1 ? t('waitlist.tableAhead') : t('waitlist.tablesAhead')}
                          </p>
                        </div>
                        <div className="bg-background-light dark:bg-neutral-800 p-4 rounded-2xl border border-neutral-50 dark:border-neutral-700">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="material-symbols-outlined text-primary text-lg">timer</span>
                            <span className="text-[10px] font-bold text-[#897961] uppercase tracking-tighter">
                              {t('waitlist.estimatedWaitShort')}
                            </span>
                          </div>
                          <p className="text-2xl font-bold font-display">{zoneInfo.estimatedWait} min</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Botones de acción */}
            <div className="px-4 mt-8 space-y-4">
              <button
                onClick={() => navigate('/menu')}
                className="w-full bg-primary hover:bg-primary/90 text-white p-5 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined font-bold">menu_book</span>
                  <span className="text-lg font-extrabold font-display">{t('waitlist.viewMenuAndOrder')}</span>
                </div>
                <span className="text-[11px] font-medium opacity-90">{t('waitlist.advanceOrderSaveTime')}</span>
              </button>
              <button
                onClick={handleChangeZoneClick}
                className="w-full bg-white dark:bg-neutral-900 border border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 active:bg-orange-50 dark:active:bg-orange-950/20 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">swap_horiz</span>
                <span>{t('waitlist.changeZone')}</span>
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-red-500 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 active:bg-red-50 dark:active:bg-red-950/20 transition-colors"
              >
                <span className="material-symbols-outlined text-xl">cancel</span>
                <span>{t('waitlist.cancelWait')}</span>
              </button>
            </div>

            {/* Imagen del restaurante */}
            <div className="px-4 mt-8">
              <div className="relative h-32 w-full rounded-2xl overflow-hidden opacity-80">
                <img 
                  alt="Restaurant Interior" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuD1rvxEy6qKgaC8sMrj4qdB-O_GSaXM3T2n0Nknes0f8GZJnSznMhQmm-laYsR-GutlrZU9DJtmjdwNaYOw6FPoSSfcAFCK3yg8gGMyJusk7-zXyMnVf2y9x1-XjfWXMbqKUyd4mu79EYjV7PeJlOwY19L_EkVQEoBy8jbQcnqk5ebWLC4AHAUKxFaR6zxWjs5TX_0u-CHDUJ8-ca63KmGwQf0eGFChWU0EO-aqCv7Gcnj8xFL88Lm34G9Hz5mn57W5YIaY59D5utdS"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-white text-xs font-medium">
                    {t('waitlist.waitingAt')} <span className="font-bold">{t('waitlist.branchRomaNorte')}</span>
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Welcome Header */}
            <header className="pt-6 px-4">
              <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-4 mb-6 flex items-center gap-3 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-3xl">restaurant</span>
                <p className="text-[#181411] dark:text-white text-sm font-medium leading-tight">
                  {selectedZones.length > 0 
                    ? t('waitlist.preparingTable').replace('{zone}', selectedZones.map(z => t(`waitlist.${z}`)).join(', '))
                    : t('waitlist.preparingTable').replace('{zone}', '')}
                </p>
              </div>
              
              {(() => {
                const hour = new Date().getHours();
                let greeting = t('waitlist.goodMorning');
                if (hour >= 12 && hour < 18) {
                  greeting = t('waitlist.goodAfternoon');
                } else if (hour >= 18) {
                  greeting = t('waitlist.goodEvening');
                }
                // Intentar obtener el nombre del usuario desde localStorage o usar un nombre genérico
                let userName = 'Usuario';
                try {
                  // Intentar obtener desde userData si está guardado
                  const savedUserData = localStorage.getItem('userData');
                  if (savedUserData) {
                    const parsed = JSON.parse(savedUserData);
                    userName = parsed.name || 'Usuario';
                  }
                } catch {
                  userName = 'Usuario';
                }
                const userEntry = userEntries[0];
                const peopleCount = userEntry?.numberOfPeople || numberOfPeople;
                const zonesList = selectedZones.map(z => t(`waitlist.${z}`)).join(', ');
                return (
                  <>
                    <h2 className="text-[#181411] dark:text-white tracking-tight text-3xl font-bold leading-tight text-center pb-2">
                      {greeting.replace('{name}', userName)}
                    </h2>
                    <p className="text-[#897961] dark:text-gray-400 text-base font-normal leading-normal text-center px-6">
                      {t('waitlist.tableForPeople')
                        .replace('{count}', peopleCount.toString())
                        .replace('{people}', peopleCount === 1 ? t('waitlist.person') : t('waitlist.people'))
                        .replace('{zone}', zonesList)}
                    </p>
                  </>
                );
              })()}
            </header>

            {/* Turn Cards por zona */}
            {Object.keys(userPositionsByZone).length > 0 && (
              <div className="p-4 space-y-4">
                {selectedZones.map((zone) => {
                  const zoneInfo = userPositionsByZone[zone];
                  if (!zoneInfo) return null;
                  return (
                    <div key={zone} className="space-y-3">
                      <div className="flex flex-col items-stretch justify-start rounded-xl shadow-lg shadow-black/5 bg-white dark:bg-neutral-800 overflow-hidden border border-neutral-100 dark:border-neutral-700">
                        <div className="w-full bg-center bg-no-repeat aspect-[16/9] bg-cover relative" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuD1rvxEy6qKgaC8sMrj4qdB-O_GSaXM3T2n0Nknes0f8GZJnSznMhQmm-laYsR-GutlrZU9DJtmjdwNaYOw6FPoSSfcAFCK3yg8gGMyJusk7-zXyMnVf2y9x1-XjfWXMbqKUyd4mu79EYjV7PeJlOwY19L_EkVQEoBy8jbQcnqk5ebWLC4AHAUKxFaR6zxWjs5TX_0u-CHDUJ8-ca63KmGwQf0eGFChWU0EO-aqCv7Gcnj8xFL88Lm34G9Hz5mn57W5YIaY59D5utdS")' }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                            <div className="flex items-center gap-2">
                              <span className="text-white bg-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">{t('waitlist.inProcess')}</span>
                              <span className="text-white text-sm font-semibold">{t(`waitlist.${zone}`)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex w-full flex-col items-center justify-center gap-2 py-8 px-6">
                          <p className="text-[#897961] dark:text-gray-400 text-sm font-semibold uppercase tracking-widest">{t('waitlist.yourTurn')}</p>
                          <p className="text-primary text-6xl font-black leading-none tracking-tighter">#{zoneInfo.position}</p>
                          <p className="text-[#897961] dark:text-gray-400 text-xs">{t(`waitlist.${zone}`)}</p>
                        </div>
                      </div>
                      
                      {/* Wait Stats para esta zona */}
                      <div className="flex flex-wrap gap-4">
                        <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 border border-[#e6e1db] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
                          <div className="flex items-center gap-2 text-[#897961] dark:text-gray-400">
                            <span className="material-symbols-outlined text-xl">schedule</span>
                            <p className="text-xs font-bold uppercase tracking-wide">{t('waitlist.wait')}</p>
                          </div>
                          <p className="text-[#181411] dark:text-white tracking-tight text-2xl font-bold">
                            {zoneInfo.estimatedWait} {t('waitlist.minutes')}
                          </p>
                        </div>
                        <div className="flex min-w-[140px] flex-1 flex-col gap-2 rounded-xl p-5 border border-[#e6e1db] dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
                          <div className="flex items-center gap-2 text-[#897961] dark:text-gray-400">
                            <span className="material-symbols-outlined text-xl">group</span>
                            <p className="text-xs font-bold uppercase tracking-wide">{t('waitlist.ahead')}</p>
                          </div>
                          <p className="text-[#181411] dark:text-white tracking-tight text-2xl font-bold">
                            {zoneInfo.position - 1} {zoneInfo.position - 1 === 1 ? t('waitlist.tableAhead') : t('waitlist.tablesAhead')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Call to Action Section */}
            <div className="px-4 mt-4">
              <div className="bg-primary rounded-xl p-6 flex flex-col items-center text-center shadow-md">
                <h3 className="text-white text-xl font-bold mb-2">{t('waitlist.hungry')}</h3>
                <p className="text-white/90 text-sm mb-6">{t('waitlist.exploreMenu')}</p>
                <button 
                  onClick={() => navigate('/menu')}
                  className="w-full bg-white text-primary font-bold py-4 rounded-lg flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
                >
                  <span className="material-symbols-outlined">menu_book</span>
                  {t('waitlist.viewMenuNow')}
                </button>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="px-4 mt-6 space-y-3 pb-6">
              {/* Botón para cambiar de zona */}
              <button
                onClick={handleChangeZoneClick}
                className="w-full py-3 px-4 rounded-xl border-2 border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold flex items-center justify-center gap-2 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
              >
                <span className="material-symbols-outlined">swap_horiz</span>
                {t('waitlist.changeZone')}
              </button>

              {/* Botón para cancelar solicitud */}
              <button
                onClick={() => setShowCancelModal(true)}
                className="w-full py-3 px-4 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 font-semibold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <span className="material-symbols-outlined">cancel</span>
                {t('waitlist.cancelRequest')}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Modal de cambio de zona */}
      {showChangeZoneModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/20 rounded-full">
              <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-2">
              {t('waitlist.changeZoneWarning')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-4">
              {t('waitlist.changeZoneMessage')
                .replace('{currentZone}', selectedZones.map(z => t(`waitlist.${z}`)).join(', '))
                .replace('{newZone}', newZonesSelected.length > 0 ? newZonesSelected.map(z => t(`waitlist.${z}`)).join(', ') : '...')}
            </p>
            
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 font-semibold mb-1">
                {t('waitlist.youWillLosePosition')}
              </p>
              <p className="text-xs text-red-600 dark:text-red-500">
                {t('waitlist.currentZones')}: {selectedZones.map(z => t(`waitlist.${z}`)).join(', ')}
              </p>
            </div>

            <div className="mb-4">
              <p className="text-sm font-semibold text-[#181411] dark:text-white mb-2">
                {t('waitlist.selectZones')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {ZONES.filter(zone => !DISABLED_ZONES.includes(zone.id)).map((zone) => {
                  const isSelected = newZonesSelected.includes(zone.id);
                  const stats = zoneStats[zone.id] || { count: 0, positions: [] };
                  const userEntry = userEntries[0];
                  const peopleCount = userEntry?.numberOfPeople || numberOfPeople;
                  const isDisabledByCapacity = zone.maxCapacity < peopleCount;
                  
                  return (
                    <button
                      key={zone.id}
                      onClick={() => {
                        if (isDisabledByCapacity) return;
                        if (isSelected) {
                          setNewZonesSelected(newZonesSelected.filter(z => z !== zone.id));
                        } else {
                          setNewZonesSelected([...newZonesSelected, zone.id]);
                        }
                      }}
                      disabled={isDisabledByCapacity}
                      className={`p-3 rounded-xl border-2 transition-all text-sm relative ${
                        isDisabledByCapacity
                          ? 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white hover:border-primary/50'
                      }`}
                    >
                      {isDisabledByCapacity && (
                        <div className="absolute top-2 right-2">
                          <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-xs">block</span>
                        </div>
                      )}
                      {!isDisabledByCapacity && isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xs">check</span>
                          </div>
                        </div>
                      )}
                      <p className={`font-semibold ${isDisabledByCapacity ? 'text-gray-400 dark:text-gray-500' : ''}`}>{t(zone.labelKey)}</p>
                      {isDisabledByCapacity ? (
                        <p className="text-xs text-orange-500 dark:text-orange-400 mt-1 font-medium">
                          {t('waitlist.capacityExceeded').replace('{max}', zone.maxCapacity.toString())}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {stats.count} {stats.count === 1 ? 'mesa' : 'mesas'} • {t('waitlist.maxCapacity')} {zone.maxCapacity}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
              {DISABLED_ZONES.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs text-yellow-700 dark:text-yellow-400">
                    {DISABLED_ZONES.map(id => t(`waitlist.${id}`)).join(', ')} {t('waitlist.zoneDisabled').toLowerCase()}
                  </p>
                </div>
              )}
            </div>

            {newZonesSelected.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  {t('waitlist.willBeAddedToEnd')}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  {t('waitlist.newZones')}: {newZonesSelected.map(z => t(`waitlist.${z}`)).join(', ')}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowChangeZoneModal(false);
                  setNewZoneSelected('');
                }}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('waitlist.cancel')}
              </button>
              <button
                onClick={handleConfirmZoneChange}
                disabled={newZonesSelected.length === 0}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors ${
                  newZonesSelected.length > 0
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                }`}
              >
                {t('waitlist.confirmChange')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-2">
              {t('waitlist.cancelRequestConfirm')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-6">
              {t('waitlist.cancelRequestMessage')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCancelRequest}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors active:scale-95"
              >
                {t('waitlist.cancelRequest')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistScreen;
