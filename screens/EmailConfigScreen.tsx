
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  getBillingReceptionEmails, 
  createBillingReceptionEmail, 
  updateBillingReceptionEmail, 
  deleteBillingReceptionEmail,
  updateBillingAutoSendConfig,
  getUserBillingProfile,
  type BillingReceptionEmail
} from '../services/api/user';

interface Email {
  id: string;
  email: string;
  label?: string;
  isPrimary: boolean;
  autoSendOnPayment: boolean;
}

const EmailConfigScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSend, setAutoSend] = useState(true);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [editingEmailId, setEditingEmailId] = useState<string | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [selectedEmailIds, setSelectedEmailIds] = useState<string[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [billingProfileId, setBillingProfileId] = useState<string | undefined>();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [showHints, setShowHints] = useState(true);

  // Ocultar descripción y hints después de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDescription(false);
      setShowHints(false);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Obtener el perfil de facturación para obtener el billing_profile_id
        const billingProfile = await getUserBillingProfile();
        if (billingProfile?.success && billingProfile.data) {
          setBillingProfileId(billingProfile.data.id);
        }

        // Cargar emails de recepción
        const emailsResponse = await getBillingReceptionEmails(billingProfile?.data?.id);
        if (emailsResponse?.success) {
          // Si la respuesta es exitosa, usar los datos (puede ser un array vacío si la tabla no existe)
          const loadedEmails: Email[] = (emailsResponse.data || []).map(e => ({
            id: e.id,
            email: e.email,
            label: e.label,
            isPrimary: e.is_primary,
            autoSendOnPayment: e.auto_send_on_payment
          }));
          setEmails(loadedEmails);
          
          // Seleccionar emails que tienen auto_send_on_payment activo
          const activeEmails = loadedEmails.filter(e => e.autoSendOnPayment);
          setSelectedEmailIds(activeEmails.map(e => e.id));
          
          // Si hay emails, usar el auto_send del primero como referencia
          if (loadedEmails.length > 0) {
            setAutoSend(loadedEmails[0].autoSendOnPayment);
          }
        } else if (emailsResponse?.error) {
          // Solo mostrar error si no es el caso de tabla no existente
          if (!emailsResponse.error.includes('no existe') && !emailsResponse.error.includes('Could not find')) {
            console.warn('[EmailConfig] No se pudieron cargar los emails:', emailsResponse.error);
          }
        }
      } catch (error: any) {
        // Solo mostrar error si no es el caso de tabla no existente
        if (!error.message?.includes('no existe') && !error.message?.includes('Could not find')) {
          console.error('[EmailConfig] Error loading emails:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const handleAddEmail = async () => {
    if (!newEmail.trim() || !user?.id) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim())) {
      alert('Por favor, ingresa un email válido');
      return;
    }

    setIsSaving(true);
    try {
      const response = await createBillingReceptionEmail({
        billing_profile_id: billingProfileId,
        email: newEmail.trim(),
        is_primary: emails.length === 0, // Primer email es primary
        auto_send_on_payment: autoSend
      });

      if (response?.success && response.data) {
        const newEmailObj: Email = {
          id: response.data.id,
          email: response.data.email,
          label: response.data.label,
          isPrimary: response.data.is_primary,
          autoSendOnPayment: response.data.auto_send_on_payment
        };
        setEmails([...emails, newEmailObj]);
        setSelectedEmailIds([...selectedEmailIds, newEmailObj.id]);
        setNewEmail('');
        setShowAddEmail(false);
      }
    } catch (error) {
      console.error('Error adding email:', error);
      setNotification({ message: 'Error al agregar el email. Por favor, intenta nuevamente.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditEmail = (id: string) => {
    const email = emails.find(e => e.id === id);
    if (email) {
      setEditingEmailId(id);
      setEditingEmailValue(email.email);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editingEmailValue.trim() || !user?.id) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmailValue.trim())) {
      alert('Por favor, ingresa un email válido');
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateBillingReceptionEmail(id, {
        email: editingEmailValue.trim()
      });

      if (response?.success && response.data) {
        setEmails(emails.map(e => 
          e.id === id ? { ...e, email: response.data!.email } : e
        ));
        setEditingEmailId(null);
        setEditingEmailValue('');
      }
    } catch (error) {
      console.error('Error updating email:', error);
      setNotification({ message: 'Error al actualizar el email. Por favor, intenta nuevamente.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingEmailId(null);
    setEditingEmailValue('');
  };

  const handleDeleteEmail = async (id: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const response = await deleteBillingReceptionEmail(id);
      if (response?.success) {
        const updatedEmails = emails.filter(e => e.id !== id);
        setEmails(updatedEmails);
        setSelectedEmailIds(selectedEmailIds.filter(emailId => emailId !== id));
      }
    } catch (error) {
      console.error('Error deleting email:', error);
      setNotification({ message: 'Error al eliminar el email. Por favor, intenta nuevamente.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmailSelection = async (id: string) => {
    if (!user?.id) return;

    const email = emails.find(e => e.id === id);
    if (!email) return;

    const newAutoSend = !email.autoSendOnPayment;

    // Si se está desactivando y es el último activo, no permitir
    if (!newAutoSend && selectedEmailIds.length === 1 && selectedEmailIds.includes(id)) {
      setNotification({ message: 'Debes tener al menos un email activo para recibir facturas', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsSaving(true);
    try {
      const response = await updateBillingReceptionEmail(id, {
        auto_send_on_payment: newAutoSend
      });

      if (response?.success && response.data) {
        setEmails(emails.map(e => 
          e.id === id ? { ...e, autoSendOnPayment: response.data!.auto_send_on_payment } : e
        ));

        if (newAutoSend) {
          setSelectedEmailIds([...selectedEmailIds, id]);
        } else {
          setSelectedEmailIds(selectedEmailIds.filter(emailId => emailId !== id));
        }
      }
    } catch (error) {
      console.error('Error updating email selection:', error);
      setNotification({ message: 'Error al actualizar la selección. Por favor, intenta nuevamente.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      // Actualizar configuración de auto_send para todos los emails
      await updateBillingAutoSendConfig(autoSend, billingProfileId);
      
      // Navegar a la siguiente pantalla
      navigate('/billing-step-4');
    } catch (error) {
      console.error('Error saving configuration:', error);
      setNotification({ message: 'Error al guardar la configuración. Por favor, intenta nuevamente.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">{t('emailConfig.title')}</h2>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full pb-48">
        <div className="px-4 pt-6">
          <div className="flex gap-1.5 w-full h-1">
            <div className="flex-1 bg-primary rounded-full"></div>
            <div className="flex-1 bg-primary rounded-full"></div>
            <div className="flex-1 bg-primary rounded-full"></div>
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          </div>
          <p className="text-xs font-semibold text-primary mt-3 uppercase tracking-wider">{t('emailConfig.step3of4')}</p>
        </div>

        <section className="px-4 pt-4">
          <h3 className="text-[#181411] dark:text-white tracking-tight text-3xl font-extrabold leading-tight">{t('emailConfig.whereToSend')}</h3>
          {showDescription && (
            <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-relaxed pt-2 transition-opacity duration-300">
              {t('emailConfig.whereToSendDesc')}
            </p>
          )}
        </section>

        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-tight">{t('emailConfig.receptionEmails')}</h4>
            <span 
              className="text-xs text-primary font-bold opacity-50 cursor-default hover:opacity-100 transition-opacity"
              onClick={() => setShowAddEmail(true)}
            >
              + {t('emailConfig.addAnother')}
            </span>
          </div>
          <div className="space-y-3">
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-4xl">mail</span>
                </div>
                {showHints && (
                  <>
                    <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-2 transition-opacity duration-300">{t('emailConfig.noEmailsConfigured')}</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 transition-opacity duration-300">{t('emailConfig.addEmailToReceive')}</p>
                  </>
                )}
                <button
                  onClick={() => setShowAddEmail(true)}
                  className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-[#e07d1d] transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>{t('emailConfig.addEmail')}</span>
                </button>
              </div>
            ) : (
              emails.map((email) => (
                editingEmailId === email.id ? (
                <div key={email.id} className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-primary/30 ring-4 ring-primary/5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </div>
                      <input
                        autoFocus
                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#181411] dark:text-white placeholder:text-gray-400 outline-none"
                        placeholder={t('emailConfig.emailPlaceholder')}
                        type="email"
                        value={editingEmailValue}
                        onChange={(e) => setEditingEmailValue(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={() => handleSaveEdit(email.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-[#e07d1d] transition-colors"
                      >
                        {t('common.save')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <EmailItem
                  key={email.id}
                  id={email.id}
                  email={email.email}
                  label={email.label}
                  isPrimary={email.isPrimary}
                  isSelected={selectedEmailIds.includes(email.id)}
                  onSelect={() => handleToggleEmailSelection(email.id)}
                  onEdit={handleEditEmail}
                  onDelete={handleDeleteEmail}
                />
              )
              ))
            )}
            
            {showAddEmail && (
              <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border-2 border-primary/30 ring-4 ring-primary/5">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-xl">add</span>
                    </div>
                    <input
                      autoFocus
                      className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#181411] dark:text-white placeholder:text-gray-400 outline-none"
                      placeholder={t('emailConfig.emailPlaceholder')}
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setShowAddEmail(false);
                        setNewEmail('');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleAddEmail}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-[#e07d1d] transition-colors"
                    >
                      {t('common.confirm')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed left-0 right-0 bg-white/95 dark:bg-background-dark/95 ios-blur border-t border-gray-100 dark:border-gray-800 z-50" style={{ bottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <div className="max-w-md mx-auto px-4 pt-4 pb-4">
          <button
            onClick={handleContinue}
            disabled={isSaving || isLoading}
            className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : t('emailConfig.continueToFinalStep')}
          </button>
        </div>
      </div>

      {/* Notificación temporal */}
      {notification && (
        <div 
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] px-6 py-4 rounded-xl shadow-2xl max-w-sm w-full mx-4 transition-all duration-300 ${
            notification.type === 'success' 
              ? 'bg-green-500 text-white' 
              : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
          style={{ animation: 'slideDown 0.3s ease-out' }}
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">
              {notification.type === 'success' ? 'check_circle' : notification.type === 'error' ? 'error' : 'info'}
            </span>
            <p className="font-semibold text-sm flex-1">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

interface EmailItemProps {
  id: string;
  email: string;
  label?: string;
  isPrimary: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EmailItem: React.FC<EmailItemProps> = ({ id, email, label, isPrimary, isSelected, onSelect, onEdit, onDelete }) => {
  const { t } = useTranslation();
  
  return (
  <div 
    onClick={onSelect}
    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ${
      isSelected
        ? 'bg-primary/5 dark:bg-primary/10 border-2 border-primary ring-2 ring-primary/20'
        : 'bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:border-primary/50'
    }`}
  >
    <div className="flex items-center gap-3 flex-1">
      <div className={`size-10 ${isPrimary ? 'bg-orange-50 dark:bg-orange-900/20' : 'bg-gray-50 dark:bg-gray-800'} rounded-full flex items-center justify-center ${isPrimary ? 'text-primary' : 'text-gray-400'}`}>
        <span className="material-symbols-outlined text-xl">mail</span>
      </div>
      <div className="flex-1">
        <p className={`text-sm font-semibold leading-none ${isSelected ? 'text-primary' : 'text-[#181411] dark:text-white'}`}>{email}</p>
        {label && <p className="text-[11px] text-gray-500 mt-1 uppercase font-bold tracking-wider">{label}</p>}
      </div>
      {isSelected && (
        <div className="flex items-center justify-center size-6 rounded-full bg-primary">
          <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
        </div>
      )}
    </div>
    <div className="flex items-center gap-2 ml-2" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onEdit(id)}
        className="text-gray-400 hover:text-primary transition-colors p-1"
      >
        <span className="material-symbols-outlined text-xl">edit</span>
      </button>
      <button
        onClick={() => onDelete(id)}
        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
        title={t('emailConfig.deleteEmail')}
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  </div>
  );
};

export default EmailConfigScreen;
