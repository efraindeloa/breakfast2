
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserBillingProfile, getBillingReceptionEmails } from '../services/api/user';

interface FiscalSummary {
  rfc: string;
  businessName: string;
  taxRegime: string;
  cfdiUsage: string;
  emailCount: number;
}

const ConfirmationScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<FiscalSummary | null>(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Cargar perfil de facturación
        const billingProfile = await getUserBillingProfile();
        if (billingProfile?.success && billingProfile.data) {
          const profile = billingProfile.data;
          
          // Cargar emails de recepción
          const emailsResponse = await getBillingReceptionEmails(profile.id);
          const emailCount = emailsResponse?.success ? (emailsResponse.data?.length || 0) : 0;

          // Mapear régimen fiscal
          const regimeMap: Record<string, string> = {
            '601': '601 – General de Ley Personas Morales',
            '605': '605 – Sueldos y Salarios',
            '612': '612 – Personas Físicas con Actividades Empresariales y Profesionales',
            '616': '616 – Sin obligaciones fiscales',
            '626': '626 – Régimen Simplificado de Confianza (RESICO)'
          };

          // Mapear uso de CFDI
          const cfdiMap: Record<string, string> = {
            'G03': 'G03 – Gastos en general',
            'S01': 'S01 – Sin efectos fiscales',
            'P01': 'P01 – Por definir'
          };

          setSummary({
            rfc: profile.tax_id || '',
            businessName: profile.business_name || '',
            taxRegime: regimeMap[profile.regimen_fiscal || ''] || profile.regimen_fiscal || '',
            cfdiUsage: cfdiMap[profile.uso_cfdi || ''] || profile.uso_cfdi || '',
            emailCount
          });
        }
      } catch (error) {
        console.error('Error loading confirmation data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen pb-40 items-center justify-center">
        <div className="text-gray-500">Cargando...</div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex flex-col h-screen pb-40 items-center justify-center">
        <div className="text-gray-500">No se encontraron datos de facturación</div>
        <button 
          onClick={() => navigate('/billing-step-1')}
          className="mt-4 bg-primary text-white px-6 py-2 rounded-xl"
        >
          Configurar datos fiscales
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 safe-top">
        <div className="flex items-center p-4 justify-between">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">{t('confirmation.title')}</h2>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 overflow-y-auto">
        <div className="flex gap-1.5 w-full h-1.5">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
        </div>
        <p className="text-[11px] font-bold text-primary mt-3 uppercase tracking-widest">{t('confirmation.step4of4')}</p>

        <section className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h3 className="text-2xl font-extrabold">{t('confirmation.readyToReview')}</h3>
          <p className="text-gray-500 text-sm mt-2 px-4">
            {t('confirmation.verifyInfo')}
          </p>
        </section>

        <section className="mt-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 bg-gray-50/50 dark:bg-gray-800/30">
            <h4 className="text-xs font-bold text-gray-400 uppercase">{t('confirmation.fiscalSummary')}</h4>
          </div>
          <div className="p-5 space-y-6">
            <SummaryItem label={t('confirmation.rfc')} value={summary.rfc || '-'} />
            <SummaryItem label={t('confirmation.businessName')} value={summary.businessName || '-'} />
            <SummaryItem label={t('confirmation.cfdiUsage')} value={summary.cfdiUsage || '-'} />
            <SummaryItem label={t('confirmation.taxRegime')} value={summary.taxRegime || '-'} />
            <SummaryItem label="Emails de recepción" value={`${summary.emailCount} ${summary.emailCount === 1 ? 'email configurado' : 'emails configurados'}`} />
          </div>
          <button 
            onClick={() => navigate('/billing-step-1')}
            className="w-full py-4 text-primary text-sm font-bold border-t border-gray-50 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            {t('confirmation.editInformation')}
          </button>
        </section>
      </main>

      <div className="fixed left-0 right-0 bg-white/90 dark:bg-background-dark/90 ios-blur border-t border-gray-100 dark:border-gray-800 p-4 pb-4 z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <button onClick={() => navigate('/profile')} className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg">
          {t('confirmation.finishConfiguration')}
        </button>
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-xs font-medium text-gray-400 uppercase">{label}</span>
    <span className="text-base font-semibold">{value}</span>
  </div>
);

export default ConfirmationScreen;
