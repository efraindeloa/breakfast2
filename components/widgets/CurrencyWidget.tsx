import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
}

interface CurrencyInfo {
  code: string;
  flag: string;
  symbol: string;
  name: string;
}

const CurrencyWidget: React.FC = () => {
  const navigate = useNavigate();
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedCurrencies, setSelectedCurrencies] = useState<Set<string>>(new Set());

  const allCurrencies: CurrencyInfo[] = [
    { code: 'USD', flag: '🇺🇸', symbol: 'US$', name: 'US Dollar' },
    { code: 'MXN', flag: '🇲🇽', symbol: 'MX$', name: 'Mexican Peso' },
    { code: 'CAD', flag: '🇨🇦', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'EUR', flag: '🇪🇺', symbol: '€', name: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', symbol: '£', name: 'British Pound' },
    { code: 'JPY', flag: '🇯🇵', symbol: 'JP¥', name: 'Japanese Yen' }
  ];

  // Cargar divisas seleccionadas desde localStorage
  useEffect(() => {
    const saved = localStorage.getItem('currencyWidget_selectedCurrencies');
    if (saved) {
      try {
        const savedSet = new Set(JSON.parse(saved));
        // Asegurar que USD siempre esté incluida
        savedSet.add('USD');
        setSelectedCurrencies(savedSet);
        // Guardar de nuevo con USD incluida
        localStorage.setItem('currencyWidget_selectedCurrencies', JSON.stringify(Array.from(savedSet)));
      } catch (err) {
        // Si hay error, usar divisas por defecto: USD, MXN, EUR
        const defaultSet = new Set(['USD', 'MXN', 'EUR']);
        setSelectedCurrencies(defaultSet);
        localStorage.setItem('currencyWidget_selectedCurrencies', JSON.stringify(Array.from(defaultSet)));
      }
    } else {
      // Por defecto, mostrar USD, MXN y EUR
      const defaultSet = new Set(['USD', 'MXN', 'EUR']);
      setSelectedCurrencies(defaultSet);
      localStorage.setItem('currencyWidget_selectedCurrencies', JSON.stringify(Array.from(defaultSet)));
    }
  }, []);

  // Filtrar divisas según selección
  const currencies = allCurrencies.filter(c => selectedCurrencies.has(c.code));

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        // Usar API gratuita de exchangerate-api.com
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
          throw new Error('Error al obtener tasas de cambio');
        }
        const data = await response.json();
        setExchangeRates(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError('Error al cargar divisas');
        // Usar datos mock en caso de error
        setExchangeRates({
          base: 'USD',
          rates: {
            USD: 1.0,
            CAD: 1.22,
            EUR: 0.90,
            GBP: 0.64,
            JPY: 121.11
          }
        });
        setLastUpdated(new Date());
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
    // Actualizar cada hora
    const interval = setInterval(fetchExchangeRates, 3600000);
    return () => clearInterval(interval);
  }, []);

  const formatRate = (currency: CurrencyInfo, rate: number): string => {
    if (currency.code === 'USD') {
      return `${currency.symbol} 1.00`;
    }
    if (currency.code === 'JPY') {
      return `${currency.symbol} ${rate.toFixed(2)}`;
    }
    return `${currency.symbol} ${rate.toFixed(2)}`;
  };

  const getTimeAgo = (): string => {
    if (!lastUpdated) return '';
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Actualizado hace menos de un minuto';
    if (diffMins === 1) return 'Actualizado hace 1 minuto';
    return `Actualizado hace ${diffMins} minutos`;
  };

  const toggleCurrency = (code: string) => {
    // No permitir deseleccionar USD
    if (code === 'USD') return;
    
    const newSelected = new Set(selectedCurrencies);
    if (newSelected.has(code)) {
      // No permitir deseleccionar si solo queda USD
      if (newSelected.size > 1) {
        newSelected.delete(code);
      }
    } else {
      newSelected.add(code);
    }
    // Asegurar que USD siempre esté incluida
    newSelected.add('USD');
    setSelectedCurrencies(newSelected);
    localStorage.setItem('currencyWidget_selectedCurrencies', JSON.stringify(Array.from(newSelected)));
  };

  return (
    <div className="rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-primary text-lg">language</span>
            </div>
            <h3 className="text-[#181411] dark:text-white text-base font-bold tracking-[-0.015em]">Divisas</h3>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[#181411] dark:text-white text-lg">settings</span>
          </button>
        </div>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <span className="text-[#897C61] dark:text-[#A8937D] text-sm">Cargando...</span>
          </div>
        )}

        {!loading && exchangeRates && (
          <div>
            {/* Currency List */}
            <div className="space-y-0">
              {currencies.map((currency, index) => {
                const rate = currency.code === 'USD' 
                  ? 1.0 
                  : exchangeRates.rates[currency.code];
                
                if (!rate) return null;
                
                const isUSD = currency.code === 'USD';
                
                return (
                  <div 
                    key={currency.code} 
                    onClick={() => navigate(`/currency-detail/${currency.code}`)}
                    className={`flex items-center justify-between py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-2 -mx-2 ${
                      index < currencies.length - 1 ? 'border-b border-[#E6E0DB] dark:border-[#3D3228]' : ''
                    }`}
                  >
                    {/* Left: Flag + Code */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shrink-0 bg-gray-100 dark:bg-gray-800">
                        {currency.flag}
                      </div>
                      <span className="text-sm font-medium text-[#181411] dark:text-white">
                        {currency.code}
                      </span>
                    </div>
                    
                    {/* Right: Rate */}
                    <span 
                      className={`text-sm font-medium shrink-0 ${
                        isUSD ? 'text-primary' : 'text-[#181411] dark:text-white'
                      }`}
                    >
                      {formatRate(currency, rate)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-[#E6E0DB] dark:border-[#3D3228]">
              <div className="text-xs text-[#897C61] dark:text-[#A8937D] mb-1 cursor-pointer hover:text-primary transition-colors">
                Ver más...
              </div>
              {lastUpdated && (
                <div className="text-xs text-[#897C61] dark:text-[#A8937D]">
                  {getTimeAgo()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configuración */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="bg-white dark:bg-[#2d241c] rounded-xl border border-gray-100 dark:border-[#3D3228] shadow-lg max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#181411] dark:text-white text-lg font-bold tracking-[-0.015em]">
                Seleccionar Divisas
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-[#181411] dark:text-white text-lg">close</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {allCurrencies.map((currency) => {
                const isSelected = selectedCurrencies.has(currency.code);
                const isUSD = currency.code === 'USD';
                const isOnlyOne = selectedCurrencies.size === 1 && isSelected;
                const isDisabled = isUSD || isOnlyOne;

                return (
                  <button
                    key={currency.code}
                    onClick={() => !isDisabled && toggleCurrency(currency.code)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary dark:border-primary/50'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'}`}
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-2xl shrink-0 bg-gray-100 dark:bg-gray-800">
                      {currency.flag}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-[#181411] dark:text-white">
                        {currency.code}
                      </div>
                      <div className="text-xs text-[#897C61] dark:text-[#A8937D]">
                        {currency.name}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="material-symbols-outlined text-primary text-lg">
                        check_circle
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-[#E6E0DB] dark:border-[#3D3228]">
              <p className="text-xs text-[#897C61] dark:text-[#A8937D] text-center">
                Selecciona al menos una divisa
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyWidget;
