import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface RegisterScreenProps {
  onLogin: () => void;
}

interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
}

const countryCodes: CountryCode[] = [
  { code: 'MX', dialCode: '+52', name: 'México' },
  { code: 'US', dialCode: '+1', name: 'Estados Unidos' },
  { code: 'CA', dialCode: '+1', name: 'Canadá' },
  { code: 'ES', dialCode: '+34', name: 'España' },
  { code: 'AR', dialCode: '+54', name: 'Argentina' },
  { code: 'CO', dialCode: '+57', name: 'Colombia' },
  { code: 'CL', dialCode: '+56', name: 'Chile' },
  { code: 'PE', dialCode: '+51', name: 'Perú' },
  { code: 'VE', dialCode: '+58', name: 'Venezuela' },
  { code: 'EC', dialCode: '+593', name: 'Ecuador' },
  { code: 'GT', dialCode: '+502', name: 'Guatemala' },
  { code: 'CU', dialCode: '+53', name: 'Cuba' },
  { code: 'BO', dialCode: '+591', name: 'Bolivia' },
  { code: 'DO', dialCode: '+1', name: 'República Dominicana' },
  { code: 'HN', dialCode: '+504', name: 'Honduras' },
  { code: 'PY', dialCode: '+595', name: 'Paraguay' },
  { code: 'SV', dialCode: '+503', name: 'El Salvador' },
  { code: 'NI', dialCode: '+505', name: 'Nicaragua' },
  { code: 'CR', dialCode: '+506', name: 'Costa Rica' },
  { code: 'PA', dialCode: '+507', name: 'Panamá' },
  { code: 'UY', dialCode: '+598', name: 'Uruguay' },
  { code: 'BR', dialCode: '+55', name: 'Brasil' },
];

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { signUp, signIn } = useAuth();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<CountryCode>(countryCodes[0]);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailOrPhoneError, setEmailOrPhoneError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Función para hacer scroll al campo que tiene el focus
  const scrollToFocusedField = (element: HTMLInputElement | null) => {
    if (element && containerRef.current) {
      setTimeout(() => {
        const container = containerRef.current;
        if (container) {
          const elementRect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const scrollTop = container.scrollTop;
          const elementTop = elementRect.top - containerRect.top + scrollTop;
          
          // Calcular la posición para centrar el campo en la vista
          const scrollPosition = elementTop - (containerRect.height / 2) + (elementRect.height / 2);
          
          container.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  // Detectar si el input es un teléfono o email
  const inputType = useMemo(() => {
    const trimmed = emailOrPhone.trim();
    if (!trimmed) return null;
    
    // Si contiene @, es definitivamente email
    if (trimmed.includes('@')) {
      return 'email';
    }
    
    // Si solo tiene números, espacios, + y guiones, es teléfono
    if (/^[\d\s+\-()]+$/.test(trimmed)) {
      // Si tiene letras, no es teléfono
      if (/[a-zA-Z]/.test(trimmed)) {
        return 'email';
      }
      return 'phone';
    }
    
    // Si tiene letras y no tiene @, podría ser email incompleto
    if (/[a-zA-Z]/.test(trimmed)) {
      return 'email';
    }
    
    // Por defecto, si solo tiene números, es teléfono
    return 'phone';
  }, [emailOrPhone]);


  // Validar formato de email
  const isValidEmail = useMemo(() => {
    if (inputType !== 'email' || !emailOrPhone.trim()) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailOrPhone.trim());
  }, [emailOrPhone, inputType]);

  // Validar formato de teléfono
  const isValidPhone = useMemo(() => {
    if (inputType !== 'phone' || !emailOrPhone.trim()) return true;
    const phoneNumber = emailOrPhone.replace(/[\s\-()]/g, '');
    // Remover el código de país si ya está incluido
    const dialCodeRegex = new RegExp(`^\\+?${selectedCountryCode.dialCode.replace('+', '')}`);
    const numberWithoutCode = phoneNumber.replace(dialCodeRegex, '');
    // Mínimo 7 dígitos, máximo 15 dígitos (sin contar código de país)
    const digitsOnly = numberWithoutCode.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  }, [emailOrPhone, inputType, selectedCountryCode]);

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
    // Validar que el campo de email/teléfono esté lleno y sea válido
    const isEmailOrPhoneValid = emailOrPhone.trim() !== '' && 
      (inputType === 'email' ? isValidEmail : inputType === 'phone' ? isValidPhone : false);
    
    // Validar que todas las reglas de contraseña se cumplan
    const isPasswordValid = Object.values(passwordValidations).every(valid => valid);
    
    return isEmailOrPhoneValid && isPasswordValid;
  }, [emailOrPhone, inputType, isValidEmail, isValidPhone, passwordValidations]);

  // Limpiar mensajes de error cuando el usuario corrige los campos
  useEffect(() => {
    if (emailOrPhoneError && (emailOrPhone.trim() && (inputType === 'email' ? isValidEmail : inputType === 'phone' ? isValidPhone : false))) {
      setEmailOrPhoneError('');
    }
    if (passwordError && password.trim() && Object.values(passwordValidations).slice(0, 5).every(valid => valid)) {
      setPasswordError('');
    }
    if (confirmPasswordError && confirmPassword.trim() && passwordValidations.passwordsMatch) {
      setConfirmPasswordError('');
    }
  }, [emailOrPhone, password, confirmPassword, emailOrPhoneError, passwordError, confirmPasswordError, inputType, isValidEmail, isValidPhone, passwordValidations]);

  const handleContinue = async () => {
    // Limpiar mensajes de error anteriores
    setEmailOrPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');
    
    // Validar campo de correo/teléfono
    if (!emailOrPhone.trim()) {
      setEmailOrPhoneError(t('register.pleaseEnterEmailOrPhone'));
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToFocusedField(inputRef.current);
      }, 0);
      return;
    }
    
    // Validar formato de correo/teléfono
    if (inputType === 'email' && !isValidEmail) {
      setEmailOrPhoneError(t('register.invalidEmail'));
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToFocusedField(inputRef.current);
      }, 0);
      return;
    }
    
    if (inputType === 'phone' && !isValidPhone) {
      setEmailOrPhoneError(t('register.invalidPhone'));
      setTimeout(() => {
        inputRef.current?.focus();
        scrollToFocusedField(inputRef.current);
      }, 0);
      return;
    }
    
    // Validar contraseña
    if (!password.trim()) {
      setPasswordError(t('register.pleaseEnterPassword'));
      setTimeout(() => {
        passwordRef.current?.focus();
        scrollToFocusedField(passwordRef.current);
      }, 0);
      return;
    }
    
    // Validar reglas de contraseña
    const missingRules: string[] = [];
    if (!passwordValidations.minLength) missingRules.push(t('register.passwordRuleMinLength'));
    if (!passwordValidations.hasNumber) missingRules.push(t('register.passwordRuleNumber'));
    if (!passwordValidations.hasLowercase) missingRules.push(t('register.passwordRuleLowercase'));
    if (!passwordValidations.hasUppercase) missingRules.push(t('register.passwordRuleUppercase'));
    if (!passwordValidations.hasSymbol) missingRules.push(t('register.passwordRuleSymbol'));
    
    if (missingRules.length > 0) {
      setPasswordError(`${t('register.passwordDoesNotMeet')}: ${missingRules.join(', ')}`);
      setTimeout(() => {
        passwordRef.current?.focus();
        scrollToFocusedField(passwordRef.current);
      }, 0);
      return;
    }
    
    // Validar confirmación de contraseña
    if (!confirmPassword.trim()) {
      setConfirmPasswordError(t('register.pleaseConfirmPassword'));
      setTimeout(() => {
        confirmPasswordRef.current?.focus();
        scrollToFocusedField(confirmPasswordRef.current);
      }, 0);
      return;
    }
    
    if (!passwordValidations.passwordsMatch) {
      setConfirmPasswordError(t('register.passwordsDoNotMatch'));
      setTimeout(() => {
        confirmPasswordRef.current?.focus();
        scrollToFocusedField(confirmPasswordRef.current);
      }, 0);
      return;
    }
    
    // Si todas las validaciones pasan
    if (isFormValid) {
      setIsLoading(true);
      setEmailOrPhoneError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setSuccessMessage('');

      try {
        // Determinar si es email o teléfono
        let email = '';
        let phone = undefined;

        if (inputType === 'email') {
          email = emailOrPhone.trim();
        } else if (inputType === 'phone') {
          // Para teléfono, usar email temporal o requerir email
          // Por ahora, requerimos email para registro
          setEmailOrPhoneError(t('register.pleaseUseEmail') || 'Por favor usa tu correo electrónico para registrarte');
          setIsLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password, phone);

        if (signUpError) {
          console.error('Registration error:', signUpError);
          if (signUpError.message.includes('User already registered')) {
            setEmailOrPhoneError(t('register.userAlreadyExists') || 'Este correo ya está registrado');
          } else if (signUpError.message.includes('Password')) {
            setPasswordError(signUpError.message);
          } else {
            setEmailOrPhoneError(signUpError.message || t('register.registrationError') || 'Error al registrarse');
          }
          setIsLoading(false);
          return;
        }

        // Registro exitoso - verificar si hay error de email duplicado
        if (signUpError && signUpError.message?.includes('ya está registrado')) {
          // El email ya existe, redirigir al login
          setEmailOrPhoneError(signUpError.message);
          setIsLoading(false);
          setTimeout(() => {
            onLogin();
          }, 2000);
        } else if (signUpError && (signUpError.message?.includes('Email not confirmed') || 
                                   signUpError.message?.includes('email_not_confirmed'))) {
          // El email no está confirmado - el usuario debe confirmar antes de iniciar sesión
          setSuccessMessage(t('register.emailConfirmationRequired') || 'Por favor, confirma tu correo electrónico antes de iniciar sesión.');
          setIsLoading(false);
          setTimeout(() => {
            onLogin();
          }, 3000);
        } else {
          // Registro exitoso - verificar si hay sesión antes de redirigir
          // Esperar un momento para que la sesión se establezca (si el signIn automático funcionó)
          setTimeout(() => {
            // Verificar si hay sesión antes de redirigir
            // Si no hay sesión, redirigir al login
            setSuccessMessage(t('register.registrationSuccess') || '¡Registro exitoso! Redirigiendo...');
            // Intentar redirigir a home, pero si no hay sesión, onAuthStateChange manejará el login
            navigate('/home');
          }, 1500);
        }
      } catch (err) {
        console.error('Unexpected registration error:', err);
        setEmailOrPhoneError(t('register.registrationError') || 'Error inesperado al registrarse');
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 bg-background-light dark:bg-background-dark p-4 pb-2 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
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
          {t('register.title')}
        </h1>
        <p className="text-[#181411]/60 dark:text-white/60 text-base font-normal leading-normal pb-6 text-center">
          {t('register.subtitle')}
        </p>
      </div>

      <div ref={containerRef} className="flex flex-col flex-1 px-6 overflow-y-auto pb-24">
        <div className="max-w-[480px] mx-auto w-full space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              {t('register.emailOrPhone')}
            </label>
            <div className="relative flex items-center">
              {inputType === 'phone' && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCountrySelector(!showCountrySelector)}
                    className="flex items-center gap-2 h-14 pl-4 pr-3 rounded-l-xl bg-white dark:bg-white/5 border-r border-gray-200 dark:border-gray-700 text-[#181411] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                  >
                    <span>{selectedCountryCode.dialCode}</span>
                    <span className="material-symbols-outlined text-lg">
                      {showCountrySelector ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>
                  
                  {showCountrySelector && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowCountrySelector(false)}
                      />
                      <div className="absolute top-full left-0 mt-2 w-64 max-h-60 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                        {countryCodes.map((country) => (
                          <button
                            key={country.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountryCode(country);
                              setShowCountrySelector(false);
                            }}
                            className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-between ${
                              selectedCountryCode.code === country.code ? 'bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-[#181411] dark:text-white">
                                {country.dialCode}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {country.name}
                              </span>
                            </div>
                            {selectedCountryCode.code === country.code && (
                              <span className="material-symbols-outlined text-primary text-lg">
                                check
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="relative flex-1">
                <span className={`material-symbols-outlined absolute ${inputType === 'phone' ? 'left-4' : 'left-4'} top-1/2 -translate-y-1/2 text-primary`}>
                  {inputType === 'phone' ? 'phone_iphone' : 'mail'}
                </span>
                <input
                  ref={inputRef}
                  className={`w-full h-14 ${inputType === 'phone' ? 'pl-12 pr-4 rounded-r-xl' : 'pl-12 pr-4 rounded-xl'} border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary ${
                    (inputType === 'email' && !isValidEmail) || (inputType === 'phone' && !isValidPhone)
                      ? 'ring-2 ring-red-500'
                      : ''
                  }`}
                  placeholder={inputType === 'phone' ? `${selectedCountryCode.dialCode} ${t('register.phonePlaceholder')}` : t('register.emailPlaceholder')}
                  type="text"
                  inputMode={inputType === 'phone' ? 'tel' : 'email'}
                  value={emailOrPhone}
                  onFocus={(e) => {
                    scrollToFocusedField(e.target);
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    const input = e.target;
                    const cursorPosition = input.selectionStart || 0;
                    
                    setEmailOrPhone(value);
                    // Limpiar mensaje de error cuando el usuario empieza a escribir
                    if (emailOrPhoneError) {
                      setEmailOrPhoneError('');
                    }
                    
                    // Preservar la posición del cursor después del re-render
                    requestAnimationFrame(() => {
                      if (inputRef.current) {
                        try {
                          const newPosition = Math.min(cursorPosition, value.length);
                          inputRef.current.setSelectionRange(newPosition, newPosition);
                        } catch (e) {
                          // Ignorar errores
                        }
                      }
                    });
                  }}
                />
              </div>
            </div>
            
            {/* Mensajes de validación */}
            {emailOrPhoneError && (
              <p className="text-xs text-red-500 px-1 mt-1">
                {emailOrPhoneError}
              </p>
            )}
            {successMessage && (
              <p className="text-xs text-green-500 px-1 mt-1">
                {successMessage}
              </p>
            )}
            {!emailOrPhoneError && inputType === 'email' && emailOrPhone.trim() && !isValidEmail && (
              <p className="text-xs text-red-500 px-1 mt-1">
                Por favor ingresa un número de teléfono o correo electrónico válido
              </p>
            )}
            {!emailOrPhoneError && inputType === 'phone' && emailOrPhone.trim() && !isValidPhone && (
              <p className="text-xs text-red-500 px-1 mt-1">
                {t('register.invalidPhone')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              {t('register.password')}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                lock
              </span>
              <input
                ref={passwordRef}
                className="w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('register.passwordPlaceholder')}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onFocus={(e) => {
                  scrollToFocusedField(e.target);
                }}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Limpiar mensaje de error cuando el usuario empieza a escribir
                  if (passwordError) {
                    setPasswordError('');
                  }
                }}
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
            {/* Mensaje de error de contraseña */}
            {passwordError && (
              <p className="text-xs text-red-500 px-1 mt-1">
                {passwordError}
              </p>
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
                <p className={passwordValidations.minLength ? 'text-green-500' : 'text-red-500'}>{t('register.passwordRuleMinLength')}</p>
              </div>
              <div className="flex gap-3 items-center w-[148px]">
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasNumber ? 'text-green-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {passwordValidations.hasNumber ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p className={passwordValidations.hasNumber ? 'text-green-500' : 'text-red-500'}>{t('register.passwordRuleNumber')}</p>
              </div>
              <div className="flex gap-3 items-center w-[148px]">
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasLowercase ? 'text-green-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {passwordValidations.hasLowercase ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p className={passwordValidations.hasLowercase ? 'text-green-500' : 'text-red-500'}>{t('register.passwordRuleLowercase')}</p>
              </div>
              <div className="flex gap-3 items-center w-[148px]">
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasUppercase ? 'text-green-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {passwordValidations.hasUppercase ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p className={passwordValidations.hasUppercase ? 'text-green-500' : 'text-red-500'}>{t('register.passwordRuleUppercase')}</p>
              </div>
              <div className="flex gap-3 items-center w-[148px]">
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.hasSymbol ? 'text-green-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {passwordValidations.hasSymbol ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p className={passwordValidations.hasSymbol ? 'text-green-500' : 'text-red-500'}>{t('register.passwordRuleSymbol')}</p>
              </div>
              <div className="flex gap-3 items-center w-[148px]">
                <div className={`flex justify-center items-center w-8 h-8 rounded-full ${passwordValidations.passwordsMatch ? 'text-green-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-2xl">
                    {passwordValidations.passwordsMatch ? 'check_circle' : 'cancel'}
                  </span>
                </div>
                <p className={passwordValidations.passwordsMatch ? 'text-green-500' : 'text-red-500'}>{t('register.passwordConfirmation')}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#181411]/80 dark:text-white/80 px-1">
              Repetir contraseña
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">
                lock
              </span>
              <input
                ref={confirmPasswordRef}
                className="w-full h-14 pl-12 pr-12 rounded-xl border-none bg-white dark:bg-white/5 shadow-sm text-base placeholder:text-[#181411]/40 dark:placeholder:text-white/30 text-[#181411] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('register.confirmPasswordPlaceholder')}
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onFocus={(e) => {
                  scrollToFocusedField(e.target);
                }}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  // Limpiar mensaje de error cuando el usuario empieza a escribir
                  if (confirmPasswordError) {
                    setConfirmPasswordError('');
                  }
                }}
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
            {/* Mensaje de error de confirmación de contraseña */}
            {confirmPasswordError && (
              <p className="text-xs text-red-500 px-1 mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto py-8">
          <p className="text-[#8a7560] dark:text-primary/70 text-sm font-medium leading-normal text-center">
            {t('register.alreadyHaveAccount')}{' '}
            <span
              className="underline cursor-pointer text-primary font-bold"
              onClick={() => navigate('/')}
            >
              {t('register.login')}
            </span>
          </p>
        </div>
      </div>

      {/* Botón Registrarse sticky en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 w-full px-4 sm:px-6 pb-6 pt-4 bg-background-light dark:bg-background-dark border-t border-gray-100 dark:border-gray-800 z-50 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
        <button
          onClick={handleContinue}
          disabled={isLoading || !isFormValid}
          className={`flex items-center justify-center rounded-xl h-14 text-white text-base font-bold w-full shadow-lg active:scale-[0.98] transition-transform ${
            isFormValid && !isLoading
              ? 'bg-primary shadow-primary/30 cursor-pointer' 
              : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
          }`}
        >
          {isLoading ? (
            <>
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              {t('register.creatingAccount') || 'Creando cuenta...'}
            </>
          ) : (
            t('register.createAccount')
          )}
        </button>
      </div>

      <div className="h-6 bg-background-light dark:bg-background-dark"></div>
    </div>
  );
};

export default RegisterScreen;
