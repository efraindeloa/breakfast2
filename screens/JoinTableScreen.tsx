import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const JoinTableScreen: React.FC = () => {
  const navigate = useNavigate();
  const [tableCode, setTableCode] = useState('');
  const [hasValidCode, setHasValidCode] = useState(false);

  const handleJoinOrder = () => {
    // Solo procesar si hay código ingresado
    if (!tableCode.trim()) return;
    
    // Marcar como código válido para mostrar los elementos
    setHasValidCode(true);
    
    // Lógica para unirse a la orden
    console.log('Unirse a orden con código:', tableCode);
    // Solo mostrar los elementos, no navegar
  };

  const handleFinalJoin = () => {
    // Este es el botón del footer que navega al menú
    if (!tableCode.trim()) return;
    navigate('/menu');
  };

  const handleScanQR = () => {
    // Lógica para escanear QR
    console.log('Escanear QR');
    // Simular código escaneado (en producción aquí iría la lógica para abrir el escáner QR)
    // Por ahora, simulamos que se escaneó un código válido
    const scannedCode = 'A-7890'; // Código simulado
    setTableCode(scannedCode);
    setHasValidCode(true);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTableCode(value);
    // Si se borra el código, ocultar los elementos
    if (!value.trim()) {
      setHasValidCode(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen flex flex-col pb-32">
      {/* TopAppBar */}
      <div className="flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-50 safe-top">
        <button 
          onClick={() => navigate(-1)} 
          className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[#8a7560] dark:text-[#d4c4a8]">arrow_back</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          Unirse a Mesa
        </h2>
        <button className="size-10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <span className="material-symbols-outlined text-zinc-400">help_outline</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* HeaderImage (Breakfast Vibes) */}
        <div className="px-4 py-3">
          <div 
            className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-xl min-h-[180px] shadow-sm relative"
            style={{
              backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAEd7e-Db1R2j2E2PCxQgYFm9KwDakWBjxc5HUGLoWjEJ1uQ_eT94KuAAWiAwVpidQTYV1RnlrlnizWf7E_67Tn4lvOJWVlvBhL0KNthO7SHFnPppjc4hO-evLyvMrq8fxsYq0ATaX1Qwp1T9Eqj51bCyKS0rKYnDwlEFDRZEXdmjdJmu_EJ6rdEZhTWJIjxZCI3x5weffPHvNnzRRCDLbx2PENsAna1VqnghXUSYbkLvjEU-4-A9QaWzuyYTmkG1V29XFMBOkWzgfE")'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
        </div>

        {/* HeadlineText */}
        <div className="px-4 pt-4 pb-2 text-center">
          <h2 className="text-[#181411] dark:text-white tracking-tight text-3xl font-extrabold leading-tight">
            ¡Únete a la mesa!
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
            Escanea el QR o ingresa el código manual
          </p>
        </div>

        {/* TextField (Join Section) */}
        <div className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-col flex-1">
            <label className="text-[#181411] dark:text-zinc-200 text-sm font-semibold leading-normal pb-2 px-1">
              Código de mesa
            </label>
            <div className="flex w-full flex-1 items-stretch rounded-full overflow-hidden shadow-sm border border-[#e5e0dc] dark:border-zinc-700">
              <input
                type="text"
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden text-[#181411] dark:text-white focus:outline-0 focus:ring-0 border-none bg-white dark:bg-zinc-800 h-14 placeholder:text-[#887563] px-6 text-base font-medium leading-normal"
                placeholder="Ej: A-7890"
                value={tableCode}
                onChange={handleCodeChange}
              />
              <button
                onClick={tableCode.trim() ? handleJoinOrder : handleScanQR}
                className="bg-primary text-white flex items-center justify-center px-6 transition-transform active:scale-95 hover:bg-primary/90"
                disabled={!tableCode.trim()}
              >
                <span className="material-symbols-outlined">
                  {tableCode.trim() ? 'arrow_forward' : 'qr_code_scanner'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* SectionHeader: Host & Friends - Solo se muestra cuando hay código válido */}
        {hasValidCode && (
        <div className="px-4 mt-2">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight">
              En la mesa
            </h3>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
              4 en la mesa
            </span>
          </div>

          {/* Friends Facepile */}
          <div className="flex flex-wrap items-center gap-2 px-1">
            <div className="flex -space-x-3 overflow-hidden">
              <img
                alt="Friend 1"
                className="inline-block size-10 rounded-full ring-2 ring-white dark:ring-zinc-800"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPR6bPRgB6XJ2mZPAeERV3anR3T3nmDOC4H05D6tVZd2EZ7RbsTfQZVPqQPa-I-bzXt4VwyUZApjPB5eeaDoSlnGKlg31MyR-yCDZKnY7eb6j21XqCnkUBNmZothtlQbNhiElHFAf_uHMbAdgeZth1B-kqnMtG0_L92V_c7gZgB4oLl6egKY-jRZ3b2Wv-qrEFV5lDTW2ZS91X9K3FgscsSUjFBmVmMPpwoR0OjtpKFlzFhBPvPjQngK-6QrIIOvfhi9X3zghhSY3J"
              />
              <img
                alt="Friend 2"
                className="inline-block size-10 rounded-full ring-2 ring-white dark:ring-zinc-800"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMXMFyF3SF-DNH-ye6kiup6FlyLQV1dJGJGJtdRL6pgkYbUDEdIokQc1Pxm76Hz4T1Oy9bKluJxfhcDTzd2iEnXq2xLYUWxxw2cIAAVXN1Tv_pNrvCGBhlUVXrfm4YQ-VI-ubAOKXmjL2rYgZEXLh6OKVVNfIFCUO3Vb6YtzxAVUi3E-niq6_gMfcxIYt0pwod5xChyT7-wywugOjkSZ7b-mCZoJmfXx7vLmqyEP44lj37HJYRnV7IZIyE-p9QU2tAnU3Rc-pR_aUp"
              />
              <img
                alt="Friend 3"
                className="inline-block size-10 rounded-full ring-2 ring-white dark:ring-zinc-800"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAcg1TZYJF7aFcWnNMNrPCFdz74wqCHHolbwmqcpLMEYo4_kHqI25oUTFb65HJVf_o7vyq_nj4S5l_5ZXaBveeEZSptIBab5Rh5EhetDgz4uvms0nTn846ZTBgTYYbDf-pcdNmvL37kLY_C_hvThQOi0B91M1A-nA0TXXFunwArdl41jQbn_gy_G-CTXwGoR8ZqN_wZYWdQtx4PxSFykE_tXC5GmHXkdb1i-lmnFG_i-bdUAf1kyu1PpOdWBhDsCGlWDehWwViyeQyV"
              />
              <div className="flex size-10 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 ring-2 ring-white dark:ring-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                +1
              </div>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium ml-2">
              Sofía, Luis y 2 más están aquí
            </p>
          </div>
        </div>
        )}

        {/* Security Notice */}
        {hasValidCode && (
        <div className="mx-4 mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/50 flex gap-3 items-start">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">shield_person</span>
          <p className="text-amber-800 dark:text-amber-200 text-xs leading-relaxed font-medium">
            <span className="font-bold">Seguridad:</span> Solo el anfitrión podrá confirmar el pago final y aplicar descuentos de grupo.
          </p>
        </div>
        )}
      </div>

      {/* Sticky Footer Action */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-background-dark border-t border-zinc-100 dark:border-zinc-800 px-4 sm:px-6 pt-4 pb-8 z-[60] md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
        <button
          onClick={handleFinalJoin}
          disabled={!tableCode.trim() || !hasValidCode}
          className={`w-full font-bold py-4 rounded-full shadow-lg transition-all text-lg mb-4 ${
            tableCode.trim() && hasValidCode
              ? 'bg-primary text-white shadow-primary/20 hover:opacity-90 active:scale-95'
              : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
          }`}
        >
          Unirme a la Orden
        </button>
      </div>
    </div>
  );
};

export default JoinTableScreen;
