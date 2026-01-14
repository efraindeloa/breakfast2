import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
  id: number;
  name: string;
  notes: string;
  price: number;
  quantity: number;
}

const OrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: 1,
      name: 'Bowl de Frutas Silvestres',
      notes: 'Con extra granola y miel de abeja.',
      price: 12.50,
      quantity: 1,
    },
    {
      id: 2,
      name: 'Tostadas de Aguacate',
      notes: 'Huevo poché término medio.',
      price: 30.00,
      quantity: 2,
    },
    {
      id: 3,
      name: 'Café Americano Lg',
      notes: 'Sin azúcar, leche de almendras aparte.',
      price: 5.00,
      quantity: 1,
    },
  ]);
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const [orderSpecialInstructions, setOrderSpecialInstructions] = useState('');
  const [isEditingOrderInstructions, setIsEditingOrderInstructions] = useState(false);

  const handleQuantityChange = (id: number, delta: number) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setOrderItems((items) => items.filter((item) => item.id !== id));
  };

  const handleEditNotes = (id: number) => {
    const item = orderItems.find(i => i.id === id);
    if (item) {
      setEditingNotesId(id);
      setEditingNotesText(item.notes || '');
    }
  };

  const handleSaveNotes = (id: number) => {
    setOrderItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, notes: editingNotesText } : item
      )
    );
    setEditingNotesId(null);
    setEditingNotesText('');
  };

  const handleCancelEdit = () => {
    setEditingNotesId(null);
    setEditingNotesText('');
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark">
      {/* Header Section */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center p-4 pb-2 justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-primary dark:text-primary">
              <span className="material-symbols-outlined text-[28px]">chevron_left</span>
            </button>
            <h1 className="text-[#181411] dark:text-white text-lg font-semibold tracking-tight">Mi Orden</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 overflow-y-auto">
        {/* Order Info */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-[#181411] dark:text-white text-sm font-semibold">Mesa #04</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">24 Oct, 2023</p>
          </div>
        </div>

        {/* Continue Exploring Section */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-dashed border-primary/30 rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 group-hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-primary text-2xl">restaurant_menu</span>
                </div>
                <div className="text-left">
                  <p className="text-[#181411] dark:text-white font-bold text-base">Seguir Explorando</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs">Agrega más productos a tu orden</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-primary text-2xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
        )}

        {/* Order Items */}
        <div className="space-y-4 mb-6">
          {orderItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">shopping_basket</span>
              </div>
              <h3 className="text-[#181411] dark:text-white text-lg font-bold mb-2">Tu orden está vacía</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">Explora nuestro menú y agrega productos deliciosos</p>
              <button
                onClick={() => navigate('/menu')}
                className="bg-primary text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 mx-auto hover:bg-primary-dark transition-colors"
              >
                <span className="material-symbols-outlined">restaurant_menu</span>
                <span>Explorar Menú</span>
              </button>
            </div>
          ) : (
            orderItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-[#181411] dark:text-white text-base font-bold leading-tight">{item.name}</h3>
                  {editingNotesId === item.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingNotesText}
                        onChange={(e) => setEditingNotesText(e.target.value)}
                        placeholder="Ej. Sin cebolla, salsa aparte..."
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveNotes(item.id)}
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
                    <div className="flex items-start gap-2 mt-1">
                      <span className="material-symbols-outlined text-xs text-gray-400 mt-0.5">edit_note</span>
                      <div className="flex-1">
                        {item.notes ? (
                          <p className="text-gray-500 dark:text-gray-400 text-sm italic">{item.notes}</p>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500 text-sm italic">Sin instrucciones especiales</p>
                        )}
                        <button
                          onClick={() => handleEditNotes(item.id)}
                          className="mt-1 text-primary text-xs font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">edit</span>
                          {item.notes ? 'Editar' : 'Agregar'} instrucciones
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-[#181411] dark:text-white text-base font-bold">${item.price.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-full px-2 py-1">
                    <button
                      onClick={() => handleQuantityChange(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center text-primary hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-lg">remove</span>
                    </button>
                    <span className="text-[#181411] dark:text-white text-base font-semibold w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.id, 1)}
                      className="w-8 h-8 flex items-center justify-center text-primary hover:scale-110 transition-transform"
                    >
                      <span className="material-symbols-outlined text-lg">add</span>
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-600 p-2"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </div>
            </div>
            ))
          )}
        </div>

        {/* Order Special Instructions */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <div className="bg-white dark:bg-[#2d2516] rounded-xl p-4 shadow-sm border border-gray-100 dark:border-[#3d3321]">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0">
                  <span className="material-symbols-outlined text-primary">info</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-[#181411] dark:text-white text-base font-bold mb-2 flex items-center gap-2">
                    Instrucciones Especiales para la Orden
                  </h3>
                  {isEditingOrderInstructions ? (
                    <div className="space-y-3">
                      <textarea
                        value={orderSpecialInstructions}
                        onChange={(e) => setOrderSpecialInstructions(e.target.value)}
                        placeholder="Ej. Traer todos los platillos al mismo tiempo, servir las bebidas primero..."
                        className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none"
                        rows={3}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsEditingOrderInstructions(false)}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                          Guardar
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingOrderInstructions(false);
                            setOrderSpecialInstructions('');
                          }}
                          className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {orderSpecialInstructions ? (
                        <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-3 mb-2">
                          <p className="text-[#181411] dark:text-white text-sm leading-relaxed">{orderSpecialInstructions}</p>
                        </div>
                      ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm italic mb-2">
                          Sin instrucciones especiales para la orden
                        </p>
                      )}
                      <button
                        onClick={() => setIsEditingOrderInstructions(true)}
                        className="text-primary text-sm font-semibold hover:text-primary/80 transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                        {orderSpecialInstructions ? 'Editar' : 'Agregar'} instrucciones
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Products */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#181411] dark:text-white text-lg font-bold">Sugerencias</h2>
              <button 
                onClick={() => navigate('/menu')}
                className="text-primary text-sm font-semibold flex items-center gap-1"
              >
                Ver todo
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 5, name: 'Jugo Natural', price: '$8.00', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBLZbTMM9brqXGUlxtKiiv0NgizQz3aZlitPSjU8LurWAVg9zadPmvmgZjwAqpI6N_8JjYDVcPgTn8-u2F6dztP4D0k-Z9_UC7v8bCTg1C6egkiySFEQDuOalcY4d2WqshT-Af654Fhe600H7R0jKl0_qWPJw_PAQEEGe5eyB0_EzW9FusO2V6Z3krROUM6Jpt8m2HQyxHx9mqrAOYtKg4gzyPGW_gLPQiljQoKtlxbY8SVvIhvXtXZN8NcsBPpyLCWl_kT0pdONj3g' },
                { id: 6, name: 'Pan Dulce', price: '$6.50', image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDql3gVcDvBtDcMPoZfRX9-ZcdJGd1F_Xj2GNNleyUQlQO0ZEeQlvCaJbtz8Cdc-FoWl-_j5PZ7z1FPEWs_2Z2SPxuRA3fSp537fMLJKjp-JYTM-FHX39o3m9w8hr8gAbxVUAeAnazhf5TPS9vb7_2oV_UprCzBOu14Hk_Yg4WrZFe2UparRd1tT55j9DqXA2u5Hxl4dVoXOpujB-VfcsX27pSJfWLKA9ix09FezTC6rf4j7CX2btXIJGcFMJaFasF1greGDe8VLqNL' },
              ].map((suggestion) => (
                <div
                  key={suggestion.id}
                  onClick={() => navigate(`/dish/${suggestion.id}`)}
                  className="bg-white dark:bg-[#2d2516] rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#3d3321] cursor-pointer hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div
                    className="w-full h-32 bg-cover bg-center"
                    style={{ backgroundImage: `url("${suggestion.image}")` }}
                  />
                  <div className="p-3">
                    <h3 className="text-[#181411] dark:text-white text-sm font-bold mb-1 line-clamp-1">{suggestion.name}</h3>
                    <p className="text-primary text-sm font-semibold">{suggestion.price}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Confirm Order Button */}
        {orderItems.length > 0 && (
          <div className="mb-6">
            <button className="w-full bg-primary text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform">
              <span>Confirmar Orden</span>
              <span className="material-symbols-outlined">restaurant</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default OrderScreen;
