import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Contacts } from '@capacitor-community/contacts';
import { Capacitor } from '@capacitor/core';

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}

const ContactsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deviceContacts, setDeviceContacts] = useState<any[]>([]);
  const [selectedDeviceContacts, setSelectedDeviceContacts] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Cargar contactos al montar
  useEffect(() => {
    loadContacts();
    checkPermissions();
  }, []);

  // Verificar permisos de contactos
  const checkPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      setHasPermission(false);
      return;
    }

    // Verificar si el plugin está disponible
    if (!Contacts || typeof Contacts.checkPermissions !== 'function') {
      console.warn('Plugin de contactos no disponible');
      setHasPermission(false);
      return;
    }

    try {
      const result = await Contacts.checkPermissions();
      console.log('Estado de permisos:', result);
      setHasPermission(result.contacts === 'granted');
    } catch (error) {
      console.error('Error verificando permisos:', error);
      setHasPermission(false);
    }
  };

  // Solicitar permisos
  const requestPermissions = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert(t('contacts.notAvailableOnWeb'));
      return;
    }

    // Verificar si el plugin está disponible
    if (!Contacts || typeof Contacts.requestPermissions !== 'function') {
      console.error('Plugin de contactos no disponible');
      alert(t('contacts.pluginNotAvailable'));
      return;
    }

    try {
      console.log('Solicitando permisos de contactos...');
      const result = await Contacts.requestPermissions();
      console.log('Resultado de permisos:', result);
      
      if (!result || !result.contacts) {
        console.error('Respuesta de permisos inválida:', result);
        setHasPermission(false);
        alert(t('contacts.permissionError'));
        return;
      }
      
      if (result.contacts === 'granted') {
        setHasPermission(true);
        loadDeviceContacts();
      } else if (result.contacts === 'denied') {
        setHasPermission(false);
        alert(t('contacts.permissionDenied'));
      } else if (result.contacts === 'prompt') {
        // El usuario aún no ha respondido, intentar de nuevo
        setHasPermission(false);
        alert(t('contacts.permissionPrompt'));
      } else {
        setHasPermission(false);
        console.warn('Estado de permiso desconocido:', result.contacts);
        alert(t('contacts.permissionDenied'));
      }
    } catch (error: any) {
      console.error('Error solicitando permisos:', error);
      setHasPermission(false);
      
      // Mensaje de error más específico basado en el tipo de error
      let errorMessage = t('contacts.permissionError');
      if (error?.message) {
        errorMessage = `${errorMessage}: ${error.message}`;
      } else if (error?.toString) {
        errorMessage = `${errorMessage}: ${error.toString()}`;
      }
      
      console.error('Detalles del error:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      });
      
      alert(errorMessage);
    }
  };

  // Cargar contactos del dispositivo
  const loadDeviceContacts = async () => {
    if (!Capacitor.isNativePlatform()) {
      alert(t('contacts.notAvailableOnWeb'));
      return;
    }

    // Verificar permisos antes de cargar
    try {
      const permissions = await Contacts.checkPermissions();
      if (permissions.contacts !== 'granted') {
        alert(t('contacts.permissionDenied'));
        setHasPermission(false);
        return;
      }
    } catch (error) {
      console.error('Error verificando permisos:', error);
      alert(t('contacts.permissionError'));
      return;
    }

    try {
      const result = await Contacts.getContacts({
        projection: {
          name: true,
          phones: true,
          emails: true
        }
      });

      if (!result.contacts || result.contacts.length === 0) {
        alert(t('contacts.noDeviceContacts'));
        return;
      }

      const formattedContacts = result.contacts.map((contact: any) => ({
        id: contact.contactId,
        name: contact.name?.display || contact.name?.given || contact.name?.family || t('contacts.unknownName'),
        phone: contact.phones?.[0]?.number || undefined,
        email: contact.emails?.[0]?.address || undefined,
        raw: contact
      }));

      setDeviceContacts(formattedContacts);
      setShowImportModal(true);
    } catch (error: any) {
      console.error('Error cargando contactos del dispositivo:', error);
      const errorMessage = error?.message || error?.toString() || t('contacts.loadError');
      alert(`${t('contacts.loadError')}: ${errorMessage}`);
    }
  };

  // Importar contactos seleccionados
  const handleImportSelected = () => {
    const existingContactIds = new Set(contacts.map(c => c.id));
    const contactsToAdd = deviceContacts
      .filter(c => selectedDeviceContacts.has(c.id) && !existingContactIds.has(c.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        email: c.email
      }));

    if (contactsToAdd.length > 0) {
      setContacts([...contacts, ...contactsToAdd]);
      alert(t('contacts.importedSuccess', { count: contactsToAdd.length }));
    }

    setShowImportModal(false);
    setSelectedDeviceContacts(new Set());
  };

  // Guardar contactos cuando cambian
  useEffect(() => {
    if (contacts.length >= 0) {
      localStorage.setItem('user_contacts', JSON.stringify(contacts));
    }
  }, [contacts]);

  const loadContacts = () => {
    try {
      const stored = localStorage.getItem('user_contacts');
      if (stored) {
        setContacts(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error cargando contactos:', error);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ name: '', phone: '', email: '' });
    setShowAddModal(true);
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteContact = (contactId: string) => {
    if (window.confirm(t('contacts.confirmDelete'))) {
      setContacts(contacts.filter(c => c.id !== contactId));
    }
  };

  const handleSaveContact = () => {
    if (!formData.name.trim()) {
      alert(t('contacts.nameRequired'));
      return;
    }

    if (!formData.phone && !formData.email) {
      alert(t('contacts.phoneOrEmailRequired'));
      return;
    }

    if (editingContact) {
      // Editar contacto existente
      setContacts(contacts.map(c =>
        c.id === editingContact.id
          ? {
              id: c.id,
              name: formData.name.trim(),
              phone: formData.phone.trim() || undefined,
              email: formData.email.trim() || undefined
            }
          : c
      ));
    } else {
      // Agregar nuevo contacto
      const newContact: Contact = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined
      };
      setContacts([...contacts, newContact]);
    }

    setShowAddModal(false);
    setFormData({ name: '', phone: '', email: '' });
    setEditingContact(null);
  };

  const handleCancel = () => {
    setShowAddModal(false);
    setFormData({ name: '', phone: '', email: '' });
    setEditingContact(null);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[#181411] dark:text-white flex size-10 shrink-0 items-center justify-start"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">
            {t('contacts.title')}
          </h2>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* Action Buttons */}
        <div className="p-4 space-y-3">
          {Capacitor.isNativePlatform() && (
            <button
              onClick={hasPermission ? loadDeviceContacts : requestPermissions}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined">contacts</span>
              <span>{hasPermission ? t('contacts.importFromDevice') : t('contacts.requestPermission')}</span>
            </button>
          )}
          <button
            onClick={handleAddContact}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined">add</span>
            <span>{t('contacts.addContact')}</span>
          </button>
        </div>

        {/* Contacts List */}
        <div className="px-4 space-y-2">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">contacts</span>
              <p className="text-gray-500 dark:text-gray-400 font-medium">{t('contacts.noContacts')}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('contacts.addFirstContact')}</p>
            </div>
          ) : (
            contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800"
              >
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#181411] dark:text-white truncate">{contact.name}</p>
                  {contact.phone && (
                    <p className="text-xs text-[#887563] dark:text-stone-400 truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">phone</span>
                      {contact.phone}
                    </p>
                  )}
                  {contact.email && (
                    <p className="text-xs text-[#887563] dark:text-stone-400 truncate flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">email</span>
                      {contact.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditContact(contact)}
                    className="text-primary hover:text-primary/80 transition-colors p-2"
                    title={t('contacts.edit')}
                  >
                    <span className="material-symbols-outlined text-xl">edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-red-500 hover:text-red-600 transition-colors p-2"
                    title={t('contacts.delete')}
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-white dark:bg-background-dark rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {editingContact ? t('contacts.editContact') : t('contacts.addContact')}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  {t('contacts.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('contacts.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800 text-[#181411] dark:text-white focus:outline-none focus:border-primary"
                  autoFocus
                />
              </div>

              {/* Phone Input */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  {t('contacts.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('contacts.phonePlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800 text-[#181411] dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  {t('contacts.email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t('contacts.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800 text-[#181411] dark:text-white focus:outline-none focus:border-primary"
                />
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('contacts.phoneOrEmailNote')}
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-[#181411] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('contacts.cancel')}
                </button>
                <button
                  onClick={handleSaveContact}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity"
                >
                  {editingContact ? t('contacts.save') : t('contacts.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Contacts Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
          <div className="bg-white dark:bg-background-dark rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[80vh] overflow-y-auto flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{t('contacts.selectContactsToImport')}</h3>
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedDeviceContacts(new Set());
                  }}
                  className="text-gray-500"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('contacts.selectContactsDescription')}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {deviceContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">{t('contacts.noDeviceContacts')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {deviceContacts.map((contact) => {
                    const isSelected = selectedDeviceContacts.has(contact.id);
                    const isAlreadyAdded = contacts.some(c => c.id === contact.id);
                    return (
                      <button
                        key={contact.id}
                        onClick={() => {
                          if (!isAlreadyAdded) {
                            const newSelected = new Set(selectedDeviceContacts);
                            if (isSelected) {
                              newSelected.delete(contact.id);
                            } else {
                              newSelected.add(contact.id);
                            }
                            setSelectedDeviceContacts(newSelected);
                          }
                        }}
                        disabled={isAlreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-colors ${
                          isAlreadyAdded
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60'
                            : isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800'
                        }`}
                      >
                        <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#181411] dark:text-white truncate">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-xs text-[#887563] dark:text-stone-400 truncate flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">phone</span>
                              {contact.phone}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-[#887563] dark:text-stone-400 truncate flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">email</span>
                              {contact.email}
                            </p>
                          )}
                        </div>
                        {isAlreadyAdded ? (
                          <span className="text-xs text-gray-400 dark:text-gray-500">{t('contacts.alreadyAdded')}</span>
                        ) : (
                          <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary bg-primary'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <span className="material-symbols-outlined text-white text-sm">check</span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {deviceContacts.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setSelectedDeviceContacts(new Set());
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-[#181411] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors"
                >
                  {t('contacts.cancel')}
                </button>
                <button
                  onClick={handleImportSelected}
                  disabled={selectedDeviceContacts.size === 0}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('contacts.importSelected', { count: selectedDeviceContacts.size })}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsScreen;
