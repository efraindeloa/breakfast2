
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();

  // Verificar si hay una orden enviada
  const hasSentOrder = () => {
    try {
      const savedData = localStorage.getItem('orderStatusData');
      if (savedData) {
        const orderStatusData = JSON.parse(savedData);
        return orderStatusData?.status === 'orden_enviada' || 
               orderStatusData?.status === 'orden_recibida' ||
               orderStatusData?.status === 'en_preparacion' ||
               orderStatusData?.status === 'lista_para_entregar' ||
               orderStatusData?.status === 'en_entrega' ||
               orderStatusData?.status === 'entregada' ||
               orderStatusData?.status === 'con_incidencias';
      }
    } catch {
      return false;
    }
    return false;
  };

  const handleOrdersClick = () => {
    if (hasSentOrder()) {
      navigate('/order-detail');
    } else {
      navigate('/orders');
    }
  };

  const navItems = [
    { label: 'Inicio', icon: 'home', path: '/home' },
    { label: 'Menú', icon: 'restaurant_menu', path: '/menu' },
    { label: 'Mi orden', icon: 'receipt_long', path: '/orders' },
    { label: 'Pagos', icon: 'account_balance_wallet', path: '/payments' },
    { label: 'Perfil', icon: 'person', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-[430px] mx-auto bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg border-t border-gray-100 dark:border-white/10 px-6 py-3 flex justify-between items-center pb-8 z-50">
      {navItems.map((item) => {
        const isOrdersPath = item.path === '/orders';
        const isActive = isOrdersPath 
          ? (location.pathname === '/orders' || location.pathname === '/order-detail')
          : (location.pathname === item.path || (item.path === '/profile' && location.pathname.includes('billing')));
        
        return (
          <button
            key={item.label}
            onClick={() => {
              if (isOrdersPath) {
                handleOrdersClick();
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500'
            }`}
          >
            <span className="relative">
              <span 
                className="material-symbols-outlined text-[28px]"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              {isOrdersPath && cartCount > 0 && !hasSentOrder() && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </button>
        );
      })}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
    </nav>
  );
};

export default BottomNav;
