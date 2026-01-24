import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const ResetPasswordScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Verificar si hay un token de recuperación en la URL
  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');
    
    if (type === 'recovery' && accessToken) {
      // El token está en la URL, Supabase lo manejará automáticamente
      console.log('Password reset token detected');
    }
  }, [searchParams]);

  // Validaciones de contraseña
  const passwordValidations = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasSymbol: /[!@#$%^&*(),.?":{}|<>_+\-=\[\]\\\/]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0,
    };
  }, [password, confirmPassword]);

  // Validar que todos los campos estén completos y válidos
  const isFormValid = useMemo(() => {
    const isPasswordValid = Object.values(passwordValidations).every(valid => valid);
    return password.trim() !== '' && confirmPassword.trim() !== '' && isPasswordValid;
  }, [password, confirmPassword, passwordValidations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar contraseña
    if (!password.trim()) {
      setError(t('resetPassword.pleaseEnterPassword') || 'Por favor ingresa una contraseña');
      return;
    }

    // Validar reglas de contraseña
    const missingRules: string[] = [];
    if (!passwordValidations.minLength) missingRules.push(t('resetPassword.passwordRuleMinLength') || '8 caracteres');
    if (!passwordValidations.hasNumber) missingRules.push(t('resetPassword.passwordRuleNumber') || '1 número');
    if (!passwordValidations.hasLowercase) missingRules.push(t('resetPassword.passwordRuleLowercase') || '1 minúscula');
    if (!passwordValidations.hasUppercase) missingRules.push(t('resetPassword.passwordRuleUppercase') || '1 mayúscula');
    if (!passwordValidations.hasSymbol) missingRules.push(t('resetPassword.passwordRuleSymbol') || '1 símbolo');

    if (missingRules.length > 0) {
      setError(`${t('resetPassword.passwordDoesNotMeet') || 'La contraseña no cumple con las siguientes reglas'}: ${missingRules.join(', ')}`);
      return;
    }

    // Validar confirmación de contraseña
    if (!confirmPassword.trim()) {
      setError(t('resetPassword.pleaseConfirmPassword') || 'Por favor confirma tu contraseña');
      return;
    }

    if (!passwordValidations.passwordsMatch) {
      setError(t('resetPassword.passwordsDoNotMatch') || 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      const { error: updateError } = await updatePassword(password);

      if (updateError) {
        console.error('Update password error:', updateError);
        if (updateError.message.includes('session')) {
          setError(t('resetPassword.invalidToken') || 'El enlace de recuperación ha expirado o no es válido. Por favor solicita uno nuevo.');
        } else {
          setError(updateError.message || t('resetPassword.updateError') || 'Error al actualizar la contraseña');
        }
        setIsLoading(false);
        return;
      }

      // Éxito
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Unexpected update password error:', err);
      setError(t('resetPassword.updateError') || 'Error inesperado al actualizar la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark p-4 pb-2 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button 
          onClick={() => navigate('/')} 
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
          {success 
            ? (t('resetPassword.successTitle') || '¡Contraseña actualizada!')
            : (t('resetPassword.title') || 'Restablecer contraseña')
          }
        </h1>
        <p className="text-[#181411]/60 dark:text-white/60 text-base font-normal leading-normal pb-6 text-center">
          {success 
            ? (t('resetPassword.successMessage') || 'Tu contraseña ha sido actualizada exitosamente. Serás redirigido al inicio de sesión.')
            : (t('resetPassword.subtitle') || 'Ingresa tu nueva contraseña')
          }
        </p>
      </div>

      {!success ? (
        <div className="flex flex-col flex-1 px-6 overflow-y-auto pb-24">
          <div className="max-w-[480px] mx-auto w-full space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
                  {t('resetPassword.newPassword')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    lock
                  </span>
                  <input
                    className={`w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                      error ? 'ring-2 ring-red-500' : ''
                    }`}
                    placeholder={t('resetPassword.passwordPlaceholder') || 'Ingresa tu nueva contraseña'}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                {error && (
                  <p className="text-xs text-red-500 px-1 mt-1">{error}</p>
                )}
              </div>

              {/* Validaciones de contraseña */}
              {password.length > 0 && (
                <div className="flex flex-wrap gap-x-4 gap-y-3 justify-center w-full">
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.minLength ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.minLength ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.minLength ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordRuleMinLength') || '8 caracteres'}</p>
                  </div>
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.hasNumber ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.hasNumber ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordRuleNumber') || '1 número'}</p>
                  </div>
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasLowercase ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.hasLowercase ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.hasLowercase ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordRuleLowercase') || '1 minúscula'}</p>
                  </div>
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasUppercase ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.hasUppercase ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.hasUppercase ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordRuleUppercase') || '1 mayúscula'}</p>
                  </div>
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasSymbol ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.hasSymbol ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.hasSymbol ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordRuleSymbol') || '1 símbolo'}</p>
                  </div>
                  <div className="flex gap-3 items-center w-[148px]">
                    <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                      <span className="material-symbols-outlined text-2xl">
                        {passwordValidations.passwordsMatch ? 'check_circle' : 'cancel'}
                      </span>
                    </div>
                    <p className={passwordValidations.passwordsMatch ? 'text-green-500' : 'text-red-500'}>{t('resetPassword.passwordConfirmation') || 'Confirmación'}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
                  {t('resetPassword.confirmPassword')}
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                    lock
                  </span>
                  <input
                    className="w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t('resetPassword.confirmPasswordPlaceholder') || 'Confirma tu nueva contraseña'}
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError('');
                    }}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading || !isFormValid}
                  className={`flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform ${
                    isLoading || !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      {t('resetPassword.updating') || 'Actualizando...'}
                    </>
                  ) : (
                    t('resetPassword.updatePassword') || 'Actualizar contraseña'
                  )}
                </button>
              </div>
            </form>
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
                {t('resetPassword.redirecting') || 'Serás redirigido al inicio de sesión en unos segundos...'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center rounded-xl h-14 bg-primary text-white text-base font-bold w-full shadow-lg shadow-primary/30 active:scale-[0.98] transition-transform"
              >
                {t('resetPassword.goToLogin') || 'Ir al inicio de sesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="h-6 bg-background-light dark:bg-background-dark"></div>
    </div>
  );
};

export default ResetPasswordScreen;
