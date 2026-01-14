import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RegisterScreenProps {
  onLogin: () => void;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleContinue = () => {
    // Aquí se podría agregar validación y lógica de registro
    onLogin();
    navigate('/home');
  };

  const handleSocialAuth = () => {
    onLogin();
    navigate('/home');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <div className="@container w-full">
        <div className="@[480px]:px-4 @[480px]:py-3">
          <div
            className="relative w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden bg-white @[480px]:rounded-xl min-h-[35vh]"
            style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU")' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background-light/95 via-transparent to-transparent dark:from-background-dark/95"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center px-6 relative -mt-6 z-10">
        <h1 className="text-[#181411] dark:text-white tracking-tight text-[32px] font-bold leading-tight text-center pb-1">
          ¡Buen día!
        </h1>
        <p className="text-[#181411]/60 dark:text-white/60 text-base font-normal leading-normal pb-6 text-center">
          Ingresa tus datos para continuar
        </p>
      </div>

      <div className="flex flex-col flex-1 px-6">
        <div className="max-w-[480px] mx-auto w-full space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              Correo electrónico
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                mail
              </span>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="ejemplo@correo.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              Número de teléfono
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                phone_iphone
              </span>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="+52 000 000 0000"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleContinue}
              className="flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
            >
              Continuar
            </button>
          </div>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-[#e5e7eb] dark:border-white/10"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-[#181411]/40 dark:text-white/30 uppercase tracking-widest">
              O continúa con
            </span>
            <div className="flex-grow border-t border-[#e5e7eb] dark:border-white/10"></div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleSocialAuth}
              className="flex flex-1 items-center justify-center rounded-xl h-12 bg-white dark:bg-white/5 border border-[#e5e7eb] dark:border-white/10 shadow-sm active:bg-gray-50 dark:active:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </button>
            <button
              onClick={handleSocialAuth}
              className="flex flex-1 items-center justify-center rounded-xl h-12 bg-white dark:bg-white/5 border border-[#e5e7eb] dark:border-white/10 shadow-sm active:bg-gray-50 dark:active:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </button>
            <button
              onClick={handleSocialAuth}
              className="flex flex-1 items-center justify-center rounded-xl h-12 bg-white dark:bg-white/5 border border-[#e5e7eb] dark:border-white/10 shadow-sm active:bg-gray-50 dark:active:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#1877F2">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-auto py-8">
          <p className="text-[#8a7560] dark:text-primary/70 text-sm font-medium leading-normal text-center">
            ¿Ya tienes cuenta?{' '}
            <span
              className="underline cursor-pointer text-primary font-bold"
              onClick={() => navigate('/')}
            >
              Inicia sesión
            </span>
          </p>
        </div>
      </div>

      <div className="h-6 bg-background-light dark:bg-background-dark"></div>
    </div>
  );
};

export default RegisterScreen;
