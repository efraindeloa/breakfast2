import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';

const AdminControlPanelScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurant } = useRestaurant();

  // Estados para los accordions
  const [openSection, setOpenSection] = useState<string>('fiscal');

  // Estados para los switches
  const [acceptCards, setAcceptCards] = useState(true);
  const [selectedTip, setSelectedTip] = useState(15);
  const [selectedColor, setSelectedColor] = useState('#f48c25');
  const [selectedMode, setSelectedMode] = useState<'light' | 'dark'>('light');

  // Datos fiscales
  const [rfc, setRfc] = useState('ABC123456XYZ');
  const [regimenFiscal, setRegimenFiscal] = useState('Simplificado de Confianza');

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? '' : section);
  };

  const handleSaveChanges = () => {
    // Aquí se guardarían los cambios en la base de datos
    alert('Cambios guardados correctamente');
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      {/* TopAppBar */}
      <div className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-[#e6e0db] dark:border-[#3d2e21]">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-start"
        >
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Configuración Admin
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-full h-10 w-10 bg-primary/10 text-primary">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        </div>
      </div>

      <div className="px-4 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-sm text-[#8a7560] dark:text-[#c0a891]">Gestiona la operatividad de tu restaurante</p>
      </div>

      {/* Métricas Clave (Stats) */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[#181411] dark:text-white text-base font-bold">Métricas Clave</h3>
          <span className="text-primary text-xs font-bold uppercase tracking-wider">Último mes</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-[#2d2218] border border-[#e6e0db] dark:border-[#3d2e21] shadow-sm">
            <p className="text-[#8a7560] dark:text-[#c0a891] text-xs font-medium uppercase">Órdenes</p>
            <p className="text-[#181411] dark:text-white text-xl font-bold">1,240</p>
            <div className="flex items-center gap-1 text-[#07880e] text-xs font-bold">
              <span className="material-symbols-outlined text-sm">trending_up</span> +12%
            </div>
          </div>
          <div className="flex flex-col gap-1 rounded-xl p-4 bg-white dark:bg-[#2d2218] border border-[#e6e0db] dark:border-[#3d2e21] shadow-sm">
            <p className="text-[#8a7560] dark:text-[#c0a891] text-xs font-medium uppercase">Rating</p>
            <p className="text-[#181411] dark:text-white text-xl font-bold">4.8</p>
            <div className="flex items-center gap-1 text-[#07880e] text-xs font-bold">
              <span className="material-symbols-outlined text-sm">star</span> Alta
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="px-4 py-6">
        <div className="rounded-xl bg-white dark:bg-[#2d2218] border border-[#e6e0db] dark:border-[#3d2e21] p-4 shadow-sm">
          <div className="flex flex-col gap-1 mb-4">
            <p className="text-[#8a7560] dark:text-[#c0a891] text-xs font-medium uppercase">Ingresos Totales</p>
            <p className="text-[#181411] dark:text-white text-2xl font-bold">$15,400.00</p>
          </div>
          <div className="h-32 w-full flex items-end gap-1 px-1">
            {/* Simple Bar Chart */}
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[40%]"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[60%]"></div>
            <div className="flex-1 bg-primary/20 rounded-t-sm h-[45%]"></div>
            <div className="flex-1 bg-primary/40 rounded-t-sm h-[75%]"></div>
            <div className="flex-1 bg-primary rounded-t-sm h-[100%]"></div>
            <div className="flex-1 bg-primary/60 rounded-t-sm h-[85%]"></div>
            <div className="flex-1 bg-primary/30 rounded-t-sm h-[50%]"></div>
          </div>
          <div className="flex justify-between mt-2 px-1">
            <p className="text-[#8a7560] text-[10px] font-bold">LUN</p>
            <p className="text-[#8a7560] text-[10px] font-bold">MAR</p>
            <p className="text-[#8a7560] text-[10px] font-bold">MIE</p>
            <p className="text-[#8a7560] text-[10px] font-bold">JUE</p>
            <p className="text-primary text-[10px] font-bold">VIE</p>
            <p className="text-[#8a7560] text-[10px] font-bold">SAB</p>
            <p className="text-[#8a7560] text-[10px] font-bold">DOM</p>
          </div>
        </div>
      </div>

      {/* Accordion Section */}
      <div className="px-4 pb-10 space-y-3">
        <h3 className="text-[#181411] dark:text-white text-base font-bold mb-1">Ajustes del Negocio</h3>

        {/* Datos Fiscales */}
        <details
          className="group bg-white dark:bg-[#2d2218] rounded-xl border border-[#e6e0db] dark:border-[#3d2e21] overflow-hidden transition-all duration-300 shadow-sm"
          open={openSection === 'fiscal'}
          onClick={() => toggleSection('fiscal')}
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <p className="text-[#181411] dark:text-white font-semibold">Datos Fiscales</p>
            </div>
            <span className="material-symbols-outlined text-[#8a7560] group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-4 pb-4 pt-0 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8a7560] dark:text-[#c0a891] mb-1 uppercase">
                RFC de la Empresa
              </label>
              <input
                className="w-full rounded-lg border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-sm focus:border-primary focus:ring-primary"
                type="text"
                value={rfc}
                onChange={(e) => setRfc(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8a7560] dark:text-[#c0a891] mb-1 uppercase">
                Régimen Fiscal
              </label>
              <select
                className="w-full rounded-lg border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-sm focus:border-primary focus:ring-primary"
                value={regimenFiscal}
                onChange={(e) => setRegimenFiscal(e.target.value)}
              >
                <option>Simplificado de Confianza</option>
                <option>Persona Moral</option>
                <option>S.A. de C.V.</option>
              </select>
            </div>
          </div>
        </details>

        {/* Configuración de Pagos */}
        <details
          className="group bg-white dark:bg-[#2d2218] rounded-xl border border-[#e6e0db] dark:border-[#3d2e21] overflow-hidden transition-all duration-300 shadow-sm"
          open={openSection === 'pagos'}
          onClick={() => toggleSection('pagos')}
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <p className="text-[#181411] dark:text-white font-semibold">Configuración de Pagos</p>
            </div>
            <span className="material-symbols-outlined text-[#8a7560] group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm font-medium">Aceptar Tarjetas</p>
                <p className="text-xs text-[#8a7560]">Visa, Mastercard, Amex</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptCards}
                  onChange={(e) => setAcceptCards(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-sm font-medium">Propina sugerida</p>
                <p className="text-xs text-[#8a7560]">Porcentaje predeterminado</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedTip(10)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                    selectedTip === 10
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-[#f8f7f5] dark:bg-[#221910] border-[#e6e0db] dark:border-[#3d2e21]'
                  }`}
                >
                  10%
                </button>
                <button
                  onClick={() => setSelectedTip(15)}
                  className={`px-3 py-1 rounded-lg text-sm font-bold border ${
                    selectedTip === 15
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-[#f8f7f5] dark:bg-[#221910] border-[#e6e0db] dark:border-[#3d2e21]'
                  }`}
                >
                  15%
                </button>
              </div>
            </div>
          </div>
        </details>

        {/* Experiencia Digital */}
        <details
          className="group bg-white dark:bg-[#2d2218] rounded-xl border border-[#e6e0db] dark:border-[#3d2e21] overflow-hidden transition-all duration-300 shadow-sm"
          open={openSection === 'experiencia'}
          onClick={() => toggleSection('experiencia')}
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">palette</span>
              </div>
              <p className="text-[#181411] dark:text-white font-semibold">Experiencia Digital</p>
            </div>
            <span className="material-symbols-outlined text-[#8a7560] group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#8a7560] uppercase">Color de Marca</p>
              <div className="flex gap-4">
                {['#f48c25', '#2563eb', '#16a34a', '#dc2626'].map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full ${
                      selectedColor === color ? 'border-2 border-white ring-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-bold text-[#8a7560] uppercase">Modo de Interfaz</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedMode('light')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-bold ${
                    selectedMode === 'light'
                      ? 'border-2 border-primary bg-primary/5 text-primary'
                      : 'border border-[#e6e0db] dark:border-[#3d2e21] font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">light_mode</span> Claro
                </button>
                <button
                  onClick={() => setSelectedMode('dark')}
                  className={`flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-bold ${
                    selectedMode === 'dark'
                      ? 'border-2 border-primary bg-primary/5 text-primary'
                      : 'border border-[#e6e0db] dark:border-[#3d2e21] font-medium'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">dark_mode</span> Oscuro
                </button>
              </div>
            </div>
          </div>
        </details>

        {/* Horarios */}
        <details
          className="group bg-white dark:bg-[#2d2218] rounded-xl border border-[#e6e0db] dark:border-[#3d2e21] overflow-hidden transition-all duration-300 shadow-sm"
          open={openSection === 'horarios'}
          onClick={() => toggleSection('horarios')}
        >
          <summary className="flex cursor-pointer items-center justify-between p-4 list-none">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <p className="text-[#181411] dark:text-white font-semibold">Horarios de Atención</p>
            </div>
            <span className="material-symbols-outlined text-[#8a7560] group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="px-4 pb-4 space-y-3">
            <div className="flex items-center justify-between text-sm py-2 border-b border-[#f5f2f0] dark:border-[#3d2e21]">
              <span className="font-medium">Lunes - Viernes</span>
              <span className="text-[#8a7560]">09:00 AM - 10:00 PM</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2 border-b border-[#f5f2f0] dark:border-[#3d2e21]">
              <span className="font-medium">Sábados</span>
              <span className="text-[#8a7560]">10:00 AM - 11:30 PM</span>
            </div>
            <div className="flex items-center justify-between text-sm py-2">
              <span className="font-medium">Domingos</span>
              <span className="text-[#dc2626] font-bold">Cerrado</span>
            </div>
            <button className="w-full mt-2 py-2 text-primary font-bold text-sm border border-primary/30 rounded-lg">
              Editar Calendario
            </button>
          </div>
        </details>
      </div>

      {/* Footer Actions */}
      <div className="mt-auto p-6 bg-white dark:bg-[#2d2218] border-t border-[#e6e0db] dark:border-[#3d2e21] pb-10">
        <button
          onClick={handleSaveChanges}
          className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
        >
          <span className="material-symbols-outlined">save</span>
          Guardar Cambios
        </button>
        <p className="text-center text-[10px] text-[#8a7560] mt-4 uppercase tracking-widest font-bold">
          Última sincronización: Hoy 14:32
        </p>
      </div>

      {/* Padding for iOS bottom bar */}
      <div className="h-8 bg-white dark:bg-[#2d2218]"></div>
    </div>
  );
};

export default AdminControlPanelScreen;
