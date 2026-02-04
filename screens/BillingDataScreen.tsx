
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserBillingProfile, upsertUserBillingProfile } from '../services/api/user';

interface FiscalData {
  rfc: string;
  businessName: string;
  taxRegime: string;
  cfdiUsage: string;
}

const BillingDataScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para los datos fiscales
  const [fiscalData, setFiscalData] = useState<FiscalData>({
    rfc: '',
    businessName: '',
    taxRegime: '616', // Por defecto: Sin obligaciones fiscales
    cfdiUsage: 'P01' // Por defecto: Por definir
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FiscalData, string>>>({});
  const [rfcType, setRfcType] = useState<'physical' | 'moral' | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showHints, setShowHints] = useState(true);

  // Regímenes fiscales disponibles según el tipo de RFC
  const physicalPersonRegimes = [
    { value: '605', label: '605 – Sueldos y Salarios' },
    { value: '612', label: '612 – Personas Físicas con Actividades Empresariales y Profesionales' },
    { value: '626', label: '626 – Régimen Simplificado de Confianza (RESICO)' },
    { value: '616', label: '616 – Sin obligaciones fiscales' }
  ];

  const moralPersonRegimes = [
    { value: '601', label: '601 – General de Ley Personas Morales' }
  ];

  // Detectar tipo de RFC (Persona Física: 13 caracteres, Persona Moral: 12 caracteres)
  useEffect(() => {
    const rfc = fiscalData.rfc.trim().toUpperCase();
    
    if (rfc.length === 13) {
      setRfcType('physical');
      // Si el régimen actual no es válido para persona física, cambiarlo
      if (!physicalPersonRegimes.some(r => r.value === fiscalData.taxRegime)) {
        setFiscalData(prev => ({ ...prev, taxRegime: '616' }));
      }
    } else if (rfc.length === 12) {
      setRfcType('moral');
      // Si el régimen actual no es válido para persona moral, cambiarlo
      if (!moralPersonRegimes.some(r => r.value === fiscalData.taxRegime)) {
        setFiscalData(prev => ({ ...prev, taxRegime: '601' }));
      }
    } else if (rfc.length > 0 && rfc.length < 12) {
      setRfcType(null);
    } else if (rfc.length === 0) {
      setRfcType(null);
      // Restablecer a valores por defecto cuando no hay RFC
      setFiscalData(prev => ({ ...prev, taxRegime: '616', cfdiUsage: 'P01' }));
    }
  }, [fiscalData.rfc]);

  // Validar RFC
  const validateRFC = (rfc: string): boolean => {
    const rfcUpper = rfc.trim().toUpperCase();
    
    if (rfcUpper.length === 0) {
      setErrors(prev => ({ ...prev, rfc: 'El RFC es requerido' }));
      return false;
    }
    
    if (rfcUpper.length !== 12 && rfcUpper.length !== 13) {
      setErrors(prev => ({ ...prev, rfc: 'El RFC debe tener 12 o 13 caracteres' }));
      return false;
    }
    
    // Validar formato básico (letras y números)
    if (!/^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$/.test(rfcUpper)) {
      setErrors(prev => ({ ...prev, rfc: 'El formato del RFC no es válido' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, rfc: undefined }));
    return true;
  };

  // Validar Razón Social
  const validateBusinessName = (name: string): boolean => {
    if (name.trim().length === 0) {
      setErrors(prev => ({ ...prev, businessName: 'La razón social es requerida' }));
      return false;
    }
    
    if (name.trim().length < 3) {
      setErrors(prev => ({ ...prev, businessName: 'La razón social debe tener al menos 3 caracteres' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, businessName: undefined }));
    return true;
  };

  // Validar Régimen Fiscal
  const validateTaxRegime = (regime: string): boolean => {
    if (!regime) {
      setErrors(prev => ({ ...prev, taxRegime: 'Debes seleccionar un régimen fiscal' }));
      return false;
    }
    
    // Validar que el régimen sea compatible con el tipo de RFC
    if (rfcType === 'physical' && !physicalPersonRegimes.some(r => r.value === regime)) {
      setErrors(prev => ({ ...prev, taxRegime: 'Este régimen no es válido para Persona Física' }));
      return false;
    }
    
    if (rfcType === 'moral' && !moralPersonRegimes.some(r => r.value === regime)) {
      setErrors(prev => ({ ...prev, taxRegime: 'Este régimen no es válido para Persona Moral' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, taxRegime: undefined }));
    return true;
  };

  // Validar Uso de CFDI
  const validateCFDIUsage = (usage: string): boolean => {
    if (!usage) {
      setErrors(prev => ({ ...prev, cfdiUsage: 'Debes seleccionar un uso de CFDI' }));
      return false;
    }
    
    setErrors(prev => ({ ...prev, cfdiUsage: undefined }));
    return true;
  };

  // Manejar cambios en los campos
  const handleRFCChange = (value: string) => {
    const rfcUpper = value.toUpperCase().replace(/[^A-ZÑ&0-9]/g, '');
    setFiscalData(prev => ({ ...prev, rfc: rfcUpper }));
    if (errors.rfc) {
      validateRFC(rfcUpper);
    }
  };

  const handleBusinessNameChange = (value: string) => {
    setFiscalData(prev => ({ ...prev, businessName: value }));
    if (errors.businessName) {
      validateBusinessName(value);
    }
  };

  const handleTaxRegimeChange = (value: string) => {
    setFiscalData(prev => ({ ...prev, taxRegime: value }));
    // Limpiar error si existe
    if (errors.taxRegime) {
      setErrors(prev => ({ ...prev, taxRegime: undefined }));
    }
    
    // Sugerir G03 si se selecciona un régimen y el uso CFDI es P01
    if (value && fiscalData.cfdiUsage === 'P01') {
      // No cambiar automáticamente, solo sugerir visualmente
    }
  };

  const handleCFDIUsageChange = (value: string) => {
    setFiscalData(prev => ({ ...prev, cfdiUsage: value }));
    // Limpiar error si existe
    if (errors.cfdiUsage) {
      setErrors(prev => ({ ...prev, cfdiUsage: undefined }));
    }
  };

  // Permitir continuar siempre, guardando cualquier dato disponible
  const handleContinue = async () => {
    setIsSaving(true);
    try {
      // Guardar cualquier dato disponible, incluso si solo hay uno
      const dataToSave: any = {
        is_default: true
      };

      // Incluir todos los campos, incluso si están vacíos (se guardarán como null)
      dataToSave.tax_id = fiscalData.rfc?.trim() || null;
      dataToSave.business_name = fiscalData.businessName?.trim() || null;
      dataToSave.regimen_fiscal = fiscalData.taxRegime || null;
      dataToSave.uso_cfdi = fiscalData.cfdiUsage || null;
      if (user?.email) {
        dataToSave.email = user.email;
      }

      // Guardar en la base de datos siempre que haya un usuario
      // Todos los campos pueden ser null ahora
      if (user?.id) {
        try {
          await upsertUserBillingProfile(dataToSave);
        } catch (error) {
          console.error('Error saving fiscal data:', error);
          // Continuar de todas formas, los datos se guardaron en localStorage
        }
      }
      
      // También guardar en localStorage como respaldo
      localStorage.setItem('fiscalData', JSON.stringify(fiscalData));
      
      navigate('/billing-step-2');
    } catch (error) {
      console.error('Error saving fiscal data:', error);
      // Aún así permitir continuar y guardar en localStorage
      localStorage.setItem('fiscalData', JSON.stringify(fiscalData));
      navigate('/billing-step-2');
    } finally {
      setIsSaving(false);
    }
  };

  // Ocultar descripción y hints después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDescription(false);
      setShowHints(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos guardados al montar el componente
  useEffect(() => {
    const loadFiscalData = async () => {
      setIsLoading(true);
      try {
        // Intentar cargar desde la base de datos primero
        if (user?.id) {
          const billingProfile = await getUserBillingProfile();
          if (billingProfile && billingProfile.success && billingProfile.data) {
            const profile = billingProfile.data;
            const loadedData = {
              rfc: profile.tax_id || '',
              businessName: profile.business_name || '',
              taxRegime: profile.regimen_fiscal || '616',
              cfdiUsage: profile.uso_cfdi || 'P01'
            };
            setFiscalData(loadedData);
            
            // Detectar tipo de RFC si existe
            if (loadedData.rfc) {
              const rfcLength = loadedData.rfc.length;
              if (rfcLength === 13) {
                setRfcType('physical');
              } else if (rfcLength === 12) {
                setRfcType('moral');
              }
            }
            
            // También guardar en localStorage como respaldo
            localStorage.setItem('fiscalData', JSON.stringify(loadedData));
            
            setIsLoading(false);
            return;
          }
        }
        
        // Si no hay datos en DB, intentar cargar desde localStorage
        const savedData = localStorage.getItem('fiscalData');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            const loadedData = {
              rfc: parsed.rfc || '',
              businessName: parsed.businessName || '',
              taxRegime: (parsed.taxRegime && parsed.taxRegime.trim()) ? parsed.taxRegime : '616',
              cfdiUsage: (parsed.cfdiUsage && parsed.cfdiUsage.trim()) ? parsed.cfdiUsage : 'P01'
            };
            setFiscalData(loadedData);
            
            // Detectar tipo de RFC si existe
            if (loadedData.rfc) {
              const rfcLength = loadedData.rfc.length;
              if (rfcLength === 13) {
                setRfcType('physical');
              } else if (rfcLength === 12) {
                setRfcType('moral');
              }
            }
          } catch (err) {
            console.error('Error loading saved fiscal data:', err);
            // Si hay error, establecer valores por defecto
            setFiscalData(prev => ({
              ...prev,
              taxRegime: '616',
              cfdiUsage: 'P01'
            }));
          }
        }
      } catch (error) {
        console.error('Error loading fiscal data:', error);
        // Intentar cargar desde localStorage como fallback
        const savedData = localStorage.getItem('fiscalData');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            const loadedData = {
              rfc: parsed.rfc || '',
              businessName: parsed.businessName || '',
              taxRegime: (parsed.taxRegime && parsed.taxRegime.trim()) ? parsed.taxRegime : '616',
              cfdiUsage: (parsed.cfdiUsage && parsed.cfdiUsage.trim()) ? parsed.cfdiUsage : 'P01'
            };
            setFiscalData(loadedData);
            
            // Detectar tipo de RFC si existe
            if (loadedData.rfc) {
              const rfcLength = loadedData.rfc.length;
              if (rfcLength === 13) {
                setRfcType('physical');
              } else if (rfcLength === 12) {
                setRfcType('moral');
              }
            }
          } catch (err) {
            console.error('Error loading saved fiscal data:', err);
            // Si hay error, establecer valores por defecto
            setFiscalData(prev => ({
              ...prev,
              taxRegime: '616',
              cfdiUsage: 'P01'
            }));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id || !user) {
      loadFiscalData();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Asegurar valores por defecto después de que termine la carga (solo si están vacíos)
  useEffect(() => {
    if (!isLoading && (!fiscalData.taxRegime || !fiscalData.cfdiUsage)) {
      setFiscalData(prev => ({
        ...prev,
        taxRegime: prev.taxRegime || '616',
        cfdiUsage: prev.cfdiUsage || 'P01'
      }));
    }
  }, [isLoading, fiscalData.taxRegime, fiscalData.cfdiUsage]);

  // Obtener regímenes disponibles según el tipo de RFC
  const getAvailableRegimes = () => {
    if (rfcType === 'physical') {
      return physicalPersonRegimes;
    } else if (rfcType === 'moral') {
      return moralPersonRegimes;
    }
    // Si no hay RFC o no se ha detectado el tipo, mostrar todos
    return [...physicalPersonRegimes, ...moralPersonRegimes];
  };

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
          {showDescription && (
            <p className="text-gray-600 dark:text-gray-400 text-base mt-2 transition-opacity duration-300">
              {t('billing.billingInformationDesc')}
            </p>
          )}
        </section>

        <form className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.rfc')}</label>
            <input
              className={`w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 p-4 focus:ring-primary focus:border-primary ${
                errors.rfc ? 'border-red-500 dark:border-red-500' : ''
              }`}
              placeholder="XAXX010101000"
              value={fiscalData.rfc}
              onChange={(e) => handleRFCChange(e.target.value)}
              maxLength={13}
            />
            {errors.rfc ? (
              <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span> {errors.rfc}
              </p>
            ) : (
              showHints && (
                <p className="text-gray-500 text-xs mt-2 ml-1 flex items-center gap-1 transition-opacity duration-300">
                  <span className="material-symbols-outlined text-sm">info</span> {t('billing.rfcHint')}
                </p>
              )
            )}
            {rfcType && showHints && (
              <p className="text-primary text-xs mt-1 ml-1 font-medium transition-opacity duration-300">
                {rfcType === 'physical' ? 'Persona Física detectada' : 'Persona Moral detectada'}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.businessName')}</label>
            <input
              className={`w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 p-4 ${
                errors.businessName ? 'border-red-500 dark:border-red-500' : ''
              }`}
              placeholder={t('billing.businessNamePlaceholder')}
              value={fiscalData.businessName}
              onChange={(e) => handleBusinessNameChange(e.target.value)}
            />
            {errors.businessName && (
              <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span> {errors.businessName}
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.taxRegime')}</label>
            <select
              className={`w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 px-4 appearance-none ${
                errors.taxRegime ? 'border-red-500 dark:border-red-500' : ''
              }`}
              value={fiscalData.taxRegime}
              onChange={(e) => handleTaxRegimeChange(e.target.value)}
            >
              <option value="">{t('billing.selectRegime')}</option>
              {getAvailableRegimes().map((regime) => (
                <option key={regime.value} value={regime.value}>
                  {regime.label}
                </option>
              ))}
            </select>
            {errors.taxRegime ? (
              <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span> {errors.taxRegime}
              </p>
            ) : (
              showHints && (
                <p className="text-gray-500 text-xs mt-2 ml-1 transition-opacity duration-300">{t('billing.regimeHint')}</p>
              )
            )}
            {fiscalData.taxRegime === '616' && fiscalData.cfdiUsage === 'P01' && showHints && (
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-2 ml-1 flex items-center gap-1 transition-opacity duration-300">
                <span className="material-symbols-outlined text-sm">lightbulb</span>
                Sugerencia: Considera usar "G03 – Gastos en general" para un uso más común
              </p>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold mb-1.5 block ml-1">{t('billing.cfdiUsage')}</label>
            <select
              className={`w-full rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-14 px-4 appearance-none ${
                errors.cfdiUsage ? 'border-red-500 dark:border-red-500' : ''
              }`}
              value={fiscalData.cfdiUsage}
              onChange={(e) => handleCFDIUsageChange(e.target.value)}
            >
              <option value="">{t('billing.selectOption')}</option>
              <option value="G03">G03 – Gastos en general</option>
              <option value="S01">S01 – Sin efectos fiscales</option>
              <option value="P01">P01 – Por definir</option>
            </select>
            {errors.cfdiUsage ? (
              <p className="text-red-500 text-xs mt-2 ml-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">error</span> {errors.cfdiUsage}
              </p>
            ) : null}
            {fiscalData.cfdiUsage === 'P01' && showHints && (
              <p className="text-amber-600 dark:text-amber-400 text-xs mt-2 ml-1 flex items-center gap-1 transition-opacity duration-300">
                <span className="material-symbols-outlined text-sm">info</span>
                Este uso requiere definición antes de emitir facturas
              </p>
            )}
          </div>
        </form>
      </main>

      <div className="fixed left-0 right-0 bg-white/90 dark:bg-background-dark/90 ios-blur border-t border-gray-100 dark:border-gray-800 p-4 pb-4 z-[55]" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <button
          onClick={handleContinue}
          className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSaving || isLoading}
        >
          {isSaving ? 'Guardando...' : t('billing.saveAndContinue')}
        </button>
      </div>
    </div>
  );
};

export default BillingDataScreen;
