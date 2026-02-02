import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import TopNavbar from '../components/TopNavbar';

interface WeatherDay {
  date: string;
  day: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
  description?: string;
}

interface CurrentWeather {
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  location: string;
  humidity?: number;
  windSpeed?: number;
  feelsLike?: number;
  pressure?: number;
  visibility?: number;
}

const WeatherDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCitySearch, setShowCitySearch] = useState<boolean>(false);
  const [cityCoordinates, setCityCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  // Cargar ciudad guardada o usar geolocalización
  useEffect(() => {
    const savedCity = localStorage.getItem('weatherCity');
    if (savedCity) {
      setSelectedCity(savedCity);
      searchCity(savedCity);
    } else {
      // Usar geolocalización por defecto
      getCurrentLocation();
    }
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no disponible');
      loadMockData();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCityCoordinates({ lat: latitude, lon: longitude });
        fetchWeatherByCoordinates(latitude, longitude);
      },
      (err) => {
        console.error('Error getting location:', err);
        loadMockData();
      }
    );
  };

  const searchCity = async (cityName: string) => {
    if (!cityName.trim()) return;

    try {
      // @ts-ignore
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
      if (!apiKey) {
        setSelectedCity(cityName);
        loadMockData();
        return;
      }

      // Buscar coordenadas de la ciudad usando Geocoding API
      const geocodeResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${apiKey}`
      );

      if (!geocodeResponse.ok) {
        throw new Error('Error al buscar ciudad');
      }

      const geocodeData = await geocodeResponse.json();
      if (geocodeData.length === 0) {
        setError('Ciudad no encontrada');
        return;
      }

      const { lat, lon } = geocodeData[0];
      setCityCoordinates({ lat, lon });
      setSelectedCity(cityName);
      localStorage.setItem('weatherCity', cityName);
      fetchWeatherByCoordinates(lat, lon);
    } catch (err) {
      console.error('Error searching city:', err);
      setError('Error al buscar ciudad');
      loadMockData();
    }
  };

  const fetchWeatherByCoordinates = async (lat: number, lon: number) => {
    try {
      setLoading(true);
      setError(null);

      // @ts-ignore
      const apiKey = import.meta.env.VITE_WEATHER_API_KEY;

      if (apiKey) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=es`
          );

          if (!response.ok) {
            if (response.status === 401) {
              console.warn('API key de OpenWeatherMap no válida, usando datos mock');
              loadMockData();
              return;
            }
            throw new Error(`Error ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          const processedData = processWeatherData(data);
          setWeatherData(processedData);
          const current = processCurrentWeather(data);
          setCurrentWeather(current);
        } catch (err) {
          console.error('Error fetching weather:', err);
          loadMockData();
        }
      } else {
        loadMockData();
      }
    } catch (err) {
      console.error('Error in weather fetch:', err);
      setError('Error al cargar clima');
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const processCurrentWeather = (data: any): CurrentWeather => {
    const today = data.list[0];
    const todayTemps = data.list.filter((item: any) => {
      const itemDate = new Date(item.dt * 1000);
      const todayDate = new Date();
      return itemDate.toDateString() === todayDate.toDateString();
    });

    const temps = todayTemps.map((item: any) => item.main.temp);
    const tempMin = Math.min(...temps);
    const tempMax = Math.max(...temps);

    const location = data.city?.name || selectedCity || 'Ubicación';

    return {
      temp: Math.round(today.main.temp),
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      condition: today.weather[0].description,
      icon: getWeatherIcon(today.weather[0].main),
      location: location,
      humidity: today.main.humidity,
      windSpeed: today.wind?.speed ? Math.round(today.wind.speed * 3.6) : undefined, // Convertir m/s a km/h
      feelsLike: Math.round(today.main.feels_like),
      pressure: today.main.pressure,
      visibility: today.visibility ? Math.round(today.visibility / 1000) : undefined, // Convertir m a km
    };
  };

  const processWeatherData = (data: any): WeatherDay[] => {
    const days: WeatherDay[] = [];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    // Agrupar por día y calcular min/max de cada día
    const groupedByDay: Record<string, any[]> = {};

    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();

      if (!groupedByDay[dayKey]) {
        groupedByDay[dayKey] = [];
      }
      groupedByDay[dayKey].push(item);
    });

    // Convertir a array y procesar cada día (próximos 5 días - máximo que devuelve la API)
    Object.entries(groupedByDay).slice(0, 5).forEach(([dayKey, items]) => {
      const date = new Date(dayKey);
      const temps = items.map((item: any) => item.main.temp);
      const tempMin = Math.min(...temps);
      const tempMax = Math.max(...temps);
      const mainItem = items[Math.floor(items.length / 2)]; // Usar el item del medio del día

      days.push({
        date: date.toISOString().split('T')[0],
        day: dayNames[date.getDay()],
        temp: Math.round(mainItem.main.temp),
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        condition: mainItem.weather[0].description,
        icon: getWeatherIcon(mainItem.weather[0].main),
        humidity: mainItem.main.humidity,
        windSpeed: mainItem.wind?.speed ? Math.round(mainItem.wind.speed * 3.6) : undefined,
        description: mainItem.weather[0].description,
      });
    });

    return days;
  };

  const getWeatherIcon = (condition: string): string => {
    const iconMap: Record<string, string> = {
      'Clear': 'wb_sunny',
      'Clouds': 'cloud',
      'Rain': 'rainy',
      'Drizzle': 'grain',
      'Thunderstorm': 'thunderstorm',
      'Snow': 'ac_unit',
      'Mist': 'foggy',
      'Fog': 'foggy',
    };
    return iconMap[condition] || 'wb_sunny';
  };

  const getWeatherIconComponent = (icon: string, size: string = 'text-4xl') => {
    const iconMap: Record<string, string> = {
      'wb_sunny': '☀️',
      'cloud': '☁️',
      'rainy': '🌧️',
      'thunderstorm': '⛈️',
      'grain': '🌦️',
      'ac_unit': '❄️',
      'foggy': '🌫️',
      'wb_cloudy': '⛅',
    };

    return (
      <span className={`${size} leading-none`}>
        {iconMap[icon] || '☀️'}
      </span>
    );
  };

  const loadMockData = () => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const days: WeatherDay[] = [];
    const conditions = [
      { condition: 'Despejado', icon: 'wb_sunny', temp: 23, min: 20, max: 28 },
      { condition: 'Lluvia', icon: 'rainy', temp: 24, min: 22, max: 30 },
      { condition: 'Tormenta', icon: 'thunderstorm', temp: 24, min: 22, max: 30 },
      { condition: 'Nublado', icon: 'cloud', temp: 25, min: 23, max: 32 },
      { condition: 'Despejado', icon: 'wb_sunny', temp: 26, min: 24, max: 33 },
    ];

    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const condition = conditions[i];
      days.push({
        date: date.toISOString().split('T')[0],
        day: dayNames[date.getDay()],
        temp: condition.temp,
        tempMin: condition.min,
        tempMax: condition.max,
        condition: condition.condition,
        icon: condition.icon,
        humidity: 65,
        windSpeed: 15,
      });
    }

    setWeatherData(days);
    setCurrentWeather({
      temp: 23,
      tempMin: 20,
      tempMax: 28,
      condition: 'Despejado',
      icon: 'wb_sunny',
      location: selectedCity || 'Ciudad',
      humidity: 65,
      windSpeed: 15,
      feelsLike: 24,
      pressure: 1013,
      visibility: 10,
    });
    setLoading(false);
  };

  const handleSearchCity = () => {
    if (searchQuery.trim()) {
      searchCity(searchQuery.trim());
      setShowCitySearch(false);
      setSearchQuery('');
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const day = dayNames[date.getDay()];
    const month = monthNames[date.getMonth()];
    const dayNum = date.getDate();
    return `${day} ${dayNum}/${month}`;
  };

  const getTimeOfDayColors = (): { from: string; to: string; darkFrom: string; darkTo: string } => {
    const hour = new Date().getHours();
    
    // Mañana: 6:00 - 12:00
    if (hour >= 6 && hour < 12) {
      return {
        from: 'from-orange-400',
        to: 'to-yellow-400',
        darkFrom: 'dark:from-orange-500',
        darkTo: 'dark:to-yellow-500'
      };
    }
    // Tarde: 12:00 - 18:00
    else if (hour >= 12 && hour < 18) {
      return {
        from: 'from-blue-500',
        to: 'to-cyan-500',
        darkFrom: 'dark:from-blue-600',
        darkTo: 'dark:to-cyan-600'
      };
    }
    // Noche: 18:00 - 6:00
    else {
      return {
        from: 'from-purple-600',
        to: 'to-indigo-700',
        darkFrom: 'dark:from-purple-700',
        darkTo: 'dark:to-indigo-800'
      };
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-background-dark pb-20">
      <TopNavbar title={t('weather.detail.title') || 'Pronóstico del Clima'} showBackButton />

      <div className="px-4 py-6">
        {/* Selector de Ciudad */}
        <div className="mb-6">
          <button
            onClick={() => setShowCitySearch(!showCitySearch)}
            className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] shadow-sm hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div className="text-left">
                <div className="text-sm text-[#897C61] dark:text-[#A8937D]">
                  {t('weather.detail.city') || 'Ciudad'}
                </div>
                <div className="text-base font-semibold text-[#181411] dark:text-white">
                  {selectedCity || (t('weather.detail.currentLocation') || 'Ubicación actual')}
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">
              {showCitySearch ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {showCitySearch && (
            <div className="mt-3 p-4 rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] shadow-sm">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchCity()}
                  placeholder={t('weather.detail.searchPlaceholder') || 'Buscar ciudad...'}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-[#181411] dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-primary"
                />
                <button
                  onClick={handleSearchCity}
                  className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                >
                  {t('common.search') || 'Buscar'}
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedCity('');
                  localStorage.removeItem('weatherCity');
                  getCurrentLocation();
                  setShowCitySearch(false);
                }}
                className="mt-3 w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-[#181411] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
              >
                {t('weather.detail.useCurrentLocation') || 'Usar ubicación actual'}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">{t('common.loading') || 'Cargando...'}</p>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => {
                if (cityCoordinates) {
                  fetchWeatherByCoordinates(cityCoordinates.lat, cityCoordinates.lon);
                } else {
                  getCurrentLocation();
                }
              }}
              className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
            >
              {t('common.retry') || 'Reintentar'}
            </button>
          </div>
        ) : (
          <>
            {/* Clima Actual */}
            {currentWeather && (() => {
              const timeColors = getTimeOfDayColors();
              return (
              <div className={`mb-6 rounded-xl bg-gradient-to-br ${timeColors.from} ${timeColors.to} ${timeColors.darkFrom} ${timeColors.darkTo} p-6 text-white shadow-lg`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-medium mb-1 opacity-90">{currentWeather.location}</div>
                    <div className="text-5xl font-bold mb-2">{currentWeather.temp}°</div>
                    <div className="text-lg font-medium capitalize mb-1">{currentWeather.condition}</div>
                    <div className="text-sm opacity-90">
                      {currentWeather.tempMin}° / {currentWeather.tempMax}°
                    </div>
                  </div>
                  <div className="text-7xl">
                    {getWeatherIconComponent(currentWeather.icon, 'text-8xl')}
                  </div>
                </div>

                {/* Detalles adicionales */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20">
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">{t('weather.detail.feelsLike') || 'Sensación'}</div>
                    <div className="text-lg font-semibold">{currentWeather.feelsLike}°</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">{t('weather.detail.humidity') || 'Humedad'}</div>
                    <div className="text-lg font-semibold">{currentWeather.humidity}%</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs opacity-80 mb-1">{t('weather.detail.wind') || 'Viento'}</div>
                    <div className="text-lg font-semibold">{currentWeather.windSpeed} km/h</div>
                  </div>
                </div>
              </div>
              );
            })()}

            {/* Pronóstico 5 Días */}
            <div className="mb-6">
              <h2 className="text-lg font-bold text-[#181411] dark:text-white mb-4">
                {t('weather.detail.forecast') || 'Pronóstico 5 Días'}
              </h2>
              <div className="space-y-3">
                {weatherData.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] shadow-sm hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 text-center">
                        <div className="text-xs font-medium text-[#897C61] dark:text-[#A8937D] mb-1">
                          {day.day}
                        </div>
                        <div className="text-xs text-[#897C61] dark:text-[#A8937D]">
                          {formatDate(day.date)}
                        </div>
                      </div>
                      <div className="text-3xl">
                        {getWeatherIconComponent(day.icon, 'text-3xl')}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#181411] dark:text-white capitalize mb-1">
                          {day.condition}
                        </div>
                        <div className="text-xs text-[#897C61] dark:text-[#A8937D]">
                          {day.humidity && `${t('weather.detail.humidity') || 'Humedad'}: ${day.humidity}%`}
                          {day.windSpeed && ` • ${t('weather.detail.wind') || 'Viento'}: ${day.windSpeed} km/h`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-[#181411] dark:text-white">
                        {day.tempMax}°
                      </div>
                      <div className="text-sm text-[#897C61] dark:text-[#A8937D]">
                        {day.tempMin}°
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WeatherDetailScreen;
