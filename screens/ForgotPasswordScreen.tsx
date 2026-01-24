import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError(t('forgotPassword.pleaseEnterEmail') || 'Por favor ingresa tu correo electrónico');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError(t('forgotPassword.invalidEmail') || 'Por favor ingresa un correo electrónico válido');
      return;
    }

    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email.trim());

      if (resetError) {
        console.error('Reset password error:', resetError);
        if (resetError.message.includes('not found') || resetError.message.includes('does not exist')) {
          setError(t('forgotPassword.emailNotFound') || 'No encontramos una cuenta con este correo electrónico');
        } else {
          setError(resetError.message || t('forgotPassword.resetError') || 'Error al enviar el correo de recuperación');
        }
        setIsLoading(false);
        return;
      }

      // Éxito
      setSuccess(true);
    } catch (err) {
      console.error('Unexpected reset password error:', err);
      setError(t('forgotPassword.resetError') || 'Error inesperado al enviar el correo de recuperación');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark p-4 pb-2 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button 
          onClick={() => navigate(-1)} 
          className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">chevron_left</span>
        </button>
      </header>

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
          {t('forgotPassword.title')}
        </h1>
        <p className="text-[#181411]/60 dark:text-white/60 text-base font-normal leading-normal pb-6 text-center">
          {success 
            ? (t('forgotPassword.successMessage') || 'Te hemos enviado un correo con las instrucciones para recuperar tu contraseña')
            : (t('forgotPassword.subtitle') || 'Ingresa tu correo electrónico y te enviaremos un enlace para recuperar tu contraseña')
          }
        </p>
      </div>

      {!success ? (
        <div className="flex flex-col flex-1 px-6">
          <div className="max-w-[480px] mx-auto w-full space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
                  {t('forgotPassword.email')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    mail
                  </span>
                  <input
                    className={`w-full h-14 pl-12 pr-4 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                      error ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder={t('forgotPassword.emailPlaceholder') || 'ejemplo@correo.com'}
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500 px-1 mt-1">{error}</p>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className={`flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform ${
                    isLoading || !email.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('forgotPassword.sending') || 'Enviando...'}
                    </>
                  ) : (
                    t('forgotPassword.sendResetLink') || 'Enviar enlace de recuperación'
                  )}
                </button>
              </div>
            </form>

            <div className="pt-4">
              <button
                onClick={() => navigate('/')}
                className="w-full text-center text-sm text-primary font-medium hover:text-primary/80 transition-colors"
              >
                {t('forgotPassword.backToLogin') || 'Volver al inicio de sesión'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 px-6">
          <div className="max-w-[480px] mx-auto w-full space-y-4">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">
                  check_circle
                </span>
              </div>
              <p className="text-center text-[#181411] dark:text-white text-base mb-6">
                {t('forgotPassword.checkEmail') || 'Revisa tu correo electrónico y sigue las instrucciones para restablecer tu contraseña.'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
              >
                {t('forgotPassword.backToLogin') || 'Volver al inicio de sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6 bg-background-light dark:bg-background-dark"></div>
    </div>
  );
};

export default ForgotPasswordScreen;
