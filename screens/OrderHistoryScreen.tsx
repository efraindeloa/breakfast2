import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: string;
}

interface Order {
  id: number;
  restaurantName: string;
  date: string;
  time: string;
  total: string;
  status: 'completada' | 'cancelada' | 'en_proceso';
  items: OrderItem[];
  logo: string;
  transactionId: number; // ID de la transacción relacionada
}

interface Filters {
  restaurant: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | '3months';
  status: 'all' | 'completada' | 'cancelada' | 'en_proceso';
}

const OrderHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const orderIdParam = searchParams.get('orderId');
  const orderRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Scroll al elemento cuando se navega con orderId
  useEffect(() => {
    if (orderIdParam) {
      const orderId = parseInt(orderIdParam);
      const element = orderRefs.current[orderId];
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-primary', 'ring-offset-2');
          }, 2000);
        }, 100);
      }
    }
  }, [orderIdParam]);
  const [filters, setFilters] = useState<Filters>({
    restaurant: '',
    dateRange: 'all',
    status: 'all',
  });

  // Lista de órdenes históricas
  const orders: Order[] = [
    {
      id: 1,
      restaurantName: 'Don Kamaron Restaurant',
      date: 'Hoy',
      time: '8:45 AM',
      total: '$97.65',
      status: 'completada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      items: [
        { id: 1, name: 'Tacos de Atún Marinado', quantity: 2, price: '$18.00' },
        { id: 2, name: 'Ceviche de Maracuyá', quantity: 1, price: '$22.00' },
        { id: 3, name: 'Agua de Horchata', quantity: 2, price: '$4.50' },
      ],
      transactionId: 1,
    },
    {
      id: 2,
      restaurantName: 'Don Kamaron Restaurant',
      date: 'Ayer',
      time: '7:30 PM',
      total: '$58.95',
      status: 'completada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      items: [
        { id: 4, name: 'Rib Eye a la Leña', quantity: 1, price: '$45.00' },
      ],
      transactionId: 2,
    },
    {
      id: 3,
      restaurantName: 'Café del Sol',
      date: '22 Oct',
      time: '10:02 AM',
      total: '$41.92',
      status: 'completada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      items: [
        { id: 5, name: 'Café Americano', quantity: 2, price: '$8.00' },
        { id: 6, name: 'Croissant', quantity: 2, price: '$12.00' },
      ],
      transactionId: 3,
    },
    {
      id: 4,
      restaurantName: 'Don Kamaron Restaurant',
      date: '20 Oct',
      time: '6:45 PM',
      total: '$28.88',
      status: 'cancelada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      items: [
        { id: 7, name: 'Pasta al Pomodoro', quantity: 1, price: '$20.00' },
        { id: 8, name: 'Refresco', quantity: 1, price: '$4.90' },
      ],
      transactionId: 4,
    },
    {
      id: 5,
      restaurantName: 'La Panadería Artesanal',
      date: '18 Oct',
      time: '1:20 PM',
      total: '$21.76',
      status: 'completada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTW04rD1StMdw5VuFmivxCsbvN_VFjrpbP1fqnSpdDL84rU6b3Mm6VZOi1IGaMZZSGyhRpeuhIyuBuI2qoIJnrvssVJjWywIGD53-994UzA3AXankHvqmjFerRER3Xtv8vI4AXqh2K8rN1puxxdNFmj94DJHZyLW_ViLJYZiW-DiUZ_Z8LlJVyPu-o9dZ004NABiXUsqXvcel_zsQBdyc13Vm9JsBE1FHo2kwkmYEHAejYBBBKvLwheTiiwnprPzmk1jwASDobqC',
      items: [
        { id: 9, name: 'Pan Integral', quantity: 2, price: '$8.00' },
      ],
      transactionId: 5,
    },
    {
      id: 6,
      restaurantName: 'Brunch & Co.',
      date: '15 Oct',
      time: '11:30 AM',
      total: '$37.34',
      status: 'completada',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      items: [
        { id: 10, name: 'Pancakes', quantity: 1, price: '$18.00' },
        { id: 11, name: 'Jugo de Naranja', quantity: 1, price: '$10.50' },
      ],
      transactionId: 6,
    },
  ];

  // Obtener lista única de restaurantes para el filtro
  const restaurants = useMemo(() => {
    const unique = Array.from(new Set(orders.map(o => o.restaurantName)));
    return unique.sort();
  }, []);

  // Función para convertir fecha a número para comparación
  const parseDate = (dateStr: string): number => {
    const now = new Date();
    if (dateStr.includes('Hoy')) {
      return now.getTime();
    }
    if (dateStr.includes('Ayer')) {
      return now.getTime() - 24 * 60 * 60 * 1000;
    }
    // Parsear formato "22 Oct"
    const parts = dateStr.match(/(\d+)\s+(\w+)/);
    if (parts) {
      const day = parseInt(parts[1]);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames.indexOf(parts[2]);
      if (month !== -1) {
        const date = new Date(now.getFullYear(), month, day);
        return date.getTime();
      }
    }
    return 0;
  };

  // Filtrar órdenes
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Filtro por restaurante
      if (filters.restaurant && order.restaurantName !== filters.restaurant) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange !== 'all') {
        const orderDate = parseDate(order.date);
        const now = new Date().getTime();
        let daysAgo = 0;
        
        switch (filters.dateRange) {
          case 'today':
            daysAgo = 0;
            break;
          case 'week':
            daysAgo = 7;
            break;
          case 'month':
            daysAgo = 30;
            break;
          case '3months':
            daysAgo = 90;
            break;
        }
        
        const cutoffDate = now - (daysAgo * 24 * 60 * 60 * 1000);
        if (orderDate < cutoffDate) {
          return false;
        }
      }

      // Filtro por estado
      if (filters.status !== 'all' && order.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [filters, orders]);

  const hasActiveFilters = useMemo(() => {
    return filters.restaurant !== '' ||
           filters.dateRange !== 'all' ||
           filters.status !== 'all';
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      restaurant: '',
      dateRange: 'all',
      status: 'all',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completada':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400';
      case 'cancelada':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400';
      case 'en_proceso':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completada':
        return 'Completada';
      case 'cancelada':
        return 'Cancelada';
      case 'en_proceso':
        return 'En proceso';
      default:
        return status;
    }
  };

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="size-12 flex items-center" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </div>
        <div className="flex-1"></div>
        <div className="w-12 flex items-center justify-end">
          <button
            onClick={() => setShowFilters(true)}
            className={`relative ${hasActiveFilters ? 'text-primary' : ''}`}
            title="Filtrar"
          >
            <span className="material-symbols-outlined cursor-pointer">filter_list</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-2xl font-bold text-[#181411] dark:text-white">Historial de Órdenes</h3>
            <p className="text-[#6b7280] dark:text-gray-400 mt-1">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'orden' : 'órdenes'}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-primary text-sm font-semibold flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Limpiar filtros
            </button>
          )}
        </div>
        
        {/* Chips de filtros aplicados */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.restaurant && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <span>{filters.restaurant}</span>
                <button
                  onClick={() => setFilters({ ...filters, restaurant: '' })}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
            {filters.dateRange !== 'all' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <span>
                  {filters.dateRange === 'today' ? 'Hoy' :
                   filters.dateRange === 'week' ? 'Esta semana' :
                   filters.dateRange === 'month' ? 'Este mes' :
                   filters.dateRange === '3months' ? 'Últimos 3 meses' : filters.dateRange}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, dateRange: 'all' })}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
            {filters.status !== 'all' && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <span>
                  {filters.status === 'completada' ? 'Completada' :
                   filters.status === 'cancelada' ? 'Cancelada' :
                   filters.status === 'en_proceso' ? 'En proceso' : filters.status}
                </span>
                <button
                  onClick={() => setFilters({ ...filters, status: 'all' })}
                  className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              ref={(el) => {
                if (el) orderRefs.current[order.id] = el;
              }}
            >
              <OrderItem
                order={order}
                statusColor={getStatusColor(order.status)}
                statusLabel={getStatusLabel(order.status)}
                onNavigateToTransaction={() => navigate(`/transactions?transactionId=${order.transactionId}`)}
              />
            </div>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
          </div>
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">
            {hasActiveFilters ? 'No se encontraron órdenes' : 'No hay órdenes'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            {hasActiveFilters 
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Aún no has realizado ninguna orden'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal de Filtros */}
      {showFilters && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#181411] dark:text-white">Filtros</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Filtro por Restaurante */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  Restaurante
                </label>
                <select
                  value={filters.restaurant}
                  onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Todos los restaurantes</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant} value={restaurant}>
                      {restaurant}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Rango de Fechas */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  Período
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'today', label: 'Hoy' },
                    { value: 'week', label: 'Esta semana' },
                    { value: 'month', label: 'Este mes' },
                    { value: '3months', label: 'Últimos 3 meses' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, dateRange: option.value as any })}
                      className={`py-3 px-4 rounded-xl border transition-colors ${
                        filters.dateRange === option.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-[#181411] dark:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtro por Estado */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  Estado
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'Todos' },
                    { value: 'completada', label: 'Completada' },
                    { value: 'cancelada', label: 'Cancelada' },
                    { value: 'en_proceso', label: 'En proceso' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFilters({ ...filters, status: option.value as any })}
                      className={`py-3 px-4 rounded-xl border transition-colors text-sm ${
                        filters.status === option.value
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-[#181411] dark:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3">
              <button
                onClick={clearFilters}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Limpiar
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderItem: React.FC<{ order: Order; statusColor: string; statusLabel: string; onNavigateToTransaction: () => void }> = ({ order, statusColor, statusLabel, onNavigateToTransaction }) => {
  const [expanded, setExpanded] = useState(false);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleViewPayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToTransaction();
  };

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      <div 
        className="p-4 cursor-pointer"
        onClick={handleToggleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
              <img 
                src={order.logo} 
                alt={order.restaurantName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  if (target.parentElement) {
                    target.parentElement.innerHTML = '<span class="material-symbols-outlined text-primary">restaurant</span>';
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-sm text-[#181411] dark:text-white">{order.restaurantName}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {order.date} • {order.time}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {order.items.length} {order.items.length === 1 ? 'artículo' : 'artículos'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-[#181411] dark:text-white">{order.total}</p>
            <span className="material-symbols-outlined text-gray-400 text-sm mt-1">
              {expanded ? 'expand_less' : 'expand_more'}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-white/10 px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
          <div className="space-y-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.quantity}x {item.name}
                </span>
                <span className="font-semibold text-[#181411] dark:text-white">
                  {item.price}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#181411] dark:text-white">Total</span>
            <span className="text-lg font-bold text-primary">{order.total}</span>
          </div>
          <button
            onClick={handleViewPayment}
            className="mt-3 w-full py-2 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-base">receipt</span>
            Ver pago relacionado
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryScreen;
