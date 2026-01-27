/**
 * Componente temporal para actualizar la imagen del restaurante
 * 
 * INSTRUCCIONES:
 * 1. Reemplaza 'TU_IMAGEN_BASE64_AQUI' con la imagen base64 completa
 * 2. Agrega esta ruta temporalmente en App.tsx: <Route path="/update-image" element={<UpdateRestaurantImageScreen />} />
 * 3. Visita http://localhost:5173/update-image (o tu URL local)
 * 4. La imagen se actualizará automáticamente
 * 5. Elimina este componente y la ruta cuando termines
 */

import React, { useEffect, useState } from 'react';
import { updateRestaurantImageFromStorage } from '../services/database';

const UpdateRestaurantImageScreen: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const updateImage = async () => {
      // Ruta de la imagen que ya está en Supabase Storage
      const imagePath = 'logos/logo-donk-restaurant.png';

      setStatus('loading');
      setMessage('Actualizando imagen del restaurante desde Storage...');

      try {
        const success = await updateRestaurantImageFromStorage(
          'donk-restaurant',
          imagePath,
          'logo' // Cambia a 'cover' si quieres actualizar la imagen de portada
        );

        if (success) {
          setStatus('success');
          setMessage('¡Imagen actualizada exitosamente! Recarga la página para ver los cambios.');
        } else {
          setStatus('error');
          setMessage('Error al actualizar la imagen. Revisa la consola para más detalles.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(`Error: ${error.message}`);
      }
    };

    updateImage();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          Actualizando Imagen del Restaurante
        </h1>
        
        {status === 'loading' && (
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <p className="text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <span className="material-symbols-outlined text-3xl">check_circle</span>
            <p className="font-semibold">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-3xl">error</span>
            <p className="font-semibold">{message}</p>
          </div>
        )}

        {status === 'idle' && (
          <p className="text-gray-600 dark:text-gray-300">
            Preparando actualización...
          </p>
        )}

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Nota:</strong> Este es un componente temporal. Elimínalo y su ruta cuando termines de actualizar la imagen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpdateRestaurantImageScreen;
