import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import {
  getRestaurantFullProfile,
  getRestaurantStaffByUser,
  updateRestaurant,
  getRestaurantImageUrl,
  updateRestaurantImageFromBase64,
  Restaurant,
} from '../services/database';
import { supabase, isSupabaseConfigured } from '../config/supabase';

const RestaurantProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [fullProfile, setFullProfile] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados de edición
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [coverImages, setCoverImages] = useState<string[]>([]);
  const [logoImage, setLogoImage] = useState<string>('');
  const [imageZoom, setImageZoom] = useState<{ [key: number]: number }>({}); // Zoom por índice de imagen (1.0 = 100%)
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagValue, setNewTagValue] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Refs para inputs de archivos
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cargar restaurante del usuario
  useEffect(() => {
    const loadRestaurant = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const staff = await getRestaurantStaffByUser(user.id);
        
        if (staff.length === 0) {
          setIsLoading(false);
          return;
        }

        const firstRestaurantId = staff[0].restaurant_id;
        
        // Validar que el restaurantId no sea un UUID de ejemplo
        if (firstRestaurantId === '00000000-0000-0000-0000-000000000001') {
          console.error('[RestaurantProfileScreen] Invalid restaurant ID from staff:', firstRestaurantId);
          console.error('[RestaurantProfileScreen] Staff data:', staff);
          setIsLoading(false);
          return;
        }
        
        setRestaurantId(firstRestaurantId);
        console.log('[RestaurantProfileScreen] Loading profile for restaurant:', firstRestaurantId);

        const profile = await getRestaurantFullProfile(firstRestaurantId);
        if (profile) {
          setFullProfile(profile);
          setRestaurant(profile.restaurant);
          
          // Cargar imágenes
          if (profile.restaurant?.logo_url) {
            setLogoImage(getRestaurantImageUrl(profile.restaurant.logo_url, 'logo'));
          }
          
          if (profile.coverImages && profile.coverImages.length > 0) {
            const coverUrls = profile.coverImages.map((img: any) => 
              getRestaurantImageUrl(img.image_url, 'cover')
            );
            setCoverImages(coverUrls);
          } else {
            // Imágenes de ejemplo
            setCoverImages([
              'https://lh3.googleusercontent.com/aida-public/AB6AXuDtUGWSWPjJbKIdOOxwJgOSkzgsLDpJ0obgPdtW86Zh8oyrhB5lX1XNaaTxQF2xRU3UGWkZYrWwbMzQTmmd8A3xx-0yKz9f9mk6_IKqLEtFTDCfOZ3rr9YEv1c5mr5boJgNiOURBUti27W-p4AqanvqBygsOTcPXfnVdgGLSeCXBgJQnkEXoRBzH7VCi-r5e2P1e1ovjjBcqsjnpEfQ_mabWnY6QaOI6J89n8v5vPOY6uWEsOVSvgu-A-1RDiVePU7G0AJFNXfgMloY',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuBOmCVaJxDWM8EsURfTog48IxhiUR9yJH3pkzsL-BHYNv0_5wEzuZcW2eyq2LcdILeyoGTH7_2la2OUymXMWhGDmVkGIOf37W7hLatU--lCS2kpCC4RlDei35eiRt2NzeST69yoReGF8eoEq7h3KnjgIKFGXnVmP8vY5EnKGLi43eiErQjTpz8jfkryx7KtdDcF7I_fnQm9-S7OyR-au8QnWVOO0vTMG-6QQyp3m3BlCBMNpUsyMejDv9i7QfBcd7_LwgELdU5-hi0U',
              'https://lh3.googleusercontent.com/aida-public/AB6AXuC1c5rAHzmeRFcC_700qJixBzX5wNYG1aYKJMwP0tPEjXssSAZZSGbUaxB2GDwoOSmKRQ_v_vrh-3l5QRWqOrIzxExNbrBjOJinQ2m2nxOqXXRyF38m1BONpMlR_0yY_pUz9vpiZzf1vGp0Cx1Rmw4TdKLQe-vijExfM3bINqBP-LBojS-rTjHLmGoj1unWF7Oq5KZPVnetb2xJm9wCRT9OCirharnHGqKeD2dGk23GxT9lFBe72Z388SpcgF-bQj1ymQh1T6OwfC7H'
            ]);
          }
        }
      } catch (error) {
        console.error('Error loading restaurant profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRestaurant();
  }, [user]);

  // Iniciar edición de campo
  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  // Guardar edición
  const saveEdit = async () => {
    if (!restaurantId || !restaurant || !editingField) {
      console.error('[saveEdit] Missing required data:', { restaurantId, restaurant, editingField });
      return;
    }

    // Validar que el restaurantId no sea un UUID de ejemplo
    if (restaurantId === '00000000-0000-0000-0000-000000000001') {
      alert('Error: ID de restaurante inválido. Por favor, ejecuta el script SQL para crear el restaurante correctamente.');
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {};
      updates[editingField] = editValue;
      
      console.log('[saveEdit] Saving updates:', { restaurantId, updates });
      
      const updated = await updateRestaurant(restaurantId, updates);
      if (updated) {
        setRestaurant(updated);
        setEditingField(null);
        setEditValue('');
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white';
        successMsg.textContent = 'Cambios guardados correctamente';
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        throw new Error('No se pudo actualizar el restaurante');
      }
    } catch (error: any) {
      console.error('[saveEdit] Error saving:', error);
      let errorMessage = 'Error al guardar los cambios';
      if (error.code === 'PGRST116') {
        errorMessage = 'No se encontró el restaurante o no tienes permisos para actualizarlo. Verifica que estés asociado como owner.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  // Agregar tag
  const handleAddTag = async () => {
    if (!newTagValue.trim() || !restaurantId || !restaurant) {
      return;
    }

    // Validar que el restaurantId no sea un UUID de ejemplo
    if (restaurantId === '00000000-0000-0000-0000-000000000001') {
      alert('Error: ID de restaurante inválido. Por favor, ejecuta el script SQL para crear el restaurante correctamente.');
      return;
    }

    const currentTags = restaurant.tags || [];
    const tagToAdd = newTagValue.trim();

    // Verificar que el tag no exista ya
    if (currentTags.includes(tagToAdd)) {
      alert('Este tag ya existe');
      setNewTagValue('');
      return;
    }

    setIsSaving(true);
    try {
      const updatedTags = [...currentTags, tagToAdd];
      const updated = await updateRestaurant(restaurantId, { tags: updatedTags });
      
      if (updated) {
        setRestaurant(updated);
        setNewTagValue('');
        setIsAddingTag(false);
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white';
        successMsg.textContent = 'Tag agregado correctamente';
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        throw new Error('No se pudo actualizar el restaurante');
      }
    } catch (error: any) {
      console.error('[handleAddTag] Error adding tag:', error);
      let errorMessage = 'Error al agregar el tag';
      if (error.code === 'PGRST116') {
        errorMessage = 'No se encontró el restaurante o no tienes permisos para actualizarlo.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar tag
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!restaurantId || !restaurant) {
      return;
    }

    // Validar que el restaurantId no sea un UUID de ejemplo
    if (restaurantId === '00000000-0000-0000-0000-000000000001') {
      alert('Error: ID de restaurante inválido. Por favor, ejecuta el script SQL para crear el restaurante correctamente.');
      return;
    }

    const currentTags = restaurant.tags || [];
    const updatedTags = currentTags.filter(tag => tag !== tagToRemove);

    setIsSaving(true);
    try {
      const updated = await updateRestaurant(restaurantId, { tags: updatedTags });
      
      if (updated) {
        setRestaurant(updated);
        // Mostrar mensaje de éxito
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white';
        successMsg.textContent = 'Tag eliminado correctamente';
        document.body.appendChild(successMsg);
        setTimeout(() => {
          document.body.removeChild(successMsg);
        }, 3000);
      } else {
        throw new Error('No se pudo actualizar el restaurante');
      }
    } catch (error: any) {
      console.error('[handleRemoveTag] Error removing tag:', error);
      let errorMessage = 'Error al eliminar el tag';
      if (error.code === 'PGRST116') {
        errorMessage = 'No se encontró el restaurante o no tienes permisos para actualizarlo.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  // Manejar cambio de logo
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !restaurant?.slug) {
      console.error('[handleLogoChange] Missing file or restaurant slug');
      return;
    }

    // Validar que el restaurantId no sea un UUID de ejemplo
    if (restaurantId === '00000000-0000-0000-0000-000000000001') {
      alert('Error: ID de restaurante inválido. Por favor, ejecuta el script SQL para crear el restaurante correctamente.');
      return;
    }

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          setIsSaving(true);
          console.log('[handleLogoChange] Updating logo for restaurant:', restaurant.slug);
          const success = await updateRestaurantImageFromBase64(
            restaurant.slug,
            reader.result,
            'logo'
          );
          if (success) {
            setLogoImage(reader.result);
            // Recargar restaurante
            const profile = await getRestaurantFullProfile(restaurantId!);
            if (profile) {
              setRestaurant(profile.restaurant);
              if (profile.restaurant?.logo_url) {
                setLogoImage(getRestaurantImageUrl(profile.restaurant.logo_url, 'logo'));
              }
            }
            // Mostrar mensaje de éxito
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg bg-green-500 text-white';
            successMsg.textContent = 'Logo actualizado correctamente';
            document.body.appendChild(successMsg);
            setTimeout(() => {
              document.body.removeChild(successMsg);
            }, 3000);
          } else {
            throw new Error('No se pudo actualizar el logo');
          }
        } catch (error: any) {
          console.error('[handleLogoChange] Error updating logo:', error);
          let errorMessage = 'Error al actualizar el logo';
          if (error.code === 'PGRST116') {
            errorMessage = 'No se encontró el restaurante o no tienes permisos para actualizarlo.';
          } else if (error.message) {
            errorMessage = error.message;
          }
          alert(errorMessage);
        } finally {
          setIsSaving(false);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manejar cambio de imagen de portada
  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande. Por favor selecciona una imagen menor a 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const newImages = [...coverImages];
        newImages[index] = reader.result;
        setCoverImages(newImages);
        // TODO: Subir a Supabase Storage y actualizar restaurant_cover_images
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Obtener valor a mostrar (ejemplo o real)
  const getDisplayValue = (field: string, exampleValue: string): string => {
    if (!restaurant) return exampleValue;
    const value = (restaurant as any)[field];
    return value || exampleValue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Cargando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant || !restaurantId) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center px-6">
            <span className="material-symbols-outlined text-6xl text-gray-400 mb-4">restaurant</span>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No tienes restaurantes asociados
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

  const restaurantName = getDisplayValue('nombre_comercial', 'Amanecer Café');
  const tipoCocina = getDisplayValue('tipo_cocina', 'Mexicana Contemporánea');
  const descripcionCorta = getDisplayValue('descripcion_corta', 'Comienza tu mañana con el sabor auténtico de México. En Amanecer Café, nos especializamos en desayunos artesanales utilizando ingredientes de granjas locales.');
  const descripcionLarga = getDisplayValue('descripcion_larga', 'Comienza tu mañana con el sabor auténtico de México. En Amanecer Café, nos especializamos en desayunos artesanales utilizando ingredientes de granjas locales. Nuestra receta de chilaquiles ha pasado por tres generaciones, brindando un calor hogareño en cada bocado.');
  const tags = restaurant.tags || ['Familiar', 'Pet Friendly', 'WiFi Gratis', 'Terraza'];
  const rating = restaurant.rating || 4.8;
  const totalReviews = restaurant.total_reviews || 250;

  // Funciones para controlar el zoom de las imágenes
  const handleZoomIn = (index: number) => {
    setImageZoom(prev => {
      const currentZoom = prev[index] || 1.0;
      const newZoom = Math.min(currentZoom + 0.1, 3.0); // Máximo 300%
      return { ...prev, [index]: newZoom };
    });
  };

  const handleZoomOut = (index: number) => {
    setImageZoom(prev => {
      const currentZoom = prev[index] || 1.0;
      const newZoom = Math.max(currentZoom - 0.1, 0.5); // Mínimo 50%
      return { ...prev, [index]: newZoom };
    });
  };

  const handleResetZoom = (index: number) => {
    setImageZoom(prev => {
      const newState = { ...prev };
      delete newState[index];
      return newState;
    });
  };

  const getImageZoom = (index: number): number => {
    return imageZoom[index] || 1.0;
  };

  return (
    <div
      className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark"
      // Reservar espacio para la BottomNav fija (evita que el último contenido quede detrás, especialmente en Android)
      style={{ paddingBottom: 'calc(6.5rem + env(safe-area-inset-bottom))' }}
    >
      {/* TopAppBar */}
      <div className="fixed top-0 z-50 w-full flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-start">
          <button onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
          </button>
        </div>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Perfil</h2>
        <div className="flex w-12 items-center justify-end">
        </div>
      </div>

      {/* Spacer for TopAppBar */}
      <div className="h-16"></div>

      {/* Carousel / Hero Section */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory">
        <div className="flex items-stretch p-4 gap-3 w-max">
          {coverImages.map((image, index) => {
            // Asegurar que el ref existe
            if (!coverInputRefs.current[index]) {
              coverInputRefs.current[index] = null;
            }
            
            return (
              <div key={index} className="flex h-full flex-1 flex-col gap-4 rounded-xl min-w-[85vw] snap-center relative">
                <div className="w-full aspect-[16/10] rounded-xl flex flex-col shadow-sm relative group bg-gradient-to-br from-primary/20 to-primary-dark/60 dark:from-primary/30 dark:to-primary-dark overflow-hidden">
                  {image ? (
                    <div className="w-full h-full overflow-hidden rounded-xl relative">
                      <img
                        src={image}
                        alt={`Imagen de portada ${index + 1}`}
                        className="w-full h-full object-cover rounded-xl transition-transform duration-300 ease-out"
                        style={{ 
                          transform: `scale(${getImageZoom(index)})`,
                          transformOrigin: 'center center',
                          willChange: 'transform'
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-center bg-no-repeat bg-contain rounded-xl" />
                  )}

                  {/* Controles de zoom y edición */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
                    {/* Botón + para agregar/editar imagen */}
                    <button
                      onClick={() => coverInputRefs.current[index]?.click()}
                      className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-800/90 flex items-center justify-center hover:bg-white dark:hover:bg-gray-800 transition-colors shadow-md"
                      title="Cambiar imagen"
                    >
                      <span className="material-symbols-outlined text-primary text-xl">add</span>
                    </button>
                    
                    {/* Controles de zoom */}
                    {image && (
                      <div className="flex flex-col gap-1 bg-white/90 dark:bg-gray-800/90 rounded-lg p-1 shadow-md">
                        <button
                          onClick={() => handleZoomIn(index)}
                          className="w-8 h-8 rounded-md bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 flex items-center justify-center transition-colors"
                          title="Acercar"
                        >
                          <span className="material-symbols-outlined text-primary text-sm">zoom_in</span>
                        </button>
                        <button
                          onClick={() => handleZoomOut(index)}
                          className="w-8 h-8 rounded-md bg-primary/10 hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30 flex items-center justify-center transition-colors"
                          title="Alejar"
                        >
                          <span className="material-symbols-outlined text-primary text-sm">zoom_out</span>
                        </button>
                        {getImageZoom(index) !== 1.0 && (
                          <button
                            onClick={() => handleResetZoom(index)}
                            className="w-8 h-8 rounded-md bg-gray-200/80 hover:bg-gray-300/80 dark:bg-gray-700/80 dark:hover:bg-gray-600/80 flex items-center justify-center transition-colors"
                            title="Restablecer zoom"
                          >
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-sm">restart_alt</span>
                          </button>
                        )}
                        <div className="text-xs text-center text-gray-600 dark:text-gray-300 px-1 py-0.5">
                          {Math.round(getImageZoom(index) * 100)}%
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={(el) => { coverInputRefs.current[index] = el; }}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleCoverImageChange(e, index)}
                    className="hidden"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ProfileHeader */}
      <div className="flex p-4 -mt-12 relative z-10">
        <div className="flex w-full flex-col gap-4 items-center">
          <div className="flex gap-4 flex-col items-center">
            {/* Logo con botón + */}
            <div className="relative group">
              <div className="aspect-square rounded-xl min-h-28 w-28 border-4 border-white dark:border-background-dark shadow-md flex items-center justify-center bg-white overflow-hidden">
                {logoImage ? (
                  <img
                    src={logoImage}
                    alt="Logo del restaurante"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div 
                    className="bg-center bg-no-repeat bg-contain w-full h-full"
                    style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBY_roTh_HopL4hrmhXpA19NfBXb_Cm70Zm36VuqYDSmDxbujvhOR5mP0zh5hFcE0b24KfKBWY8os_NtTqLircInX1Jndrbn75kECMIuEO2Ok9Cl9Y8_yXPEeqLDhPNsRl2mfgFk_6CTEo-SsUMUNU6j3fOu_PdjyQuDW79Xp1vRE-01e-f24KBn2AoWxtkWA8F1p8GW5ipNQqH6VZ9pB5thDJumHZh81JVlOaY39Wdn4es_zzHnZeJ3rViORCNpBRV2TJRxM65helB")' }}
                  />
                )}
              </div>
              <button
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors z-10"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>

            {/* Nombre del restaurante */}
            <div className="flex flex-col items-center justify-center">
              {editingField === 'nombre_comercial' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="text-3xl font-extrabold text-center bg-transparent border-b-2 border-primary px-2 min-w-[200px]"
                    autoFocus
                    placeholder="Nombre del restaurante"
                  />
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="text-primary"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="text-gray-400"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-[#181411] dark:text-white text-3xl font-extrabold leading-tight tracking-[-0.015em] text-center">
                    {restaurantName}
                  </h1>
                  <button
                    onClick={() => startEdit('nombre_comercial', restaurant.nombre_comercial || '')}
                    className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Editar nombre"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
              )}

              {/* Tipo de cocina */}
              {editingField === 'tipo_cocina' ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') cancelEdit();
                    }}
                    className="text-base text-center bg-transparent border-b-2 border-primary px-2 text-[#8a7560] dark:text-gray-400 min-w-[200px]"
                    autoFocus
                    placeholder="Ej: Mexicana Contemporánea"
                  />
                  <button onClick={saveEdit} disabled={isSaving} className="text-primary">
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                  <button onClick={cancelEdit} className="text-gray-400">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[#8a7560] dark:text-gray-400 text-base font-medium leading-normal text-center">
                    {tipoCocina}
                  </p>
                  <button
                    onClick={() => startEdit('tipo_cocina', restaurant.tipo_cocina || '')}
                    className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Editar tipo de cocina"
                  >
                    <span className="material-symbols-outlined text-xs">add</span>
                  </button>
                </div>
              )}

              {/* Rating */}
              <div className="flex items-center gap-1 mt-2">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                <p className="text-[#181411] dark:text-white text-base font-bold leading-normal text-center">{rating}</p>
                <p className="text-[#8a7560] dark:text-gray-400 text-base font-normal leading-normal text-center">({totalReviews}+ reseñas)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ActionsBar */}
      <div className="px-4 py-2">
        <div className="gap-3 grid grid-cols-3">
          <div className="flex flex-col items-center gap-2 bg-primary py-4 px-2 text-center rounded-xl shadow-lg shadow-primary/20">
            <div className="rounded-full bg-white/20 p-3">
              <span className="material-symbols-outlined text-white">restaurant_menu</span>
            </div>
            <p className="text-white text-xs font-bold leading-normal uppercase tracking-wider">Gestionar Menú</p>
          </div>
          <button
            onClick={() => navigate('/restaurant-details')}
            className="flex flex-col items-center gap-2 bg-white dark:bg-gray-800/50 py-4 px-2 text-center rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="rounded-full bg-primary/10 p-3">
              <span className="material-symbols-outlined text-primary">calendar_today</span>
            </div>
            <p className="text-[#181411] dark:text-white text-xs font-bold leading-normal uppercase tracking-wider">Configurar Reservaciones</p>
          </button>
          <button
            onClick={() => navigate('/admin-control-panel')}
            className="flex flex-col items-center gap-2 bg-primary py-4 px-2 text-center rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors"
          >
            <div className="rounded-full bg-white/20 p-3">
              <span className="material-symbols-outlined text-white">dashboard</span>
            </div>
            <p className="text-white text-xs font-bold leading-normal uppercase tracking-wider">Panel de Control</p>
          </button>
        </div>
      </div>

      {/* Section: About Us */}
      <div className="mt-4">
        <h2 className="text-[#181411] dark:text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 pb-2">Sobre nosotros</h2>
        <div className="px-4">
          {editingField === 'descripcion_corta' ? (
            <div className="space-y-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-full text-[#8a7560] dark:text-gray-300 text-base leading-relaxed bg-white dark:bg-gray-800 border-2 border-primary rounded-lg p-3"
                rows={4}
                autoFocus
                placeholder="Describe tu restaurante..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={saveEdit} 
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm disabled:opacity-50"
                >
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
                <button 
                  onClick={cancelEdit} 
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-bold text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <p className="text-[#8a7560] dark:text-gray-300 text-base leading-relaxed">
                {isDescriptionExpanded ? descripcionLarga : descripcionCorta}
              </p>
              <button
                onClick={() => startEdit('descripcion_corta', restaurant.descripcion_corta || '')}
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                title="Editar descripción"
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
              {descripcionLarga && descripcionLarga !== descripcionCorta && (
                <button
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="text-primary font-bold mt-2 text-sm hover:underline transition-all"
                >
                  {isDescriptionExpanded ? 'Leer menos' : 'Leer más...'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tags / Lifestyle */}
      <div className="mt-6 px-4">
        <div className="flex flex-wrap gap-2 pb-8">
          {tags.map((tag, index) => (
            <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 bg-background-light dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700">
              <span className="material-symbols-outlined text-sm text-primary">local_offer</span>
              <span className="text-sm font-medium">{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                disabled={isSaving}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                title="Eliminar tag"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))}
          {isAddingTag ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full border-2 border-primary">
              <input
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                  if (e.key === 'Escape') {
                    setIsAddingTag(false);
                    setNewTagValue('');
                  }
                }}
                className="text-sm font-medium text-primary bg-transparent border-none outline-none min-w-[120px]"
                placeholder="Nuevo tag..."
                autoFocus
              />
              <button
                onClick={handleAddTag}
                disabled={isSaving || !newTagValue.trim()}
                className="text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Guardar tag"
              >
                <span className="material-symbols-outlined text-sm">check</span>
              </button>
              <button
                onClick={() => {
                  setIsAddingTag(false);
                  setNewTagValue('');
                }}
                className="text-gray-400"
                title="Cancelar"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingTag(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm text-primary">add</span>
              <span className="text-sm font-medium text-primary">Agregar tag</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RestaurantProfileScreen;
