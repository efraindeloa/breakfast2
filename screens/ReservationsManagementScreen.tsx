import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getRestaurantReservations, updateReservation, Reservation } from '../services/api/reservations';
import { getCurrentUserRestaurantId } from '../services/database';

type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
type ViewMode = 'list' | 'calendar';

const ReservationsManagementScreen: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Estados principales
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false); // Cambiar a false para mostrar datos hardcodeados
  const [error, setError] = useState<string | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>('3de5a7bc-362a-4613-838c-188cf8ff760d'); // Don K Restaurant ID

  // Datos hardcodeados para mostrar el diseño
  const hardcodedReservations: Reservation[] = [
    // HOY - Reservaciones
    {
      id: 'res-001',
      user_id: 'user-001',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date().toISOString().split('T')[0], // Hoy
      reservation_time: '19:00:00',
      number_of_people: 4,
      zone: 'Terraza',
      special_occasion: 'Cumpleaños',
      table_preferences: 'Mesa junto a la ventana, decoración especial para niña de 8 años',
      advance_order_items: [
        { id: 1, name: 'Pastel de Chocolate Don K', price: 280.00, quantity: 1 },
        { id: 2, name: 'Velas Especiales', price: 50.00, quantity: 1 }
      ],
      status: 'pending',
      notes: 'EJEMPLO DON K - Cumpleaños infantil, requiere decoración especial y mesa familiar',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'res-002',
      user_id: 'user-002',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date().toISOString().split('T')[0], // Hoy
      reservation_time: '20:30:00',
      number_of_people: 2,
      zone: 'Zona VIP',
      special_occasion: 'Aniversario',
      table_preferences: 'Mesa romántica, velas, música suave, vista panorámica',
      advance_order_items: [
        { id: 3, name: 'Cena Romántica Don K', price: 850.00, quantity: 1 },
        { id: 4, name: 'Vino Tinto Reserva', price: 450.00, quantity: 1 },
        { id: 5, name: 'Postre Especial Pareja', price: 180.00, quantity: 1 }
      ],
      status: 'confirmed',
      notes: 'EJEMPLO DON K - Aniversario de bodas, cliente VIP, mesa con vista especial',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'res-003',
      user_id: 'user-003',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date().toISOString().split('T')[0], // Hoy
      reservation_time: '14:00:00',
      number_of_people: 7,
      zone: 'Sala Principal',
      special_occasion: 'Comida Familiar Dominical',
      table_preferences: 'Mesa amplia, sillas para niños, área tranquila',
      advance_order_items: [
        { id: 12, name: 'Menú Infantil Don K', price: 150.00, quantity: 3 },
        { id: 13, name: 'Plato del Día Adulto', price: 280.00, quantity: 4 }
      ],
      status: 'pending',
      notes: 'EJEMPLO DON K - Comida familiar dominical, incluye 3 niños y 4 adultos',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'res-004',
      user_id: 'user-004',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date().toISOString().split('T')[0], // Hoy
      reservation_time: '15:30:00',
      number_of_people: 2,
      zone: 'Terraza Íntima',
      special_occasion: null,
      table_preferences: 'Mesa con vista, ambiente relajado, música ambiental',
      advance_order_items: [
        { id: 14, name: 'Café Don K Especial', price: 85.00, quantity: 2 },
        { id: 15, name: 'Postre Compartir', price: 120.00, quantity: 1 }
      ],
      status: 'confirmed',
      notes: 'EJEMPLO DON K - Cita casual de pareja joven, primera visita al restaurante',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // AYER - Reservaciones
    {
      id: 'res-005',
      user_id: 'user-005',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Ayer
      reservation_time: '13:00:00',
      number_of_people: 6,
      zone: 'Sala Ejecutiva',
      special_occasion: 'Reunión de Negocios',
      table_preferences: 'Mesa amplia, ambiente silencioso, proyector disponible, WiFi premium',
      advance_order_items: [
        { id: 6, name: 'Menú Ejecutivo Don K', price: 380.00, quantity: 6 },
        { id: 7, name: 'Agua Premium', price: 45.00, quantity: 3 },
        { id: 8, name: 'Café Gourmet', price: 65.00, quantity: 6 }
      ],
      status: 'completed',
      notes: 'EJEMPLO DON K - Reunión ejecutiva completada exitosamente, cliente corporativo recurrente',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'res-006',
      user_id: 'user-006',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Ayer
      reservation_time: '18:30:00',
      number_of_people: 5,
      zone: 'Zona Familiar',
      special_occasion: null,
      table_preferences: 'Mesa cerca del área de juegos, sillas altas para niños',
      advance_order_items: [],
      status: 'no_show',
      notes: 'EJEMPLO DON K - Cliente no se presentó, se esperó 25 minutos, no respondió llamadas',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // MAÑANA - Reservaciones
    {
      id: 'res-007',
      user_id: 'user-007',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Mañana
      reservation_time: '21:00:00',
      number_of_people: 10,
      zone: 'Terraza Grande',
      special_occasion: 'Despedida de Soltero',
      table_preferences: 'Mesas juntas, música permitida hasta 11 PM, área reservada',
      advance_order_items: [
        { id: 9, name: 'Parrillada Don K Grupal', price: 1200.00, quantity: 2 },
        { id: 10, name: 'Cerveza Nacional', price: 55.00, quantity: 15 },
        { id: 11, name: 'Botana Especial', price: 180.00, quantity: 3 }
      ],
      status: 'cancelled',
      notes: 'EJEMPLO DON K - Cancelada por cambio de fecha, cliente reagendará para próxima semana',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    // Reservaciones adicionales para otros días del mes (para mostrar el calendario)
    {
      id: 'res-008',
      user_id: 'user-008',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Pasado mañana
      reservation_time: '19:30:00',
      number_of_people: 3,
      zone: 'Terraza',
      special_occasion: 'Cena de Trabajo',
      table_preferences: 'Mesa tranquila para conversación',
      advance_order_items: [
        { id: 16, name: 'Menú Degustación', price: 450.00, quantity: 3 }
      ],
      status: 'confirmed',
      notes: 'EJEMPLO DON K - Cena de trabajo importante',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'res-009',
      user_id: 'user-009',
      restaurant_id: '3de5a7bc-362a-4613-838c-188cf8ff760d',
      reservation_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // En 5 días
      reservation_time: '20:00:00',
      number_of_people: 8,
      zone: 'Sala Principal',
      special_occasion: 'Celebración Familiar',
      table_preferences: 'Mesa grande para toda la familia',
      advance_order_items: [
        { id: 17, name: 'Paella Familiar', price: 680.00, quantity: 1 },
        { id: 18, name: 'Sangría', price: 120.00, quantity: 2 }
      ],
      status: 'pending',
      notes: 'EJEMPLO DON K - Celebración familiar, requiere mesa grande',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  // Estados de filtros
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<ReservationStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Estados de UI
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Cargar ID del restaurante
  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const id = await getCurrentUserRestaurantId();
        if (!id) {
          setError('No se pudo obtener el ID del restaurante');
          return;
        }
        setRestaurantId(id);
      } catch (err) {
        console.error('Error loading restaurant ID:', err);
        setError('Error al cargar información del restaurante');
      }
    };

    if (user) {
      loadRestaurantId();
    }
  }, [user]);

  // Cargar reservaciones (usando datos hardcodeados para mostrar diseño)
  useEffect(() => {
    const loadReservations = () => {
      if (!restaurantId) return;
      
      // Simular un pequeño delay para mostrar el comportamiento real
      setTimeout(() => {
        setLoading(false);
        setError(null);
        
        // Usar datos hardcodeados
        let filteredData = hardcodedReservations;
        
        // Filtrar por fecha si no es 'all'
        if (selectedDate) {
          filteredData = filteredData.filter(r => r.reservation_date === selectedDate);
        }
        
        // Filtrar por estado si no es 'all'
        if (selectedStatus !== 'all') {
          filteredData = filteredData.filter(r => r.status === selectedStatus);
        }
        
        setReservations(filteredData);
      }, 300); // 300ms delay para simular carga
    };

    loadReservations();
  }, [restaurantId, selectedDate, selectedStatus, hardcodedReservations]);

  // Filtrar reservaciones por búsqueda
  const filteredReservations = useMemo(() => {
    // Asegurar que reservations sea un array válido
    const validReservations = Array.isArray(reservations) ? reservations : [];
    
    if (!searchQuery.trim()) return validReservations;
    
    const query = searchQuery.toLowerCase();
    return validReservations.filter(reservation => 
      reservation.user_id.toLowerCase().includes(query) ||
      reservation.zone.toLowerCase().includes(query) ||
      reservation.special_occasion?.toLowerCase().includes(query) ||
      reservation.table_preferences?.toLowerCase().includes(query) ||
      reservation.notes?.toLowerCase().includes(query)
    );
  }, [reservations, searchQuery]);

  // Agrupar reservaciones por hora (para vista lista)
  const reservationsByTime = useMemo(() => {
    const grouped: Record<string, Reservation[]> = {};
    
    // Asegurar que filteredReservations sea un array válido
    const validFilteredReservations = Array.isArray(filteredReservations) ? filteredReservations : [];
    
    validFilteredReservations.forEach(reservation => {
      const time = reservation.reservation_time;
      if (!grouped[time]) {
        grouped[time] = [];
      }
      grouped[time].push(reservation);
    });
    
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredReservations]);

  // Generar calendario para vista calendario
  const calendarData = useMemo(() => {
    const currentDate = new Date(selectedDate);
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Primer día del mes
    const firstDay = new Date(year, month, 1);
    // Último día del mes
    const lastDay = new Date(year, month + 1, 0);
    
    // Primer día de la semana (lunes = 1, domingo = 0)
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que lunes sea el primer día
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // Generar 42 días (6 semanas x 7 días)
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateString = date.toISOString().split('T')[0];
      const dayReservations = hardcodedReservations.filter(r => r.reservation_date === dateString);
      
      days.push({
        date: new Date(date),
        dateString,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateString === new Date().toISOString().split('T')[0],
        isSelected: dateString === selectedDate,
        reservations: dayReservations,
        reservationCount: dayReservations.length,
        pendingCount: dayReservations.filter(r => r.status === 'pending').length,
        confirmedCount: dayReservations.filter(r => r.status === 'confirmed').length
      });
    }
    
    return {
      days,
      monthName: currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      year,
      month
    };
  }, [selectedDate, reservations]);

  // Actualizar estado de reservación
  const handleStatusUpdate = async (reservationId: string, newStatus: ReservationStatus) => {
    try {
      setUpdatingStatus(reservationId);
      
      const response = await updateReservation(reservationId, { status: newStatus });
      
      if (response.success) {
        // Actualizar la reservación en el estado local
        setReservations(prev => 
          Array.isArray(prev) ? prev.map(r => 
            r.id === reservationId 
              ? { ...r, status: newStatus }
              : r
          ) : []
        );
        
        // Cerrar modal si está abierto
        if (selectedReservation?.id === reservationId) {
          setSelectedReservation(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        setError(response.error || 'Error al actualizar reservación');
      }
    } catch (err) {
      console.error('Error updating reservation status:', err);
      setError('Error al actualizar estado de reservación');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Obtener color del estado
  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: ReservationStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      case 'no_show': return 'No Show';
      default: return status;
    }
  };

  // Formatear hora
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando reservaciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center">
        <div className="text-center p-6">
          <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-100 pb-10">
      {/* Safe area top */}
      <div className="h-12 bg-background-light dark:bg-background-dark sticky top-0 z-50"></div>
      
      {/* Header */}
      <header className="sticky top-12 z-50 px-4 py-2 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">arrow_back_ios_new</span>
          </button>
          <h1 className="text-xl font-bold tracking-tight">Gestionar Reservaciones</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2.5 rounded-xl transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined">list_alt</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`p-2.5 rounded-xl transition-colors ${
              viewMode === 'calendar'
                ? 'bg-primary text-white shadow-sm shadow-primary/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 mt-6 space-y-6">
        {/* Fecha de operación */}
        <section>
          <label className="block text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">
            Fecha de operación
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl py-4 px-5 pr-12 font-medium focus:ring-primary"
            />
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary">event</span>
          </div>
        </section>

        {/* Estadísticas / Filtros */}
        <section className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'pending' ? 'all' : 'pending')}
            className={`p-4 rounded-2xl shadow-sm ring-1 text-center transition-all hover:scale-105 active:scale-95 ${
              selectedStatus === 'pending'
                ? 'bg-primary text-white ring-primary shadow-primary/20'
                : 'bg-white dark:bg-slate-900 ring-slate-100 dark:ring-slate-800 hover:ring-primary/50'
            }`}
          >
            <p className={`text-3xl font-extrabold mb-1 ${
              selectedStatus === 'pending' ? 'text-white' : 'text-primary'
            }`}>
              {hardcodedReservations.filter(r => r.status === 'pending').length}
            </p>
            <p className={`text-sm font-medium ${
              selectedStatus === 'pending' 
                ? 'text-white/80' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              Pendientes
            </p>
          </button>
          
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'confirmed' ? 'all' : 'confirmed')}
            className={`p-4 rounded-2xl shadow-sm ring-1 text-center transition-all hover:scale-105 active:scale-95 ${
              selectedStatus === 'confirmed'
                ? 'bg-primary text-white ring-primary shadow-primary/20'
                : 'bg-white dark:bg-slate-900 ring-slate-100 dark:ring-slate-800 hover:ring-primary/50'
            }`}
          >
            <p className={`text-3xl font-extrabold mb-1 ${
              selectedStatus === 'confirmed' ? 'text-white' : 'text-primary'
            }`}>
              {hardcodedReservations.filter(r => r.status === 'confirmed').length}
            </p>
            <p className={`text-sm font-medium ${
              selectedStatus === 'confirmed' 
                ? 'text-white/80' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              Confirmadas
            </p>
          </button>
          
          <button
            onClick={() => setSelectedStatus(selectedStatus === 'completed' ? 'all' : 'completed')}
            className={`p-4 rounded-2xl shadow-sm ring-1 text-center transition-all hover:scale-105 active:scale-95 ${
              selectedStatus === 'completed'
                ? 'bg-primary text-white ring-primary shadow-primary/20'
                : 'bg-white dark:bg-slate-900 ring-slate-100 dark:ring-slate-800 hover:ring-primary/50'
            }`}
          >
            <p className={`text-3xl font-extrabold mb-1 ${
              selectedStatus === 'completed' ? 'text-white' : 'text-primary'
            }`}>
              {hardcodedReservations.filter(r => r.status === 'completed').length}
            </p>
            <p className={`text-sm font-medium ${
              selectedStatus === 'completed' 
                ? 'text-white/80' 
                : 'text-slate-500 dark:text-slate-400'
            }`}>
              Completadas
            </p>
          </button>
          
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 text-center">
            <p className="text-3xl font-extrabold text-primary mb-1">
              {hardcodedReservations.reduce((sum, r) => sum + r.number_of_people, 0)}
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Comensales</p>
          </div>
        </section>

        {/* Lista de reservaciones */}
        {viewMode === 'list' ? (
          <section className="space-y-6">
            {filteredReservations.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4">
                  event_busy
                </span>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  No hay reservaciones
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  No hay reservaciones para esta fecha
                </p>
              </div>
            ) : (
              reservationsByTime.map(([time, timeReservations]) => (
                <div key={time} className="space-y-3">
                  <div className="flex justify-between items-end px-1">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      {formatTime(time)}
                    </h2>
                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                      {timeReservations.length} reservación{timeReservations.length !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
                    {timeReservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="p-4 border-b border-slate-50 dark:border-slate-800/50 last:border-b-0"
                        onClick={() => {
                          setSelectedReservation(reservation);
                          setShowDetailsModal(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
                              reservation.status === 'pending' 
                                ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                                : reservation.status === 'confirmed'
                                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                                : reservation.status === 'completed'
                                ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
                            }`}>
                              {getStatusText(reservation.status)}
                            </span>
                            <h3 className="text-base font-semibold">
                              Reserva para {reservation.number_of_people} persona{reservation.number_of_people !== 1 ? 's' : ''}
                            </h3>
                          </div>
                          <div className="flex gap-1">
                            {reservation.status === 'pending' && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(reservation.id, 'confirmed');
                                  }}
                                  disabled={updatingStatus === reservation.id}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:scale-105 active:scale-95 transition-transform"
                                >
                                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(reservation.id, 'cancelled');
                                  }}
                                  disabled={updatingStatus === reservation.id}
                                  className="w-9 h-9 flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:scale-105 active:scale-95 transition-transform"
                                >
                                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                                </button>
                              </>
                            )}
                            {reservation.status === 'confirmed' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(reservation.id, 'completed');
                                }}
                                disabled={updatingStatus === reservation.id}
                                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:scale-105 active:scale-95 transition-transform"
                              >
                                <span className="material-symbols-outlined text-[20px]">task_alt</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReservation(reservation);
                                setShowDetailsModal(true);
                              }}
                              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 hover:scale-105 active:scale-95 transition-transform"
                            >
                              <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-primary/70 text-lg">
                              {reservation.zone.toLowerCase().includes('terraza') ? 'deck' : 'location_on'}
                            </span>
                            <span>{reservation.zone}</span>
                          </div>
                          {reservation.special_occasion && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <span className="material-symbols-outlined text-primary/70 text-lg">
                                {reservation.special_occasion.toLowerCase().includes('cumpleaños') ? 'cake' : 'celebration'}
                              </span>
                              <span>{reservation.special_occasion}</span>
                            </div>
                          )}
                          {reservation.advance_order_items.length > 0 && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                              <span className="material-symbols-outlined text-primary/70 text-lg">shopping_basket</span>
                              <span>{reservation.advance_order_items.length} producto{reservation.advance_order_items.length !== 1 ? 's' : ''} pre-ordenado{reservation.advance_order_items.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>
        ) : (
          // VISTA CALENDARIO
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header del calendario */}
            <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {calendarData.monthName}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prevMonth = new Date(selectedDate);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setSelectedDate(prevMonth.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={() => {
                      const today = new Date();
                      setSelectedDate(today.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => {
                      const nextMonth = new Date(selectedDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setSelectedDate(nextMonth.toISOString().split('T')[0]);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Días de la semana */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-600">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <div key={day} className="p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                  {day}
                </div>
              ))}
            </div>

            {/* Días del calendario */}
            <div className="grid grid-cols-7">
              {calendarData.days.map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border-r border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !day.isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/50' : ''
                  } ${
                    day.isSelected ? 'bg-primary/10 border-primary' : ''
                  }`}
                  onClick={() => setSelectedDate(day.dateString)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-medium ${
                      !day.isCurrentMonth 
                        ? 'text-gray-400 dark:text-gray-600' 
                        : day.isToday 
                          ? 'text-primary font-bold' 
                          : 'text-gray-900 dark:text-white'
                    }`}>
                      {day.date.getDate()}
                    </span>
                  </div>
                  
                  {/* Número de reservaciones centrado */}
                  {day.reservationCount > 0 && (
                    <div className="flex justify-center items-center flex-1">
                      <span className="bg-primary text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                        {day.reservationCount}
                      </span>
                    </div>
                  )}
                  
                  {/* Solo mostrar el número total, sin detalles de estado */}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal de detalles */}
      {showDetailsModal && selectedReservation && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Detalles de Reservación
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedReservation.status)}`}>
                  {getStatusText(selectedReservation.status)}
                </span>
              </div>
              
              {/* Información básica */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(selectedReservation.reservation_date)}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hora
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {formatTime(selectedReservation.reservation_time)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Personas
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedReservation.number_of_people}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zona
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedReservation.zone}
                  </p>
                </div>
              </div>
              
              {/* Ocasión especial */}
              {selectedReservation.special_occasion && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ocasión Especial
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedReservation.special_occasion}
                  </p>
                </div>
              )}
              
              {/* Preferencias de mesa */}
              {selectedReservation.table_preferences && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Preferencias de Mesa
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedReservation.table_preferences}
                  </p>
                </div>
              )}
              
              {/* Pedido anticipado */}
              {selectedReservation.advance_order_items.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Pedido Anticipado
                  </label>
                  <div className="space-y-2">
                    {selectedReservation.advance_order_items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cantidad: {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${item.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Notas */}
              {selectedReservation.notes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedReservation.notes}
                  </p>
                </div>
              )}
              
              {/* Acciones */}
              <div className="flex gap-3 pt-4">
                {selectedReservation.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'confirmed')}
                      disabled={updatingStatus === selectedReservation.id}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'cancelled')}
                      disabled={updatingStatus === selectedReservation.id}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">cancel</span>
                      Cancelar
                    </button>
                  </>
                )}
                
                {selectedReservation.status === 'confirmed' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'completed')}
                      disabled={updatingStatus === selectedReservation.id}
                      className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">task_alt</span>
                      Completar
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(selectedReservation.id, 'no_show')}
                      disabled={updatingStatus === selectedReservation.id}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-base">person_off</span>
                      No Show
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsManagementScreen;