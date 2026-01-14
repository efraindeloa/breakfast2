
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UploadConstanciaScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen pb-40">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100">
        <div className="flex items-center p-4 justify-between">
          <span className="material-symbols-outlined text-xl cursor-pointer" onClick={() => navigate(-1)}>arrow_back_ios</span>
          <h2 className="text-lg font-bold flex-1 text-center pr-10">Carga de Constancia</h2>
        </div>
      </header>

      <main className="flex-1 px-4 pt-6">
        <div className="flex gap-1 w-full h-1">
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-primary rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        </div>
        <p className="text-xs font-semibold text-primary mt-2 uppercase">Paso 2 de 4</p>

        <section className="pt-4">
          <h3 className="text-3xl font-extrabold">Sube tu Constancia</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base mt-2">
            Sube el PDF de tu Constancia de Situación Fiscal o escanéalo con tu cámara. Usaremos IA para extraer tus datos automáticamente.
          </p>
        </section>

        <div className="mt-8 space-y-6">
          <button className="w-full bg-white dark:bg-gray-800 border-2 border-primary/20 flex items-center justify-center gap-3 py-5 rounded-2xl shadow-sm active:bg-gray-50">
            <span className="material-symbols-outlined text-primary text-2xl">photo_camera</span>
            <span className="font-bold text-lg">Escanear con Cámara</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">o subir archivo</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
          </div>

          <div className="dotted-border bg-white dark:bg-gray-800/40 p-10 flex flex-col items-center justify-center text-center group cursor-pointer">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
            </div>
            <h4 className="font-bold text-lg">Selecciona tu PDF</h4>
            <p className="text-gray-500 text-sm mt-1">Arrastra tu archivo aquí o presiona para buscar en tus documentos</p>
            <p className="text-xs text-gray-400 mt-4">Formato soportado: PDF (Máx. 5MB)</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex gap-3 border border-blue-100">
          <span className="material-symbols-outlined text-blue-500">auto_awesome</span>
          <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
            Nuestra IA identificará automáticamente tu RFC, Razón Social y Régimen Fiscal.
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-background-dark/90 p-4 pb-12 z-50">
        <button onClick={() => navigate('/billing-step-3')} className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg active:scale-95 transition-all">
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default UploadConstanciaScreen;
