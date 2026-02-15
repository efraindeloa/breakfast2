import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';
import { playClickSound } from '../utils/sound';
import { getCurrentUserRestaurantId } from '../services/database';
import { getAssistanceRequestsByRestaurant, subscribeToAssistanceRequests } from '../services/api';

const DEFAULT_TABLE_COUNT = 20;
type TableStatus = 'free' | 'occupied' | 'out_of_service';

interface TableItem {
  number: number;
  status: TableStatus;
}

const WaiterHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectTableModalOpen, setSelectTableModalOpen] = useState(false);
  const [selectedTableNumber, setSelectedTableNumber] = useState<number | null>(null);
  const [pendingAssistanceCount, setPendingAssistanceCount] = useState(0);

  const loadPendingCount = useCallback(async () => {
    const restId = await getCurrentUserRestaurantId();
    if (!restId) return;
    const result = await getAssistanceRequestsByRestaurant(restId, { status: 'pending', limit: 99 });
    if (result.success && result.data) setPendingAssistanceCount(result.data.length);
  }, []);

  useEffect(() => {
    loadPendingCount();
  }, [loadPendingCount]);

  useEffect(() => {
    let restId: string | null = null;
    const init = async () => {
      restId = await getCurrentUserRestaurantId();
      if (!restId) return;
      return subscribeToAssistanceRequests(restId, () => {
        setPendingAssistanceCount((c) => c + 1);
      });
    };
    let unsubscribe: (() => void) | void;
    init().then((unsub) => {
      unsubscribe = unsub;
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Estado de mesas: por defecto todas libres; algunas en ocupada/fuera de servicio para demo
  const [tables, setTables] = useState<TableItem[]>(() =>
    Array.from({ length: DEFAULT_TABLE_COUNT }, (_, i) => ({
      number: i + 1,
      status: ((): TableStatus => {
        const n = i + 1;
        if (n === 2 || n === 5 || n === 9) return 'occupied';
        if (n === 7) return 'out_of_service';
        return 'free';
      })(),
    }))
  );

  const handleSelectTable = (tableNumber: number) => {
    setSelectedTableNumber(tableNumber);
    setSelectTableModalOpen(false);
    playClickSound();
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'free':
        return t('waiter.tableStatus.free');
      case 'occupied':
        return t('waiter.tableStatus.occupied');
      case 'out_of_service':
        return t('waiter.tableStatus.outOfService');
      default:
        return status;
    }
  };

  const getStatusClass = (status: TableStatus) => {
    switch (status) {
      case 'free':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'occupied':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
      case 'out_of_service':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const selectedTableLabel = selectedTableNumber
    ? t('waiter.home.selectedTable', { number: selectedTableNumber })
    : null;

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />

      <div className="px-4 pt-6 pb-2">
        <h3 className="text-[#111813] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em]">
          {t('waiter.home.quickActions')}
        </h3>
      </div>

      <div className="px-4 flex gap-3 w-full">
        {/* Columna izquierda */}
        <div className="flex flex-col gap-3 w-1/2">
          {/* Botón Seleccionar mesa */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              setSelectTableModalOpen(true);
            }}
            className="relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all duration-200 min-h-[140px] overflow-hidden hover:border-primary text-left group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
              <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">
                table_restaurant
              </span>
            </div>
            <h2 className="font-bold leading-tight text-base text-[#111813] dark:text-white">
              {t('waiter.home.selectTable')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {selectedTableLabel || t('waiter.home.selectTableDescription')}
            </p>
          </button>

          {/* Botón Mesas (ir a lista de mesas) */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              navigate('/waiter-tables');
            }}
            className="relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all duration-200 min-h-[140px] overflow-hidden hover:border-primary text-left group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
              <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">
                list_alt
              </span>
            </div>
            <h2 className="font-bold leading-tight text-base text-[#111813] dark:text-white">
              {t('waiter.navigation.tables')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {t('waiter.tables.subtitle')}
            </p>
          </button>
        </div>

        {/* Columna derecha */}
        <div className="flex flex-col gap-3 w-1/2">
          {/* Botón Órdenes */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              navigate('/waiter-orders');
            }}
            className="relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all duration-200 min-h-[140px] overflow-hidden hover:border-primary text-left group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
              <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">
                receipt_long
              </span>
            </div>
            <h2 className="font-bold leading-tight text-base text-[#111813] dark:text-white">
              {t('waiter.navigation.orders')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {t('waiter.orders.subtitle')}
            </p>
          </button>

          {/* Botón Solicitudes de Asistencia */}
          <button
            type="button"
            onClick={() => {
              playClickSound();
              navigate('/waiter-assistance-requests');
            }}
            className="relative flex flex-col rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm transition-all duration-200 min-h-[140px] overflow-hidden hover:border-primary text-left group"
          >
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 group-hover:bg-primary transition-colors shrink-0 mb-2">
              <span className="material-symbols-outlined text-primary group-hover:text-white transition-colors">
                support_agent
              </span>
            </div>
            <h2 className="font-bold leading-tight text-base text-[#111813] dark:text-white">
              {t('waiter.home.assistanceRequests')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
              {t('waiter.home.assistanceRequestsDescription')}
            </p>
            {pendingAssistanceCount > 0 && (
              <span className="absolute top-3 right-3 flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary px-2 text-xs font-bold text-white">
                {pendingAssistanceCount > 99 ? '99+' : pendingAssistanceCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Modal Seleccionar mesa */}
      {selectTableModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div
            className="w-full max-w-[480px] max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#32281d] shadow-xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-[#181411] dark:text-white">
                {t('waiter.modal.selectTableTitle')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  playClickSound();
                  setSelectTableModalOpen(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#181411] dark:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tables.map((table) => (
                  <button
                    key={table.number}
                    type="button"
                    onClick={() => handleSelectTable(table.number)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-colors ${
                      selectedTableNumber === table.number
                        ? 'border-primary bg-primary/10 dark:bg-primary/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary/50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl text-primary mb-1">
                      table_restaurant
                    </span>
                    <span className="font-bold text-[#181411] dark:text-white">
                      {t('waiter.tables.tableLabel', { number: table.number })}
                    </span>
                    <span
                      className={`mt-1 text-xs px-2 py-0.5 rounded-full ${getStatusClass(table.status)}`}
                    >
                      {getStatusLabel(table.status)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterHomeScreen;
