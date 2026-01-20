
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { ORDERS_STORAGE_KEY, ORDER_HISTORY_STORAGE_KEY, HistoricalOrder } from '../types/order';

interface Email {
  id: number;
  email: string;
  isPrimary: boolean;
}

interface FiscalData {
  rfc: string;
  razonSocial: string;
  usoCFDI: string;
  regimenFiscal: string;
}

const PaymentSuccessScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config, selectedRestaurant } = useRestaurant();
  const [wantsInvoice, setWantsInvoice] = useState<boolean | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
  const [fiscalDataConfirmed, setFiscalDataConfirmed] = useState(false);
  const [isEditingFiscalData, setIsEditingFiscalData] = useState(false);
  const [emails] = useState<Email[]>([
    { id: 1, email: 'juan.perez@empresa.com', isPrimary: true },
    { id: 2, email: 'contabilidad@empresa.com', isPrimary: false },
  ]);
  
  // Datos fiscales del usuario (en producción vendrían de una API o contexto)
  const [fiscalData, setFiscalData] = useState<FiscalData>({
    rfc: 'XAXX010101000',
    razonSocial: 'Juan Pérez García',
    usoCFDI: 'G03 - Gastos en general',
    regimenFiscal: '601 - General de Ley Personas Morales',
  });

  const [editingFiscalData, setEditingFiscalData] = useState<FiscalData>(fiscalData);

  const handleSaveFiscalData = () => {
    setFiscalData(editingFiscalData);
    setIsEditingFiscalData(false);
    setFiscalDataConfirmed(false); // Resetear confirmación al editar
  };

  const handleCancelEdit = () => {
    setEditingFiscalData(fiscalData);
    setIsEditingFiscalData(false);
  };

  // Cargar órdenes actuales
  const currentOrders = useMemo(() => {
    try {
      const savedData = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch {
      return [];
    }
    return [];
  }, []);

  const handleFinish = () => {
    // Combinar todas las órdenes en una sola orden histórica
    if (currentOrders.length > 0) {
      // Combinar todos los items de todas las órdenes
      const allItems: Array<{ id: number; name: string; price: number; notes: string; quantity: number }> = [];
      let totalAmount = 0;

      currentOrders.forEach((order: any) => {
        order.items.forEach((item: any) => {
          // Buscar si ya existe un item con el mismo id y notas
          const existingItemIndex = allItems.findIndex(
            existingItem => existingItem.id === item.id && existingItem.notes === item.notes
          );

          if (existingItemIndex >= 0) {
            // Si existe, sumar la cantidad
            allItems[existingItemIndex].quantity += item.quantity;
          } else {
            // Si no existe, agregarlo
            allItems.push({ ...item });
          }
          totalAmount += item.price * item.quantity;
        });
      });

      // Crear la orden histórica combinada
      const paymentDate = new Date();
      const historicalOrder: HistoricalOrder = {
        id: `historical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        restaurantName: selectedRestaurant || 'DONK RESTAURANT',
        date: paymentDate.toLocaleDateString('es-MX', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        }),
        time: paymentDate.toLocaleTimeString('es-MX', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        total: totalAmount,
        status: 'completada',
        items: allItems.map(item => ({
          id: item.id,
          name: item.name,
          price: `$${item.price.toFixed(2)}`,
          notes: item.notes,
          quantity: item.quantity,
        })),
        logo: '/logo-donk-restaurant.png',
        timestamp: paymentDate.toISOString(),
      };

      // Cargar historial existente y agregar la nueva orden
      let orderHistory: HistoricalOrder[] = [];
      try {
        const historyData = localStorage.getItem(ORDER_HISTORY_STORAGE_KEY);
        if (historyData) {
          orderHistory = JSON.parse(historyData);
        }
      } catch {
        orderHistory = [];
      }

      // Agregar la nueva orden al inicio del historial
      orderHistory.unshift(historicalOrder);
      localStorage.setItem(ORDER_HISTORY_STORAGE_KEY, JSON.stringify(orderHistory));

      // Limpiar las órdenes actuales
      localStorage.removeItem(ORDERS_STORAGE_KEY);
    }

    // Aquí se podría enviar la factura al correo seleccionado si wantsInvoice es true
    navigate('/home');
  };

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 safe-top">
        <button onClick={() => navigate('/home')} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <div className="w-12"></div>
      </header>

      <div className="flex flex-col items-center justify-center px-4 py-8">
        {/* Icono de éxito */}
        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-5xl">check_circle</span>
        </div>

        <h3 className="text-2xl font-bold text-[#181411] dark:text-white mb-2 text-center">
          {t('paymentSuccess.title')}
        </h3>

        {/* Pregunta sobre factura */}
        {config.allowInvoice && wantsInvoice === null && (
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-[#2d2516] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              <h4 className="text-lg font-bold text-[#181411] dark:text-white mb-4 text-center">
                {t('paymentSuccess.wantInvoice')}
              </h4>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setWantsInvoice(true);
                    if (emails.length > 0) {
                      setSelectedEmailId(emails[0].id);
                    }
                  }}
                  className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors active:scale-95"
                >
                  {t('common.yes')}
                </button>
                <button
                  onClick={() => {
                    setWantsInvoice(false);
                    handleFinish();
                  }}
                  className="flex-1 bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary/90 transition-colors active:scale-95"
                >
                  {t('common.no')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selección de correo electrónico */}
        {wantsInvoice === true && (
          <>
            {/* Datos Fiscales */}
            <div className="w-full max-w-md mt-6">
              <div className="bg-white dark:bg-[#2d2516] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[#3d3321]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-[#181411] dark:text-white">
                    {t('paymentSuccess.verifyFiscalData')}
                  </h4>
                  {!isEditingFiscalData && (
                    <button
                      onClick={() => setIsEditingFiscalData(true)}
                      className="text-primary hover:text-primary/80 transition-colors flex items-center gap-1 text-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      {t('common.edit')}
                    </button>
                  )}
                </div>

                {isEditingFiscalData ? (
                  <div className="space-y-4 mb-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{t('billing.rfc')}</label>
                      <input
                        type="text"
                        value={editingFiscalData.rfc}
                        onChange={(e) => setEditingFiscalData({ ...editingFiscalData, rfc: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-10 px-3 text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="XAXX010101000"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">Razón Social</label>
                      <input
                        type="text"
                        value={editingFiscalData.razonSocial}
                        onChange={(e) => setEditingFiscalData({ ...editingFiscalData, razonSocial: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-10 px-3 text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="Nombre legal completo"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{t('billing.cfdiUsage')}</label>
                      <select
                        value={editingFiscalData.usoCFDI}
                        onChange={(e) => setEditingFiscalData({ ...editingFiscalData, usoCFDI: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-10 px-3 text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      >
                        <option value="G03 - Gastos en general">G03 - Gastos en general</option>
                        <option value="G01 - Adquisición de mercancías">G01 - Adquisición de mercancías</option>
                        <option value="G02 - Devoluciones, descuentos o bonificaciones">G02 - Devoluciones, descuentos o bonificaciones</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 block">{t('billing.taxRegime')}</label>
                      <select
                        value={editingFiscalData.regimenFiscal}
                        onChange={(e) => setEditingFiscalData({ ...editingFiscalData, regimenFiscal: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800/50 h-10 px-3 text-sm text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      >
                        <option value="601 - General de Ley Personas Morales">601 - General de Ley Personas Morales</option>
                        <option value="603 - Personas Morales con Fines no Lucrativos">603 - Personas Morales con Fines no Lucrativos</option>
                        <option value="605 - Sueldos y Salarios e Ingresos Asimilados a Salarios">605 - Sueldos y Salarios e Ingresos Asimilados a Salarios</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveFiscalData}
                        className="flex-1 bg-primary text-white font-semibold py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
                      >
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4 mb-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">RFC</p>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{fiscalData.rfc}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('billing.businessName')}</p>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{fiscalData.razonSocial}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('billing.cfdiUsage')}</p>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{fiscalData.usoCFDI}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t('billing.taxRegime')}</p>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{fiscalData.regimenFiscal}</p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 p-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 cursor-pointer hover:border-primary transition-all">
                      <input
                        type="checkbox"
                        checked={fiscalDataConfirmed}
                        onChange={(e) => setFiscalDataConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">
                          {t('paymentSuccess.confirmFiscalData')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('paymentSuccess.updateFromProfile')}
                        </p>
                      </div>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Selección de correo */}
            <div className="w-full max-w-md mt-6">
              <div className="bg-white dark:bg-[#2d2516] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[#3d3321]">
                <h4 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
                  {t('paymentSuccess.selectEmail')}
                </h4>
                <div className="space-y-2 mb-4">
                  {emails.map((email) => (
                    <label
                      key={email.id}
                      onClick={() => setSelectedEmailId(email.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedEmailId === email.id
                          ? 'border-primary bg-primary/5 dark:bg-primary/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedEmailId === email.id
                          ? 'border-primary bg-primary'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {selectedEmailId === email.id && (
                          <span className="material-symbols-outlined text-white text-xs">check</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#181411] dark:text-white">{email.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <button
                  onClick={() => navigate('/billing-step-3')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/30 hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all"
                >
                  <span className="material-symbols-outlined text-primary text-sm">add</span>
                  <span className="text-sm font-semibold text-primary">{t('paymentSuccess.addAnotherEmail')}</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Botón Finalizar - Solo se muestra si quiere factura y ha completado los datos */}
        {wantsInvoice === true && selectedEmailId && fiscalDataConfirmed && (
          <div className="w-full max-w-md mt-6">
            <button
              onClick={handleFinish}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform hover:bg-primary/90"
            >
              <span>{t('paymentSuccess.finish')}</span>
              <span className="material-symbols-outlined">check_circle</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessScreen;
