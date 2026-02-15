import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';

const WaiterOrdersScreen: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[480px] mx-auto flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      <TopNavbar showAvatar={true} showWelcome={true} showBackButton={false} />
      <div className="px-4 pt-6">
        <h1 className="text-xl font-bold text-[#181411] dark:text-white mb-2">
          {t('waiter.orders.title')}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('waiter.orders.subtitle')}
        </p>
      </div>
    </div>
  );
};

export default WaiterOrdersScreen;
