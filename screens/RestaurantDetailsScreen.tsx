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

  useEffect(() => {
    // Determinar el día actual
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const today = new Date().getDay();
    setCurrentDay(days[today]);
  }, []);

  // Datos de ejemplo
  const restaurantName = restaurant?.nombre_comercial || 'Café de la Mañana';
  const coverImage = restaurant?.imagen || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDt3fWtlAY6oQ-DKr3GM4BHi2wY4U5FJuPppLLqPMew1W3SGoqp4jzyKrhxivlLoGgiv48Fd79Wf7LrkkWlBETprzOHQWn29-gjWzOHad36MNQU4Fb1HTi9bTpjIB37rYIc4RAIg4FDfHAg-jrDF2tmkX-bSFvHlMLvmHLyosYrV351pEMTnF8o7W4JOeSWrNcd8rIiyLY8a-CRC3IhssEBVvYKCtEyazZRthwuCbZyXo0Bj5LDhFKtlDd-X5IidlvsZu4OZ-mf4fRY';
  const cuisine = restaurant?.tipo_cocina || 'Artesanal • Saludable • Local';
  const rating = '4.9';
  const reviews = '120+';
  const address = restaurant?.direccion_completa || 'Av. Reforma 450, Juárez, CDMX';
  const phone = restaurant?.telefono || '+52 55 1234 5678';
  const website = restaurant?.sitio_web || 'www.cafedelamanana.com';

  // Horarios de ejemplo
  const schedule = [
    { day: 'Lunes', hours: '07:00 AM - 12:00 PM' },
    { day: 'Martes', hours: '07:00 AM - 12:00 PM' },
    { day: 'Miércoles', hours: '07:00 AM - 12:00 PM' },
    { day: 'Jueves', hours: '07:00 AM - 12:00 PM' },
    { day: 'Viernes', hours: '07:00 AM - 01:00 PM' },
    { day: 'Fin de Semana', hours: '08:00 AM - 02:00 PM' },
  ];

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    alert('Dirección copiada al portapapeles');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: restaurantName,
        text: `Visita ${restaurantName} - ${cuisine}`,
        url: window.location.href,
      });
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
          <button
            onClick={handleShare}
            className="flex cursor-pointer items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined">share</span>
          </button>
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
          <button className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm">
            <span className="material-symbols-outlined text-primary">call</span>
            <span className="text-xs font-semibold">Llamar</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm">
            <span className="material-symbols-outlined text-primary">language</span>
            <span className="text-xs font-semibold">Web</span>
          </button>
          <button className="flex-1 flex flex-col items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 rounded-xl border border-[#f5f2f0] dark:border-white/5 shadow-sm">
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
              <div className="flex flex-col justify-center max-w-[70%]">
                <p className="text-[#181411] dark:text-white text-base font-semibold leading-tight line-clamp-1">
                  Dirección Completa
                </p>
                <p className="text-[#8a7560] dark:text-white/60 text-sm font-normal leading-normal">{address}</p>
              </div>
              <div className="shrink-0">
                <button
                  onClick={handleCopyAddress}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10 dark:bg-primary/20 text-primary transition-all hover:bg-primary hover:text-white"
                >
                  <span className="material-symbols-outlined">content_copy</span>
                </button>
              </div>
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
                      : 'text-[#8a7560] dark:text-white/60'
                  }`}
                >
                  {item.day} {item.day === currentDay && '(Hoy)'}
                </span>
                <span
                  className={`text-sm ${
                    item.day === currentDay ? 'font-bold text-primary' : 'font-semibold'
                  }`}
                >
                  {item.hours}
                </span>
              </div>
            ))}
          </div>
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

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-lg p-4 border-t border-[#f5f2f0] dark:border-white/10 flex justify-center">
        <button
          onClick={() => navigate('/menu')}
          className="w-full max-w-[448px] h-14 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">restaurant_menu</span>
          Ver Menú de Hoy
        </button>
      </div>
    </div>
  );
};

export default RestaurantDetailsScreen;
