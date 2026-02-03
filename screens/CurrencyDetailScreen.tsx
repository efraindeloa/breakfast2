import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';

interface ExchangeRate {
  base: string;
  rates: Record<string, number>;
  date?: string;
}

interface CurrencyInfo {
  code: string;
  flag: string;
  symbol: string;
  name: string;
}

interface HistoricalDataPoint {
  date: string;
  rate: number;
}

interface LineChartProps {
  data: HistoricalDataPoint[];
  min: number;
  max: number;
  formatRate: (rate: number) => string;
  formatDate: (date: string) => string;
}

const LineChart: React.FC<LineChartProps> = ({ data, min, max, formatRate, formatDate }) => {
  const [hoveredPoint, setHoveredPoint] = useState<HistoricalDataPoint | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = 100;
  const height = 200;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calcular puntos
  const points = data.map((point, index) => {
    const x = padding.left + (index / (data.length - 1 || 1)) * chartWidth;
    const y = padding.top + chartHeight - ((point.rate - min) / (max - min || 1)) * chartHeight;
    return { x, y, ...point };
  });

  // Crear path para la línea suave
  const createSmoothPath = (points: Array<{ x: number; y: number }>) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      path += ` L ${midX} ${current.y}`;
      path += ` L ${midX} ${next.y}`;
    }
    path += ` L ${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return path;
  };

  const pathData = createSmoothPath(points);
  const lastPoint = points[points.length - 1];

  // Crear área bajo la curva
  const areaPath = `${pathData} L ${lastPoint.x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  // Calcular valores para el eje Y
  const yAxisValues = [];
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const value = min + (max - min) * (1 - ratio);
    yAxisValues.push(value);
  }

  // Formatear fecha para el eje X (mostrar mes y año)
  const formatAxisDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
  };

  // Manejar hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    
    // Encontrar el punto más cercano
    let closestPoint = points[0];
    let minDistance = Math.abs(x - points[0].x);
    
    points.forEach(point => {
      const distance = Math.abs(x - point.x);
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = point;
      }
    });
    
    setHoveredPoint(closestPoint);
    setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setMousePosition(null);
  };

  return (
    <div className="w-full relative">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-64" 
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines horizontales */}
        {yAxisValues.map((value, index) => {
          const y = padding.top + (index / (yAxisValues.length - 1)) * chartHeight;
          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                strokeWidth="0.3"
                className="text-gray-300 dark:text-gray-700"
                strokeDasharray="2,2"
              />
            </g>
          );
        })}

        {/* Área bajo la curva con gradiente rojizo/rosa */}
        <defs>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#EC4899" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={areaPath}
          fill="url(#areaGradient)"
        />

        {/* Línea principal - color rojizo/rosa */}
        <path
          d={pathData}
          fill="none"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Línea punteada vertical desde el último punto */}
        <line
          x1={lastPoint.x}
          y1={lastPoint.y}
          x2={lastPoint.x}
          y2={padding.top + chartHeight}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4,4"
          className="text-gray-400 dark:text-gray-600"
        />

        {/* Punto rojo en el último valor */}
        <circle
          cx={lastPoint.x}
          cy={lastPoint.y}
          r="4"
          fill="#EF4444"
          stroke="white"
          strokeWidth="2"
        />

        {/* Punto hover */}
        {hoveredPoint && (
          <>
            <line
              x1={hoveredPoint.x}
              y1={hoveredPoint.y}
              x2={hoveredPoint.x}
              y2={padding.top + chartHeight}
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4,4"
              className="text-gray-400 dark:text-gray-500"
            />
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="5"
              fill="currentColor"
              className="text-primary"
              stroke="white"
              strokeWidth="2"
            />
          </>
        )}

        {/* Etiquetas del eje Y */}
        {yAxisValues.map((value, index) => {
          const y = padding.top + (index / (yAxisValues.length - 1)) * chartHeight;
          return (
            <text
              key={index}
              x={padding.left - 10}
              y={y + 4}
              fontSize="10"
              fill="currentColor"
              className="text-[#897C61] dark:text-[#A8937D]"
              textAnchor="end"
            >
              {Math.round(value * 100) / 100}
            </text>
          );
        })}

        {/* Etiquetas del eje X */}
        {points.map((point, index) => {
          // Mostrar solo algunas fechas
          const showLabel = index === 0 || index === Math.floor(points.length / 2) || index === points.length - 1;
          if (!showLabel) return null;
          
          return (
            <text
              key={`label-${index}`}
              x={point.x}
              y={height - padding.bottom + 20}
              fontSize="9"
              fill="currentColor"
              className="text-[#897C61] dark:text-[#A8937D]"
              textAnchor="middle"
            >
              {formatAxisDate(point.date)}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && mousePosition && (
        <div
          className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10 pointer-events-none"
          style={{
            left: `${mousePosition.x + 10}px`,
            top: `${mousePosition.y - 10}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-sm font-semibold text-[#181411] dark:text-white">
            {formatRate(hoveredPoint.rate)}
          </div>
          <div className="text-xs text-[#897C61] dark:text-[#A8937D]">
            {formatDate(hoveredPoint.date)}
          </div>
        </div>
      )}
    </div>
  );
};

const CurrencyDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const [currentRate, setCurrentRate] = useState<ExchangeRate | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalDataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const allCurrencies: CurrencyInfo[] = [
    { code: 'USD', flag: '🇺🇸', symbol: 'US$', name: 'US Dollar' },
    { code: 'MXN', flag: '🇲🇽', symbol: 'MX$', name: 'Mexican Peso' },
    { code: 'CAD', flag: '🇨🇦', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'EUR', flag: '🇪🇺', symbol: '€', name: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', symbol: '£', name: 'British Pound' },
    { code: 'JPY', flag: '🇯🇵', symbol: 'JP¥', name: 'Japanese Yen' }
  ];

  const currency = allCurrencies.find(c => c.code === code) || allCurrencies[0];
  const isUSD = currency.code === 'USD';

  // Calcular fechas para el historial
  const getDateRange = (periodType: 'week' | 'month' | 'year') => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (periodType) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    
    return { startDate, endDate };
  };

  // Obtener tasa actual
  useEffect(() => {
    const fetchCurrentRate = async () => {
      try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (!response.ok) {
          throw new Error('Error al obtener tasa actual');
        }
        const data = await response.json();
        setCurrentRate(data);
      } catch (err) {
        console.error('Error fetching current rate:', err);
        setError('Error al cargar tasa de cambio');
        setCurrentRate(null);
      }
    };

    fetchCurrentRate();
  }, []);

  // Obtener datos históricos
  useEffect(() => {
    const fetchHistoricalData = async () => {
      // La API gratuita de exchangerate-api.com no tiene endpoint histórico completo
      // Por lo tanto, no mostramos datos históricos
      setHistoricalData([]);
      setLoading(false);
      setError('Los datos históricos no están disponibles con la API gratuita');
    };

    if (currentRate) {
      fetchHistoricalData();
    } else {
      setHistoricalData([]);
      setLoading(false);
    }
  }, [code, period, currentRate, isUSD]);

  const formatRate = (rate: number): string => {
    if (currency.code === 'JPY') {
      return `${currency.symbol} ${rate.toFixed(2)}`;
    }
    return `${currency.symbol} ${rate.toFixed(4)}`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getRateChange = (): { value: number; percentage: number; isPositive: boolean } | null => {
    if (historicalData.length < 2) return null;
    
    const firstRate = historicalData[0].rate;
    const lastRate = historicalData[historicalData.length - 1].rate;
    const change = lastRate - firstRate;
    const percentage = ((change / firstRate) * 100);
    
    return {
      value: change,
      percentage: Math.abs(percentage),
      isPositive: change >= 0
    };
  };

  const getMinMaxRates = () => {
    if (historicalData.length === 0) return { min: 0, max: 0 };
    
    const rates = historicalData.map(d => d.rate);
    return {
      min: Math.min(...rates),
      max: Math.max(...rates)
    };
  };

  const currentRateValue = isUSD ? 1.0 : (currentRate?.rates[currency.code] || 0);
  const rateChange = getRateChange();
  const { min, max } = getMinMaxRates();

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-20">
      <TopNavbar 
        title={`${currency.flag} ${currency.code}`} 
        showBackButton 
      />

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('common.loading') || 'Cargando...'}</p>
            </div>
          </div>
        ) : error || !currentRate ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error || 'No se pudieron cargar los datos'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              {t('common.retry') || 'Reintentar'}
            </button>
          </div>
        ) : (
          <>
            {/* Información Actual */}
            <div className="mb-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 border border-primary/20 dark:border-primary/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-[#897C61] dark:text-[#A8937D] mb-1">
                    {currency.name}
                  </div>
                  <div className="text-4xl font-bold text-[#181411] dark:text-white mb-2">
                    {formatRate(currentRateValue)}
                  </div>
                  <div className="text-sm text-[#897C61] dark:text-[#A8937D]">
                    {t('currency.detail.perUSD') || 'por 1 USD'}
                  </div>
                </div>
                <div className="text-6xl">
                  {currency.flag}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-primary/20 dark:border-primary/30">
                <div className="text-center">
                  <div className="text-xs text-[#897C61] dark:text-[#A8937D] mb-1">
                    {t('currency.detail.change') || 'Cambio'}
                  </div>
                  {rateChange && (
                    <div className={`text-lg font-semibold ${
                      rateChange.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {rateChange.isPositive ? '+' : '-'}{formatRate(Math.abs(rateChange.value))}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#897C61] dark:text-[#A8937D] mb-1">
                    {t('currency.detail.min') || 'Mínimo'}
                  </div>
                  <div className="text-lg font-semibold text-[#181411] dark:text-white">
                    {historicalData.length > 0 ? formatRate(min) : '-'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-[#897C61] dark:text-[#A8937D] mb-1">
                    {t('currency.detail.max') || 'Máximo'}
                  </div>
                  <div className="text-lg font-semibold text-[#181411] dark:text-white">
                    {historicalData.length > 0 ? formatRate(max) : '-'}
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de Período */}
            <div className="mb-6">
              <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                {(['week', 'month', 'year'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      period === p
                        ? 'bg-primary text-white'
                        : 'text-[#181411] dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {p === 'week' && (t('currency.detail.week') || 'Semana')}
                    {p === 'month' && (t('currency.detail.month') || 'Mes')}
                    {p === 'year' && (t('currency.detail.year') || 'Año')}
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico de Historial */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
                {t('currency.detail.history') || 'Historial'}
              </h3>
              <div className="rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] p-4">
                {historicalData.length > 0 ? (
                  <LineChart data={historicalData.slice(-10).reverse()} min={min} max={max} formatRate={formatRate} formatDate={formatDate} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {t('currency.detail.noData') || 'No hay datos disponibles'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de Historial Completo */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
                {t('currency.detail.detailedHistory') || 'Historial Detallado'}
              </h3>
              <div className="rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#897C61] dark:text-[#A8937D] uppercase tracking-wider">
                          {t('currency.detail.date') || 'Fecha'}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-[#897C61] dark:text-[#A8937D] uppercase tracking-wider">
                          {t('currency.detail.rate') || 'Tasa'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {historicalData.length > 0 ? (
                        historicalData.slice().reverse().map((point, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="px-4 py-3 text-sm text-[#181411] dark:text-white">
                              {formatDate(point.date)}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-right text-[#181411] dark:text-white">
                              {formatRate(point.rate)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                            {t('currency.detail.noData') || 'No hay datos históricos disponibles'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CurrencyDetailScreen;
