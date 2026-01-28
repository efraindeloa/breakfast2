import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRestaurant } from '../contexts/RestaurantContext';

const RestaurantDetailsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { restaurant } = useRestaurant();

  // Estado para controlar si está abierto
  const [isOpen, setIsOpen] = useState(true);
  const [currentDay, setCurrentDay] = useState('Martes');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(0); // 0=Lunes, 1=Martes, etc.
  const [isDayOpen, setIsDayOpen] = useState(true);
  const [startHour, setStartHour] = useState('07');
  const [startMinute, setStartMinute] = useState('30');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('11');
  const [endMinute, setEndMinute] = useState('00');
  const [endPeriod, setEndPeriod] = useState('AM');
  const [editingTime, setEditingTime] = useState<'start' | 'end'>('start');
  
  // Refs para los contenedores de scroll
  const hourScrollRef = React.useRef<HTMLDivElement>(null);
  const minuteScrollRef = React.useRef<HTMLDivElement>(null);
  const periodScrollRef = React.useRef<HTMLDivElement>(null);
  
  // Datos de ejemplo - DEBEN estar antes de los estados que los usan
  const restaurantName = restaurant?.nombre_comercial || 'Café de la Mañana';
  const coverImage = restaurant?.imagen || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt3fWtlAY6oQ-DKr3GM4BHi2wY4U5FJuPppLLqPMew1W3SGoqp4jzyKrhxivlLoGgiv48Fd79Wf7LrkkWlBETprzOHQWn29-gjWzOHad36MNQU4Fb1HTi9bTpjIB37rYIc4RAIg4FDfHAg-jrDF2tmkX-bSFvHlMLvmHLyosYrV351pEMTnF8o7W4JOeSWrNcd8rIiyLY8a-CRC3IhssEBVvYKCtEyazZRthwuCbZyXo0Bj5LDhFKtlDd-X5IidlvsZu4OZ-mf4fRY';
  const cuisine = restaurant?.tipo_cocina || 'Artesanal • Saludable • Local';
  const rating = '4.9';
  const reviews = '120+';
  const address = restaurant?.direccion_completa || 'Av. Reforma 450, Juárez, CDMX';
  const phone = restaurant?.telefono || '+52 55 1234 5678';
  const website = restaurant?.sitio_web || 'www.cafedelamanana.com';
  
  // Estado para edición de dirección
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  
  // Estados para modales de contacto
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [websiteInput, setWebsiteInput] = useState(website);
  const [whatsappInput, setWhatsappInput] = useState(phone);
  
  // Estados de configuración (si los datos están configurados)
  const [isPhoneConfigured, setIsPhoneConfigured] = useState(!!restaurant?.telefono);
  const [isWebsiteConfigured, setIsWebsiteConfigured] = useState(!!restaurant?.sitio_web);
  const [isWhatsappConfigured, setIsWhatsappConfigured] = useState(false); // TODO: agregar campo whatsapp en BD

  // Horarios con estado editable
  const [schedule, setSchedule] = useState([
    { day: 'Lunes', hours: '07:00 AM - 12:00 PM', closed: false },
    { day: 'Martes', hours: '07:00 AM - 12:00 PM', closed: false },
    { day: 'Miércoles', hours: '07:00 AM - 12:00 PM', closed: false },
    { day: 'Jueves', hours: '07:00 AM - 12:00 PM', closed: false },
    { day: 'Viernes', hours: '07:00 AM - 01:00 PM', closed: false },
    { day: 'Sábado', hours: '08:00 AM - 02:00 PM', closed: false },
    { day: 'Domingo', hours: '08:00 AM - 02:00 PM', closed: true },
  ]);

  useEffect(() => {
    // Determinar el día actual
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date().getDay();
    setCurrentDay(days[today]);
  }, []);

  const handleEditAddress = () => {
    setAddressInput(address);
    setIsEditingAddress(true);
  };

  const handleSaveAddress = async () => {
    if (!addressInput.trim()) {
      alert('Por favor ingresa una dirección');
      return;
    }

    // Aquí se integraría con Google Places API para buscar y validar la dirección
    // Por ahora, simulamos la búsqueda
    try {
      // TODO: Integrar con Google Places API
      // const geocoder = new google.maps.Geocoder();
      // const result = await geocoder.geocode({ address: addressInput });
      
      // Simulación de guardado
      console.log('Buscando dirección:', addressInput);
      
      // Aquí se guardaría en la base de datos
      // await updateRestaurant(restaurantId, { 
      //   direccion_completa: addressInput,
      //   latitud: result.lat,
      //   longitud: result.lng
      // });
      
      alert(`Dirección actualizada: ${addressInput}`);
      setIsEditingAddress(false);
    } catch (error) {
      console.error('Error al buscar dirección:', error);
      alert('No se pudo encontrar la dirección. Por favor verifica e intenta de nuevo.');
    }
  };

  const handleSavePhone = () => {
    if (!phoneInput.trim()) {
      alert('Por favor ingresa un número de teléfono');
      return;
    }
    // TODO: Guardar en base de datos
    console.log('Guardando teléfono:', phoneInput);
    setIsPhoneConfigured(true);
    alert(`Teléfono actualizado: ${phoneInput}`);
    setShowPhoneModal(false);
  };

  const handleSaveWebsite = () => {
    if (!websiteInput.trim()) {
      alert('Por favor ingresa una URL');
      return;
    }
    // Validación básica de URL
    if (!websiteInput.startsWith('http://') && !websiteInput.startsWith('https://')) {
      alert('La URL debe comenzar con http:// o https://');
      return;
    }
    // TODO: Guardar en base de datos
    console.log('Guardando sitio web:', websiteInput);
    setIsWebsiteConfigured(true);
    alert(`Sitio web actualizado: ${websiteInput}`);
    setShowWebModal(false);
  };

  const handleSaveWhatsApp = () => {
    if (!whatsappInput.trim()) {
      alert('Por favor ingresa un número de WhatsApp');
      return;
    }
    // TODO: Guardar en base de datos
    console.log('Guardando WhatsApp:', whatsappInput);
    setIsWhatsappConfigured(true);
    alert(`WhatsApp actualizado: ${whatsappInput}`);
    setShowWhatsAppModal(false);
  };


  const handleOpenScheduleModal = () => {
    setShowScheduleModal(true);
  };

  // Guardar automáticamente cuando cambian los valores
  useEffect(() => {
    if (showScheduleModal) {
      const newHours = isDayOpen 
        ? `${startHour}:${startMinute} ${startPeriod} - ${endHour}:${endMinute} ${endPeriod}`
        : 'Cerrado';
      
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
      const dayName = dayNames[selectedDay];
      
      setSchedule(
        schedule.map((item) =>
          item.day === dayName 
            ? { ...item, hours: newHours, closed: !isDayOpen } 
            : item
        )
      );
    }
  }, [startHour, startMinute, startPeriod, endHour, endMinute, endPeriod, isDayOpen, selectedDay, showScheduleModal]);

  const handleSelectDay = (dayIndex: number) => {
    setSelectedDay(dayIndex);
    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayName = dayNames[dayIndex];
    const daySchedule = schedule.find(s => s.day === dayName);
    
    if (daySchedule) {
      setIsDayOpen(!daySchedule.closed);
      if (!daySchedule.closed && daySchedule.hours) {
        // Parse existing hours
        const parts = daySchedule.hours.split(' - ');
        if (parts.length === 2) {
          const [start, end] = parts;
          const [startTime, startP] = start.split(' ');
          const [endTime, endP] = end.split(' ');
          const [sH, sM] = startTime.split(':');
          const [eH, eM] = endTime.split(':');
          
          setStartHour(sH);
          setStartMinute(sM);
          setStartPeriod(startP);
          setEndHour(eH);
          setEndMinute(eM);
          setEndPeriod(endP);
        }
      }
    }
  };

  // Detectar el elemento centrado en el scroll
  const handleScroll = (
    container: HTMLDivElement,
    items: string[],
    setValue: (value: string) => void
  ) => {
    const containerRect = container.getBoundingClientRect();
    const containerCenter = containerRect.top + containerRect.height / 2;
    
    const buttons = container.querySelectorAll('button');
    let closestButton: HTMLButtonElement | null = null;
    let closestDistance = Infinity;
    
    buttons.forEach((button) => {
      const buttonRect = button.getBoundingClientRect();
      const buttonCenter = buttonRect.top + buttonRect.height / 2;
      const distance = Math.abs(containerCenter - buttonCenter);
      
      if (distance < closestDistance) {
        closestDistance = distance;
        closestButton = button;
      }
    });
    
    if (closestButton) {
      const value = closestButton.textContent?.trim() || '';
      if (items.includes(value)) {
        setValue(value);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#181411] dark:text-white">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-[#f5f2f0] dark:border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="text-[#181411] dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
          Detalles y Contacto
        </h2>
        <div className="flex size-10 items-center justify-end">
          {/* Espacio reservado para mantener el centrado del título */}
        </div>
      </div>

      <main className="max-w-[480px] mx-auto pb-24">
        {/* Hero Header */}
        <div className="p-4">
          <div
            className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[240px] shadow-sm relative group"
            style={{
              backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 50%), url("${coverImage}")`,
            }}
          >
            <div className="flex flex-col p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Desayuno
                </span>
                <div className="flex items-center bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5 text-white text-xs">
                  <span className="material-symbols-outlined !text-xs text-yellow-400 mr-1">star</span>
                  {rating} ({reviews})
                </div>
              </div>
              <p className="text-white text-[28px] font-extrabold leading-tight">{restaurantName}</p>
              <p className="text-white/80 text-sm font-medium">{cuisine}</p>
            </div>
          </div>
        </div>

        {/* Action Quick Links */}
        <div className="flex gap-3 px-4 mb-6">
          <button 
            onClick={() => {
              setPhoneInput(phone);
              setShowPhoneModal(true);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm hover:border-primary transition-colors relative"
          >
            {isPhoneConfigured ? (
              <span className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">check</span>
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">priority_high</span>
              </span>
            )}
            <span className="material-symbols-outlined text-primary">call</span>
            <span className="text-xs font-semibold">Llamar</span>
          </button>
          <button 
            onClick={() => {
              setWebsiteInput(website);
              setShowWebModal(true);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm hover:border-primary transition-colors relative"
          >
            {isWebsiteConfigured ? (
              <span className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">check</span>
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">priority_high</span>
              </span>
            )}
            <span className="material-symbols-outlined text-primary">language</span>
            <span className="text-xs font-semibold">Web</span>
          </button>
          <button 
            onClick={() => {
              setWhatsappInput(phone);
              setShowWhatsAppModal(true);
            }}
            className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm hover:border-primary transition-colors relative"
          >
            {isWhatsappConfigured ? (
              <span className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">check</span>
              </span>
            ) : (
              <span className="absolute top-1 right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-white !text-xs">priority_high</span>
              </span>
            )}
            <span className="material-symbols-outlined text-primary">chat_bubble</span>
            <span className="text-xs font-semibold">WhatsApp</span>
          </button>
        </div>

        {/* Location Section */}
        <div className="px-4 mb-8">
          <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">location_on</span>
            Ubicación
          </h3>
          <div className="rounded-xl overflow-hidden border border-[#f5f2f0] dark:border-white/5 shadow-sm bg-white dark:bg-white/5">
            <div
              className="w-full aspect-video bg-cover bg-center"
              style={{
                backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBh2jQUhuOdFP4aRK3dPi8KEp2F7Um8Zuc_lqiOoQPXe-o0n1m8LeSSoyY_E-rELIsUFi0yyspVpo3QsjBvBmkz-ppgsmSOggBLrwY7uvAejFtYZuoxCI4uYLIZJu9I1O3WZtzWV_ALfD1ilKsMoJUjO_MFgG0Tdb8ot4MdlZRftwxToN_yyExclOc-PYqhb2WtK37iOe8gWxHFu5WwsHYI-aySyOIzw-qBRZwIne9V0AxfdMgbHG8O1_Sl-2ukudjPXjNUUrhJY_9h")',
              }}
            />
            <div className="flex items-center gap-4 px-4 min-h-[72px] py-3 justify-between">
              {isEditingAddress ? (
                <div className="flex-1 flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-[#181411] dark:text-white text-xs font-semibold mb-1 uppercase">
                      Nueva Dirección
                    </p>
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveAddress();
                        if (e.key === 'Escape') setIsEditingAddress(false);
                      }}
                      placeholder="Ej: Av. Reforma 450, Juárez, CDMX"
                      className="w-full px-3 py-2 text-sm border border-primary rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleSaveAddress}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
                    title="Guardar dirección"
                  >
                    <span className="material-symbols-outlined">check</span>
                  </button>
                  <button
                    onClick={() => setIsEditingAddress(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    title="Cancelar"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col justify-center max-w-[70%]">
                    <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight line-clamp-1">
                      Dirección Completa
                    </p>
                    <p className="text-[#8a7560] dark:text-white/60 text-sm font-normal leading-normal">{address}</p>
                  </div>
                  <div className="shrink-0">
                    <button
                      onClick={handleEditAddress}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10 dark:bg-primary/20 text-primary transition-all hover:bg-primary hover:text-white"
                      title="Editar dirección"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Operating Hours Section */}
        <div className="px-4 mb-8">
          <div className="flex items-center justify-between pb-3">
            <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              Horarios de Apertura
            </h3>
            {isOpen && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold rounded uppercase">
                Abierto Ahora
              </span>
            )}
          </div>
          <div className="bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 overflow-hidden">
            {schedule.map((item, index) => (
              <div
                key={index}
                className={`flex justify-between items-center px-4 py-3 ${
                  item.day === currentDay
                    ? 'bg-primary/5 border-b border-[#f5f2f0] dark:border-white/5'
                    : index < schedule.length - 1
                    ? 'border-b border-[#f5f2f0] dark:border-white/5'
                    : ''
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    item.day === currentDay
                      ? 'font-bold text-primary'
                      : item.closed
                      ? 'text-[#dc2626] font-bold'
                      : 'text-[#8a7560] dark:text-white/60'
                  }`}
                >
                  {item.day} {item.day === currentDay && '(Hoy)'}
                </span>
                <span
                  className={`text-sm ${
                    item.day === currentDay
                      ? 'font-bold text-primary'
                      : item.closed
                      ? 'text-[#dc2626] font-bold'
                      : 'font-semibold'
                  }`}
                >
                  {item.closed ? 'Cerrado' : item.hours}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleOpenScheduleModal}
            className="w-full mt-3 py-3 text-primary font-bold text-sm border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
          >
            Configurar Horarios
          </button>
        </div>

        {/* Services & Amenities */}
        <div className="px-4 mb-8">
          <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">restaurant</span>
            Servicios Disponibles
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5">
              <div className="text-primary size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">event_available</span>
              </div>
              <span className="text-xs font-bold">Reserva Online</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5">
              <div className="text-primary size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">delivery_dining</span>
              </div>
              <span className="text-xs font-bold">Domicilio</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5">
              <div className="text-primary size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">credit_card</span>
              </div>
              <span className="text-xs font-bold">Pago Digital</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5">
              <div className="text-primary size-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined !text-lg">wifi</span>
              </div>
              <span className="text-xs font-bold">WiFi Gratis</span>
            </div>
          </div>
        </div>

        {/* Social Media Direct Links */}
        <div className="px-4 mb-8">
          <h3 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] pb-3">
            Síguenos
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-1">
            <button className="flex items-center gap-3 px-5 py-3 bg-[#E4405F]/10 dark:bg-[#E4405F]/20 text-[#E4405F] rounded-xl font-bold whitespace-nowrap border border-[#E4405F]/20">
              <span className="material-symbols-outlined !text-xl">camera_alt</span>
              Instagram
            </button>
            <button className="flex items-center gap-3 px-5 py-3 bg-[#25D366]/10 dark:bg-[#25D366]/20 text-[#25D366] rounded-xl font-bold whitespace-nowrap border border-[#25D366]/20">
              <span className="material-symbols-outlined !text-xl">chat</span>
              WhatsApp Directo
            </button>
          </div>
        </div>

        {/* Policies Section */}
        <div className="px-4">
          <div className="bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 p-4">
            <h3 className="text-[#181411] dark:text-white text-base font-bold pb-2 flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400 !text-xl">info</span>
              Políticas de Servicio
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#8a7560] dark:text-white/40 uppercase tracking-wider mb-1">
                  Cancelación
                </p>
                <p className="text-sm text-[#181411] dark:text-white/80 leading-relaxed">
                  Puedes cancelar tu reserva sin costo hasta <span className="font-bold">2 horas antes</span> de la
                  cita. Las cancelaciones tardías pueden incurrir en un cargo del 20%.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-[#8a7560] dark:text-white/40 uppercase tracking-wider mb-1">
                  Reembolsos
                </p>
                <p className="text-sm text-[#181411] dark:text-white/80 leading-relaxed">
                  Los reembolsos por pedidos incorrectos se procesarán en un plazo de 3 a 5 días hábiles a través del
                  mismo método de pago.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Phone Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-[#181411] dark:text-white mb-2">Número de Teléfono</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ingresa el número de teléfono principal del restaurante
            </p>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePhone();
                if (e.key === 'Escape') setShowPhoneModal(false);
              }}
              placeholder="+52 55 1234 5678"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhoneModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhone}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Website Modal */}
      {showWebModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-[#181411] dark:text-white mb-2">Sitio Web</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ingresa la URL del sitio web del restaurante
            </p>
            <input
              type="url"
              value={websiteInput}
              onChange={(e) => setWebsiteInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveWebsite();
                if (e.key === 'Escape') setShowWebModal(false);
              }}
              placeholder="https://www.ejemplo.com"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWebModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveWebsite}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-[#181411] dark:text-white mb-2">WhatsApp</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ingresa el número de WhatsApp para contacto directo
            </p>
            <input
              type="tel"
              value={whatsappInput}
              onChange={(e) => setWhatsappInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveWhatsApp();
                if (e.key === 'Escape') setShowWhatsAppModal(false);
              }}
              placeholder="+52 55 1234 5678"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveWhatsApp}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-dark transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Configuration Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-[480px] bg-background-light dark:bg-background-dark rounded-t-3xl shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-50 flex items-center bg-white dark:bg-background-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-[#181411] dark:text-white flex size-12 shrink-0 items-center cursor-pointer"
              >
                <span className="material-symbols-outlined">arrow_back_ios</span>
              </button>
              <h2 className="text-[#181411] dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
                Configurar Horario
              </h2>
              <div className="flex w-12 items-center justify-end">
                <button className="flex cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 bg-transparent text-[#181411] dark:text-white">
                  <span className="material-symbols-outlined">help</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {/* Headline & Description */}
              <div className="px-4 pt-6">
                <h3 className="text-[#181411] dark:text-white tracking-tight text-2xl font-bold leading-tight text-left">
                  Configurar horario
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal pt-1">
                  Selecciona los dias y horarios de servicio.
                </p>
              </div>

              {/* Day Selector Chips */}
              <div className="flex gap-3 p-4 flex-nowrap overflow-x-auto no-scrollbar">
                {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((letter, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectDay(index)}
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold ${
                      selectedDay === index
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[#181411] dark:text-gray-300'
                    }`}
                  >
                    <p className="text-sm">{letter}</p>
                  </button>
                ))}
              </div>

              {/* Toggle Open/Closed */}
              <div className="mx-4 mt-2 bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4 justify-between shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">store</span>
                  <p className="text-[#181411] dark:text-white text-base font-semibold leading-normal">
                    {isDayOpen ? 'Abierto este día' : 'Cerrado este día'}
                  </p>
                </div>
                <div className="shrink-0">
                  <label className="relative flex h-[31px] w-[51px] cursor-pointer items-center rounded-full border-none bg-gray-200 dark:bg-gray-700 p-0.5 transition-all has-[:checked]:justify-end has-[:checked]:bg-primary">
                    <div className="h-full w-[27px] rounded-full bg-white shadow-md"></div>
                    <input
                      type="checkbox"
                      checked={isDayOpen}
                      onChange={(e) => setIsDayOpen(e.target.checked)}
                      className="invisible absolute"
                    />
                  </label>
                </div>
              </div>

              {/* Time Slots Container */}
              {isDayOpen && (
                <div className="px-4 mt-6 space-y-4 pb-48">
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][selectedDay]}
                  </div>

                  {/* Time Slot Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Start Time */}
                      <button
                        onClick={() => setEditingTime('start')}
                        className="space-y-2 text-left"
                      >
                        <label className="text-xs font-semibold text-gray-500 px-1 uppercase">Apertura</label>
                        <div className={`flex items-center justify-center rounded-lg p-3 border-2 transition-all ${
                          editingTime === 'start'
                            ? 'bg-primary/5 border-primary'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700'
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-[#181411] dark:text-white">
                              {startHour}:{startMinute}
                            </span>
                            <span className="text-xs font-bold text-primary">{startPeriod}</span>
                          </div>
                        </div>
                      </button>

                      {/* End Time */}
                      <button
                        onClick={() => setEditingTime('end')}
                        className="space-y-2 text-left"
                      >
                        <label className="text-xs font-semibold text-gray-500 px-1 uppercase">Cierre</label>
                        <div className={`flex items-center justify-center rounded-lg p-3 border-2 transition-all ${
                          editingTime === 'end'
                            ? 'bg-primary/5 border-primary'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-700'
                        }`}>
                          <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-[#181411] dark:text-white">
                              {endHour}:{endMinute}
                            </span>
                            <span className="text-xs font-bold text-primary">{endPeriod}</span>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Drum Picker Interactive */}
                    <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-6 pb-10 mb-32">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 text-center">
                        Editando: {editingTime === 'start' ? 'Hora de Apertura' : 'Hora de Cierre'}
                      </p>
                      <div className="relative h-44 w-full overflow-hidden bg-white dark:bg-gray-800 flex justify-around items-center">
                        {/* Overlay gradients */}
                        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white dark:from-gray-800 to-transparent z-10 pointer-events-none"></div>
                        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-12 bg-primary/10 rounded-lg border-y-2 border-primary/30 pointer-events-none"></div>

                        {/* Time Picker Columns */}
                        <div className="flex space-x-12 z-0 w-full justify-center">
                          {/* Hours */}
                          <div 
                            ref={hourScrollRef}
                            className="h-44 overflow-y-scroll snap-y snap-mandatory hide-scrollbar flex flex-col items-center py-16"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onScroll={(e) => {
                              const hours = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
                              handleScroll(
                                e.currentTarget,
                                hours,
                                editingTime === 'start' ? setStartHour : setEndHour
                              );
                            }}
                          >
                            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => {
                              const currentHour = editingTime === 'start' ? startHour : endHour;
                              return (
                                <button
                                  key={h}
                                  onClick={() => editingTime === 'start' ? setStartHour(h) : setEndHour(h)}
                                  className={`py-3 px-3 transition-all min-w-[3rem] shrink-0 snap-center ${
                                    h === currentHour 
                                      ? 'text-2xl font-bold text-primary scale-110' 
                                      : 'text-base text-gray-300 dark:text-gray-600 hover:text-primary'
                                  }`}
                                >
                                  {h}
                                </button>
                              );
                            })}
                          </div>
                          {/* Minutes */}
                          <div 
                            ref={minuteScrollRef}
                            className="h-44 overflow-y-scroll snap-y snap-mandatory hide-scrollbar flex flex-col items-center py-16"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onScroll={(e) => {
                              const minutes = ['00', '15', '30', '45'];
                              handleScroll(
                                e.currentTarget,
                                minutes,
                                editingTime === 'start' ? setStartMinute : setEndMinute
                              );
                            }}
                          >
                            {['00', '15', '30', '45'].map((m) => {
                              const currentMinute = editingTime === 'start' ? startMinute : endMinute;
                              return (
                                <button
                                  key={m}
                                  onClick={() => editingTime === 'start' ? setStartMinute(m) : setEndMinute(m)}
                                  className={`py-3 px-3 transition-all min-w-[3rem] shrink-0 snap-center ${
                                    m === currentMinute 
                                      ? 'text-2xl font-bold text-primary scale-110' 
                                      : 'text-base text-gray-300 dark:text-gray-600 hover:text-primary'
                                  }`}
                                >
                                  {m}
                                </button>
                              );
                            })}
                          </div>
                          {/* Period */}
                          <div 
                            ref={periodScrollRef}
                            className="h-44 overflow-y-scroll snap-y snap-mandatory hide-scrollbar flex flex-col items-center py-16"
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                            onScroll={(e) => {
                              const periods = ['AM', 'PM'];
                              handleScroll(
                                e.currentTarget,
                                periods,
                                editingTime === 'start' ? setStartPeriod : setEndPeriod
                              );
                            }}
                          >
                            {['AM', 'PM'].map((p) => {
                              const currentPeriod = editingTime === 'start' ? startPeriod : endPeriod;
                              return (
                                <button
                                  key={p}
                                  onClick={() => editingTime === 'start' ? setStartPeriod(p) : setEndPeriod(p)}
                                  className={`py-3 px-3 transition-all min-w-[3rem] shrink-0 snap-center ${
                                    p === currentPeriod 
                                      ? 'text-2xl font-bold text-primary scale-110' 
                                      : 'text-base text-gray-300 dark:text-gray-600 hover:text-primary'
                                  }`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetailsScreen;
