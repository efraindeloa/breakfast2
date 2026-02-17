import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRestaurantImageUrl } from '../../services/database';
import type { Restaurant, RestaurantSocialMedia } from '../../services/database';
import type { CoverImageItem, OwnerData } from './types';
import { geocodeAddress, buildAddressString } from '../../services/geocoding';

// Fix para iconos de Leaflet en react-leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface RestaurantProfilePreviewProps {
  restaurant: Restaurant | null;
  carouselImages: CoverImageItem[];
  ownerData: OwnerData | null;
  socialMedia?: RestaurantSocialMedia[];
}

/** Centra el mapa en la posición del marcador al montar */
function MapCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  React.useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

/**
 * Vista de solo lectura del perfil del restaurante:
 * cómo lo verá un comensal (hero, info básica, ubicación, presencia digital, datos del propietario).
 */
const RestaurantProfilePreview: React.FC<RestaurantProfilePreviewProps> = ({
  restaurant,
  carouselImages,
  ownerData,
  socialMedia = [],
}) => {
  const navigate = useNavigate();
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingGeocode, setIsLoadingGeocode] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const handleCarouselSwipeStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) touchStartX.current = e.touches[0].clientX;
  };
  const handleCarouselSwipeEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || carouselImages.length <= 1) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    const minSwipe = 50;
    if (diff > minSwipe) {
      setCurrentCarouselIndex((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));
    } else if (diff < -minSwipe) {
      setCurrentCarouselIndex((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
    }
    touchStartX.current = null;
  };

  // Geocodificar domicilio cuando no hay lat/lng pero sí dirección
  useEffect(() => {
    if (!restaurant) {
      setResolvedCoords(null);
      return;
    }
    const hasStoredCoords = restaurant.latitude != null && restaurant.longitude != null;
    if (hasStoredCoords) {
      setResolvedCoords(null);
      return;
    }
    const addressStr = buildAddressString({
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      country: restaurant.country,
      postal_code: restaurant.postal_code,
    });
    if (!addressStr.trim()) {
      setResolvedCoords(null);
      return;
    }
    let cancelled = false;
    setIsLoadingGeocode(true);
    setResolvedCoords(null);
    geocodeAddress(addressStr)
      .then((coords) => {
        if (!cancelled && coords) setResolvedCoords(coords);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingGeocode(false);
      });
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id, restaurant?.address, restaurant?.city, restaurant?.state, restaurant?.country, restaurant?.postal_code, restaurant?.latitude, restaurant?.longitude]);

  const mapCoords =
    restaurant?.latitude != null && restaurant?.longitude != null
      ? { lat: restaurant.latitude, lng: restaurant.longitude }
      : resolvedCoords;
  const showMap = mapCoords != null;

  const activeIndex = Math.min(currentCarouselIndex, Math.max(0, carouselImages.length - 1));
  const currentImage = carouselImages[activeIndex];
  const displayRating = restaurant?.rating ?? 0;
  const displayReviews = restaurant?.total_reviews ?? 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-[#181411] dark:text-white antialiased pb-24">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 justify-between border-b border-primary/10">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-10 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center mr-10">
          Perfil del Restaurante
        </h2>
      </header>

      {/* Hero Carousel */}
      <div className="px-4 py-3">
        <div
          className="relative group touch-pan-y"
          onTouchStart={handleCarouselSwipeStart}
          onTouchEnd={handleCarouselSwipeEnd}
        >
          <div
            className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[320px] shadow-lg"
            style={{
              backgroundImage: currentImage
                ? `linear-gradient(0deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 40%), url("${getRestaurantImageUrl(currentImage.image_url, 'cover')}")`
                : 'linear-gradient(0deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 40%), linear-gradient(135deg, #e6e0db 0%, #d4cdc4 100%)',
            }}
          >
            <div className="flex justify-center gap-2 p-5">
              {carouselImages.length > 0 ? (
                carouselImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentCarouselIndex(i)}
                    className={`size-2 rounded-full shadow-sm transition-colors ${i === activeIndex ? 'bg-primary' : 'bg-white opacity-40'}`}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))
              ) : (
                <>
                  <div className="size-2 rounded-full bg-primary/50" />
                  <div className="size-2 rounded-full bg-white opacity-40" />
                  <div className="size-2 rounded-full bg-white opacity-40" />
                </>
              )}
            </div>
          </div>
          {carouselImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setCurrentCarouselIndex((prev) =>
                    prev === 0 ? carouselImages.length - 1 : prev - 1
                  )
                }
                className="absolute inset-y-0 left-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white cursor-pointer">
                  <span className="material-symbols-outlined text-4xl">chevron_left</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentCarouselIndex((prev) =>
                    prev === carouselImages.length - 1 ? 0 : prev + 1
                  )
                }
                className="absolute inset-y-0 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full text-white cursor-pointer">
                  <span className="material-symbols-outlined text-4xl">chevron_right</span>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="px-4 pb-6 pt-2">
        <div className="flex items-center justify-between mb-2">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            Abierto
          </span>
          <div className="flex items-center gap-1 text-primary">
            <span
              className="material-symbols-outlined text-sm"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold text-sm">
              {displayRating.toFixed(1)} ({displayReviews}+ reseñas)
            </span>
          </div>
        </div>
        <h1 className="text-[#181411] dark:text-white text-3xl font-extrabold leading-tight mb-3">
          {restaurant?.nombre_comercial || 'Restaurante'}
        </h1>
        <p className="text-[#181411]/70 dark:text-white/70 text-base leading-relaxed">
          {restaurant?.description || '—'}
        </p>
      </div>

      {/* Cards: Ubicación, Presencia Digital, Información de Cuenta */}
      <div className="px-4 space-y-6 pb-24">
        <section className="bg-white dark:bg-background-dark p-5 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">contact_mail</span>
            <h3 className="font-bold text-lg text-[#181411] dark:text-white">Contacto</h3>
          </div>
          <div className="space-y-4">
            <div className="w-full">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                Correo Electrónico
              </p>
              <p className="text-sm font-medium break-all">{ownerData?.email || '—'}</p>
            </div>
            <div className="w-full">
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                Teléfono de Contacto
              </p>
              <p className="text-sm font-medium">{restaurant?.phone || ownerData?.phone || '—'}</p>
            </div>
          </div>
          <div className="border-t border-primary/10 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <h3 className="font-bold text-lg text-[#181411] dark:text-white">Ubicación</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                  Dirección
                </p>
                <p className="text-sm font-medium">{restaurant?.address || '—'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                    Ciudad
                  </p>
                  <p className="text-sm font-medium">{restaurant?.city || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                    Estado / Provincia
                  </p>
                  <p className="text-sm font-medium">{restaurant?.state || '—'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                    País
                  </p>
                  <p className="text-sm font-medium">{restaurant?.country || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                    Código Postal
                  </p>
                  <p className="text-sm font-medium">{restaurant?.postal_code || '—'}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg overflow-hidden h-[24rem] border border-primary/10">
            {showMap ? (
              <div className="w-full h-full [&_.leaflet-container]:!h-full [&_.leaflet-container]:!rounded-lg">
                <MapContainer
                  center={[mapCoords.lat, mapCoords.lng]}
                  zoom={15}
                  scrollWheelZoom={false}
                  className="h-full w-full rounded-lg"
                  style={{ height: '100%', minHeight: 384 }}
                >
                  <MapCenter center={[mapCoords.lat, mapCoords.lng]} zoom={15} />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[mapCoords.lat, mapCoords.lng]} icon={defaultIcon}>
                    <Popup>{restaurant?.nombre_comercial || restaurant?.name || 'Restaurante'}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            ) : isLoadingGeocode ? (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center gap-2">
                <span className="material-symbols-outlined text-4xl text-primary/30 animate-pulse">map</span>
                <span className="text-xs text-[#8a7560]">Buscando ubicación...</span>
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 dark:bg-gray-800 flex flex-col items-center justify-center relative gap-2">
                <span className="material-symbols-outlined text-4xl text-primary/30">map</span>
                {(restaurant?.address || restaurant?.city) && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      [restaurant.address, restaurant.city, restaurant.state, restaurant.country].filter(Boolean).join(', ')
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary text-sm font-semibold hover:underline flex items-center gap-1"
                  >
                    Ver en Google Maps
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </a>
                )}
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              </div>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-background-dark p-5 rounded-xl border border-primary/5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-primary">language</span>
            <h3 className="font-bold text-lg text-[#181411] dark:text-white">Presencia Digital</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                Sitio Web
              </p>
              {restaurant?.website ? (
                <a
                  href={
                    restaurant.website.startsWith('http')
                      ? restaurant.website
                      : `https://${restaurant.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
                >
                  {restaurant.website.replace(/^https?:\/\//, '')}
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              ) : (
                <p className="text-sm font-medium">—</p>
              )}
            </div>
            {(['facebook', 'instagram', 'tiktok'] as const).map((platform) => {
              const url =
                (platform === 'facebook' && restaurant?.facebook_url) ||
                (platform === 'instagram' && restaurant?.instagram_url) ||
                (platform === 'tiktok' && restaurant?.tiktok_url) ||
                socialMedia.find((s) => s.platform === platform && s.is_active && s.url?.trim())?.url;
              const label = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'TikTok';
              const href = url?.trim() ? (url.startsWith('http') ? url : `https://${url}`) : null;
              const display = href && url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;
              return (
                <div key={platform}>
                  <p className="text-xs text-primary font-bold uppercase tracking-widest mb-0.5">
                    {label}
                  </p>
                  {display && href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
                    >
                      {display}
                      <span className="material-symbols-outlined text-xs">open_in_new</span>
                    </a>
                  ) : (
                    <p className="text-sm font-medium">—</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default RestaurantProfilePreview;
