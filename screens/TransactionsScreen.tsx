import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getUserTransactions, UserTransaction } from '../services/database';
import TopNavbar from '../components/TopNavbar';

interface Transaction {
  id: number;
  restaurantName: string;
  date: string;
  amount: string;
  logo: string;
  cardLast4: string;
  orderId: number; // ID de la orden relacionada
  subtotal: string;
  tip: string;
  tipPercentage?: number;
  iva: string;
  total: string;
  paymentMethod: 'card' | 'cash';
  invoiceSent: boolean;
  invoiceEmail?: string;
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
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const orderIdParam = searchParams.get('orderId');
  const transactionIdParam = searchParams.get('transactionId');
  const transactionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [filters, setFilters] = useState<Filters>({
    restaurant: '',
    dateRange: 'all',
    minAmount: '',
    maxAmount: '',
    cardLast4: '',
  });

  // Lista de transacciones - cargar desde la base de datos
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { user } = useAuth();
  
  // Cargar transacciones desde la base de datos
  useEffect(() => {
    const loadTransactions = async () => {
      if (!user?.id) {
        setTransactions([]);
        return;
      }

      try {
        const dbTransactions = await getUserTransactions(user.id, 100);
        
        // Convertir transacciones de la BD al formato esperado por el componente
        const formattedTransactions: Transaction[] = dbTransactions.map((t: UserTransaction) => {
          const date = new Date(t.created_at);
          const dateStr = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          
          return {
            id: parseInt(t.id.replace(/-/g, '').substring(0, 8), 16) || Math.floor(Math.random() * 1000000),
            restaurantName: t.restaurant_name,
            date: dateStr,
            amount: `$${t.total.toFixed(2)}`,
            logo: '/logo.png', // TODO: Obtener logo del restaurante
            cardLast4: t.payment_method_last4 || '',
            orderId: parseInt(t.order_id.replace(/-/g, '').substring(0, 8), 16) || 0,
            subtotal: `$${t.subtotal.toFixed(2)}`,
            tip: `$${t.tip.toFixed(2)}`,
            tipPercentage: t.tip_percentage,
            iva: `$${t.tax.toFixed(2)}`,
            total: `$${t.total.toFixed(2)}`,
            paymentMethod: t.payment_method === 'card' ? 'card' : 'cash',
            invoiceSent: t.invoice_sent,
            invoiceEmail: t.invoice_email,
          };
        });
        
        setTransactions(formattedTransactions);
      } catch (error) {
        console.error('Error loading transactions:', error);
        setTransactions([]);
      }
    };
    
    loadTransactions();
  }, [user?.id]);

  // Obtener lista única de restaurantes para el filtro
  const restaurants = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.restaurantName)));
    return unique.sort();
  }, [transactions]);

  // Obtener lista única de tarjetas para el filtro
  const cards = useMemo(() => {
    const unique = Array.from(new Set(transactions.map(t => t.cardLast4)));
    return unique.sort();
  }, [transactions]);

  // Función para convertir fecha a número para comparación
  const parseDate = (dateStr: string): number => {
    const now = new Date();
    // Usar texto en inglés para comparación ya que las fechas están hardcodeadas en inglés
    if (dateStr.includes('Today') || dateStr.includes('Hoy')) {
      return now.getTime();
    }
    if (dateStr.includes('Yesterday') || dateStr.includes('Ayer')) {
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

  // Scroll al elemento cuando se navega con orderId o transactionId
  useEffect(() => {
    if (orderIdParam) {
      const orderId = parseInt(orderIdParam);
      const transaction = transactions.find(t => t.orderId === orderId);
      if (transaction) {
        const element = transactionRefs.current[transaction.orderId];
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
    }
    if (transactionIdParam) {
      const transactionId = parseInt(transactionIdParam);
      const transaction = transactions.find(t => t.id === transactionId);
      if (transaction) {
        const element = transactionRefs.current[transaction.orderId];
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
    }
  }, [orderIdParam, transactionIdParam, transactions]);

  return (
    <div className="pb-32 overflow-y-auto bg-background-light dark:bg-background-dark min-h-screen">
      <TopNavbar 
        title="Todas las Transacciones"
        showBackButton={true}
        showAvatar={false}
      />
      <div className="sticky top-[73px] z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-end p-2 pr-4">
          <button
            onClick={() => setShowFilters(true)}
            className={`relative ${hasActiveFilters ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}
            title={t('transactions.filter')}
          >
            <span className="material-symbols-outlined cursor-pointer">filter_list</span>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      <div className="px-4 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-[#181411] dark:text-white">{t('transactions.paymentHistory')}</h3>
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
              {t('transactions.clearFilters')}
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <div
              key={transaction.id}
              ref={(el) => {
                if (el) transactionRefs.current[transaction.orderId] = el;
              }}
            >
              <TransactionItem
                transaction={transaction}
                onNavigateToOrder={() => navigate(`/order-history?orderId=${transaction.orderId}`)}
                onNavigateToDetail={() => navigate(`/transaction-detail/${transaction.id}`)}
              />
            </div>
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
              ? t('transactions.adjustFilters')
              : t('transactions.noTransactionsYet')}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-primary text-white rounded-xl font-semibold text-sm"
            >
              {t('transactions.clearFilters')}
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
                  {t('transactions.restaurant')}
                </label>
                <select
                  value={filters.restaurant}
                  onChange={(e) => setFilters({ ...filters, restaurant: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">{t('transactions.allRestaurants')}</option>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { value: 'all', label: t('transactions.all') },
                    { value: 'today', label: t('transactions.today') },
                    { value: 'week', label: t('transactions.thisWeek') },
                    { value: 'month', label: t('transactions.thisMonth') },
                    { value: '3months', label: t('transactions.last3Months') },
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
                  {t('transactions.amountRange')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="number"
                      placeholder={t('transactions.minimum')}
                      value={filters.minAmount}
                      onChange={(e) => setFilters({ ...filters, minAmount: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder={t('transactions.maximum')}
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
                  {t('transactions.card')}
                </label>
                <select
                  value={filters.cardLast4}
                  onChange={(e) => setFilters({ ...filters, cardLast4: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#181411] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="">{t('transactions.allCards')}</option>
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
                {t('transactions.clear')}
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                {t('transactions.apply')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionItem: React.FC<{ transaction: Transaction; onNavigateToOrder: () => void; onNavigateToDetail: () => void }> = ({ transaction, onNavigateToOrder, onNavigateToDetail }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigateToDetail();
  };

  return (
    <div 
      onClick={handleClick}
      className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
          <img 
            src={transaction.logo} 
            alt={transaction.restaurantName}
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
          <p className="font-semibold text-sm text-[#181411] dark:text-white">{transaction.restaurantName}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{transaction.date}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">**** **** **** {transaction.cardLast4}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-2">
        <div>
          <p className="font-bold text-[#181411] dark:text-white">{transaction.amount}</p>
        </div>
        <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors text-sm">
          arrow_forward_ios
        </span>
      </div>
    </div>
  );
};

export default TransactionsScreen;
