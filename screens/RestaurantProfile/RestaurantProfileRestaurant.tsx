import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getRestaurantFullProfile,
  getRestaurantImageUrl,
  updateRestaurant,
  type Restaurant,
} from '../../services/database';
import { getUserData } from '../../services/api/user';
import type { CoverImageItem } from './types';

export interface RestaurantProfileRestaurantProps {
  restaurantId: string;
}

/**
 * Contenedor para la vista cuenta restaurante: gestión del perfil (carrusel, formulario editable, info de cuenta).
 */
const RestaurantProfileRestaurant: React.FC<RestaurantProfileRestaurantProps> = ({
  restaurantId,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [carouselImages, setCarouselImages] = useState<CoverImageItem[]>([]);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [userData, setUserData] = useState({ name: '', email: '', phone: '' });
  const [restaurantForm, setRestaurantForm] = useState({
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    website: '',
  });
  const [isSavingRestaurant, setIsSavingRestaurant] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const [profileResult, userResult] = await Promise.all([
          getRestaurantFullProfile(restaurantId),
          getUserData(user.id),
        ]);
        if (profileResult) {
          setRestaurant(profileResult.restaurant);
          if (profileResult.coverImages?.length) {
            setCarouselImages(
              profileResult.coverImages.map((img: { id: string; image_url: string; image_order: number }) => ({
                id: img.id,
                image_url: img.image_url,
                image_order: img.image_order,
              }))
            );
          } else {
            setCarouselImages([]);
          }
        }
        if (userResult.success && userResult.data) {
          setUserData(userResult.data);
        } else {
          setUserData({
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '',
            email: user.email || '',
            phone: user.user_metadata?.phone || '',
          });
        }
      } catch (error) {
        console.error('Error loading restaurant profile (restaurant):', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user?.id, restaurantId]);

  useEffect(() => {
    if (!restaurant) return;
    setRestaurantForm({
      description: restaurant.description ?? '',
      address: restaurant.address ?? '',
      city: restaurant.city ?? '',
      state: restaurant.state ?? '',
      country: restaurant.country ?? 'México',
      postal_code: restaurant.postal_code ?? '',
      website: restaurant.website ?? '',
    });
  }, [
    restaurant?.id,
    restaurant?.description,
    restaurant?.address,
    restaurant?.city,
    restaurant?.state,
    restaurant?.country,
    restaurant?.postal_code,
    restaurant?.website,
  ]);

  const handleSaveRestaurant = async () => {
    if (!restaurantId || !restaurant) return;
    setIsSavingRestaurant(true);
    try {
      const updated = await updateRestaurant(restaurantId, {
        description: restaurantForm.description || undefined,
        address: restaurantForm.address || undefined,
        city: restaurantForm.city || undefined,
        state: restaurantForm.state || undefined,
        country: restaurantForm.country || undefined,
        postal_code: restaurantForm.postal_code || undefined,
        website: restaurantForm.website || undefined,
      });
      if (updated) setRestaurant(updated);
    } catch (err) {
      console.error('Error saving restaurant:', err);
    } finally {
      setIsSavingRestaurant(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center px-6">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">restaurant</span>
            <p className="text-gray-600 dark:text-gray-400 mb-4">No se pudo cargar el perfil.</p>
            <button onClick={() => navigate('/home')} className="px-6 py-2 bg-primary text-white rounded-lg">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeIndex = Math.min(currentCarouselIndex, Math.max(0, carouselImages.length - 1));
  const currentImage = carouselImages[activeIndex];

  return (
    <div className="pb-32 bg-background-light dark:bg-background-dark">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-[#e6e0db] dark:border-[#3d2e21] safe-top">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-start"
        >
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          {t('profile.title')}
        </h2>
        <div className="flex w-12 items-center justify-end" />
      </header>

      <section className="relative w-full bg-white dark:bg-[#2d2218] border-b border-[#f5f2f0] dark:border-[#3d2e21] mb-6">
        <div className="relative h-64 w-full overflow-hidden">
          {currentImage ? (
            <div
              className="w-full h-full bg-center bg-cover"
              style={{ backgroundImage: `url("${getRestaurantImageUrl(currentImage.image_url, 'cover')}")` }}
            />
          ) : (
            <div className="w-full h-full bg-[#e6e0db] dark:bg-[#3d2e21] flex items-center justify-center text-[#8a7560] text-sm">
              <span className="opacity-60">Sin fotos</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6 text-white">
            <h2 className="text-xl font-bold">Fotos del Restaurante</h2>
            <p className="text-xs opacity-80">{carouselImages.length} fotos publicadas</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex gap-1.5 items-center">
            {carouselImages.length > 0 ? (
              carouselImages.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentCarouselIndex(i)}
                  className={`h-1.5 rounded-full transition-colors ${i === activeIndex ? 'w-6 bg-primary' : 'w-1.5 bg-[#e6e0db] dark:bg-[#3d2e21]'}`}
                  aria-label={`Foto ${i + 1}`}
                />
              ))
            ) : (
              <div className="h-1.5 w-6 rounded-full bg-[#e6e0db] dark:bg-[#3d2e21]" />
            )}
          </div>
          <button
            type="button"
            onClick={() => carouselImages.length > 0 && setShowGalleryModal(true)}
            disabled={carouselImages.length === 0}
            className="text-primary text-sm font-bold flex items-center gap-1 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">gallery_thumbnail</span>
            Ver todas
          </button>
        </div>
      </section>

      <div className="px-4 pb-4 space-y-3">
        <h3 className="text-[#181411] dark:text-white text-base font-bold mb-1">Perfil del restaurante</h3>
        <details className="group bg-white dark:bg-[#2d2218] rounded-xl border border-[#e6e0db] dark:border-[#3d2e21] overflow-hidden shadow-sm" open>
          <summary className="flex cursor-pointer items-center justify-between p-4 list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined">store</span>
              </div>
              <div>
                <p className="text-[#181411] dark:text-white font-semibold">Datos del restaurante</p>
                <p className="text-xs text-[#8a7560]">Domicilio, sitio web, ciudad, código postal y más</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-[#8a7560] group-open:rotate-90 transition-transform">chevron_right</span>
          </summary>
          <div className="px-4 pb-4 pt-0 space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Descripción</label>
              <textarea
                value={restaurantForm.description}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm min-h-[100px] px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Describe tu restaurante..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Dirección</label>
              <input
                type="text"
                value={restaurantForm.address}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Calle y número"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Ciudad</label>
                <input
                  type="text"
                  value={restaurantForm.city}
                  onChange={(e) => setRestaurantForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Estado</label>
                <input
                  type="text"
                  value={restaurantForm.state}
                  onChange={(e) => setRestaurantForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">País</label>
                <input
                  type="text"
                  value={restaurantForm.country}
                  onChange={(e) => setRestaurantForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Código Postal</label>
                <input
                  type="text"
                  value={restaurantForm.postal_code}
                  onChange={(e) => setRestaurantForm((f) => ({ ...f, postal_code: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                  maxLength={10}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Sitio Web</label>
              <input
                type="url"
                value={restaurantForm.website}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, website: e.target.value }))}
                className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="https://..."
              />
            </div>
            <button
              type="button"
              onClick={handleSaveRestaurant}
              disabled={isSavingRestaurant}
              className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {isSavingRestaurant ? (
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </details>
      </div>

      <section className="px-4 pt-4">
        <h3 className="text-[#181411] dark:text-white text-base font-bold mb-4">{t('profile.accountInfo')}</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.name')}</p>
              <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.name || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.email')}</p>
              <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">call</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.phone')}</p>
              <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.phone || '—'}</p>
            </div>
          </div>
        </div>
      </section>

      {showGalleryModal && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex flex-col p-4"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white text-lg font-bold">Todas las fotos</h3>
            <button
              type="button"
              onClick={() => setShowGalleryModal(false)}
              className="text-white p-2 rounded-full hover:bg-white/10"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3">
            {carouselImages.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#222]">
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url("${getRestaurantImageUrl(img.image_url, 'cover')}")` }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantProfileRestaurant;
