
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

const UploadConstanciaScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 safe-top">
        <div className="flex items-center p-4 justify-between">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">{t('billing.step2')}</h2>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6">
        <div className="flex gap-1 w-full h-1">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <p className="text-xs font-semibold text-primary mt-2 uppercase">{t('billing.step2of4')}</p>

        <section className="pt-4">
          <h3 className="text-3xl font-extrabold">{t('billing.uploadCertificate')}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
            {t('billing.uploadCertificateDesc')}
          </p>
        </section>

        <div className="mt-8 space-y-6">
          <button className="w-full bg-white dark:bg-gray-800 border-2 border-primary/20 flex items-center justify-center gap-3 py-5 rounded-2xl shadow-sm active:bg-gray-50">
            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
            <span className="font-bold text-lg">{t('billing.scanCamera')}</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('billing.orUpload')}</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>

          <div className="dotted-border bg-white dark:bg-gray-800/40 p-10 flex flex-col items-center justify-center text-center group cursor-pointer">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <h4 className="font-bold text-lg">{t('billing.selectPDF')}</h4>
            <p className="text-gray-500 text-sm mt-1">{t('billing.dragFile')}</p>
            <p className="text-xs text-gray-400 mt-4">{t('billing.supportedFormat')}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 border border-blue-100">
          <span className="material-symbols-outlined text-blue-500">auto_awesome</span>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
            {t('billing.aiNotice')}
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 p-4 pb-12 z-50">
        <button onClick={() => navigate('/billing-step-3')} className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all">
          {t('common.next')}
        </button>
      </div>
    </div>
  );
};

export default UploadConstanciaScreen;
