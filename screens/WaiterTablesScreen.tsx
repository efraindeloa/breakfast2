import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';

const DEFAULT_TABLE_COUNT = 20;

const WaiterTablesScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const tableNumbers = Array.from({ length: DEFAULT_TABLE_COUNT }, (_, i) => i + 1);

  const handleTablePress = (number: number) => {
    const label = t('waiter.tables.tableLabel', { number }) || `Mesa ${number}`;
    navigate('/waiter-take-order', { state: { tableNumber: number, tableLabel: label } });
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-[#181411] dark:text-white mb-2">
          {t('waiter.tables.title')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {t('waiter.tables.subtitle')}
        </p>
        <div className="grid grid-cols-4 gap-3">
          {tableNumbers.map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleTablePress(num)}
              className="flex flex-col items-center justify-center py-4 rounded-xl bg-white dark:bg-[#32281d] border border-gray-200 dark:border-gray-700 shadow-sm hover:bg-primary/10 hover:border-primary/30 transition-colors"
            >
              <span className="material-symbols-outlined text-2xl text-primary mb-1">table_restaurant</span>
              <span className="text-sm font-bold text-[#181411] dark:text-white">
                {t('waiter.tables.tableLabel', { number: num }) || `Mesa ${num}`}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WaiterTablesScreen;
