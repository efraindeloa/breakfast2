import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
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
  isOpen: boolean;
  latitude: number;
  longitude: number;
  address?: string;
}

const MeetUpScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectedRestaurant } = useRestaurant();
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const meetupMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [selectedRestaurantState, setSelectedRestaurantState] = useState<Restaurant | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showRestaurantSelector, setShowRestaurantSelector] = useState(false);
  const [showContactsSelector, setShowContactsSelector] = useState(false);

  // Restaurantes disponibles (pueden venir de un contexto o API)
  const availableRestaurants: Restaurant[] = [
    {
      id: '1',
      name: 'La Baguette Mágica',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      rating: 4.8,
      isOpen: true,
      latitude: 40.4168,
      longitude: -3.7038,
      address: 'Madrid, España'
    },
    {
      id: '2',
      name: 'Café de la Mañana',
      image: 'https://images.unsplash.com/photo-1551782450-17144efb9c50?w=400',
      rating: 4.7,
      isOpen: true,
      latitude: 40.4250,
      longitude: -3.7100,
      address: 'Madrid, España'
    },
    {
      id: '3',
      name: 'Boulangerie Central',
      image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?w=400',
      rating: 4.5,
      isOpen: true,
      latitude: 40.4100,
      longitude: -3.7000,
      address: 'Madrid, España'
    }
  ];

  // Inicializar con restaurante seleccionado o el primero
  useEffect(() => {
    if (selectedRestaurant) {
      // Buscar el restaurante en la lista disponible
      const found = availableRestaurants.find(r => r.name === selectedRestaurant);
      if (found) {
        setSelectedRestaurantState(found);
      } else {
        setSelectedRestaurantState(availableRestaurants[0]);
      }
    } else {
      setSelectedRestaurantState(availableRestaurants[0]);
    }
  }, [selectedRestaurant]);

  // Obtener ubicación del usuario
  const getUserLocation = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          () => {
            // Ubicación por defecto (Madrid)
            setUserLocation({ lat: 40.4168, lng: -3.7038 });
          }
        );
      }
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setUserLocation({ lat: 40.4168, lng: -3.7038 });
    }
  };

  // Inicializar mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultLat = 40.4168; // Madrid
    const defaultLng = -3.7038;

    const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 14);
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
      if (meetupMarkerRef.current) {
        meetupMarkerRef.current.remove();
        meetupMarkerRef.current = null;
      }
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
    };
  }, []);

  // Actualizar marcadores cuando cambia el restaurante seleccionado
  useEffect(() => {
    if (!mapRef.current || !selectedRestaurantState) return;

    // Actualizar marcador del punto de encuentro (restaurante)
    const meetupIcon = L.divIcon({
      className: 'custom-meetup-marker',
      html: `
        <div style="width: 56px; height: 56px; border-radius: 50%; background: #f48c25; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3); color: white; font-size: 28px;">
          🍽️
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 56]
    });

    if (meetupMarkerRef.current) {
      meetupMarkerRef.current.setLatLng([selectedRestaurantState.latitude, selectedRestaurantState.longitude]);
    } else {
      meetupMarkerRef.current = L.marker(
        [selectedRestaurantState.latitude, selectedRestaurantState.longitude],
        { icon: meetupIcon }
      )
        .addTo(mapRef.current!)
        .bindPopup(t('meetup.meetingPoint'))
        .openPopup();
    }

    // Centrar mapa en el restaurante
    mapRef.current.setView([selectedRestaurantState.latitude, selectedRestaurantState.longitude], 14);
  }, [selectedRestaurantState, t]);

  // Actualizar marcador de usuario
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #3b82f6; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: white;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      userMarkerRef.current.setIcon(userIcon);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { 
        icon: userIcon,
        zIndexOffset: 1000
      })
        .addTo(mapRef.current!)
        .bindPopup(t('discover.yourLocation'))
        .openPopup();
    }
  }, [userLocation, t]);

  // Obtener ubicación al montar
  useEffect(() => {
    getUserLocation();
  }, []);

  // Generar link para compartir
  const generateShareLink = (): string => {
    if (!selectedRestaurantState) return '';
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      restaurant: selectedRestaurantState.id,
      lat: selectedRestaurantState.latitude.toString(),
      lng: selectedRestaurantState.longitude.toString(),
      name: selectedRestaurantState.name
    });
    return `${baseUrl}/meetup?${params.toString()}`;
  };

  // Generar mensaje para compartir
  const generateShareMessage = (): string => {
    if (!selectedRestaurantState) return '';
    return t('meetup.shareMessage', {
      restaurant: selectedRestaurantState.name,
      rating: selectedRestaurantState.rating,
      link: generateShareLink()
    });
  };

  // Obtener contactos registrados
  const getContacts = (): Array<{ id: string; name: string; phone?: string; email?: string }> => {
    try {
      const stored = localStorage.getItem('user_contacts');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error cargando contactos:', error);
    }
    return [];
  };

  // Compartir ubicación en tiempo real con contactos
  const handleShareRealTimeLocation = () => {
    setShowContactsSelector(true);
  };

  // Compartir con contacto seleccionado
  const handleShareWithContact = (contact: { id: string; name: string; phone?: string; email?: string }) => {
    if (!selectedRestaurantState) return;

    const shareUrl = generateShareLink() + '&realtime=true';
    const shareText = t('meetup.realTimeLocationShare', { restaurant: selectedRestaurantState.name });

    // Si tiene teléfono, intentar WhatsApp
    if (contact.phone) {
      const message = `${t('meetup.shareMessageContact', { name: contact.name })} ${shareText}`;
      const url = `https://wa.me/${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } else if (contact.email) {
      // Si tiene email, abrir cliente de email
      const subject = encodeURIComponent(t('meetup.meetingPoint'));
      const body = encodeURIComponent(shareText);
      window.location.href = `mailto:${contact.email}?subject=${subject}&body=${body}`;
    }

    setShowContactsSelector(false);
  };

  return (
    <div className="relative flex h-screen w-full max-w-[480px] mx-auto flex-col bg-white dark:bg-background-dark overflow-hidden shadow-2xl">
      {/* TopAppBar */}
      <header className="flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-primary flex size-12 shrink-0 items-center justify-center"
        >
          <span className="material-symbols-outlined text-3xl">arrow_back_ios</span>
        </button>
        <div className="text-primary flex size-12 shrink-0 items-center justify-center">
          <span className="material-symbols-outlined text-3xl">coffee</span>
        </div>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {t('meetup.meetingPoint')}
        </h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex cursor-pointer items-center justify-center rounded-full h-12 bg-transparent text-[#181411] dark:text-white">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {/* HeadlineText */}
        <div className="px-4 pt-4">
          <h3 className="text-[#181411] dark:text-white tracking-tight text-2xl font-extrabold leading-tight text-center">
            {t('meetup.letsHaveBreakfast')}
          </h3>
          <p className="text-[#887563] dark:text-stone-400 text-sm text-center mt-1 font-medium">
            {t('meetup.coordinateArrival')}
          </p>
        </div>

        {/* Map Component */}
        <div className="px-4 py-4">
          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-sm border border-black/5">
            <div
              ref={mapContainerRef}
              className="absolute inset-0 w-full h-full"
            />
            {/* Label del punto de encuentro */}
            {selectedRestaurantState && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-[40px] flex flex-col items-center pointer-events-none z-10">
                <div className="bg-white/90 dark:bg-background-dark/90 px-3 py-1 rounded-full text-[10px] font-bold mt-1 shadow-sm">
                  {t('meetup.meetingPoint').toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Restaurant Card */}
        <div className="px-4">
          <div className="flex items-stretch justify-between gap-4 rounded-xl bg-white dark:bg-stone-800 p-4 shadow-[0_4px_12px_rgba(0,0,0,0.08)] border border-black/5">
            <div className="flex flex-[2_2_0px] flex-col justify-between py-1">
              <div className="flex flex-col gap-1">
                <p className="text-[#181411] dark:text-white text-lg font-bold leading-tight">
                  {selectedRestaurantState?.name || ''}
                </p>
                <div className="flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-primary text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <p className="text-[#887563] dark:text-stone-400 text-sm font-medium leading-normal">
                    {selectedRestaurantState?.rating || 0} •{' '}
                    {selectedRestaurantState?.isOpen ? t('discover.open') : t('discover.closed')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRestaurantSelector(!showRestaurantSelector)}
                className="flex min-w-[84px] cursor-pointer items-center justify-center rounded-full h-8 px-4 bg-[#f4f2f0] dark:bg-stone-700 text-[#181411] dark:text-white gap-1 text-xs font-bold leading-normal w-fit mt-3"
              >
                <span className="material-symbols-outlined text-sm">swap_horiz</span>
                <span>{t('meetup.change')}</span>
              </button>
            </div>
            <div
              className="w-32 h-24 bg-center bg-no-repeat bg-cover rounded-lg"
              style={{
                backgroundImage: `url("${selectedRestaurantState?.image || ''}")`
              }}
            />
          </div>
        </div>

        {/* Restaurant Selector Modal */}
        {showRestaurantSelector && (
          <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
            <div className="bg-white dark:bg-background-dark rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[70vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{t('meetup.selectRestaurant')}</h3>
                  <button
                    onClick={() => setShowRestaurantSelector(false)}
                    className="text-gray-500"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {availableRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => {
                      setSelectedRestaurantState(restaurant);
                      setShowRestaurantSelector(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${
                      selectedRestaurantState?.id === restaurant.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800'
                    }`}
                  >
                    <div
                      className="w-20 h-20 bg-center bg-no-repeat bg-cover rounded-lg flex-shrink-0"
                      style={{ backgroundImage: `url("${restaurant.image}")` }}
                    />
                    <div className="flex-1 text-left">
                      <p className="font-bold text-[#181411] dark:text-white">{restaurant.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span
                          className="material-symbols-outlined text-primary text-xs"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                        <span className="text-xs text-[#887563] dark:text-stone-400">
                          {restaurant.rating}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sharing Options Section */}
        <div className="mt-6">
          <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2">
            {t('meetup.shareWithFriends')}
          </h3>
          <div className="px-4 space-y-3">
            {/* Action Button 1 */}
            <button
              onClick={handleShareRealTimeLocation}
              className="flex w-full items-center justify-between p-4 bg-primary text-white rounded-xl shadow-md font-bold hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">share_location</span>
                <span>{t('meetup.realTimeLocation')}</span>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </button>

          </div>
        </div>

        {/* Contacts Selector Modal */}
        {showContactsSelector && (
          <div className="fixed inset-0 bg-black/50 z-30 flex items-end">
            <div className="bg-white dark:bg-background-dark rounded-t-3xl w-full max-w-[480px] mx-auto max-h-[70vh] overflow-y-auto">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold">{t('meetup.selectContact')}</h3>
                  <button
                    onClick={() => setShowContactsSelector(false)}
                    className="text-gray-500"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="p-4">
                {getContacts().length > 0 ? (
                  <div className="space-y-2">
                    {getContacts().map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => handleShareWithContact(contact)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-stone-800 hover:border-primary transition-colors text-left"
                      >
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <span className="material-symbols-outlined">person</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#181411] dark:text-white truncate">{contact.name}</p>
                          {contact.phone && (
                            <p className="text-xs text-[#887563] dark:text-stone-400 truncate">{contact.phone}</p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-[#887563] dark:text-stone-400 truncate">{contact.email}</p>
                          )}
                        </div>
                        <span className="material-symbols-outlined text-gray-400">chevron_right</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">contacts</span>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">{t('meetup.noContacts')}</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">{t('meetup.addContactsInProfile')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeetUpScreen;
