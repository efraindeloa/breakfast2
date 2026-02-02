import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface WeatherDay {
  date: string;
  day: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
}

interface CurrentWeather {
  temp: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: string;
  location: string;
}

const WeatherWidget: React.FC = () => {
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState<WeatherDay[]>([]);
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Actualizar fecha y hora cada minuto
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      
      const day = dayNames[now.getDay()];
      const month = monthNames[now.getMonth()];
      const dayNum = now.getDate();
      setCurrentDate(`${day} ${dayNum}/${month}`);
      
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Obtener ubicación del usuario
        if (!navigator.geolocation) {
          throw new Error('Geolocalización no disponible');
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            
            // Usar OpenWeatherMap API (requiere API key, por ahora usar datos mock)
            // En producción, necesitarías agregar VITE_WEATHER_API_KEY al .env
            // @ts-ignore - Vite environment variables
            const apiKey = import.meta.env.VITE_WEATHER_API_KEY;
            
            if (apiKey) {
              try {
                const response = await fetch(
                  `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric&lang=es`
                );
                if (!response.ok) {
                  // Si es 401 (Unauthorized), la API key no es válida, usar datos mock
                  if (response.status === 401) {
                    console.warn('API key de OpenWeatherMap no válida, usando datos mock');
                    const mockData = getMockWeatherData();
                    setWeatherData(mockData);
                    setCurrentWeather(getMockCurrentWeather());
                    return;
                  }
                  throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                
                // Procesar datos para los próximos 3 días
                const processedData = processWeatherData(data);
                setWeatherData(processedData.slice(0, 3));
                
                // Procesar clima actual
                const current = processCurrentWeather(data);
                setCurrentWeather(current);
                setError(null);
              } catch (err) {
                console.error('Error fetching weather:', err);
                // Fallback a datos mock
                const mockData = getMockWeatherData();
                setWeatherData(mockData.slice(0, 3));
                setCurrentWeather(getMockCurrentWeather());
              }
            } else {
              // Usar datos mock si no hay API key
              const mockData = getMockWeatherData();
              setWeatherData(mockData.slice(0, 3));
              setCurrentWeather(getMockCurrentWeather());
            }
          },
          (err) => {
            console.error('Error getting location:', err);
            // Usar datos mock si no se puede obtener ubicación
            const mockData = getMockWeatherData();
            setWeatherData(mockData.slice(0, 3));
            setCurrentWeather(getMockCurrentWeather());
          }
        );
      } catch (err) {
        console.error('Error in weather fetch:', err);
        setError('Error al cargar clima');
        const mockData = getMockWeatherData();
        setWeatherData(mockData.slice(0, 3));
        setCurrentWeather(getMockCurrentWeather());
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Actualizar cada 3 horas
    const interval = setInterval(fetchWeather, 10800000);
    return () => clearInterval(interval);
  }, []);

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
    
    // Obtener nombre de la ciudad
    const location = data.city?.name || 'Ubicación';
    
    return {
      temp: Math.round(today.main.temp),
      tempMin: Math.round(tempMin),
      tempMax: Math.round(tempMax),
      condition: today.weather[0].description,
      icon: getWeatherIcon(today.weather[0].main),
      location: location
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

    // Convertir a array y procesar cada día
    Object.entries(groupedByDay).slice(1, 4).forEach(([dayKey, items], index) => {
      const date = new Date(dayKey);
      const temps = items.map((item: any) => item.main.temp);
      const tempMin = Math.min(...temps);
      const tempMax = Math.max(...temps);
      const mainItem = items[0];
      
      days.push({
        date: date.toISOString().split('T')[0],
        day: dayNames[date.getDay()].toUpperCase(),
        temp: Math.round(mainItem.main.temp),
        tempMin: Math.round(tempMin),
        tempMax: Math.round(tempMax),
        condition: mainItem.weather[0].description,
        icon: getWeatherIcon(mainItem.weather[0].main)
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
      'Fog': 'foggy'
    };
    return iconMap[condition] || 'wb_sunny';
  };

  const getMockCurrentWeather = (): CurrentWeather => {
    return {
      temp: 23,
      tempMin: 20,
      tempMax: 28,
      condition: 'Despejado',
      icon: 'wb_sunny',
      location: 'Ciudad'
    };
  };

  const getMockWeatherData = (): WeatherDay[] => {
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const today = new Date();
    const days: WeatherDay[] = [];
    const conditions = [
      { condition: 'Lluvia', icon: 'rainy', temp: 23, min: 20, max: 30 },
      { condition: 'Tormenta', icon: 'thunderstorm', temp: 24, min: 22, max: 30 },
      { condition: 'Lluvia', icon: 'rainy', temp: 24, min: 22, max: 30 }
    ];

    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const condition = conditions[i - 1];
      days.push({
        date: date.toISOString().split('T')[0],
        day: dayNames[date.getDay()].toUpperCase(),
        temp: condition.temp,
        tempMin: condition.min,
        tempMax: condition.max,
        condition: condition.condition,
        icon: condition.icon
      });
    }

    return days;
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
      'wb_cloudy': '⛅'
    };
    
    return (
      <span className={`${size} leading-none`}>
        {iconMap[icon] || '☀️'}
      </span>
    );
  };

  return (
    <div 
      className="rounded-xl bg-white dark:bg-[#2d241c] border border-gray-100 dark:border-[#3D3228] shadow-sm overflow-hidden relative cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate('/weather-detail')}
    >
      <div className="relative p-5">
        {/* Sección Superior */}
        <div className="flex items-start justify-between mb-6">
          {/* Lado Izquierdo - Sol Grande */}
          <div className="flex items-center justify-center">
            {currentWeather && (
              <div className="text-6xl leading-none" style={{ filter: 'drop-shadow(0 0 20px rgba(255, 200, 0, 0.6))' }}>
                {getWeatherIconComponent(currentWeather.icon, 'text-7xl')}
              </div>
            )}
          </div>

          {/* Lado Derecho - Fecha, Hora, Ubicación */}
          <div className="flex flex-col items-end">
            <div className="text-sm font-medium mb-1 text-[#181411] dark:text-white/80">{currentDate}</div>
            <div className="text-3xl font-bold mb-1 text-[#181411] dark:text-white">{currentTime}</div>
            {currentWeather && (
              <div className="text-sm font-medium text-[#897C61] dark:text-[#A8937D]">{currentWeather.location}</div>
            )}
          </div>
        </div>

        {/* Sección Inferior */}
        <div className="flex items-end justify-between">
          {/* Lado Izquierdo - Temperatura Actual */}
          {currentWeather && (
            <div className="flex flex-col">
              <div className="text-4xl font-bold mb-1 text-[#181411] dark:text-white">{currentWeather.temp}°</div>
              <div className="text-sm font-medium text-[#897C61] dark:text-[#A8937D] mb-1">
                {currentWeather.tempMin}~{currentWeather.tempMax}°
              </div>
              <div className="text-sm font-medium text-[#181411] dark:text-white/90 capitalize">
                {currentWeather.condition}
              </div>
            </div>
          )}

          {/* Lado Derecho - Pronóstico 3 días */}
          <div className="flex gap-4">
            {weatherData.map((day, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-xs font-medium mb-2 text-[#897C61] dark:text-[#A8937D]">{day.day}</div>
                <div className="mb-2">
                  {getWeatherIconComponent(day.icon, 'text-2xl')}
                </div>
                <div className="text-xs font-medium text-[#181411] dark:text-white">
                  {day.tempMin}/{day.tempMax}°
                </div>
              </div>
            ))}
          </div>
        </div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-[#2d241c]/80 backdrop-blur-sm rounded-xl">
            <span className="text-[#181411] dark:text-white text-sm">Cargando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherWidget;
