import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api.js';
import Stepper from '../components/Stepper';
import BookingCalendar from '../components/BookingCalendar';
import { format, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

const BookingPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const serviceId = searchParams.get('serviceId');
  const comboId = searchParams.get('comboId');
  
  // Función para validar que date sea un Date válido
  const isValidDate = (date) => date instanceof Date && !isNaN(date.getTime());
  
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [item, setItem] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  // Función segura para actualizar fecha
  const handleDateChange = (date) => {
    if (isValidDate(date)) {
      setSelectedDate(date);
      setSelectedSlot(null); // Resetear slot seleccionado cuando cambia la fecha
    }
  };

  // Calcular dateStr de forma segura
  const dateStr = useMemo(() => {
    if (!selectedDate || !(selectedDate instanceof Date) || isNaN(selectedDate.getTime())) {
      return format(new Date(), 'yyyy-MM-dd');
    }
    return format(selectedDate, 'yyyy-MM-dd');
  }, [selectedDate]);

  useEffect(() => {
    if (serviceId) {
      api.get(`/services/${serviceId}`)
        .then(res => {
          setItem(res.data);
          setDurationMinutes(res.data.durationMinutes);
        })
        .catch(err => console.error(err));
    }

    if (comboId) {
      api.get(`/combos/${comboId}`)
        .then(res => {
          setItem(res.data);
          const totalDuration = res.data.services.reduce((sum, service) => sum + service.durationMinutes, 0);
          setDurationMinutes(totalDuration);
        })
        .catch(err => console.error(err));
    }
  }, [serviceId, comboId]);

  useEffect(() => {
    if (!selectedDate || (!serviceId && !comboId)) return;

    setLoadingSlots(true);
    const queryParam = serviceId ? `serviceId=${serviceId}` : `comboId=${comboId}`;

    api.get(`/availability?${queryParam}&date=${dateStr}`)
      .then(res => {
        setAvailableSlots(res.data.availableSlots || []);
      })
      .catch(err => {
        toast.error('Error al cargar horarios. Intenta de nuevo.');
        console.error(err);
      })
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, serviceId, comboId, dateStr]);

  // Filtrar horarios que ya pasaron si la fecha es hoy
  const filteredSlots = useMemo(() => {
    const today = startOfToday();
    const selectedDateOnly = startOfToday();
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

    if (!isToday) return availableSlots;

    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    return availableSlots.filter(slot => slot > currentTime);
  }, [availableSlots, selectedDate]);

  return (
    <div className="min-h-screen bg-warm-white pb-24">
      {/* Back Button */}
      <div className="px-5 py-6 sm:px-6">
        <Link 
          to="/services"
          className="inline-flex items-center gap-2 text-sm font-medium text-rose-text hover:text-rose-deep transition-colors"
        >
          ← Volver
        </Link>
        {/* Indicador de Pasos - Estamos en el Paso 2 */}
        <div className="pt-4">
          <Stepper currentStep={2} />
        </div>
      </div>

      <main className="px-5 max-w-md mx-auto">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-3xl text-text-dark">Reserva tu cita</h2>
          {item && (
            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-rose-light/50 border border-rose-mid/30">
              <p className="text-[10px] uppercase tracking-widest text-rose-text font-bold">
                {item.name} • {durationMinutes} min
              </p>
            </div>
          )}
        </div>

        {/* El Calendario con la librería */}
        <BookingCalendar 
          selectedDate={selectedDate} 
          onSelect={handleDateChange} 
        />

        {/* Selector de Horarios */}
        {selectedDate && (
          <div className="mt-10 animate-fadeIn">
            <p className="text-[10px] uppercase tracking-[0.3em] text-text-mid font-bold mb-5 text-center">
              Horarios Disponibles
            </p>

            {/* 1. Estado de Carga */}
            {loadingSlots ? (
              <div className="flex flex-col items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-text mb-2"></div>
                <p className="text-[10px] uppercase tracking-widest text-text-mid">Buscando lugares...</p>
              </div>
            ) : filteredSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {filteredSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-4 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
                      selectedSlot === slot 
                        ? 'bg-rose-text text-white border-rose-text shadow-lg shadow-rose-text/20 -translate-y-1' 
                        : 'bg-white border-rose-mid/40 text-text-dark hover:border-rose-deep'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-beige-soft/20 rounded-3xl border border-dashed border-rose-mid/50">
                <p className="text-sm italic text-text-mid">No hay horarios disponibles para este día.</p>
                <p className="text-[10px] uppercase tracking-widest mt-2 text-rose-deep font-bold">Probá con otra fecha ✨</p>
              </div>
            )}

            {selectedSlot && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => navigate(`/confirm?${serviceId ? `serviceId=${serviceId}` : `comboId=${comboId}`}&date=${dateStr}&slot=${selectedSlot}`)}
                  className="inline-flex items-center justify-center w-full rounded-full bg-rose-text px-6 py-4 text-sm font-bold tracking-widest text-white transition hover:bg-rose-deep active:scale-95 shadow-lg shadow-rose-text/20"
                >
                  Continuar a confirmar ❀
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingPage;