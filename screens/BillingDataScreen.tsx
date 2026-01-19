
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const BillingDataScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen pb-32">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 justify-between">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">{t('billing.step1')}</h2>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6">
        <div className="flex gap-1 w-full h-1">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <p className="text-xs font-semibold text-primary mt-2 uppercase tracking-wider">{t('billing.step1of4')}</p>

        <section className="pt-4">
          <h3 className="text-3xl font-extrabold leading-tight">{t('billing.billingInformation')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
            {t('billing.billingInformationDesc')}
          </p>
        </section>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.rfc')}</label>
            <input className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 p-4 focus:ring-primary focus:border-primary" placeholder="XAXX010101000" />
            <p className="text-gray-500 text-xs mt-2 ml-1 flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">info</span> {t('billing.rfcHint')}
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.businessName')}</label>
            <input className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 p-4" placeholder={t('billing.businessNamePlaceholder')} />
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.cfdiUsage')}</label>
            <select className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 px-4 appearance-none">
              <option value="">{t('billing.selectOption')}</option>
              <option value="G03">G03 - {t('billing.generalExpenses')}</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.taxRegime')}</label>
            <select className="w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 px-4 appearance-none">
              <option value="">{t('billing.selectRegime')}</option>
              <option value="601">601 - {t('billing.generalLawLegalEntities')}</option>
            </select>
            <p className="text-gray-500 text-xs mt-2 ml-1">{t('billing.regimeHint')}</p>
          </div>
        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 ios-blur border-t border-gray-100 p-4 pb-12 z-50">
        <button onClick={() => navigate('/billing-step-2')} className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all">
          {t('billing.saveAndContinue')}
        </button>
      </div>
    </div>
  );
};

export default BillingDataScreen;
