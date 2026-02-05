import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';

interface GuestRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

const GuestRestrictionModal: React.FC<GuestRestrictionModalProps> = ({ 
  isOpen, 
  onClose, 
  featureName 
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-primary text-2xl">person_add</span>
          </div>
          <h2 className="text-[#181511] dark:text-white text-xl font-bold mb-2">
            {t('guest.restrictionTitle') || 'Función Restringida'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {t('guest.restrictionMessage', { feature: featureName }) || 
             `Para acceder a ${featureName}, necesitas crear una cuenta. ¡Es gratis y solo toma un minuto!`}
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate('/register');
            }}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-base font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
          >
            {t('guest.createAccount') || 'Crear Cuenta'}
          </button>
          
          <button
            onClick={() => {
              onClose();
              navigate('/');
            }}
            className="w-full h-12 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-xl transition-colors"
          >
            {t('guest.signIn') || 'Iniciar Sesión'}
          </button>
          
          <button
            onClick={onClose}
            className="w-full h-10 text-gray-500 dark:text-gray-400 text-sm font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {t('common.cancel') || 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestRestrictionModal;