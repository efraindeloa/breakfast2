
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Card {
  id: number;
  color: string;
  textColor: string;
  number: string;
  exp: string;
  name: string;
  brand: string;
  isMastercard?: boolean;
  isDisabled?: boolean;
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[]>([
    {
      id: 1,
      color: 'from-[#e0f2fe] to-[#bae6fd]',
      textColor: 'text-[#0369a1]',
      number: '**** **** **** 4242',
      exp: '12/26',
      name: 'ALEX GONZALEZ',
      brand: 'VISA',
      isDisabled: false,
    },
    {
      id: 2,
      color: 'from-[#ffedd5] to-[#fed7aa]',
      textColor: 'text-[#9a3412]',
      number: '**** **** **** 8888',
      exp: '09/25',
      name: 'ALEX GONZALEZ',
      brand: 'Mastercard',
      isMastercard: true,
      isDisabled: false,
    },
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [userData, setUserData] = useState({
    name: 'Carlos González',
    email: 'carlos.gonzalez@email.com',
    phone: '+52 55 1234 5678',
  });
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');

  const toggleCardStatus = (cardId: number) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isDisabled: !card.isDisabled } : card
    ));
  };

  const handleStartEdit = (field: 'name' | 'email' | 'phone') => {
    setEditingField(field);
    setEditValue(userData[field]);
  };

  const handleSaveEdit = () => {
    if (editingField) {
      setUserData({ ...userData, [editingField]: editValue });
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  return (
    <div className="pb-24">
      <header className="flex items-center bg-white dark:bg-[#2d2116] p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="size-12 flex items-center justify-start text-[#181411] dark:text-white">
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </div>
        <h2 className="text-lg font-bold flex-1 text-center">Mi Perfil</h2>
        <div className="w-12 flex items-center justify-end">
          <span className="material-symbols-outlined cursor-pointer" onClick={() => navigate('/settings')}>settings</span>
        </div>
      </header>

      <section className="flex p-6 bg-white dark:bg-[#2d2116] mb-2 shadow-sm">
        <div className="flex w-full flex-col gap-4 items-center">
          <div className="relative">
            <div className="aspect-square rounded-full min-h-32 w-32 border-4 border-primary/20 bg-center bg-cover"
                 style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCpDz7kylj-nzXQ8dgTtg0umbheeBshTyl9RxUnJSp0BUjFcWJ3sxgOubkQ8zmiPon5fihqbaOxTagMXDyKVNgvKz26RDTYgirEcCoN4D63BS70Z756QE8GvMF0f9jY4ay6NQGHThIUrY9LyBJ36TnvGVD55nEjl3MkjHlHN1Lu8GWsNcmjYRbb1fvVeEXa3U082ocTXHk5jBmvqBPt1G5iwzCVNqXclTyviqCl15lCCSj96Ih0QAmRstK-YiKSnnxj97uPAvxJUJVd")' }}>
            </div>
            <div className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-white">
              <span className="material-symbols-outlined text-sm">edit</span>
            </div>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[24px] font-bold">¡Hola, Carlos! ☀️</p>
            <p className="text-[#8a7560] dark:text-[#c0a890] mt-1 text-center">¡Que tengas un excelente desayuno!</p>
            <div className="mt-2 px-3 py-1 bg-primary/10 rounded-full">
              <p className="text-primary text-xs font-semibold uppercase">Miembro Gold desde 2023</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <h3 className="text-lg font-bold py-4">Información de Cuenta</h3>
        <div className="py-4 space-y-4">
          {/* Nombre */}
          <div className="flex items-start gap-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">Nombre</p>
              {editingField === 'name' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.name}</p>
                  <button
                    onClick={() => handleStartEdit('name')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title="Editar nombre"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Correo electrónico */}
          <div className="flex items-start gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">Correo electrónico</p>
              {editingField === 'email' ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.email}</p>
                  <button
                    onClick={() => handleStartEdit('email')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title="Editar correo"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Número de teléfono */}
          <div className="flex items-start gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">phone</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">Número de teléfono</p>
              {editingField === 'phone' ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.phone}</p>
                  <button
                    onClick={() => handleStartEdit('phone')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title="Editar teléfono"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tarjetas de Crédito */}
      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4 py-4">
        <h3 className="text-lg font-bold mb-4">Mis Tarjetas</h3>
        <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-4 px-4">
          {cards.map((card) => (
            <CreditCard
              key={card.id}
              {...card}
              onDelete={() => setShowDeleteConfirm(card.id)}
              onToggle={() => toggleCardStatus(card.id)}
            />
          ))}
          <EmptyCard onClick={() => navigate('/add-card')} />
        </div>
      </section>

      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <h3 className="text-lg font-bold py-4">Mi Actividad</h3>
        <MenuItem icon="history" title="Historial de Órdenes" subtitle="Revisa tus desayunos anteriores" />
        <MenuItem icon="receipt_long" title="Mis Facturas" subtitle="Descarga tus comprobantes fiscales" onClick={() => navigate('/billing-step-1')} />
      </section>

      {/* Historial de Pagos */}
      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4 py-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Historial de Pagos</h3>
          <button 
            onClick={() => navigate('/transactions')}
            className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
          >
            Ver todo
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="space-y-3">
          <PaymentHistoryItem 
            restaurantName="Café del Sol" 
            date="Hoy, 8:45 AM" 
            amount="$12.50" 
            logo="https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU"
            cardLast4="4242"
          />
          <PaymentHistoryItem 
            restaurantName="La Panadería Artesanal" 
            date="Ayer, 9:15 AM" 
            amount="$8.75" 
            logo="https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTW04rD1StMdw5VuFmivxCsbvN_VFjrpbP1fqnSpdDL84rU6b3Mm6VZOi1IGaMZZSGyhRpeuhIyuBuI2qoIJnrvssVJjWywIGD53-994UzA3AXankHvqmjFerRER3Xtv8vI4AXqh2K8rN1puxxdNFmj94DJHZyLW_ViLJYZiW-DiUZ_Z8LlJVyPu-o9dZ004NABiXUsqXvcel_zsQBdyc13Vm9JsBE1FHo2kwkmYEHAejYBBBKvLwheTiiwnprPzmk1jwASDobqC"
            cardLast4="8888"
          />
          <PaymentHistoryItem 
            restaurantName="Brunch & Co." 
            date="22 Oct, 10:02 AM" 
            amount="$15.20" 
            logo="https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK"
            cardLast4="4242"
          />
        </div>
      </section>

      <div className="px-4 mt-8">
        <button className="w-full h-14 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/30 active:scale-95 transition-all">
          Cerrar Sesión
        </button>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-2">
              ¿Eliminar tarjeta?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-6">
              Esta acción no se puede deshacer. La tarjeta será eliminada permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setCards(cards.filter(card => card.id !== showDeleteConfirm));
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors active:scale-95"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ icon: string; title: string; subtitle: string; onClick?: () => void }> = ({ icon, title, subtitle, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-primary/5 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-4">
      <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-[#8a7560] dark:text-[#c0a890] text-sm">{subtitle}</p>
      </div>
    </div>
    <span className="material-symbols-outlined text-[#8a7560]">chevron_right</span>
  </div>
);

const CreditCard: React.FC<{ 
  color: string; 
  textColor: string; 
  number: string; 
  exp: string; 
  name: string; 
  brand: string; 
  isMastercard?: boolean;
  isDisabled?: boolean;
  onDelete: () => void;
  onToggle: () => void;
}> = ({ color, textColor, number, exp, name, brand, isMastercard, isDisabled, onDelete, onToggle }) => (
  <div className={`min-w-[280px] aspect-[1.6/1] rounded-xl flex flex-col justify-between p-6 bg-gradient-to-br ${color} ${textColor} relative shadow-sm group ${isDisabled ? 'opacity-60' : ''}`}>
    {/* Overlay de deshabilitado */}
    {isDisabled && (
      <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center z-20 pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
          <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-300">block</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">Deshabilitada</span>
        </div>
      </div>
    )}

    {/* Botón de eliminar */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity hover:bg-white/40 dark:hover:bg-black/40 active:scale-95 z-30"
      title="Eliminar tarjeta"
    >
      <span className="material-symbols-outlined text-sm">delete</span>
    </button>

    {/* Toggle de habilitar/deshabilitar */}
    <div className="absolute bottom-3 right-3 z-30">
      <label className="relative inline-flex items-center cursor-pointer" title={isDisabled ? 'Habilitar tarjeta' : 'Deshabilitar tarjeta'}>
        <input
          type="checkbox"
          checked={!isDisabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          isDisabled 
            ? 'bg-gray-400/50 dark:bg-gray-600/50' 
            : 'bg-white/50 dark:bg-black/50'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
            isDisabled ? '' : 'translate-x-5'
          }`}></div>
        </div>
      </label>
    </div>

    <div className="flex justify-between items-start">
      <span className="material-symbols-outlined text-3xl">contactless</span>
      {isMastercard ? (
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-500/80"></div>
        </div>
      ) : <span className="font-bold italic text-lg">{brand}</span>}
    </div>
    <div>
      <p className="text-lg font-mono tracking-widest">{number}</p>
      <div className="flex gap-4 mt-2">
        <div>
          <p className="text-[10px] uppercase opacity-70">Expira</p>
          <p className="text-sm font-medium">{exp}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase opacity-70">Titular</p>
          <p className="text-sm font-medium">{name}</p>
        </div>
      </div>
    </div>
  </div>
);

const EmptyCard: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div
    onClick={onClick}
    className="min-w-[280px] aspect-[1.6/1] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all active:scale-95"
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-3xl">add</span>
      </div>
      <p className="text-primary font-semibold text-sm">Agregar tarjeta</p>
    </div>
  </div>
);

const PaymentHistoryItem: React.FC<{ restaurantName: string; date: string; amount: string; logo: string; cardLast4: string }> = ({ restaurantName, date, amount, logo, cardLast4 }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
        <img 
          src={logo} 
          alt={restaurantName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<span class="material-symbols-outlined text-primary text-lg">restaurant</span>';
            }
          }}
        />
      </div>
      <div>
        <p className="font-semibold text-sm text-[#181411] dark:text-white">{restaurantName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">**** **** **** {cardLast4}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-sm text-[#181411] dark:text-white">{amount}</p>
    </div>
  </div>
);

export default ProfileScreen;
