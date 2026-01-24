
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useRestaurant } from '../contexts/RestaurantContext';

interface Card {
  id: number;
  color: string;
  textColor: string;
  number: string;
  exp: string;
  name: string;
  brand: string;
  isMastercard?: boolean;
  isDisabled?: boolean;
}

const ProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { config } = useRestaurant();
  const { signOut } = useAuth();
  const [cards, setCards] = useState<Card[]>([
    {
      id: 1,
      color: 'from-[#e0f2fe] to-[#bae6fd]',
      textColor: 'text-[#0369a1]',
      number: '**** **** **** 4242',
      exp: '12/26',
      name: 'ALEX GONZALEZ',
      brand: 'VISA',
      isDisabled: false,
    },
    {
      id: 2,
      color: 'from-[#ffedd5] to-[#fed7aa]',
      textColor: 'text-[#9a3412]',
      number: '**** **** **** 8888',
      exp: '09/25',
      name: 'ALEX GONZALEZ',
      brand: 'Mastercard',
      isMastercard: true,
      isDisabled: false,
    },
  ]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [userData, setUserData] = useState({
    name: 'Carlos González',
    email: 'carlos.gonzalez@email.com',
    phone: '+52 55 1234 5678',
  });
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');
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

  // Cargar imagen desde localStorage al iniciar
  useEffect(() => {
    const savedImage = localStorage.getItem('profileImage');
    if (savedImage) {
      setProfileImage(savedImage);
    }
  }, []);

  // Guardar imagen en localStorage cuando cambia
  useEffect(() => {
    if (profileImage && profileImage !== defaultImage) {
      localStorage.setItem('profileImage', profileImage);
    }
  }, [profileImage]);

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

  const toggleCardStatus = (cardId: number) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, isDisabled: !card.isDisabled } : card
    ));
  };

  const handleStartEdit = (field: 'name' | 'email' | 'phone') => {
    setEditingField(field);
    setEditValue(userData[field]);
  };

  const handleSaveEdit = () => {
    if (editingField) {
      setUserData({ ...userData, [editingField]: editValue });
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
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

  const handleDeleteImage = () => {
    setProfileImage(defaultImage);
    localStorage.removeItem('profileImage');
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


  return (
    <div className="pb-32">
      <header className="flex items-center bg-white dark:bg-[#2d2116] p-4 pb-2 justify-between sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 safe-top">
        <button onClick={() => navigate(-1)} className="size-10 rounded-full bg-[#F5F0E8] dark:bg-[#3d3321] flex items-center justify-center hover:bg-[#E8E0D0] dark:hover:bg-[#4a3f2d] transition-colors shadow-sm">
          <span className="material-symbols-outlined cursor-pointer text-[#8a7560] dark:text-[#d4c4a8]">arrow_back_ios</span>
        </button>
        <h2 className="text-lg font-bold flex-1 text-center">{t('profile.title')}</h2>
        <div className="w-12 flex items-center justify-end">
          <span className="material-symbols-outlined cursor-pointer" onClick={() => navigate('/settings')}>settings</span>
        </div>
      </header>

      <section className="flex p-6 bg-white dark:bg-[#2d2116] mb-2 shadow-sm">
        <div className="flex w-full flex-col gap-4 items-center">
          <div className="relative">
            <div className="aspect-square rounded-full min-h-32 w-32 border-4 border-primary/20 bg-center bg-cover"
                 style={{ backgroundImage: profileImage !== defaultImage ? `url("${profileImage}")` : 'none', backgroundColor: profileImage === defaultImage ? '#f3f4f6' : 'transparent' }}>
              {profileImage === defaultImage && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                </div>
              )}
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowImageMenu(!showImageMenu);
              }}
              className="absolute bottom-1 right-1 bg-primary text-white p-1 rounded-full border-2 border-white cursor-pointer hover:bg-primary/90 transition-colors active:scale-95 z-10"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            
            {/* Menú desplegable */}
            {showImageMenu && (
              <div 
                ref={menuRef}
                className="absolute left-full top-1/2 -translate-y-1/2 ml-3 bg-white dark:bg-[#2d2116] rounded-md shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-[60] w-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Agregar/Cambiar foto - siempre visible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditImage();
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#181411] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700"
                >
                  <span className="material-symbols-outlined text-sm">photo_camera</span>
                  <span>{profileImage === defaultImage ? t('profile.addPhoto') : t('profile.changePhoto')}</span>
                </button>
                
                {/* Editar foto y Eliminar foto - solo cuando hay imagen personalizada */}
                {profileImage !== defaultImage && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditExistingImage();
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-[#181411] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 border-b border-gray-100 dark:border-gray-700"
                    >
                      <span className="material-symbols-outlined text-sm">crop</span>
                      <span>{t('profile.editPhoto')}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage();
                      }}
                      className="w-full px-2.5 py-1.5 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>{t('profile.deletePhoto')}</span>
                    </button>
                  </>
                )}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[24px] font-bold">{t('profile.greeting')}</p>
            <p className="text-[#8a7560] dark:text-[#c0a890] mt-1 text-center">{t('profile.greetingMessage')}</p>
            <div className="mt-2 px-3 py-1 bg-primary/10 rounded-full">
              <p className="text-primary text-xs font-semibold uppercase">{t('profile.memberSince')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <h3 className="text-lg font-bold py-4">{t('profile.accountInfo')}</h3>
        <div className="py-4 space-y-4">
          {/* Nombre */}
          <div className="flex items-start gap-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">{t('profile.name')}</p>
              {editingField === 'name' ? (
                <div className="space-y-2">
                  <input
                    type="text"
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
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.name}</p>
                  <button
                    onClick={() => handleStartEdit('name')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title={t('profile.editName')}
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Correo electrónico */}
          <div className="flex items-start gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">mail</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">{t('profile.email')}</p>
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
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.email}</p>
                  <button
                    onClick={() => handleStartEdit('email')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title={t('profile.editEmail')}
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Número de teléfono */}
          <div className="flex items-start gap-4 border-t border-gray-50 dark:border-gray-800 pt-4">
            <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12 shrink-0">
              <span className="material-symbols-outlined">phone</span>
            </div>
            <div className="flex-1">
              <p className="text-[#8a7560] dark:text-[#c0a890] text-xs font-medium mb-1">{t('profile.phone')}</p>
              {editingField === 'phone' ? (
                <div className="space-y-2">
                  <input
                    type="tel"
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
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-[#181411] dark:text-white">{userData.phone}</p>
                  <button
                    onClick={() => handleStartEdit('phone')}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title={t('profile.editPhone')}
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Mis datos de facturación */}
      {config.allowInvoice && (
        <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
          <MenuItem icon="receipt_long" title={t('profile.billingData')} subtitle={t('profile.billingDataSubtitle')} onClick={() => navigate('/billing-step-1')} />
        </section>
      )}

      {/* Programa de Lealtad */}
      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <MenuItem 
          icon="stars" 
          title={t('loyalty.title')} 
          subtitle={t('loyalty.myLevelBenefits')} 
          onClick={() => navigate('/loyalty')} 
        />
        <MenuItem 
          icon="confirmation_number" 
          title={t('coupons.title')} 
          subtitle={t('coupons.yourCoupons')} 
          onClick={() => navigate('/coupons')} 
        />
      </section>

      {/* Contactos */}
      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <MenuItem 
          icon="contacts" 
          title={t('contacts.title')} 
          subtitle={t('contacts.manageContacts')} 
          onClick={() => navigate('/contacts')} 
        />
      </section>

      {/* Tarjetas de Crédito */}
      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4 py-4">
        <h3 className="text-lg font-bold mb-4">{t('profile.myCards')}</h3>
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
      </section>

      <section className="bg-white dark:bg-[#2d2116] mb-2 px-4">
        <h3 className="text-lg font-bold py-4">{t('profile.myActivity')}</h3>
        <MenuItem icon="favorite" title={t('profile.favorites')} subtitle={t('profile.favoritesSubtitle')} onClick={() => navigate('/favorites')} />
        <MenuItem icon="history" title={t('profile.orderHistory')} subtitle={t('profile.orderHistorySubtitle')} onClick={() => navigate('/order-history')} />
        <MenuItem icon="payments" title={t('profile.transactions')} subtitle={t('profile.transactionsSubtitle')} onClick={() => navigate('/transactions')} />
      </section>

      <div className="px-4 mt-8">
        <button 
          onClick={async () => {
            await signOut();
            navigate('/');
          }}
          className="w-full h-14 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900/30 active:scale-95 transition-all"
        >
          {t('profile.logout')}
        </button>
      </div>

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
                onClick={() => {
                  setCards(cards.filter(card => card.id !== showDeleteConfirm));
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

const MenuItem: React.FC<{ icon: string; title: string; subtitle: string; onClick?: () => void }> = ({ icon, title, subtitle, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-primary/5 cursor-pointer border-b border-gray-50 dark:border-gray-800 last:border-0">
    <div className="flex items-center gap-4">
      <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 size-12">
        <span className="material-symbols-outlined">{icon}</span>
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-[#8a7560] dark:text-[#c0a890] text-sm">{subtitle}</p>
      </div>
    </div>
    <span className="material-symbols-outlined text-[#8a7560]">chevron_right</span>
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
