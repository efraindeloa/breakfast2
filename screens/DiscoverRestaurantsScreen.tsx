import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix para iconos de Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Restaurant {
  id: string;
  name: string;
  image: string;
  rating: number;
  distance: number;
  isOpen: boolean;
  tags: string[];
  latitude: number;
  longitude: number;
}

interface City {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

const DiscoverRestaurantsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [mapZoom, setMapZoom] = useState(15);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'breakfast' | 'open' | 'nearby'>('breakfast');
  const [showCitySelector, setShowCitySelector] = useState(false);

  // Ciudades disponibles
  const cities: City[] = [
    { id: 'cdmx', name: 'Ciudad de México', latitude: 19.4326, longitude: -99.1332 },
    { id: 'guadalajara', name: 'Guadalajara', latitude: 20.6597, longitude: -103.3496 },
    { id: 'monterrey', name: 'Monterrey', latitude: 25.6866, longitude: -100.3161 },
    { id: 'puebla', name: 'Puebla', latitude: 19.0414, longitude: -98.2063 },
  ];

  // Restaurantes de ejemplo
  const allRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'Café de la Mañana',
      image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=200',
      rating: 4.8,
      distance: 350,
      isOpen: true,
      tags: ['Saludable', 'Pet Friendly'],
      latitude: 19.4326,
      longitude: -99.1332
    },
    {
      id: '2',
      name: 'Boulangerie Central',
      image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=200',
      rating: 4.5,
      distance: 1200,
      isOpen: true,
      tags: ['Panadería', 'Terraza'],
      latitude: 19.4350,
      longitude: -99.1400
    },
    {
      id: '3',
      name: 'Breakfast Club',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200',
      rating: 4.7,
      distance: 850,
      isOpen: false,
      tags: ['Americano', 'Rápido'],
      latitude: 19.4300,
      longitude: -99.1350
    }
  ];

  // Obtener ubicación del usuario
  const getUserLocation = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Verificar permisos primero
        try {
          const permissions = await Geolocation.checkPermissions();
          if (permissions.location !== 'granted') {
            const requestResult = await Geolocation.requestPermissions();
            if (requestResult.location !== 'granted') {
              console.warn('Permisos de ubicación denegados');
              const defaultLocation = { lat: 19.4326, lng: -99.1332 };
              setUserLocation(defaultLocation);
              centerMapOnLocation(defaultLocation);
              setRestaurants(allRestaurants);
              return;
            }
          }
        } catch (permError) {
          console.error('Error verificando/solicitando permisos de ubicación:', permError);
          // Continuar con ubicación por defecto si hay error en permisos
          const defaultLocation = { lat: 19.4326, lng: -99.1332 };
          setUserLocation(defaultLocation);
          centerMapOnLocation(defaultLocation);
          setRestaurants(allRestaurants);
          return;
        }

        const position = await Geolocation.getCurrentPosition({ 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log('Ubicación obtenida:', location);
        setUserLocation(location);
        // Esperar un momento para que el mapa esté listo
        setTimeout(() => {
          centerMapOnLocation(location, true);
          loadNearbyRestaurants(location);
        }, 100);
      } else {
        // Para web, usar geolocation API del navegador
        if (!navigator.geolocation) {
          console.warn('Geolocalización no soportada en este navegador');
          const defaultLocation = { lat: 19.4326, lng: -99.1332 };
          setUserLocation(defaultLocation);
          centerMapOnLocation(defaultLocation);
          setRestaurants(allRestaurants);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            console.log('Ubicación obtenida (web):', location);
            setUserLocation(location);
            setTimeout(() => {
              centerMapOnLocation(location, true);
              loadNearbyRestaurants(location);
            }, 100);
          },
          (error) => {
            console.error('Error obteniendo ubicación (web):', error);
            // Si no hay permiso, usar ubicación por defecto (CDMX)
            const defaultLocation = { lat: 19.4326, lng: -99.1332 };
            setUserLocation(defaultLocation);
            centerMapOnLocation(defaultLocation);
            setRestaurants(allRestaurants);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      // Ubicación por defecto
      const defaultLocation = { lat: 19.4326, lng: -99.1332 };
      setUserLocation(defaultLocation);
      centerMapOnLocation(defaultLocation, true);
      setRestaurants(allRestaurants);
    }
  };

  // Calcular distancia entre dos puntos
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distancia en metros
  };

  // Cargar restaurantes cercanos
  const loadNearbyRestaurants = (location: { lat: number; lng: number }) => {
    const nearby = allRestaurants
      .map(restaurant => ({
        ...restaurant,
        distance: calculateDistance(location.lat, location.lng, restaurant.latitude, restaurant.longitude)
      }))
      .filter(r => r.distance < 5000) // Dentro de 5km
      .sort((a, b) => a.distance - b.distance);
    
    setRestaurants(nearby);
    updateMapMarkers(nearby);
  };

  // Inicializar mapa (solo una vez)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = 19.4326;
    const defaultLng = -99.1332;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], mapZoom);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Actualizar marcador de usuario cuando cambia la ubicación
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Crear o actualizar el icono del marcador de usuario
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #f48c25; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (userMarkerRef.current) {
      // Actualizar posición del marcador existente
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userMarkerRef.current.setIcon(userIcon);
    } else {
      // Crear nuevo marcador
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
        icon: userIcon,
        zIndexOffset: 1000 // Asegurar que esté por encima de otros marcadores
      })
        .addTo(mapRef.current!)
        .bindPopup(t('discover.yourLocation'))
        .openPopup(); // Abrir popup automáticamente para que sea visible
    }
  }, [userLocation, t]);

  // Actualizar marcadores del mapa
  const updateMapMarkers = (restaurantsList: Restaurant[]) => {
    if (!mapRef.current) return;

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Agregar nuevos marcadores
    restaurantsList.forEach(restaurant => {
      const customIcon = L.divIcon({
        className: 'custom-restaurant-marker',
        html: `
          <div style="width: 48px; height: 48px; border-radius: 50%; border: 4px solid white; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <img src="${restaurant.image}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48]
      });

      const marker = L.marker([restaurant.latitude, restaurant.longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(restaurant.name);
      
      marker.on('click', () => {
        // Seleccionar restaurante y scroll a su card
        const restaurantCard = document.getElementById(`restaurant-${restaurant.id}`);
        if (restaurantCard) {
          restaurantCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      });

      markersRef.current.push(marker);
    });
  };

  // Centrar mapa en ubicación
  const centerMapOnLocation = (location: { lat: number; lng: number }, isUserLocation = false) => {
    if (mapRef.current) {
      mapRef.current.setView([location.lat, location.lng], mapZoom);
      // El marcador se actualizará automáticamente mediante el useEffect de userLocation
    }
  };

  // Obtener ubicación al montar
  useEffect(() => {
    getUserLocation();
  }, []);

  // Actualizar marcadores cuando cambian los restaurantes
  useEffect(() => {
    if (restaurants.length > 0 && mapRef.current) {
      updateMapMarkers(restaurants);
    }
  }, [restaurants]);

  // Manejar selección de ciudad
  const handleCitySelect = (city: City) => {
    setSelectedCity(city);
    setShowCitySelector(false);
    const location = { lat: city.latitude, lng: city.longitude };
    centerMapOnLocation(location);
    loadNearbyRestaurants(location);
  };

  // Zoom in
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
      setMapZoom(mapRef.current.getZoom());
    }
  };

  // Zoom out
  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
      setMapZoom(mapRef.current.getZoom());
    }
  };

  // Centrar en mi ubicación
  const handleCenterLocation = () => {
    if (userLocation) {
      centerMapOnLocation(userLocation, true);
      loadNearbyRestaurants(userLocation);
    } else {
      getUserLocation();
    }
  };

  // Obtener saludo según hora del día
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('discover.goodMorning');
    if (hour < 18) return t('discover.goodAfternoon');
    return t('discover.goodEvening');
  };

  // Formatear distancia
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden max-w-[430px] mx-auto shadow-2xl bg-white dark:bg-background-dark">
      {/* Top App Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center bg-white/90 dark:bg-background-dark/90 backdrop-blur-md rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-800 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-primary flex size-10 shrink-0 items-center justify-center"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <div className="flex-1 px-2">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{getGreeting()}</p>
            <h2 className="text-[#171411] dark:text-white text-base font-bold leading-tight">
              {t('discover.title')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCitySelector(!showCitySelector)}
              className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-primary/10 text-primary"
              title={t('discover.selectCity')}
            >
              <span className="material-symbols-outlined">tune</span>
            </button>
          </div>
        </div>

        {/* City Selector */}
        {showCitySelector && (
          <div className="mt-2 bg-white dark:bg-background-dark rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-3">
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">{t('discover.selectCity')}</p>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setSelectedCity(null);
                  setShowCitySelector(false);
                  getUserLocation();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                  !selectedCity
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-[#171411] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {t('discover.currentLocation')}
              </button>
              {cities.map(city => (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
                    selectedCity?.id === city.id
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-[#171411] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chips Section */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-2 [-ms-scrollbar-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedFilter('breakfast')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm ${
              selectedFilter === 'breakfast'
                ? 'bg-primary text-white'
                : 'bg-white/90 dark:bg-background-dark/90 text-[#171411] dark:text-white border border-gray-100 dark:border-gray-800'
            }`}
          >
            <span className="text-sm font-semibold">{t('discover.breakfast')}</span>
            <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
          </button>
          <button
            onClick={() => setSelectedFilter('open')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm ${
              selectedFilter === 'open'
                ? 'bg-primary text-white'
                : 'bg-white/90 dark:bg-background-dark/90 text-[#171411] dark:text-white border border-gray-100 dark:border-gray-800'
            }`}
          >
            <span className="text-sm font-medium">{t('discover.openNow')}</span>
          </button>
          <button
            onClick={() => setSelectedFilter('nearby')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-4 shadow-sm ${
              selectedFilter === 'nearby'
                ? 'bg-primary text-white'
                : 'bg-white/90 dark:bg-background-dark/90 text-[#171411] dark:text-white border border-gray-100 dark:border-gray-800'
            }`}
          >
            <span className="text-sm font-medium">{t('discover.nearby')}</span>
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div
          ref={mapContainerRef}
          className="w-full h-full"
          style={{ zIndex: 1 }}
        />

        {/* Map Controls */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-10">
          <div className="flex flex-col gap-0.5 rounded-xl overflow-hidden shadow-lg">
            <button
              onClick={handleZoomIn}
              className="flex size-11 items-center justify-center bg-white dark:bg-background-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <div className="h-[1px] bg-gray-100 dark:bg-gray-800"></div>
            <button
              onClick={handleZoomOut}
              className="flex size-11 items-center justify-center bg-white dark:bg-background-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
          </div>
          <button
            onClick={handleCenterLocation}
            className="flex size-11 items-center justify-center rounded-xl bg-white dark:bg-background-dark text-primary shadow-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            title={t('discover.myLocation')}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              my_location
            </span>
          </button>
        </div>

        {/* Share Location Button */}
        <button
          className="absolute bottom-[320px] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full shadow-xl font-bold transition-transform active:scale-95 z-10 hover:opacity-90"
          onClick={() => {
            // Navegar a la pantalla de punto de encuentro
            navigate('/meetup');
          }}
        >
          <span className="material-symbols-outlined">group</span>
          <span>{t('discover.meetHere')}</span>
        </button>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col bg-white dark:bg-background-dark rounded-t-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.1)] h-[300px]">
        <button className="flex h-8 w-full items-center justify-center shrink-0">
          <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
        </button>
        <div className="flex-1 overflow-y-auto px-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[#171411] dark:text-white text-lg font-bold leading-tight tracking-tight">
              {t('discover.nearYou')}
            </h3>
            <button className="text-primary text-sm font-semibold">{t('discover.seeAll')}</button>
          </div>
          <div className="space-y-4 pb-20">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                id={`restaurant-${restaurant.id}`}
                className="flex gap-4 p-2 rounded-2xl bg-background-light dark:bg-gray-900/50 border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
                onClick={() => {
                  // Por ahora, seleccionar el restaurante (en el futuro podría navegar a un detalle)
                  // navigate(`/restaurant/${restaurant.id}`);
                  // Centrar mapa en el restaurante seleccionado
                  centerMapOnLocation({ lat: restaurant.latitude, lng: restaurant.longitude });
                }}
              >
                <div className="relative size-24 shrink-0 overflow-hidden rounded-xl">
                  <img
                    className="h-full w-full object-cover"
                    src={restaurant.image}
                    alt={restaurant.name}
                  />
                  <div className="absolute top-1 right-1 bg-white/90 px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow-sm">
                    <span
                      className="material-symbols-outlined text-[12px] text-orange-400"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="text-[10px] font-bold">{restaurant.rating}</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-1 flex-1">
                  <h4 className="font-bold text-[#171411] dark:text-white">{restaurant.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-sm">near_me</span>
                      {formatDistance(restaurant.distance)}
                    </span>
                    <span>•</span>
                    <span className={restaurant.isOpen ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                      {restaurant.isOpen ? t('discover.open') : t('discover.closed')}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {restaurant.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          idx === 0
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {restaurants.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p>{t('discover.noRestaurantsFound')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscoverRestaurantsScreen;
