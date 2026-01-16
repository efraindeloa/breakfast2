
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Email {
  id: number;
  email: string;
  label?: string;
  isPrimary: boolean;
}

const EmailConfigScreen: React.FC = () => {
  const navigate = useNavigate();
  const [autoSend, setAutoSend] = useState(true);
  const [showAddEmail, setShowAddEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [editingEmailId, setEditingEmailId] = useState<number | null>(null);
  const [editingEmailValue, setEditingEmailValue] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<number | null>(1); // Por defecto el primer correo está seleccionado
  const [emails, setEmails] = useState<Email[]>([
    { id: 1, email: 'juan.perez@empresa.com', isPrimary: true },
    { id: 2, email: 'contabilidad@empresa.com', isPrimary: false },
  ]);

  const handleAddEmail = () => {
    if (newEmail.trim()) {
      const newId = Math.max(...emails.map(e => e.id), 0) + 1;
      const newEmails = [...emails, { id: newId, email: newEmail.trim(), isPrimary: false }];
      setEmails(newEmails);
      setSelectedEmailId(newId); // Seleccionar el nuevo correo agregado
      setNewEmail('');
      setShowAddEmail(false);
    }
  };

  const handleEditEmail = (id: number) => {
    const email = emails.find(e => e.id === id);
    if (email) {
      setEditingEmailId(id);
      setEditingEmailValue(email.email);
    }
  };

  const handleSaveEdit = (id: number) => {
    if (editingEmailValue.trim()) {
      setEmails(emails.map(e => 
        e.id === id ? { ...e, email: editingEmailValue.trim() } : e
      ));
      setEditingEmailId(null);
      setEditingEmailValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingEmailId(null);
    setEditingEmailValue('');
  };

  const handleDeleteEmail = (id: number) => {
    const email = emails.find(e => e.id === id);
    if (email) {
      const updatedEmails = emails.filter(e => e.id !== id);
      setEmails(updatedEmails);
      
      // Si se eliminó el correo seleccionado, seleccionar otro o limpiar selección
      if (selectedEmailId === id) {
        if (updatedEmails.length > 0) {
          setSelectedEmailId(updatedEmails[0].id);
        } else {
          setSelectedEmailId(null);
        }
      }
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 ios-blur border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
            <span className="material-symbols-outlined text-xl text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
          </button>
          <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">Configuración de Envío</h2>
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
          <p className="text-xs font-semibold text-primary mt-3 uppercase tracking-wider">Paso 3 de 4</p>
        </div>

        <section className="px-4 pt-4">
          <h3 className="text-[#181411] dark:text-white tracking-tight text-3xl font-extrabold leading-tight">¿A dónde enviamos tus facturas?</h3>
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-relaxed pt-2">
            Configura los correos electrónicos donde recibirás automáticamente tus archivos XML y PDF cada mañana.
          </p>
        </section>

        <div className="px-4 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[#181411] dark:text-white text-sm font-bold uppercase tracking-tight">Correos de recepción</h4>
            <span 
              className="text-xs text-primary font-bold opacity-50 cursor-default hover:opacity-100 transition-opacity"
              onClick={() => setShowAddEmail(true)}
            >
              + Agregar otro
            </span>
          </div>
          <div className="space-y-3">
            {emails.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
                  <span className="material-symbols-outlined text-primary text-4xl">mail</span>
                </div>
                <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-2">No hay correos configurados</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Agrega un correo electrónico para recibir tus facturas</p>
                <button
                  onClick={() => setShowAddEmail(true)}
                  className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-[#e07d1d] transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  <span>Agregar Correo</span>
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
                        placeholder="ejemplo@correo.com"
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
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleSaveEdit(email.id)}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-[#e07d1d] transition-colors"
                      >
                        Guardar
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
                  isSelected={selectedEmailId !== null && selectedEmailId === email.id}
                  onSelect={() => setSelectedEmailId(email.id)}
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
                      placeholder="ejemplo@correo.com"
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
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddEmail}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg shadow-sm hover:bg-[#e07d1d] transition-colors"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 mt-8">
          <div className="bg-white dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex-1 pr-4">
              <h4 className="text-sm font-bold text-[#181411] dark:text-white">Envío automático al pagar</h4>
              <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1">
                Generar y enviar la factura inmediatamente después de cada consumo de desayuno.
              </p>
            </div>
            <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
              <input
                checked={autoSend}
                onChange={(e) => setAutoSend(e.target.checked)}
                className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-gray-200 dark:border-gray-700 checked:border-primary z-10 transition-transform duration-200"
                id="toggle"
                name="toggle"
                type="checkbox"
              />
              <label
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors duration-200 ${
                  autoSend ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
                }`}
                htmlFor="toggle"
              >
                <span className={`toggle-dot absolute left-0 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  autoSend ? 'translate-x-6' : 'translate-x-0'
                }`}></span>
              </label>
            </div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-[12px] font-normal leading-normal pt-3 ml-1 flex items-start gap-2">
            <span className="material-symbols-outlined text-base mt-0.5">verified_user</span>
            <span>Tus datos se manejan de forma segura bajo los protocolos del SAT.</span>
          </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-background-dark/95 ios-blur border-t border-gray-100 dark:border-gray-800 safe-area-bottom z-50">
        <div className="max-w-md mx-auto px-4 pt-4 pb-2">
          <button
            onClick={() => navigate('/billing-step-4')}
            className="w-full bg-primary hover:bg-[#e07d1d] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            Continuar al Paso Final
          </button>
        </div>
      </div>
    </div>
  );
};

interface EmailItemProps {
  id: number;
  email: string;
  label?: string;
  isPrimary: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

const EmailItem: React.FC<EmailItemProps> = ({ id, email, label, isPrimary, isSelected, onSelect, onEdit, onDelete }) => (
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
        title="Eliminar correo"
      >
        <span className="material-symbols-outlined text-xl">delete</span>
      </button>
    </div>
  </div>
);

export default EmailConfigScreen;
