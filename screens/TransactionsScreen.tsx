import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: number;
  restaurantName: string;
  date: string;
  amount: string;
  logo: string;
  cardLast4: string;
}

interface Filters {
  restaurant: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | '3months';
  minAmount: string;
  maxAmount: string;
  cardLast4: string;
}

const TransactionsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    restaurant: '',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    cardLast4: '',
  });

  // Lista completa de transacciones (incluyendo las recientes y más antiguas)
  const transactions: Transaction[] = [
    {
      id: 1,
      restaurantName: 'Café del Sol',
      date: 'Hoy, 8:45 AM',
      amount: '$12.50',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '4242',
    },
    {
      id: 2,
      restaurantName: 'La Panadería Artesanal',
      date: 'Ayer, 9:15 AM',
      amount: '$8.75',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTW04rD1StMdw5VuFmivxCsbvN_VFjrpbP1fqnSpdDL84rU6b3Mm6VZOi1IGaMZZSGyhRpeuhIyuBuI2qoIJnrvssVJjWywIGD53-994UzA3AXankHvqmjFerRER3Xtv8vI4AXqh2K8rN1puxxdNFmj94DJHZyLW_ViLJYZiW-DiUZ_Z8LlJVyPu-o9dZ004NABiXUsqXvcel_zsQBdyc13Vm9JsBE1FHo2kwkmYEHAejYBBBKvLwheTiiwnprPzmk1jwASDobqC',
      cardLast4: '8888',
    },
    {
      id: 3,
      restaurantName: 'Brunch & Co.',
      date: '22 Oct, 10:02 AM',
      amount: '$15.20',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      cardLast4: '4242',
    },
    {
      id: 4,
      restaurantName: 'Restaurante El Patio',
      date: '20 Oct, 7:30 PM',
      amount: '$45.80',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkUTW04rD1StMdw5VuFmivxCsbvN_VFjrpbP1fqnSpdDL84rU6b3Mm6VZOi1IGaMZZSGyhRpeuhIyuBuI2qoIJnrvssVJjWywIGD53-994UzA3AXankHvqmjFerRER3Xtv8vI4AXqh2K8rN1puxxdNFmj94DJHZyLW_ViLJYZiW-DiUZ_Z8LlJVyPu-o9dZ004NABiXUsqXvcel_zsQBdyc13Vm9JsBE1FHo2kwkmYEHAejYBBBKvLwheTiiwnprPzmk1jwASDobqC',
      cardLast4: '8888',
    },
    {
      id: 5,
      restaurantName: 'Sushi Bar Tokyo',
      date: '18 Oct, 12:15 PM',
      amount: '$32.40',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '4242',
    },
    {
      id: 6,
      restaurantName: 'Pizzeria Italiana',
      date: '15 Oct, 6:45 PM',
      amount: '$24.90',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDNanplizQsqu_AWgfvOvcfFVNxOTL41X1kCPX1xvEMEsYo9o0WTi5Zp4q-4XKvx8ixXcz9vsSZrCafyWPVQjOxr0skT0HWuaKy2QIBpPU9lHutFSJgkLDlcksL-7CNVKdtkKJaxm4-_Qf-9Zs8CHDtVEK_nLT9Lvx2F1w3rR5aJ0_sVNdNhSKOeqx2atLUGjzVCZnSpfVYviNGCLiGQ8ScYzXfPiY-fLU0OJrfN2_RXnrYGklyPMwO4hkStBj8oI_4Dc0breu5o4hK',
      cardLast4: '4242',
    },
    {
      id: 7,
      restaurantName: 'Café del Sol',
      date: '12 Oct, 9:20 AM',
      amount: '$18.60',
      logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc2H-XYiq7VOCFCpx2cuCePgbQE7ZDrkxgLFu-itmo_MSFUGuJ4MEK9gfv4p-Lur7DUSWI21FL7WjRrLtfWx6nu7z0mjAn2bhClTodzDi-pzY6r3wzdPoDRYMS1cM7ZBlUns8GzyAI7djeA6qN2gngbm8XYIbP5M6fXO48cdOauM5hZYsfaZ6Mxl204e6c5lXbMZh9Shgmz6nScvzItmVrWwCvhFVLdRbJtmqHe_EdQndGNhwA5EeplOu2NO9sXkEhh-WocuJ1KcoU',
      cardLast4: '8888',
    },
  ];

  // Obtener lista única de restaurantes para el filtro
  const restaurants = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.restaurantName)));
    return unique.sort();
  }, []);

  // Obtener lista única de tarjetas para el filtro
  const cards = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.cardLast4)));
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
    // Parsear formato "22 Oct, 10:02 AM"
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

  // Filtrar transacciones
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      // Filtro por restaurante
      if (filters.restaurant && transaction.restaurantName !== filters.restaurant) {
        return false;
      }

      // Filtro por rango de fechas
      if (filters.dateRange !== 'all') {
        const transactionDate = parseDate(transaction.date);
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
        if (transactionDate < cutoffDate) {
          return false;
        }
      }

      // Filtro por monto mínimo
      if (filters.minAmount) {
        const min = parseFloat(filters.minAmount);
        const amount = parseFloat(transaction.amount.replace('$', ''));
        if (amount < min) {
          return false;
        }
      }

      // Filtro por monto máximo
      if (filters.maxAmount) {
        const max = parseFloat(filters.maxAmount);
        const amount = parseFloat(transaction.amount.replace('$', ''));
        if (amount > max) {
          return false;
        }
      }

      // Filtro por tarjeta
      if (filters.cardLast4 && transaction.cardLast4 !== filters.cardLast4) {
        return false;
      }

      return true;
    });
  }, [filters, transactions]);

  const hasActiveFilters = useMemo(() => {
    return filters.restaurant !== '' ||
           filters.dateRange !== 'all' ||
           filters.minAmount !== '' ||
           filters.maxAmount !== '' ||
           filters.cardLast4 !== '';
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      restaurant: '',
      dateRange: 'all',
      minAmount: '',
      maxAmount: '',
      cardLast4: '',
    });
  };

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800">
        <div className="size-12 flex items-center" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </div>
        <h2 className="text-lg font-bold flex-1 text-center">Todas las Transacciones</h2>
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-[#181411] dark:text-white">Historial de Pagos</h3>
            <p className="text-[#6b7280] dark:text-gray-400 mt-1">
              {filteredTransactions.length} {filteredTransactions.length === 1 ? 'transacción' : 'transacciones'}
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
      </div>

      <div className="px-4 py-4">
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              restaurantName={transaction.restaurantName}
              date={transaction.date}
              amount={transaction.amount}
              logo={transaction.logo}
              cardLast4={transaction.cardLast4}
            />
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-4xl text-gray-400">search_off</span>
          </div>
          <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-2">
            {hasActiveFilters ? 'No se encontraron resultados' : 'No hay transacciones'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            {hasActiveFilters 
              ? 'Intenta ajustar los filtros para ver más resultados'
              : 'Aún no has realizado ninguna transacción'}
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

              {/* Filtro por Monto */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  Rango de Monto
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder="Mínimo"
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Máximo"
                      value={filters.maxAmount}
                      onChange={(e) => setFilters({ ...filters, maxAmount: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro por Tarjeta */}
              <div>
                <label className="block text-sm font-semibold text-[#181411] dark:text-white mb-2">
                  Tarjeta
                </label>
                <select
                  value={filters.cardLast4}
                  onChange={(e) => setFilters({ ...filters, cardLast4: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">Todas las tarjetas</option>
                  {cards.map((card) => (
                    <option key={card} value={card}>
                      **** **** **** {card}
                    </option>
                  ))}
                </select>
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

const TransactionItem: React.FC<{ restaurantName: string; date: string; amount: string; logo: string; cardLast4: string }> = ({ restaurantName, date, amount, logo, cardLast4 }) => (
  <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:shadow-md transition-shadow">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
        <img 
          src={logo} 
          alt={restaurantName}
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
      <div>
        <p className="font-semibold text-sm text-[#181411] dark:text-white">{restaurantName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">**** **** **** {cardLast4}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-[#181411] dark:text-white">{amount}</p>
    </div>
  </div>
);

export default TransactionsScreen;
