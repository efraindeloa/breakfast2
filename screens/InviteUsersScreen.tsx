import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupOrder, GroupOrderParticipant } from '../contexts/GroupOrderContext';
import { useTranslation } from '../contexts/LanguageContext';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  isFavorite?: boolean;
}

const InviteUsersScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { addParticipant, participants } = useGroupOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'email' | 'phone' | 'favorites'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  // Datos de ejemplo - usuarios registrados
  const registeredUsers: User[] = [
    {
      id: '1',
      name: 'María García',
      email: 'maria.garcia@email.com',
      phone: '+52 555 123 4567',
      avatar: 'https://i.pravatar.cc/150?img=1',
      isFavorite: true,
    },
    {
      id: '2',
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+52 555 234 5678',
      avatar: 'https://i.pravatar.cc/150?img=2',
      isFavorite: true,
    },
    {
      id: '3',
      name: 'Ana López',
      email: 'ana.lopez@email.com',
      phone: '+52 555 345 6789',
      avatar: 'https://i.pravatar.cc/150?img=3',
      isFavorite: false,
    },
    {
      id: '4',
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+52 555 456 7890',
      avatar: 'https://i.pravatar.cc/150?img=4',
      isFavorite: false,
    },
    {
      id: '5',
      name: 'Laura Martínez',
      email: 'laura.martinez@email.com',
      phone: '+52 555 567 8901',
      avatar: 'https://i.pravatar.cc/150?img=5',
      isFavorite: true,
    },
  ];

  // Filtrar usuarios según búsqueda
  const filteredUsers = useMemo(() => {
    let filtered = registeredUsers;

    // Filtrar por tipo de búsqueda
    if (searchType === 'favorites') {
      filtered = filtered.filter(u => u.isFavorite);
    } else if (searchType === 'all' && !searchQuery) {
      // Si es "Todos los contactos" sin búsqueda, excluir favoritos (ya están en su propia sección)
      filtered = filtered.filter(u => !u.isFavorite);
    }

    // Filtrar por query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(user => {
        if (searchType === 'email') {
          return user.email.toLowerCase().includes(query);
        } else if (searchType === 'phone') {
          return user.phone?.toLowerCase().includes(query);
        } else {
          return (
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.phone?.toLowerCase().includes(query)
          );
        }
      });
    }

    // Excluir usuarios ya agregados
    const participantIds = new Set(participants.map(p => p.id));
    filtered = filtered.filter(u => !participantIds.has(u.id));

    return filtered;
  }, [searchQuery, searchType, participants]);

  const favorites = useMemo(() => {
    return registeredUsers.filter(u => u.isFavorite && !participants.some(p => p.id === u.id));
  }, [participants]);

  const handleToggleUser = (user: User) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(user.id)) {
        newSet.delete(user.id);
      } else {
        newSet.add(user.id);
      }
      return newSet;
    });
  };

  const handleInviteSelected = () => {
    selectedUsers.forEach(userId => {
      const user = registeredUsers.find(u => u.id === userId);
      if (user) {
        addParticipant({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          isFavorite: user.isFavorite,
        });
      }
    });
    // Regresar a la orden después de invitar
    navigate(-1);
  };

  // Eliminamos handleInviteUser ya que ahora usamos el sistema de selección múltiple

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">{t('invite.title')}</h2>
        <div className="w-12"></div>
      </header>

      <div className="px-4 py-6">
        {/* Barra de búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('invite.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            />
          </div>
        </div>

        {/* Filtros de búsqueda */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: 'all', label: t('invite.all'), icon: 'people' },
              { value: 'favorites', label: t('invite.favorites'), icon: 'star' },
              { value: 'email', label: t('invite.byEmail'), icon: 'email' },
              { value: 'phone', label: t('invite.byPhone'), icon: 'phone' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setSearchType(filter.value as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                  searchType === filter.value
                    ? 'bg-primary text-white'
                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{filter.icon}</span>
                <span className="text-sm font-medium">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Sección de Favoritos (si no hay búsqueda) */}
        {!searchQuery && searchType === 'all' && favorites.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">star</span>
              {t('invite.favoriteContacts')}
            </h3>
            <div className="space-y-2">
              {favorites.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white dark:bg-white/5 border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
                    selectedUsers.has(user.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 dark:border-white/10'
                  }`}
                  onClick={() => handleToggleUser(user)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary">person</span>
                        )}
                      </div>
                      <span className="absolute -top-1 -right-1 material-symbols-outlined text-yellow-500 text-sm bg-white dark:bg-gray-800 rounded-full">star</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#181411] dark:text-white">{user.name}</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUsers.has(user.id) ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados de búsqueda */}
        <div>
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-3">
            {searchQuery || searchType !== 'all' ? t('invite.results') : t('invite.allContacts')}
          </h3>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 mx-auto mb-4">
                <span className="material-symbols-outlined text-4xl text-gray-400">person_search</span>
              </div>
              <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">{t('invite.noUsersFound')}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {searchQuery
                  ? t('invite.tryAnotherSearch')
                  : t('invite.allUsersInOrder')}
              </p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`bg-white dark:bg-white/5 border rounded-xl p-4 flex items-center justify-between hover:shadow-md transition-all cursor-pointer ${
                    selectedUsers.has(user.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-100 dark:border-white/10'
                  }`}
                  onClick={() => handleToggleUser(user)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-primary">person</span>
                        )}
                      </div>
                      {user.isFavorite && (
                        <span className="absolute -top-1 -right-1 material-symbols-outlined text-yellow-500 text-sm bg-white dark:bg-gray-800 rounded-full">star</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#181411] dark:text-white">{user.name}</p>
                        {user.isFavorite && (
                          <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      {user.phone && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">{user.phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedUsers.has(user.id) ? (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botón de invitar seleccionados */}
        {selectedUsers.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 w-full px-4 z-40 md:max-w-2xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
            <button
              onClick={handleInviteSelected}
              className="w-full py-4 px-6 rounded-xl bg-primary text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined">person_add</span>
              {t('invite.invite')} {selectedUsers.size} {selectedUsers.size === 1 ? t('invite.user') : t('invite.users')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteUsersScreen;
