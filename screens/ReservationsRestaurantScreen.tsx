import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useProducts } from '../contexts/ProductsContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createReservation } from '../services/api/reservations';

interface ReservationItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

const ReservationsRestaurantScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Estado de la reservación
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('00:00');
  const [numberOfPeople, setNumberOfPeople] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [specialOccasion, setSpecialOccasion] = useState<string | null>(null);
  const [tablePreferences, setTablePreferences] = useState<string>('');
  const [reservationItems, setReservationItems] = useState<ReservationItem[]>([]);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState<boolean>(false);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [subtitleOpacity, setSubtitleOpacity] = useState<number>(1);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(true);
  
  // Estados para controlar la visibilidad progresiva de secciones
  const [showTimeSection, setShowTimeSection] = useState<boolean>(false);
  const [timeSectionOpacity, setTimeSectionOpacity] = useState<number>(0);
  const [showPeopleSection, setShowPeopleSection] = useState<boolean>(false);
  const [peopleSectionOpacity, setPeopleSectionOpacity] = useState<number>(0);
  const [showZoneSection, setShowZoneSection] = useState<boolean>(false);
  const [zoneSectionOpacity, setZoneSectionOpacity] = useState<number>(0);
  const [showOccasionSection, setShowOccasionSection] = useState<boolean>(false);
  const [occasionSectionOpacity, setOccasionSectionOpacity] = useState<number>(0);
  const [showPreferencesSection, setShowPreferencesSection] = useState<boolean>(false);
  const [preferencesSectionOpacity, setPreferencesSectionOpacity] = useState<number>(0);
  const [showAdvanceOrderSection, setShowAdvanceOrderSection] = useState<boolean>(false);
  const [advanceOrderSectionOpacity, setAdvanceOrderSectionOpacity] = useState<number>(0);
  
  // Estado para rastrear si la fecha ha sido seleccionada (no solo inicializada)
  const [dateSelected, setDateSelected] = useState<boolean>(false);

  // Verificar si todas las preguntas obligatorias están completadas
  const allRequiredFieldsCompleted = dateSelected && selectedTime !== '00:00' && numberOfPeople > 0 && selectedZone !== '';
  
  // Estado para el wheel picker
  const [pickerHour, setPickerHour] = useState<number>(9);
  const [pickerMinute, setPickerMinute] = useState<number>(0);
  const [pickerMeridiem, setPickerMeridiem] = useState<'AM' | 'PM'>('AM');
  
  // Refs para las columnas del picker
  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);
  const meridiemsRef = useRef<HTMLDivElement>(null);

  // Meses (usar traducciones si están disponibles, sino español por defecto)
  const monthNames = [
    t('common.months.january') || 'Enero',
    t('common.months.february') || 'Febrero',
    t('common.months.march') || 'Marzo',
    t('common.months.april') || 'Abril',
    t('common.months.may') || 'Mayo',
    t('common.months.june') || 'Junio',
    t('common.months.july') || 'Julio',
    t('common.months.august') || 'Agosto',
    t('common.months.september') || 'Septiembre',
    t('common.months.october') || 'Octubre',
    t('common.months.november') || 'Noviembre',
    t('common.months.december') || 'Diciembre'
  ];
  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  // Convertir hora 24h a formato 12h para mostrar
  const formatTime12h = (time24: string): string => {
    if (time24 === '00:00') {
      return '00:00';
    }
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Convertir hora 12h a formato 24h
  const convert12hTo24h = (hour: number, minute: number, meridiem: 'AM' | 'PM'): string => {
    let hour24 = hour;
    if (meridiem === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (meridiem === 'AM' && hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Ocultar subtítulo después de 10 segundos con efecto de desvanecimiento
  useEffect(() => {
    const timer = setTimeout(() => {
      // Primero desvanecer (cambiar opacidad a 0)
      setSubtitleOpacity(0);
      // Después de la transición, ocultar completamente
      setTimeout(() => {
        setShowSubtitle(false);
      }, 500); // Duración de la transición
    }, 10000); // 10 segundos

    return () => clearTimeout(timer);
  }, []);

  // Función helper para mostrar la siguiente sección con fade in
  const showNextSection = (
    setShow: React.Dispatch<React.SetStateAction<boolean>>,
    setOpacity: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setTimeout(() => {
      setShow(true);
      setTimeout(() => setOpacity(1), 10);
    }, 300);
  };


  // Inicializar picker cuando se abre y hacer scroll a la posición correcta
  useEffect(() => {
    if (isTimePickerOpen) {
      const [hours24, minutes24] = selectedTime.split(':').map(Number);
      const hour12 = hours24 % 12 || 12;
      setPickerHour(hour12);
      setPickerMinute(minutes24);
      setPickerMeridiem(hours24 >= 12 ? 'PM' : 'AM');
      
      // Hacer scroll a la posición correcta después de un pequeño delay
      setTimeout(() => {
        const itemHeight = 44;
        const hourIndex = hours.indexOf(hour12);
        const minuteIndex = minutes.indexOf(minutes24);
        const meridiemIndex = meridiems.indexOf(hours24 >= 12 ? 'PM' : 'AM');
        
        if (hoursRef.current && hourIndex >= 0) {
          hoursRef.current.scrollTo({ top: hourIndex * itemHeight, behavior: 'smooth' });
        }
        if (minutesRef.current && minuteIndex >= 0) {
          minutesRef.current.scrollTo({ top: minuteIndex * itemHeight, behavior: 'smooth' });
        }
        if (meridiemsRef.current && meridiemIndex >= 0) {
          meridiemsRef.current.scrollTo({ top: meridiemIndex * itemHeight, behavior: 'smooth' });
        }
      }, 100);
    }
  }, [isTimePickerOpen, selectedTime]);

  // Generar opciones para el picker
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 15, 30, 45];
  const meridiems: ('AM' | 'PM')[] = ['AM', 'PM'];

  // Zonas disponibles
  const zones = [
    { id: 'interior', name: t('restaurant.reservations.zones.interior') || 'Interior', icon: 'chair_alt' },
    { id: 'terraza', name: t('restaurant.reservations.zones.terraza') || 'Terraza', icon: 'deck' },
    { id: 'jardin', name: t('restaurant.reservations.zones.jardin') || 'Jardín', icon: 'local_florist' }
  ];

  // Ocasiones especiales
  const occasions = [
    { id: 'birthday', name: t('restaurant.reservations.occasions.birthday') || 'Cumpleaños' },
    { id: 'anniversary', name: t('restaurant.reservations.occasions.anniversary') || 'Aniversario' },
    { id: 'business', name: t('restaurant.reservations.occasions.business') || 'Negocios' },
    { id: 'date', name: t('restaurant.reservations.occasions.date') || 'Cita' }
  ];

  // Calendario
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Generar días del mes
  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; date: Date }> = [];
    
    // Días del mes anterior
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthDays - i);
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        date
      });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.getTime() === today.getTime();
      const isSelected = date.getTime() === selectedDate.getTime();
      
      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        isSelected,
        date
      });
    }

    // Días del mes siguiente para completar la cuadrícula
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        date
      });
    }

    return days;
  }, [currentMonth, currentYear, selectedDate, today]);

  // Navegar mes anterior
  const goToPreviousMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth - 1, selectedDate.getDate()));
  };

  // Navegar mes siguiente
  const goToNextMonth = () => {
    setSelectedDate(new Date(currentYear, currentMonth + 1, selectedDate.getDate()));
  };

  // Seleccionar día
  const selectDay = (date: Date) => {
    setSelectedDate(new Date(date));
    if (!dateSelected) {
      setDateSelected(true);
      // Mostrar sección de hora después de seleccionar fecha
      setTimeout(() => {
        setShowTimeSection(true);
        setTimeout(() => setTimeSectionOpacity(1), 10);
      }, 100);
    }
  };

  // Incrementar/decrementar número de personas
  const incrementPeople = () => {
    setNumberOfPeople(prev => {
      const newValue = Math.min(prev + 1, 20);
      // Mostrar sección de zona cuando se incrementa por primera vez
      if (!showZoneSection && newValue > 0) {
        showNextSection(setShowZoneSection, setZoneSectionOpacity);
      }
      return newValue;
    });
  };

  const decrementPeople = () => {
    setNumberOfPeople(prev => Math.max(prev - 1, 0));
  };

  // Agregar producto al pedido anticipado
  const addItemToReservation = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

      const existingItem = reservationItems.find(item => item.id === productId);
      const productPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price || '0');
      const productImage = product.image || (product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '') || '';
      
      if (existingItem) {
        setReservationItems(prev =>
          prev.map(item =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        );
      } else {
        setReservationItems(prev => [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: productPrice,
            image: productImage,
            quantity: 1
          }
        ]);
      }
  };

  // Calcular total
  const total = useMemo(() => {
    return reservationItems.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString() || '0');
      return sum + (price * item.quantity);
    }, 0);
  }, [reservationItems]);

  // Productos destacados para pedido anticipado
  const featuredProducts = useMemo(() => {
    if (products.length === 0) return [];
    // Mostrar los primeros productos de platos fuertes
    const mainCourses = products.filter(p => p.category === 'main_courses' || p.category === 'Alimentos');
    if (mainCourses.length >= 2) {
      return mainCourses.slice(0, 2);
    }
    // Si no hay suficientes platos fuertes, usar los primeros productos disponibles
    return products.slice(0, 2);
  }, [products]);

  // Confirmar reservación
  const handleConfirm = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);

    try {
      // Obtener restaurant_id (por ahora usar el ID por defecto, en el futuro se puede obtener del contexto)
      // TODO: Obtener restaurant_id del contexto o de localStorage cuando se selecciona el restaurante
      const restaurantId = '00000000-0000-0000-0000-000000000001'; // ID por defecto

      // Formatear fecha como YYYY-MM-DD
      const formattedDate = selectedDate.toISOString().split('T')[0];
      
      // Preparar items del pedido anticipado
      const advanceOrderItems = reservationItems.map(item => ({
        id: item.id,
        name: item.name,
        price: typeof item.price === 'number' ? item.price : parseFloat(item.price.toString() || '0'),
        quantity: item.quantity
      }));

      // Guardar reservación en la base de datos
      const { data: reservation, error } = await createReservation({
        restaurant_id: restaurantId,
        reservation_date: formattedDate,
        reservation_time: selectedTime,
        number_of_people: numberOfPeople,
        zone: selectedZone,
        special_occasion: specialOccasion,
        table_preferences: tablePreferences || null,
        advance_order_items: advanceOrderItems,
        notes: null
      });

      if (error) {
        console.error('Error al crear reservación:', error);
        alert('Error al crear la reservación. Por favor, intenta de nuevo.');
        setIsSubmitting(false);
        return;
      }

      console.log('Reservación creada exitosamente:', reservation);

      // Agregar items al carrito si hay pedido anticipado
      if (reservationItems.length > 0) {
        reservationItems.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString() || '0');
            addToCart({
              id: item.id,
              name: item.name,
              price: itemPrice,
              notes: 'Pedido anticipado - Reservación'
            });
          }
        });
      }

      // Navegar a confirmación o mostrar mensaje de éxito
      // Por ahora, navegar de vuelta al home
      navigate('/home');
    } catch (error) {
      console.error('Error inesperado al crear reservación:', error);
      alert('Error inesperado al crear la reservación. Por favor, intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen pb-48">
      {/* Modal de bienvenida */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <h2 className="text-[#181511] dark:text-white text-xl font-bold mb-3">
                {t('restaurant.reservations.welcomeTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                {t('restaurant.reservations.welcomeMessage')}
              </p>
            </div>
            <button
              onClick={() => setShowWelcomeModal(false)}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center"
            >
              {t('common.continue')}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 safe-top">
        <div className="flex items-center p-4 justify-between max-w-md mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="text-[#181511] dark:text-white flex size-10 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-[#181511] dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
            {t('restaurant.reservations.details')}
          </h2>
          <div className="flex w-10 items-center justify-end">
            <button className="text-[#181511] dark:text-white">
              <span className="material-symbols-outlined">info</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        {!showWelcomeModal && (
          <>
            {/* Calendario */}
            <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">calendar_month</span>
              ¿Qué día quieres reservar?
            </h3>
            <section className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-orange-50 dark:border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              {monthNames[currentMonth]} {currentYear}
            </p>
            <div className="flex gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button
                onClick={goToNextMonth}
                className="p-1 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {dayNames.map((day, index) => (
              <span key={index} className="text-[11px] font-bold text-gray-400">
                {day}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((dayData, index) => (
              <button
                key={index}
                onClick={() => selectDay(dayData.date)}
                className={`h-10 text-sm font-medium rounded-xl flex items-center justify-center transition-colors ${
                  !dayData.isCurrentMonth
                    ? 'text-gray-300'
                    : dayData.isSelected
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 font-bold'
                    : dayData.isToday
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-[#181511] dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {dayData.day}
              </button>
            ))}
          </div>
        </section>

        {/* Hora */}
        {showTimeSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: timeSectionOpacity }}
          >
            <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">schedule</span>
              {t('restaurant.reservations.arrivalTime')}
            </h3>
            <div
              onClick={() => setIsTimePickerOpen(true)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:border-primary/50 transition-colors cursor-pointer"
            >
              <span className="text-lg text-[#181511] dark:text-white font-semibold">
                {formatTime12h(selectedTime)}
              </span>
            </div>

          {/* Modal del selector de horario (Clock Design) */}
          {isTimePickerOpen && (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center"
              onClick={() => setIsTimePickerOpen(false)}
            >
              {/* Backdrop */}
              <div className="fixed inset-0 bg-black/40 dark:bg-black/60"></div>
              
              {/* Bottom Sheet */}
              <div
                className="relative z-10 w-full max-w-md bg-white dark:bg-background-dark rounded-t-xl overflow-hidden shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Handle */}
                <div className="flex h-6 w-full items-center justify-center pt-2">
                  <div className="h-1.5 w-12 rounded-full bg-gray-200 dark:bg-zinc-700"></div>
                </div>

                {/* Header */}
                <div className="px-4 pt-4 pb-2">
                  <h4 className="text-zinc-900 dark:text-white text-lg font-bold leading-normal tracking-tight text-center">
                    Seleccionar Hora
                  </h4>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm text-center font-medium mt-1">
                    Horario de Desayuno (6:00 AM - 11:30 AM)
                  </p>
                </div>

                {/* Clock Design */}
                <div className="px-6 py-8">
                  {/* Clock Display */}
                  <div className="flex items-center justify-center gap-3 mb-8">
                    {/* Hours */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          const newHour = pickerHour === 12 ? 1 : pickerHour + 1;
                          setPickerHour(newHour > 12 ? 1 : newHour);
                        }}
                        className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-2"
                      >
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-xl">arrow_drop_up</span>
                      </button>
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-primary px-6 py-4 min-w-[80px] flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary">
                          {pickerHour.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const newHour = pickerHour === 1 ? 12 : pickerHour - 1;
                          setPickerHour(newHour < 1 ? 12 : newHour);
                        }}
                        className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mt-2"
                      >
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-xl">arrow_drop_down</span>
                      </button>
                    </div>

                    {/* Separator */}
                    <div className="text-primary font-bold text-4xl pb-8">:</div>

                    {/* Minutes */}
                    <div className="flex flex-col items-center">
                      <button
                        onClick={() => {
                          const currentIndex = minutes.indexOf(pickerMinute);
                          const nextIndex = currentIndex === minutes.length - 1 ? 0 : currentIndex + 1;
                          setPickerMinute(minutes[nextIndex]);
                        }}
                        className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mb-2"
                      >
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-xl">arrow_drop_up</span>
                      </button>
                      <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-primary px-6 py-4 min-w-[80px] flex items-center justify-center">
                        <span className="text-4xl font-bold text-primary">
                          {pickerMinute.toString().padStart(2, '0')}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          const currentIndex = minutes.indexOf(pickerMinute);
                          const prevIndex = currentIndex === 0 ? minutes.length - 1 : currentIndex - 1;
                          setPickerMinute(minutes[prevIndex]);
                        }}
                        className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mt-2"
                      >
                        <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-xl">arrow_drop_down</span>
                      </button>
                    </div>

                    {/* AM/PM */}
                    <div className="flex flex-col items-center ml-4">
                      <button
                        onClick={() => setPickerMeridiem('AM')}
                        className={`size-10 rounded-lg flex items-center justify-center transition-colors mb-2 ${
                          pickerMeridiem === 'AM'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-sm font-bold">AM</span>
                      </button>
                      <div className="h-16"></div>
                      <button
                        onClick={() => setPickerMeridiem('PM')}
                        className={`size-10 rounded-lg flex items-center justify-center transition-colors mt-2 ${
                          pickerMeridiem === 'PM'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-sm font-bold">PM</span>
                      </button>
                    </div>
                  </div>

                  {/* Clock Icon */}
                  <div className="flex justify-center mb-6">
                    <div className="size-24 rounded-full bg-primary/10 dark:bg-primary/5 flex items-center justify-center border-2 border-primary/20">
                      <span className="material-symbols-outlined text-primary text-5xl">schedule</span>
                    </div>
                  </div>
                </div>

                {/* Button Group */}
                <div className="p-4 pb-safe bg-zinc-50 dark:bg-zinc-900/50" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => {
                        const newTime = convert12hTo24h(pickerHour, pickerMinute, pickerMeridiem);
                        setSelectedTime(newTime);
                        setIsTimePickerOpen(false);
                        // Mostrar sección de número de personas después de confirmar hora
                        if (!showPeopleSection) {
                          showNextSection(setShowPeopleSection, setPeopleSectionOpacity);
                        }
                      }}
                      className="w-full h-14 bg-primary hover:bg-primary/90 text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center"
                    >
                      {t('common.confirm')}
                    </button>
                    <button
                      onClick={() => setIsTimePickerOpen(false)}
                      className="w-full h-12 bg-transparent text-zinc-500 dark:text-zinc-400 text-base font-bold rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </section>
        )}

        {/* Número de personas */}
        {showPeopleSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: peopleSectionOpacity }}
          >
          <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">groups</span>
            {t('restaurant.reservations.numberOfPeople')}
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 flex items-center justify-between border border-gray-100 dark:border-gray-800 shadow-sm">
            <button
              onClick={decrementPeople}
              className="size-12 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-primary active:scale-95 transition-transform border border-gray-100 dark:border-gray-700"
            >
              <span className="material-symbols-outlined font-bold">remove</span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-3xl font-bold text-[#181511] dark:text-white">
                {numberOfPeople}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">
                {t('restaurant.reservations.guests')}
              </span>
            </div>
            <button
              onClick={incrementPeople}
              className="size-12 rounded-xl bg-primary flex items-center justify-center text-white active:scale-95 transition-transform shadow-md shadow-primary/20"
            >
              <span className="material-symbols-outlined font-bold">add</span>
            </button>
          </div>
          </section>
        )}

        {/* Zona */}
        {showZoneSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: zoneSectionOpacity }}
          >
          <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">location_on</span>
            {t('restaurant.reservations.selectZone')}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {zones.map((zone) => (
              <button
                key={zone.id}
                onClick={() => {
                  setSelectedZone(zone.id);
                  // Mostrar todas las secciones restantes cuando se selecciona una zona
                  if (!showOccasionSection) {
                    showNextSection(setShowOccasionSection, setOccasionSectionOpacity);
                  }
                  if (!showPreferencesSection) {
                    setTimeout(() => {
                      showNextSection(setShowPreferencesSection, setPreferencesSectionOpacity);
                    }, 600);
                  }
                  if (!showAdvanceOrderSection) {
                    setTimeout(() => {
                      showNextSection(setShowAdvanceOrderSection, setAdvanceOrderSectionOpacity);
                    }, 1200);
                  }
                }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                  selectedZone === zone.id
                    ? 'bg-white dark:bg-gray-900 border-2 border-primary bg-primary/5 text-primary'
                    : 'bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="material-symbols-outlined text-2xl">{zone.icon}</span>
                <span className="text-xs font-bold">{zone.name}</span>
              </button>
            ))}
          </div>
          </section>
        )}

        {/* Ocasión especial */}
        {showOccasionSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: occasionSectionOpacity }}
          >
          <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">celebration</span>
            {t('restaurant.reservations.specialOccasion')} <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(opcional)</span>
          </h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {occasions.map((occasion) => (
              <button
                key={occasion.id}
                onClick={() => {
                  const newValue = specialOccasion === occasion.id ? null : occasion.id;
                  setSpecialOccasion(newValue);
                  // Mostrar sección de preferencias cuando se selecciona una ocasión (o se deselecciona)
                  if (!showPreferencesSection) {
                    showNextSection(setShowPreferencesSection, setPreferencesSectionOpacity);
                  }
                }}
                className={`px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-all ${
                  specialOccasion === occasion.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900'
                }`}
              >
                {occasion.name}
              </button>
            ))}
          </div>
          </section>
        )}

        {/* Preferencias de mesa */}
        {showPreferencesSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: preferencesSectionOpacity }}
          >
          <h3 className="text-[#181511] dark:text-white text-base font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">edit_note</span>
            {t('restaurant.reservations.tablePreferences')} <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(opcional)</span>
          </h3>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-1 border border-gray-100 dark:border-gray-800 shadow-sm focus-within:border-primary/50 transition-colors">
            <textarea
              value={tablePreferences}
              onChange={(e) => {
                setTablePreferences(e.target.value);
                // Mostrar sección de pedido anticipado cuando se empieza a escribir
                if (!showAdvanceOrderSection && e.target.value.length > 0) {
                  showNextSection(setShowAdvanceOrderSection, setAdvanceOrderSectionOpacity);
                }
              }}
              onFocus={() => {
                // También mostrar cuando se enfoca el textarea
                if (!showAdvanceOrderSection) {
                  showNextSection(setShowAdvanceOrderSection, setAdvanceOrderSectionOpacity);
                }
              }}
              className="w-full bg-transparent border-none focus:ring-0 text-sm text-[#181511] dark:text-white p-3 min-h-[100px] resize-none outline-none"
              placeholder={t('restaurant.reservations.tablePreferencesPlaceholder')}
            />
          </div>
          </section>
        )}

        {/* Botón Solicitar Reservación */}
        {allRequiredFieldsCompleted && (
          <div className="px-4 py-6 mb-8">
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl transition-colors shadow-lg shadow-primary/20 flex items-center justify-center"
            >
              {isSubmitting ? 'Guardando...' : 'Solicitar reservación'}
            </button>
          </div>
        )}

        {/* Pedido Anticipado */}
        {showAdvanceOrderSection && (
          <section 
            className="mb-8 transition-opacity duration-500 ease-out"
            style={{ opacity: advanceOrderSectionOpacity }}
          >
          <div className="bg-primary/10 dark:bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <span className="material-symbols-outlined text-8xl text-primary">restaurant_menu</span>
            </div>
            <h2 className="text-[#181511] dark:text-white text-xl font-bold mb-2">
              {t('restaurant.reservations.advanceOrder')} <span className="text-gray-400 dark:text-gray-500 font-normal text-base">(opcional)</span>
            </h2>
            <p className="text-[#181511]/70 dark:text-gray-400 text-sm leading-relaxed mb-4">
              {t('restaurant.reservations.advanceOrderDescription')}
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="flex items-center gap-2 text-primary font-bold text-sm"
            >
              {t('restaurant.reservations.viewFullMenu')}
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>

          {/* Productos destacados */}
          {featuredProducts.length > 0 ? (
            <div className="space-y-4">
              {featuredProducts.map((product) => {
              const reservationItem = reservationItems.find(item => item.id === product.id);
              const quantity = reservationItem?.quantity || 0;

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-4 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800"
                >
                  <div className="size-20 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden shrink-0">
                    {(product.image || (product.image_urls && product.image_urls.length > 0)) ? (
                      <img
                        alt={product.name}
                        className="size-full object-cover"
                        src={product.image || (product.image_urls && product.image_urls.length > 0 ? product.image_urls[0] : '') || ''}
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-gray-400">
                        <span className="material-symbols-outlined text-3xl">restaurant</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[#181511] dark:text-white font-bold text-sm">
                      {product.name}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {product.description || ''}
                    </p>
                    <p className="text-primary font-bold">
                      ${typeof product.price === 'number' ? product.price.toFixed(2) : parseFloat(product.price || '0').toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => addItemToReservation(product.id)}
                    className={`size-8 rounded-lg flex items-center justify-center shadow-md transition-all ${
                      quantity > 0
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-[#181511] dark:text-white'
                    }`}
                  >
                    {quantity > 0 ? (
                      <span className="text-xs font-bold">{quantity}</span>
                    ) : (
                      <span className="material-symbols-outlined text-base">add</span>
                    )}
                  </button>
                </div>
              );
              })}
            </div>
          ) : null}
          </section>
        )}
          </>
        )}
      </main>

    </div>
  );
};

export default ReservationsRestaurantScreen;
