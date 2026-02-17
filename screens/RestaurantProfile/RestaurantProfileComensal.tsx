import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRestaurantFullProfile,
  getRestaurantStaff,
  type Restaurant,
  type RestaurantSocialMedia,
} from '../../services/database';
import { getUserData } from '../../services/api/user';
import type { CoverImageItem, OwnerData } from './types';
import RestaurantProfilePreview from './RestaurantProfilePreview';

export interface RestaurantProfileComensalProps {
  restaurantId: string;
}

/**
 * Contenedor para la vista comensal del perfil del restaurante.
 * Carga datos del restaurante seleccionado y del propietario, luego muestra el preview.
 */
const RestaurantProfileComensal: React.FC<RestaurantProfileComensalProps> = ({
  restaurantId,
}) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [carouselImages, setCarouselImages] = useState<CoverImageItem[]>([]);
  const [ownerData, setOwnerData] = useState<OwnerData | null>(null);
  const [socialMedia, setSocialMedia] = useState<RestaurantSocialMedia[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const profile = await getRestaurantFullProfile(restaurantId);
        if (profile) {
          setRestaurant(profile.restaurant);
          setSocialMedia(profile.socialMedia ?? []);
          if (profile.coverImages?.length) {
            setCarouselImages(
              profile.coverImages.map((img: { id: string; image_url: string; image_order: number }) => ({
                id: img.id,
                image_url: img.image_url,
                image_order: img.image_order,
              }))
            );
          } else {
            setCarouselImages([]);
          }
        } else {
          setRestaurant(null);
          setCarouselImages([]);
          setSocialMedia([]);
        }

        const staffList = await getRestaurantStaff(restaurantId);
        const owner = staffList.find((s) => s.role === 'owner');
        if (owner) {
          const ownerResult = await getUserData(owner.user_id);
          if (ownerResult.success && ownerResult.data) {
            setOwnerData(ownerResult.data);
          } else {
            setOwnerData(null);
          }
        } else {
          setOwnerData(null);
        }
      } catch (error) {
        console.error('Error loading restaurant profile (comensal):', error);
        setRestaurant(null);
        setCarouselImages([]);
        setOwnerData(null);
        setSocialMedia([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [restaurantId]);

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
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No se pudo cargar el perfil del restaurante.
            </p>
            <button
              onClick={() => navigate('/home')}
              className="px-6 py-2 bg-primary text-white rounded-lg"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <RestaurantProfilePreview
      restaurant={restaurant}
      carouselImages={carouselImages}
      ownerData={ownerData}
      socialMedia={socialMedia}
    />
  );
};

export default RestaurantProfileComensal;
