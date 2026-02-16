import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useRestaurant } from '../../contexts/RestaurantContext';
import { getRestaurantStaffByUser } from '../../services/database';
import RestaurantProfileComensal from './RestaurantProfileComensal';
import RestaurantProfileRestaurant from './RestaurantProfileRestaurant';

/**
 * Pantalla orquestadora del perfil del restaurante.
 * Resuelve el restaurante a mostrar (staff o seleccionado), muestra loading/empty y delega a la vista según tipo de cuenta.
 */
const RestaurantProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user, accountType } = useAuth();
  const { selectedRestaurantId } = useRestaurant();
  const [isLoading, setIsLoading] = useState(true);
  const [targetRestaurantId, setTargetRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    const resolve = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const staff = await getRestaurantStaffByUser(user.id);
        let id: string | null = null;
        if (staff.length > 0) {
          const first = staff[0].restaurant_id;
          if (first && first !== '00000000-0000-0000-0000-000000000001') {
            id = first;
          }
        }
        if (!id && selectedRestaurantId && selectedRestaurantId !== '00000000-0000-0000-0000-000000000001') {
          id = selectedRestaurantId;
        }
        setTargetRestaurantId(id);
      } catch (error) {
        console.error('Error resolving restaurant profile:', error);
        setTargetRestaurantId(null);
      } finally {
        setIsLoading(false);
      }
    };
    resolve();
  }, [user?.id, selectedRestaurantId]);

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

  if (!targetRestaurantId) {
    const isComensal = accountType === 'diner';
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center px-6">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">restaurant</span>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isComensal
                ? 'Elige un restaurante desde el menú para ver su perfil.'
                : 'No tienes restaurantes asociados'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isComensal && (
                <button
                  onClick={() => navigate('/menu')}
                  className="px-6 py-2 bg-primary text-white rounded-lg"
                >
                  Ir al menú
                </button>
              )}
              <button
                onClick={() => navigate('/home')}
                className={`px-6 py-2 rounded-lg ${isComensal ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'bg-primary text-white'}`}
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accountType === 'diner') {
    return <RestaurantProfileComensal restaurantId={targetRestaurantId} />;
  }

  return <RestaurantProfileRestaurant restaurantId={targetRestaurantId} />;
};

export default RestaurantProfileScreen;
