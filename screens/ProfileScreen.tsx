
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { isSupabaseConfigured } from '../config/supabase';
import { 
  getUserSettings, 
  upsertUserSettings,
  getUserPaymentMethods,
  UserPaymentMethod
} from '../services/database';
import { getUserProfile, updateUserProfile, getUserData, updateUserData } from '../services/api/user';
import {
  getCurrentUserRestaurantId,
  getRestaurantById,
  getRestaurantCoverImages,
  createRestaurantCoverImage,
  deleteRestaurantCoverImage,
  uploadImage,
  getRestaurantImageUrl,
} from '../services/database';
import { updateRestaurant as updateRestaurantApi } from '../services/api/restaurant';
import { playClickSound, playBackspaceSound } from '../utils/sound';
import GuestRestrictionModal from '../components/GuestRestrictionModal';

interface Card {
  id: string; // Cambiar a string para usar UUID de la BD
  color: string;
  textColor: string;
  number: string;
  exp: string;
  name: string;
  brand: string;
  isMastercard?: boolean;
  isDisabled?: boolean;
  isDefault?: boolean;
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config } = useRestaurant();
  const { signOut, user, userType, accountType } = useAuth();
  const { clearCart } = useCart();
  const [cards, setCards] = useState<Card[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Estado para el modal de restricción de invitados
  const [guestRestrictionModal, setGuestRestrictionModal] = useState<{ show: boolean; featureName: string }>({
    show: false,
    featureName: ''
  });
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  type RestaurantFormField = 'description' | 'address' | 'city' | 'state' | 'country' | 'postal_code' | 'website';
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | RestaurantFormField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [lastSync, setLastSync] = useState<string>('');
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [restaurantForm, setRestaurantForm] = useState({
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'México',
    postal_code: '',
    website: '',
  });
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [carouselImages, setCarouselImages] = useState<{ id: string; image_url: string; image_order: number }[]>([]);
  const [isUploadingCarousel, setIsUploadingCarousel] = useState(false);
  const carouselInputRef = useRef<HTMLInputElement>(null);
  const defaultImage = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpDz7kylj-nzXQ8dgTtg0umbheeBshTyl9RxUnJSp0BUjFcWJ3sxgOubkQ8zmiPon5fihqbaOxTagMXDyKVNgvKz26RDTYgirEcCoN4D63BS70Z756QE8GvMF0f9jY4ay6NQGHThIUrY9LyBJ36TnvGVD55nEjl3MkjHlHN1Lu8GWsNcmjYRbb1fvVeEXa3U082ocTXHk5jBmvqBPt1G5iwzCVNqXclTyviqCl15lCCSj96Ih0QAmRstK-YiKSnnxj97uPAvxJUJVd';
  const [profileImage, setProfileImage] = useState<string>(defaultImage);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [cropData, setCropData] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showImageMenu, setShowImageMenu] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cargar datos del usuario desde la API
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSupabaseConfigured() || !user?.id) {
        setIsLoadingUserData(false);
        return;
      }

      try {
        setIsLoadingUserData(true);
        const result = await getUserData(user.id);
        
        if (result.success && result.data) {
          setUserData(result.data);
          setLastSync(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
        } else {
          // Fallback a datos de Auth si la API falla
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          '';
          setUserData({
            name: fullName,
            email: user.email || '',
            phone: user.phone || user.user_metadata?.phone || '',
          });
        }
      } catch (error) {
        console.error('[ProfileScreen] Error loading user data:', error);
        // Fallback a datos de Supabase Auth
        const fullName = user.user_metadata?.full_name || 
                        user.user_metadata?.name || 
                        user.email?.split('@')[0] || 
                        '';
        setUserData({
          name: fullName,
          email: user.email || '',
          phone: user.phone || user.user_metadata?.phone || '',
        });
      } finally {
        setIsLoadingUserData(false);
      }
    };

    loadUserData();
  }, [user?.id]);

  // Cargar datos del restaurante cuando la cuenta es tipo restaurante
  useEffect(() => {
    const loadRestaurant = async () => {
      if (accountType !== 'restaurant' || !isSupabaseConfigured()) return;
      try {
        const rid = await getCurrentUserRestaurantId();
        if (!rid) return;
        setRestaurantId(rid);
        const rest = await getRestaurantById(rid);
        if (rest) {
          setRestaurantName(rest.name || '');
          setRestaurantForm({
            description: rest.description || '',
            address: rest.address || '',
            city: rest.city || '',
            state: rest.state || '',
            country: rest.country || 'México',
            postal_code: rest.postal_code || '',
            website: rest.website || '',
          });
        }
        const covers = await getRestaurantCoverImages(rid);
        setCarouselImages(covers.map(c => ({ id: c.id, image_url: c.image_url, image_order: c.image_order })));
      } catch (e) {
        console.error('[ProfileScreen] Error loading restaurant:', e);
      }
    };
    loadRestaurant();
  }, [accountType]);

  // Cargar perfil, configuración y métodos de pago desde la base de datos
  useEffect(() => {
    const loadUserProfileData = async () => {
      if (!user?.id || !isSupabaseConfigured()) {
        return;
      }

      try {
        // Cargar perfil de usuario
        const profileResult = await getUserProfile(user.id);
        if (profileResult.success && profileResult.data?.avatar_url) {
          setProfileImage(profileResult.data.avatar_url);
        }

        // Cargar métodos de pago
        const paymentMethods = await getUserPaymentMethods(user.id);
        const formattedCards: Card[] = paymentMethods.map((method: UserPaymentMethod) => {
          const expMonth = method.exp_month?.toString().padStart(2, '0') || '01';
          const expYear = method.exp_year?.toString().slice(-2) || '26';
          const isMastercard = method.brand?.toLowerCase() === 'mastercard';
          
          // Determinar colores según la marca
          const color = isMastercard 
            ? 'from-[#ffedd5] to-[#fed7aa]' 
            : 'from-[#e0f2fe] to-[#bae6fd]';
          const textColor = isMastercard 
            ? 'text-[#9a3412]' 
            : 'text-[#0369a1]';

          return {
            id: method.id,
            color,
            textColor,
            number: `**** **** **** ${method.last4 || '0000'}`,
            exp: `${expMonth}/${expYear}`,
            name: method.holder_name || 'ALEX GONZALEZ',
            brand: method.brand || 'VISA',
            isMastercard,
            isDisabled: !method.is_active,
            isDefault: method.is_default,
          };
        });
        setCards(formattedCards);
      } catch (error) {
        console.error('[ProfileScreen] Error loading profile data:', error);
      }
    };

    loadUserProfileData();
  }, [user?.id]);

  // Guardar imagen en la base de datos cuando cambia
  useEffect(() => {
    const saveProfileImage = async () => {
      if (!user?.id || !isSupabaseConfigured() || profileImage === defaultImage) {
        return;
      }

      try {
        // Guardar avatar_url a través de la API
        const result = await updateUserProfile({ avatar_url: profileImage }, user.id);
        if (!result.success) {
          console.error('[ProfileScreen] Error saving profile image:', result.error);
        }
      } catch (error) {
        console.error('[ProfileScreen] Error saving profile image:', error);
      }
    };

    // Solo guardar si la imagen cambió y no es la primera carga
    if (profileImage && profileImage !== defaultImage) {
      saveProfileImage();
    }
  }, [profileImage, user?.id]);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showImageMenu && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        // Verificar si el clic fue en el botón de editar
        const target = e.target as HTMLElement;
        const button = target.closest('button');
        if (button && button.querySelector('.material-symbols-outlined')) {
          return; // No cerrar si el clic fue en el botón
        }
        setShowImageMenu(false);
      }
    };
    if (showImageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showImageMenu]);

  // Manejar eventos globales de mouse para el arrastre del recorte
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!containerRef.current || !imageRef.current) return;
      const bounds = getImageBounds();
      if (!bounds) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Calcular nueva posición del recorte
      let newCropX = mouseX - dragStart.x;
      let newCropY = mouseY - dragStart.y;
      const cropSize = cropData.size / bounds.scaleX;
      
      // Limitar dentro de los bordes de la imagen
      newCropX = Math.max(bounds.x, Math.min(newCropX, bounds.x + bounds.width - cropSize));
      newCropY = Math.max(bounds.y, Math.min(newCropY, bounds.y + bounds.height - cropSize));
      
      // Convertir de vuelta a coordenadas de imagen natural
      const newCropXNatural = (newCropX - bounds.x) * bounds.scaleX;
      const newCropYNatural = (newCropY - bounds.y) * bounds.scaleY;
      
      setCropData(prev => ({ ...prev, x: newCropXNatural, y: newCropYNatural }));
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      document.body.style.overflow = '';
    };

    document.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.overflow = '';
    };
  }, [isDragging, dragStart, cropData.size]);

  const toggleCardStatus = async (cardId: string) => {
    if (!user?.id || !isSupabaseConfigured()) {
      // Fallback: solo actualizar estado local
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, isDisabled: !card.isDisabled } : card
      ));
      return;
    }

    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      // Actualizar en la base de datos
      const { updatePaymentMethod } = await import('../services/database');
      const updated = await updatePaymentMethod(cardId, user.id, { 
        is_active: !card.isDisabled 
      });

      if (updated) {
        // Actualizar estado local
        setCards(cards.map(c => 
          c.id === cardId ? { ...c, isDisabled: !c.isDisabled } : c
        ));
      }
    } catch (error) {
      console.error('[ProfileScreen] Error toggling card status:', error);
      // Fallback: actualizar estado local
      setCards(cards.map(card => 
        card.id === cardId ? { ...card, isDisabled: !card.isDisabled } : card
      ));
    }
  };

  const handleStartEdit = (field: 'name' | 'email' | 'phone' | RestaurantFormField) => {
    setEditingField(field);
    if (field === 'name' && accountType === 'restaurant') {
      setEditValue(restaurantName);
    } else if (field === 'name' || field === 'email' || field === 'phone') {
      setEditValue(userData[field]);
    } else {
      const v = restaurantForm[field];
      setEditValue(field === 'postal_code' ? (v || '') : (v || ''));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;
    try {
      if (editingField === 'email') {
        setEditingField(null);
        setEditValue('');
        return;
      }

      // Aplicar el valor editado al estado antes de armar el perfil completo
      const nameForUser = editingField === 'name' && accountType !== 'restaurant' ? editValue : userData.name;
      const phoneForUser = editingField === 'phone' ? editValue : userData.phone;
      const nameForRestaurant = editingField === 'name' && accountType === 'restaurant' ? editValue.trim() : restaurantName;
      const appliedRestaurantForm = { ...restaurantForm };
      if (['description', 'address', 'city', 'state', 'country', 'postal_code', 'website'].includes(editingField)) {
        const key = editingField as RestaurantFormField;
        appliedRestaurantForm[key] = key === 'postal_code' ? editValue.replace(/\D/g, '').slice(0, 10) : editValue.trim();
      }

      // Llamada a API: guardar perfil completo (usuario + restaurante si aplica)
      if (isSupabaseConfigured() && user?.id) {
        const userResult = await updateUserData({ name: nameForUser, phone: phoneForUser }, user.id);
        if (userResult.success && userResult.data) {
          setUserData(userResult.data);
        } else {
          setUserData(prev => ({ ...prev, name: nameForUser, phone: phoneForUser }));
        }
      } else {
        setUserData(prev => ({ ...prev, name: nameForUser, phone: phoneForUser }));
      }

      if (restaurantId && accountType === 'restaurant' && isSupabaseConfigured()) {
        const fullRestaurantPayload = {
          name: nameForRestaurant || undefined,
          description: appliedRestaurantForm.description || undefined,
          address: appliedRestaurantForm.address || undefined,
          city: appliedRestaurantForm.city || undefined,
          state: appliedRestaurantForm.state || undefined,
          country: appliedRestaurantForm.country || undefined,
          postal_code: appliedRestaurantForm.postal_code || undefined,
          website: appliedRestaurantForm.website || undefined,
        };
        const restaurantResult = await updateRestaurantApi(restaurantId, fullRestaurantPayload);
        if (restaurantResult.success && restaurantResult.data) {
          setRestaurantName(restaurantResult.data.name || nameForRestaurant);
          setRestaurantForm(prev => ({
            ...prev,
            description: restaurantResult.data.description ?? prev.description,
            address: restaurantResult.data.address ?? prev.address,
            city: restaurantResult.data.city ?? prev.city,
            state: restaurantResult.data.state ?? prev.state,
            country: restaurantResult.data.country ?? prev.country,
            postal_code: restaurantResult.data.postal_code ?? prev.postal_code,
            website: restaurantResult.data.website ?? prev.website,
          }));
        } else {
          setRestaurantName(nameForRestaurant);
          setRestaurantForm(appliedRestaurantForm);
        }
      } else if (editingField === 'name' && accountType === 'restaurant') {
        setRestaurantName(editValue.trim());
      } else if (['description', 'address', 'city', 'state', 'country', 'postal_code', 'website'].includes(editingField)) {
        setRestaurantForm(appliedRestaurantForm);
      }
    } catch (error: unknown) {
      console.error('[ProfileScreen] Error saving:', error);
      if (editingField === 'name' && accountType === 'restaurant') {
        setRestaurantName(editValue);
      } else if (editingField !== 'email' && editingField !== 'name' && editingField !== 'phone' && restaurantForm.hasOwnProperty(editingField)) {
        setRestaurantForm(prev => ({ ...prev, [editingField]: editingField === 'postal_code' ? editValue.replace(/\D/g, '').slice(0, 10) : editValue }));
      } else if ((editingField === 'name' || editingField === 'phone') && user?.id) {
        setUserData({ ...userData, [editingField]: editValue });
      }
    } finally {
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      if (user?.id && isSupabaseConfigured()) {
        await updateUserData({ name: userData.name, phone: userData.phone }, user.id);
      }
      if (restaurantId && accountType === 'restaurant' && isSupabaseConfigured()) {
        await updateRestaurantApi(restaurantId, {
          name: restaurantName || undefined,
          description: restaurantForm.description || undefined,
          address: restaurantForm.address || undefined,
          city: restaurantForm.city || undefined,
          state: restaurantForm.state || undefined,
          country: restaurantForm.country || undefined,
          postal_code: restaurantForm.postal_code || undefined,
          website: restaurantForm.website || undefined,
        });
      }
      setLastSync(new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      console.error('[ProfileScreen] Error saving:', e);
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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

      // Crear una URL temporal para la imagen y abrir modal de recorte
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageToCrop(reader.result);
          setShowCropModal(true);
        }
      };
      reader.readAsDataURL(file);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const getImageBounds = () => {
    if (!imageRef.current || !containerRef.current) return null;
    const img = imageRef.current;
    const container = containerRef.current;
    const imgRect = img.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Calcular dimensiones reales de la imagen escalada
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerRect.width / containerRect.height;
    
    let imgDisplayWidth: number;
    let imgDisplayHeight: number;
    let imgDisplayX: number;
    let imgDisplayY: number;
    
    if (imgAspect > containerAspect) {
      // Imagen más ancha que el contenedor
      imgDisplayWidth = containerRect.width;
      imgDisplayHeight = containerRect.width / imgAspect;
      imgDisplayX = 0;
      imgDisplayY = (containerRect.height - imgDisplayHeight) / 2;
    } else {
      // Imagen más alta que el contenedor
      imgDisplayHeight = containerRect.height;
      imgDisplayWidth = containerRect.height * imgAspect;
      imgDisplayX = (containerRect.width - imgDisplayWidth) / 2;
      imgDisplayY = 0;
    }
    
    return {
      x: imgDisplayX,
      y: imgDisplayY,
      width: imgDisplayWidth,
      height: imgDisplayHeight,
      scaleX: img.naturalWidth / imgDisplayWidth,
      scaleY: img.naturalHeight / imgDisplayHeight
    };
  };

  const handleCropStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    const bounds = getImageBounds();
    if (!bounds) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Convertir cropData a coordenadas de pantalla
    const cropX = bounds.x + (cropData.x / bounds.scaleX);
    const cropY = bounds.y + (cropData.y / bounds.scaleY);
    const cropSize = cropData.size / bounds.scaleX;
    
    // Verificar si el clic está dentro del área de recorte
    if (mouseX >= cropX && mouseX <= cropX + cropSize && 
        mouseY >= cropY && mouseY <= cropY + cropSize) {
      setIsDragging(true);
      setDragStart({
        x: mouseX - cropX,
        y: mouseY - cropY,
      });
      
      // Prevenir scroll del body cuando se está arrastrando
      document.body.style.overflow = 'hidden';
    }
  };


  const handleZoom = (delta: number) => {
    const bounds = getImageBounds();
    if (!bounds) return;
    
    const minSize = 100;
    const maxSize = Math.min(bounds.width * bounds.scaleX, bounds.height * bounds.scaleY);
    
    const newSize = Math.max(minSize, Math.min(cropData.size + delta, maxSize));
    
    // Mantener el centro del recorte
    const centerX = cropData.x + cropData.size / 2;
    const centerY = cropData.y + cropData.size / 2;
    
    let newX = centerX - newSize / 2;
    let newY = centerY - newSize / 2;
    
    // Limitar dentro de los bordes
    newX = Math.max(0, Math.min(newX, bounds.width * bounds.scaleX - newSize));
    newY = Math.max(0, Math.min(newY, bounds.height * bounds.scaleY - newSize));
    
    setCropData({ x: newX, y: newY, size: newSize });
  };

  const handleCropConfirm = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const image = imageRef.current;
    const size = cropData.size;
    
    // Configurar canvas
    canvas.width = 400;
    canvas.height = 400;
    
    // Dibujar imagen recortada
    ctx.drawImage(
      image,
      cropData.x, cropData.y, size, size,
      0, 0, 400, 400
    );
    
    // Convertir a base64 y guardar
    const croppedImage = canvas.toDataURL('image/png');
    setProfileImage(croppedImage);
    setShowCropModal(false);
    setImageToCrop('');
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop('');
    setCropData({ x: 0, y: 0, size: 200 });
  };

  const handleDeleteImage = async () => {
    setProfileImage(defaultImage);
    
    // Eliminar de la base de datos a través de la API
    if (user?.id && isSupabaseConfigured()) {
      try {
        const result = await updateUserProfile({ avatar_url: null }, user.id);
        if (!result.success) {
          console.error('[ProfileScreen] Error deleting profile image:', result.error);
        }
      } catch (error) {
        console.error('[ProfileScreen] Error deleting profile image:', error);
      }
    }
    
    setShowImageMenu(false);
  };

  const handleEditImage = () => {
    fileInputRef.current?.click();
    setShowImageMenu(false);
  };

  const handleEditExistingImage = () => {
    if (profileImage && profileImage !== defaultImage) {
      setImageToCrop(profileImage);
      setShowCropModal(true);
      setShowImageMenu(false);
    }
  };

  const handleCarouselAdd = () => {
    if (carouselImages.length >= 10) return;
    carouselInputRef.current?.click();
  };

  const handleCarouselFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !restaurantId || !file.type.startsWith('image/')) return;
    setIsUploadingCarousel(true);
    try {
      const filePath = `cover/${restaurantId}/${Date.now()}-${file.name.replace(/\s/g, '-')}`;
      const url = await uploadImage('restaurant-images', filePath, file);
      if (!url) throw new Error('Upload failed');
      const created = await createRestaurantCoverImage({
        restaurant_id: restaurantId,
        image_url: filePath,
        image_order: carouselImages.length,
        is_active: true,
      });
      if (created) setCarouselImages(prev => [...prev, { id: created.id, image_url: created.image_url, image_order: created.image_order }]);
    } catch (err) {
      console.error('[ProfileScreen] Error adding carousel image:', err);
    } finally {
      setIsUploadingCarousel(false);
    }
  };

  const handleCarouselRemove = async (imageId: string) => {
    const ok = await deleteRestaurantCoverImage(imageId);
    if (ok) setCarouselImages(prev => prev.filter(img => img.id !== imageId));
  };

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-50 flex items-center bg-white/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between border-b border-[#e6e0db] dark:border-[#3d2e21] safe-top">
        <button
          onClick={() => { playClickSound(); navigate(-1); }}
          className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center justify-start"
        >
          <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">{t('profile.title')}</h2>
        <div className="flex w-12 items-center justify-end">
          <button
            type="button"
            onClick={() => { playClickSound(); navigate('/settings'); }}
            className="flex cursor-pointer items-center justify-center rounded-full h-10 w-10 bg-primary/10 text-primary"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {accountType === 'restaurant' ? (
        <section className="py-6 bg-white dark:bg-[#2d2218] border-b border-[#f5f2f0] dark:border-[#3d2e21]">
          <p className="text-center text-sm text-[#8a7560] mb-3 px-4">Hasta 10 imágenes para tu restaurante</p>
          <div className="flex overflow-x-auto gap-4 px-4 pb-2 snap-x snap-mandatory hide-scrollbar" style={{ scrollSnapType: 'x mandatory' }}>
            {carouselImages.map((img) => (
              <div
                key={img.id}
                className="relative shrink-0 w-[180px] h-[120px] rounded-xl overflow-hidden snap-center bg-[#f8f7f5] dark:bg-[#221910] border border-[#e6e0db] dark:border-[#3d2e21]"
              >
                <div
                  className="w-full h-full bg-center bg-cover"
                  style={{ backgroundImage: `url("${getRestaurantImageUrl(img.image_url, 'cover')}")` }}
                />
                <button
                  type="button"
                  onClick={() => handleCarouselRemove(img.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                  title="Eliminar"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            ))}
            {carouselImages.length < 10 && (
              <button
                type="button"
                onClick={handleCarouselAdd}
                disabled={isUploadingCarousel}
                className="shrink-0 w-[180px] h-[120px] rounded-xl border-2 border-dashed border-[#e6e0db] dark:border-[#3d2e21] flex flex-col items-center justify-center gap-2 text-[#8a7560] hover:border-primary hover:bg-primary/5 transition-colors snap-center disabled:opacity-50"
              >
                {isUploadingCarousel ? (
                  <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                    <span className="text-xs font-medium">Agregar</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={carouselInputRef}
            type="file"
            accept="image/*"
            onChange={handleCarouselFileChange}
            className="hidden"
          />
        </section>
      ) : (
        <section className="flex flex-col items-center py-8 bg-white dark:bg-[#2d2218] border-b border-[#f5f2f0] dark:border-[#3d2e21]">
          <div className="relative mb-4">
            <div
              className="w-32 h-32 rounded-full border-4 border-[#f5f2f0] dark:border-[#3d2e21] flex items-center justify-center bg-[#f8f7f5] dark:bg-[#2d2218] bg-center bg-cover"
              style={{ backgroundImage: profileImage !== defaultImage ? `url("${profileImage}")` : 'none' }}
            >
              {profileImage === defaultImage && (
                <span className="material-symbols-outlined text-5xl text-[#8a7560] font-light">person</span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowImageMenu(!showImageMenu); }}
              className="absolute bottom-1 right-1 bg-primary text-white p-2 rounded-full shadow-lg z-10"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            {showImageMenu && (
              <div
                ref={menuRef}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white dark:bg-[#2d2116] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-[60] w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={(e) => { e.stopPropagation(); handleEditImage(); }} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#181411] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700">
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{profileImage === defaultImage ? t('profile.addPhoto') : t('profile.changePhoto')}</span>
                </button>
                {profileImage !== defaultImage && (
                  <>
                    <button onClick={(e) => { e.stopPropagation(); handleEditExistingImage(); }} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#181411] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700">
                      <span className="material-symbols-outlined text-sm">crop</span>
                      <span>{t('profile.editPhoto')}</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }} className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>{t('profile.deletePhoto')}</span>
                    </button>
                  </>
                )}
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </div>
          <div className="flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-2">
              {(() => {
                const firstName = userData.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Usuario';
                const limited = firstName.length > 10 ? firstName.substring(0, 10) : firstName;
                return t('profile.greeting').replace('Carlos', limited);
              })()}
            </h1>
            <span className="bg-[#fef3e7] dark:bg-primary/20 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{t('profile.memberSince')}</span>
          </div>
        </section>
      )}

      {/* Perfil del restaurante: accordion con formulario — solo para cuentas restaurante */}
      {accountType === 'restaurant' && (
        <div className="px-4 pb-4 space-y-3">
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
              {/* 1. Nombre */}
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">{t('profile.name')}</label>
                {editingField === 'name' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') playBackspaceSound(); else if (e.key.length === 1) playClickSound(); }}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90">
                        <span className="material-symbols-outlined text-sm">check</span>{t('common.save')}
                      </button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold">
                        <span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white">{accountType === 'restaurant' && restaurantName ? restaurantName : (userData.name || '-')}</span>
                    <button type="button" onClick={() => handleStartEdit('name')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
              {/* 2. Descripción */}
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Descripción</label>
                {editingField === 'description' ? (
                  <div className="space-y-2">
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary min-h-[100px] px-3 py-2"
                      placeholder="Describe tu restaurante..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start gap-2 w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white whitespace-pre-wrap flex-1">{restaurantForm.description || '-'}</span>
                    <button type="button" onClick={() => handleStartEdit('description')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
              {/* 3. Teléfono */}
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">{t('profile.phone')}</label>
                {editingField === 'phone' ? (
                  <div className="space-y-2">
                    <input
                      type="tel"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Backspace' || e.key === 'Delete') playBackspaceSound(); else if (e.key.length === 1) playClickSound(); }}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white">{userData.phone || '-'}</span>
                    <button type="button" onClick={() => handleStartEdit('phone')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editPhone')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
              {/* Resto de campos */}
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Dirección</label>
                {editingField === 'address' ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                      placeholder="Calle y número"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white">{restaurantForm.address || '-'}</span>
                    <button type="button" onClick={() => handleStartEdit('address')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Ciudad</label>
                  {editingField === 'city' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                      <span className="text-[#181411] dark:text-white truncate">{restaurantForm.city || '-'}</span>
                      <button type="button" onClick={() => handleStartEdit('city')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Estado</label>
                  {editingField === 'state' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                      <span className="text-[#181411] dark:text-white truncate">{restaurantForm.state || '-'}</span>
                      <button type="button" onClick={() => handleStartEdit('state')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">País</label>
                  {editingField === 'country' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                      <span className="text-[#181411] dark:text-white truncate">{restaurantForm.country || '-'}</span>
                      <button type="button" onClick={() => handleStartEdit('country')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Código Postal</label>
                  {editingField === 'postal_code' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                        maxLength={10}
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                        <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                      <span className="text-[#181411] dark:text-white">{restaurantForm.postal_code || '-'}</span>
                      <button type="button" onClick={() => handleStartEdit('postal_code')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">Sitio Web</label>
                {editingField === 'website' ? (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                      placeholder="https://..."
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white truncate">{restaurantForm.website || '-'}</span>
                    <button type="button" onClick={() => handleStartEdit('website')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
              {/* Email al final */}
              <div>
                <label className="block text-xs font-bold text-[#8a7560] mb-1 uppercase">{t('profile.email')}</label>
                {editingField === 'email' ? (
                  <div className="space-y-2">
                    <input
                      type="email"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary px-3 py-2"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"><span className="material-symbols-outlined text-sm">check</span>{t('common.save')}</button>
                      <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold"><span className="material-symbols-outlined text-sm">close</span>{t('common.cancel')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full rounded-lg border border-[#e6e0db] dark:border-[#3d2e21] bg-[#f8f7f5] dark:bg-[#221910] text-[#181411] dark:text-white text-sm px-3 py-2 min-h-[42px]">
                    <span className="text-[#181411] dark:text-white">{userData.email || '-'}</span>
                    <button type="button" onClick={() => handleStartEdit('email')} className="text-primary hover:text-primary/80 p-1 shrink-0" title={t('profile.editEmail')}><span className="material-symbols-outlined text-sm">edit</span></button>
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Información de Cuenta (Nombre, Correo, Teléfono): solo para cuentas que no son restaurante; en restaurante están en Datos del restaurante */}
      {accountType !== 'restaurant' && (
      <section className={`px-4 pt-4 ${userType === 'guest' ? 'opacity-50' : ''}`}>
        <h3 className={`text-[#181411] dark:text-white text-base font-bold mb-4 ${userType === 'guest' ? 'text-gray-400' : ''}`}>{t('profile.accountInfo')}</h3>
        {userType === 'guest' ? (
          <div className="py-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <span className="material-symbols-outlined text-4xl">person_off</span>
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm font-medium mb-2">Solo para usuarios registrados</p>
              <button 
                onClick={() => setGuestRestrictionModal({
                  show: true,
                  featureName: t('profile.accountInfo')
                })}
                className="text-primary text-sm font-medium hover:text-primary/80 transition-colors bg-transparent border-none shadow-none"
              >
                Registrarse para acceder
              </button>
          </div>
        ) : (
          <div className="space-y-4">
          {/* Nombre */}
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.name')}</p>
              {editingField === 'name' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        playBackspaceSound();
                      } else if (e.key.length === 1) {
                        playClickSound();
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.name || '-'}</p>
                  <button type="button" onClick={() => handleStartEdit('name')} className="text-primary hover:text-primary/80 p-1" title={t('profile.editName')}><span className="material-symbols-outlined text-sm">edit</span></button>
                </div>
              )}
            </div>
          </div>
          {/* Correo electrónico */}
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.email')}</p>
              {editingField === 'email' ? (
                <div className="space-y-2">
                  <input
                    type="email"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.email || '-'}</p>
                  <button type="button" onClick={() => handleStartEdit('email')} className="text-primary hover:text-primary/80 p-1" title={t('profile.editEmail')}><span className="material-symbols-outlined text-sm">edit</span></button>
                </div>
              )}
            </div>
          </div>
          {/* Número de teléfono */}
          <div className="flex items-center gap-4 p-2">
            <div className="bg-[#fef3e7] dark:bg-primary/20 p-3 rounded-lg text-primary shrink-0">
              <span className="material-symbols-outlined">call</span>
            </div>
            <div className="flex-1 border-b border-[#f5f2f0] dark:border-[#3d2e21] pb-2">
              <p className="text-xs text-[#8a7560] mb-0.5">{t('profile.phone')}</p>
              {editingField === 'phone' ? (
                <div className="space-y-2">
                  <input
                    type="tel"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' || e.key === 'Delete') {
                        playBackspaceSound();
                      } else if (e.key.length === 1) {
                        playClickSound();
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border-2 border-primary/50 bg-white dark:bg-gray-900 text-[#181411] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">check</span>
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-[#181411] dark:text-white">{userData.phone || '-'}</p>
                  <button type="button" onClick={() => handleStartEdit('phone')} className="text-primary hover:text-primary/80 p-1" title={t('profile.editPhone')}><span className="material-symbols-outlined text-sm">edit</span></button>
                </div>
              )}
            </div>
          </div>
          </div>
        )}
      </section>
      )}

      {/* Mis datos de facturación — solo para cuentas que no son restaurante */}
      {config.allowInvoice && accountType !== 'restaurant' && (
        <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
          <MenuItem 
            icon="receipt_long" 
            title={t('profile.billingData')} 
            subtitle={t('profile.billingDataSubtitle')} 
            disabled={userType === 'guest'}
            onClick={() => navigate('/billing-step-1')} 
            onRestrictedClick={() => setGuestRestrictionModal({
              show: true,
              featureName: t('profile.billingData')
            })}
          />
        </section>
      )}

      {/* Programa de Lealtad, Cupones, Contactos y Tarjetas: solo para cuentas comensal */}
      {accountType !== 'restaurant' && (
        <>
          <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
            <MenuItem 
              icon="stars" 
              title={t('loyalty.title')} 
              subtitle={t('loyalty.myLevelBenefits')} 
              disabled={userType === 'guest'}
              onClick={() => navigate('/loyalty')} 
              onRestrictedClick={() => setGuestRestrictionModal({
                show: true,
                featureName: t('loyalty.title')
              })}
            />
            <MenuItem 
              icon="confirmation_number" 
              title={t('coupons.title')} 
              subtitle={t('coupons.yourCoupons')} 
              disabled={userType === 'guest'}
              onClick={() => navigate('/coupons')} 
              onRestrictedClick={() => setGuestRestrictionModal({
                show: true,
                featureName: t('coupons.title')
              })}
            />
          </section>

          <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
            <MenuItem 
              icon="contacts" 
              title={t('contacts.title')} 
              subtitle={t('contacts.manageContacts')} 
              disabled={userType === 'guest'}
              onClick={() => navigate('/contacts')} 
              onRestrictedClick={() => setGuestRestrictionModal({
                show: true,
                featureName: t('contacts.title')
              })}
            />
          </section>

          <section className={`bg-white dark:bg-[#2d2116] mb-2 px-4 py-4 ${userType === 'guest' ? 'opacity-50' : ''}`}>
            <h3 className={`text-lg font-bold mb-4 ${userType === 'guest' ? 'text-gray-400 dark:text-gray-500' : ''}`}>{t('profile.myCards')}</h3>
            {userType === 'guest' ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-400 dark:text-gray-500 mb-2">
                    <span className="material-symbols-outlined text-4xl">credit_card_off</span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Solo para usuarios registrados</p>
                  <button 
                    onClick={() => setGuestRestrictionModal({
                      show: true,
                      featureName: t('profile.myCards')
                    })}
                    className="mt-2 text-primary text-sm font-medium hover:text-primary/80 transition-colors bg-transparent border-none shadow-none"
                  >
                    Registrarse para acceder
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex overflow-x-auto hide-scrollbar gap-4 pb-2 -mx-4 px-4">
                {cards.map((card) => (
                  <CreditCard
                    key={card.id}
                    {...card}
                    onDelete={() => setShowDeleteConfirm(card.id)}
                    onToggle={() => toggleCardStatus(card.id)}
                  />
                ))}
                <EmptyCard onClick={() => navigate('/add-card')} />
              </div>
            )}
          </section>
        </>
      )}

      <div className="px-4 mt-8">
        <button 
          onClick={async () => {
            if (userType === 'guest') {
              // Para usuarios invitados, navegar a registro
              playClickSound();
              navigate('/register');
            } else {
              // Para usuarios registrados, cerrar sesión
              try {
                // Limpiar carrito ANTES de cerrar sesión (necesita usuario autenticado)
                await clearCart();
                // Cerrar sesión
                await signOut();
                // Redirigir a la página de login/welcome
                navigate('/', { replace: true });
              } catch (error) {
                console.error('Error al cerrar sesión:', error);
                // Aún así intentar cerrar sesión y redirigir
                try {
                  await signOut();
                } catch (signOutError) {
                  console.error('Error al cerrar sesión después del error:', signOutError);
                }
                navigate('/', { replace: true });
              }
            }
          }}
          className={`w-full h-14 font-bold rounded-xl border active:scale-95 transition-all ${
            userType === 'guest'
              ? 'bg-primary text-white border-primary hover:bg-primary/90'
              : 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'
          }`}
        >
          {userType === 'guest' ? t('welcome.register') : t('profile.logout')}
        </button>
      </div>

      {/* Modal de restricción para usuarios invitados */}
      {guestRestrictionModal.show && (
        <GuestRestrictionModal
          featureName={guestRestrictionModal.featureName}
          onClose={() => setGuestRestrictionModal({ show: false, featureName: '' })}
        />
      )}

      {/* Modal de recorte de imagen */}
      {showCropModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#2d2116] rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-4">
              Recortar Foto de Perfil
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center text-sm mb-6">
              Ajusta la posición y el tamaño de tu foto
            </p>
            
            <div 
              ref={containerRef}
              className="relative w-full aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-4"
            >
              <div
                className="relative w-full h-full"
                style={{ userSelect: 'none', cursor: isDragging ? 'grabbing' : 'default' }}
              >
                <img
                  ref={imageRef}
                  src={imageToCrop}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-contain"
                  onLoad={(e) => {
                    const img = e.target as HTMLImageElement;
                    if (!containerRef.current) return;
                    
                    const containerRect = containerRef.current.getBoundingClientRect();
                    const imgAspect = img.naturalWidth / img.naturalHeight;
                    const containerAspect = containerRect.width / containerRect.height;
                    
                    let imgDisplayWidth: number;
                    let imgDisplayHeight: number;
                    
                    if (imgAspect > containerAspect) {
                      imgDisplayWidth = containerRect.width;
                      imgDisplayHeight = containerRect.width / imgAspect;
                    } else {
                      imgDisplayHeight = containerRect.height;
                      imgDisplayWidth = containerRect.height * imgAspect;
                    }
                    
                    const scaleX = img.naturalWidth / imgDisplayWidth;
                    const scaleY = img.naturalHeight / imgDisplayHeight;
                    
                    // Tamaño inicial del recorte (80% del tamaño más pequeño)
                    const initialSize = Math.min(img.naturalWidth, img.naturalHeight) * 0.8;
                    
                    setCropData({ 
                      x: (img.naturalWidth - initialSize) / 2, 
                      y: (img.naturalHeight - initialSize) / 2, 
                      size: initialSize 
                    });
                  }}
                />
                
                {/* Overlay oscuro - usando múltiples divs para mejor compatibilidad */}
                {(() => {
                  const bounds = getImageBounds();
                  if (!bounds) return null;
                  
                  const cropX = bounds.x + (cropData.x / bounds.scaleX);
                  const cropY = bounds.y + (cropData.y / bounds.scaleY);
                  const cropSize = cropData.size / bounds.scaleX;
                  
                  return (
                    <>
                      {/* Top overlay */}
                      <div 
                        className="absolute top-0 left-0 right-0 bg-black/50 pointer-events-none"
                        style={{ height: `${cropY}px` }}
                      ></div>
                      {/* Bottom overlay */}
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-black/50 pointer-events-none"
                        style={{ height: `${bounds.height - cropY - cropSize}px` }}
                      ></div>
                      {/* Left overlay */}
                      <div 
                        className="absolute left-0 bg-black/50 pointer-events-none"
                        style={{ 
                          top: `${cropY}px`,
                          bottom: `${bounds.height - cropY - cropSize}px`,
                          width: `${cropX}px`
                        }}
                      ></div>
                      {/* Right overlay */}
                      <div 
                        className="absolute right-0 bg-black/50 pointer-events-none"
                        style={{ 
                          top: `${cropY}px`,
                          bottom: `${bounds.height - cropY - cropSize}px`,
                          width: `${bounds.width - cropX - cropSize}px`
                        }}
                      ></div>
                    </>
                  );
                })()}
                
                {/* Marco de recorte */}
                {(() => {
                  const bounds = getImageBounds();
                  if (!bounds) return null;
                  
                  const cropX = bounds.x + (cropData.x / bounds.scaleX);
                  const cropY = bounds.y + (cropData.y / bounds.scaleY);
                  const cropSize = cropData.size / bounds.scaleX;
                  
                  return (
                    <div 
                      className="absolute border-2 border-white shadow-lg z-10"
                      style={{
                        left: `${cropX}px`,
                        top: `${cropY}px`,
                        width: `${cropSize}px`,
                        height: `${cropSize}px`,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        pointerEvents: 'auto'
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleCropStart(e as any);
                      }}
                    >
                      {/* Esquinas de recorte */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-white pointer-events-none"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-white pointer-events-none"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-white pointer-events-none"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-white pointer-events-none"></div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Controles de zoom */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => handleZoom(-20)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">remove</span>
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Zoom</span>
              <button
                onClick={() => handleZoom(20)}
                className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">add</span>
              </button>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-3">
              <button
                onClick={handleCropCancel}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors active:scale-95"
              >
                Confirmar
              </button>
            </div>
            
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-3xl">warning</span>
            </div>
            <h3 className="text-xl font-bold text-center text-[#181411] dark:text-white mb-2">
              {t('profile.deleteCardConfirm')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-center text-sm mb-6">
              {t('profile.deleteCardWarning')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={async () => {
                  if (!user?.id || !isSupabaseConfigured()) {
                    // Fallback: solo actualizar estado local
                    setCards(cards.filter(card => card.id !== showDeleteConfirm));
                    setShowDeleteConfirm(null);
                    return;
                  }

                  try {
                    const { deletePaymentMethod } = await import('../services/database');
                    const deleted = await deletePaymentMethod(showDeleteConfirm, user.id);
                    
                    if (deleted) {
                      setCards(cards.filter(card => card.id !== showDeleteConfirm));
                    } else {
                      alert('Error al eliminar la tarjeta. Por favor, intenta de nuevo.');
                    }
                  } catch (error) {
                    console.error('[ProfileScreen] Error deleting card:', error);
                    alert('Error al eliminar la tarjeta. Por favor, intenta de nuevo.');
                  }
                  
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors active:scale-95"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{ 
  icon: string; 
  title: string; 
  subtitle: string; 
  onClick?: () => void; 
  disabled?: boolean;
  onRestrictedClick?: () => void;
}> = ({ icon, title, subtitle, onClick, disabled = false, onRestrictedClick }) => (
  <div 
    onClick={() => {
      if (disabled) {
        onRestrictedClick?.();
        return;
      }
      playClickSound();
      onClick?.();
    }} 
    className={`flex items-center gap-4 py-3 justify-between border-b border-gray-50 dark:border-gray-800 last:border-0 ${
      disabled 
        ? 'opacity-50 cursor-not-allowed' 
        : 'hover:bg-gray-50 dark:hover:bg-primary/5 cursor-pointer'
    }`}
  >
    <div className="flex items-center gap-4">
      <div className={`flex items-center justify-center rounded-lg size-12 ${
        disabled 
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500' 
          : 'text-primary bg-primary/10'
      }`}>
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className={`font-semibold ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}`}>{title}</p>
        <p className="text-[#8a7560] dark:text-[#c0a890] text-sm">{subtitle}</p>
        {disabled && (
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-1">
            Solo para usuarios registrados
          </p>
        )}
      </div>
    </div>
    <span className={`material-symbols-outlined ${disabled ? 'text-gray-400' : 'text-[#8a7560]'}`}>chevron_right</span>
  </div>
);

const CreditCard: React.FC<{ 
  color: string; 
  textColor: string; 
  number: string; 
  exp: string; 
  name: string; 
  brand: string; 
  isMastercard?: boolean;
  isDisabled?: boolean;
  onDelete: () => void;
  onToggle: () => void;
}> = ({ color, textColor, number, exp, name, brand, isMastercard, isDisabled, onDelete, onToggle }) => {
  const { t } = useTranslation();
  
  return (
  <div className={`min-w-[280px] aspect-[1.6/1] rounded-xl flex flex-col justify-between p-6 bg-gradient-to-br ${color} ${textColor} relative shadow-sm group ${isDisabled ? 'opacity-60' : ''}`}>
    {/* Overlay de deshabilitado */}
    {isDisabled && (
      <div className="absolute inset-0 bg-black/20 rounded-xl flex items-center justify-center z-20 pointer-events-none">
        <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg px-3 py-1.5 flex items-center gap-2 pointer-events-auto">
          <span className="material-symbols-outlined text-sm text-gray-600 dark:text-gray-300">block</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase">{t('profile.disabled')}</span>
        </div>
      </div>
    )}

    {/* Botón de eliminar */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onDelete();
      }}
      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-80 hover:opacity-100 group-hover:opacity-100 transition-opacity hover:bg-white/40 dark:hover:bg-black/40 active:scale-95 z-30"
      title={t('profile.deleteCard')}
    >
      <span className="material-symbols-outlined text-sm">delete</span>
    </button>

    {/* Toggle de habilitar/deshabilitar */}
    <div className="absolute bottom-3 right-3 z-30">
      <label className="relative inline-flex items-center cursor-pointer" title={isDisabled ? t('profile.enableCard') : t('profile.disableCard')}>
        <input
          type="checkbox"
          checked={!isDisabled}
          onChange={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${
          isDisabled 
            ? 'bg-gray-400/50 dark:bg-gray-600/50' 
            : 'bg-white/50 dark:bg-black/50'
        }`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-md ${
            isDisabled ? '' : 'translate-x-5'
          }`}></div>
        </div>
      </label>
    </div>

    <div className="flex justify-between items-start">
      <span className="material-symbols-outlined text-3xl">contactless</span>
      {isMastercard ? (
        <div className="flex -space-x-2">
          <div className="w-6 h-6 rounded-full bg-red-500/80"></div>
          <div className="w-6 h-6 rounded-full bg-yellow-500/80"></div>
        </div>
      ) : <span className="font-bold italic text-lg">{brand}</span>}
    </div>
    <div>
      <p className="text-lg font-mono tracking-widest">{number}</p>
      <div className="flex gap-4 mt-2">
        <div>
          <p className="text-[10px] uppercase opacity-70">{t('profile.expires')}</p>
          <p className="text-sm font-medium">{exp}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase opacity-70">{t('profile.cardholder')}</p>
          <p className="text-sm font-medium">{name}</p>
        </div>
      </div>
    </div>
  </div>
  );
};

const EmptyCard: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useTranslation();
  
  return (
    <div
      onClick={onClick}
      className="min-w-[280px] aspect-[1.6/1] rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all active:scale-95"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-3xl">add</span>
        </div>
        <p className="text-primary font-semibold text-sm">{t('profile.addCard')}</p>
      </div>
    </div>
  );
};

const PaymentHistoryItem: React.FC<{ restaurantName: string; date: string; amount: string; logo: string; cardLast4: string }> = ({ restaurantName, date, amount, logo, cardLast4 }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
        <img 
          src={logo} 
          alt={restaurantName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            if (target.parentElement) {
              target.parentElement.innerHTML = '<span class="material-symbols-outlined text-primary text-lg">restaurant</span>';
            }
          }}
        />
      </div>
      <div>
        <p className="font-semibold text-sm text-[#181411] dark:text-white">{restaurantName}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{date}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">**** **** **** {cardLast4}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="font-bold text-sm text-[#181411] dark:text-white">{amount}</p>
    </div>
  </div>
);

export default ProfileScreen;
