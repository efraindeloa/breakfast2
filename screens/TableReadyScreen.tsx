import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface TableReadyData {
  zone: string;
  tableNumber?: string;
  timeRemaining: number; // en segundos
  estimatedWaitTime?: number;
}

const TableReadyScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  // Obtener datos de la ubicación o localStorage
  const [tableData, setTableData] = useState<TableReadyData>(() => {
    // Intentar obtener de location.state primero
    if (location.state && typeof location.state === 'object' && 'zone' in location.state) {
      return location.state as TableReadyData;
    }
    
    // Fallback: obtener de localStorage
    const savedData = localStorage.getItem('tableReadyData');
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch {
        // Si hay error, usar valores por defecto
      }
    }
    
    // Valores por defecto
    return {
      zone: 'Interior',
      timeRemaining: 300, // 5 minutos por defecto
    };
  });

  const [timeRemaining, setTimeRemaining] = useState(tableData.timeRemaining || 300);

  // Contador regresivo
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          // Cuando el tiempo expire, redirigir o mostrar mensaje
          alert(t('tableReady.timeExpired'));
          navigate('/waitlist');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate, t]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: secs.toString().padStart(2, '0')
    };
  };

  const handleImHere = () => {
    // Confirmar asistencia
    alert(t('tableReady.confirmedAttendance'));
    
    // Limpiar datos de mesa lista
    localStorage.removeItem('tableReadyData');
    
    // Navegar al menú o home
    navigate('/menu');
  };

  const handleNeedMoreTime = () => {
    // Solicitar 5 minutos más
    const newTime = timeRemaining + 300; // Agregar 5 minutos (300 segundos)
    setTimeRemaining(newTime);
    
    // Actualizar en localStorage
    const updatedData = { ...tableData, timeRemaining: newTime };
    localStorage.setItem('tableReadyData', JSON.stringify(updatedData));
    setTableData(updatedData);
    
    alert(t('tableReady.timeExtended'));
  };

  const time = formatTime(timeRemaining);

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      {/* Top App Bar */}
      <div className="flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50 p-4 pb-2 justify-between">
        <button
          onClick={() => navigate('/waitlist')}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          {t('tableReady.title')}
        </h2>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 pb-24 breakfast-gradient">
        {/* Illustration Section */}
        <div className="w-full max-w-sm mt-4 mb-8">
          <div className="aspect-[4/3] relative rounded-xl overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-yellow-400/20 rounded-xl"></div>
            <div className="relative z-10 text-center">
              {/* Custom SVG Illustration for Breakfast Vibes */}
              <div className="text-primary text-8xl mb-2 drop-shadow-sm">
                <span className="material-symbols-outlined !text-7xl">wb_sunny</span>
              </div>
              <div className="flex justify-center gap-4 text-primary/80">
                <span className="material-symbols-outlined">coffee</span>
                <span className="material-symbols-outlined">bakery_dining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Headline & Body */}
        <div className="text-center mb-8">
          <h1 className="text-[#181411] dark:text-white tracking-tight text-[32px] font-extrabold leading-tight pb-3">
            {t('tableReady.headline')}
          </h1>
          <p className="text-[#181411]/70 dark:text-white/70 text-base font-medium leading-normal px-4">
            {t('tableReady.message')}
          </p>
          {tableData.zone && (
            <p className="text-primary text-sm font-semibold mt-2">
              {t('tableReady.zone')}: {tableData.zone}
            </p>
          )}
        </div>

        {/* Timer Component */}
        <div className="w-full max-w-xs bg-white dark:bg-white/5 rounded-3xl p-6 shadow-xl shadow-primary/5 border border-primary/10 mb-10">
          <div className="text-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              {t('tableReady.remainingTime')}
            </span>
          </div>
          <div className="flex gap-4 justify-center items-center">
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/30">
                <p className="text-2xl font-black leading-none">{time.minutes}</p>
              </div>
              <p className="text-[#181411] dark:text-white/60 text-[10px] font-bold uppercase tracking-tighter">
                {t('tableReady.minutes')}
              </p>
            </div>
            <div className="text-primary font-black text-2xl pb-6">:</div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 dark:bg-white/10 border-2 border-primary/20">
                <p className="text-[#181411] dark:text-white text-2xl font-black leading-none">{time.seconds}</p>
              </div>
              <p className="text-[#181411] dark:text-white/60 text-[10px] font-bold uppercase tracking-tighter">
                {t('tableReady.seconds')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-4">
          <button
            onClick={handleImHere}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-5 px-6 rounded-full text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
          >
            {t('tableReady.imHere')}
          </button>
          <button
            onClick={handleNeedMoreTime}
            className="w-full bg-white dark:bg-transparent border-2 border-primary/20 dark:border-white/20 text-[#181411] dark:text-white font-bold py-5 px-6 rounded-full text-lg transition-all active:bg-gray-50"
          >
            {t('tableReady.needMoreTime')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default TableReadyScreen;
