
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ConfirmationScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100">
        <div className="flex items-center p-4 justify-between">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">Confirmación</h2>
        </div>
      </header>

      <main className="flex-1 px-6 pt-6 overflow-y-auto">
        <div className="flex gap-1.5 w-full h-1.5">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
        </div>
        <p className="text-[11px] font-bold text-primary mt-3 uppercase tracking-widest">Paso 4 de 4</p>

        <section className="pt-6 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full mb-4">
            <span className="material-symbols-outlined text-primary text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h3 className="text-2xl font-extrabold">¡Todo listo para revisar!</h3>
          <p className="text-gray-500 text-sm mt-2 px-4">
            Verifica que la información capturada sea correcta antes de finalizar la configuración.
          </p>
        </section>

        <section className="mt-8 bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 bg-gray-50/50 dark:bg-gray-800/30">
            <h4 className="text-xs font-bold text-gray-400 uppercase">Resumen Fiscal</h4>
          </div>
          <div className="p-5 space-y-6">
            <SummaryItem label="RFC" value="XAXX010101000" />
            <SummaryItem label="Razón Social" value="SERVICIOS DE RESTAURACIÓN S.A. DE C.V." />
            <SummaryItem label="Uso de CFDI" value="G03 - Gastos en general" />
            <SummaryItem label="Régimen Fiscal" value="601 - General de Ley Personas Morales" />
          </div>
          <button 
            onClick={() => navigate('/billing-step-1')}
            className="w-full py-4 text-primary text-sm font-bold border-t border-gray-50 flex items-center justify-center gap-2 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
            Editar Información
          </button>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 p-4 pb-12 z-50">
        <button onClick={() => navigate('/profile')} className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3">
          Finalizar Configuración
          <span className="material-symbols-outlined">rocket_launch</span>
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
