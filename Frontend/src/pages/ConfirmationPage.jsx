import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../api';
import Stepper from '../components/Stepper';
import toast from 'react-hot-toast';

const normalizeWhatsapp = (phone) => phone.toString().replace(/\D/g, '');
const formatWhatsapp = (phone) => {
  const digits = normalizeWhatsapp(phone);
  if (digits.startsWith('549')) return digits;
  if (digits.startsWith('54')) return digits;
  return `549${digits}`;
};
const isValidWhatsapp = (phone) => {
  const digits = normalizeWhatsapp(phone);
  const normalized = formatWhatsapp(digits);
  return normalized.length >= 12 && normalized.length <= 15;
};

const ConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Datos que vienen de la URL
  const serviceId = searchParams.get('serviceId');
  const comboId = searchParams.get('comboId');
  const dateStr = searchParams.get('date');
  const slot = searchParams.get('slot');

  const [paymentMethod, setPaymentMethod] = useState('MP');
  const [item, setItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLocalDateFromDateStr = (value) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  };

  const buildLocalStartTimeISOString = (value, slotValue) => {
    if (!value || !slotValue) return null;
    const [year, month, day] = value.split('-').map(Number);
    const [hour, minute] = slotValue.split(':').map(Number);
    if ([year, month, day, hour, minute].some((num) => Number.isNaN(num))) return null;
    return new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();
  };

  useEffect(() => {
    if (serviceId) {
      api.get(`/services/${serviceId}`).then(res => setItem(res.data));
    }

    if (comboId) {
      api.get(`/combos/${comboId}`).then(res => setItem(res.data));
    }
  }, [serviceId, comboId]);

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!isValidWhatsapp(formData.phone)) {
    toast.error('Ingresa un número de WhatsApp válido');
    return;
  }

  setIsSubmitting(true);
  const clientWhatsApp = formatWhatsapp(formData.phone);
  const startTime = buildLocalStartTimeISOString(dateStr, slot);
  if (!startTime) {
    toast.error('Fecha u hora inválida. Vuelve a seleccionar el turno.');
    setIsSubmitting(false);
    return;
  }

  const bookingData = {
      clientName: formData.name,
      clientWhatsApp,
      startTime,
      paymentMethod,
      ...(serviceId ? { serviceId: Number(serviceId) } : {}),
      ...(comboId ? { comboId: Number(comboId) } : {})
  };

  try {
    if (paymentMethod === 'MP') {
      const res = await api.post('/appointments', bookingData);
      window.location.href = res.data.init_point;
    } else {
      await api.post('/appointments', bookingData);
      navigate('/success?method=transferencia');
    }
  } catch (error) {
    console.error(error);
    toast.error('Error al reservar. Intenta de nuevo.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-warm-white pb-10">
      {/* Back Button */}
      <div className="px-5 py-6 sm:px-6">
        <Link 
          to="/booking"
          className="inline-flex items-center gap-2 text-sm font-medium text-rose-text hover:text-rose-deep transition-colors"
        >
          ← Volver
        </Link>
        {/* Indicador de Pasos - Estamos en el Paso 3 */}
        <div className="pt-4">
          <Stepper currentStep={3} />
        </div>
      </div>

      <main className="px-6 max-w-md mx-auto mt-8">
        <h2 className="font-serif text-3xl text-text-dark text-center mb-8">Confirmar Turno</h2>

        {/* Resumen del Turno (Ticket Style) */}
        <div className="relative bg-white border border-rose-mid rounded-3xl p-6 shadow-sm mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 font-serif text-6xl">✦</div>
          
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-text-mid font-bold">Servicio / Combo</p>
              <p className="font-serif text-xl text-rose-text">{item?.name || 'Cargando...'}</p>
              {comboId && item?.services && (
                <p className="mt-2 text-xs text-text-mid">Incluye: {item.services.map(service => service.name).join(', ')}</p>
              )}
            </div>

            <div className="flex justify-between border-t border-rose-mid/20 pt-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-mid font-bold">Fecha</p>
                <p className="text-sm font-medium">
                  {dateStr ? format(getLocalDateFromDateStr(dateStr), "EEEE d 'de' MMMM", { locale: es }) : '-'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-text-mid font-bold">Hora</p>
                <p className="text-sm font-medium">{slot} hs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario de Datos */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-mid font-bold mb-2 ml-1">Nombre Completo</label>
            <input 
              required
              type="text" 
              className="w-full bg-white border border-rose-mid/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-rose-text transition-colors"
              placeholder="Ej: Ana García"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-text-mid font-bold mb-2 ml-1">WhatsApp</label>
            <input 
              required
              type="tel" 
              className="w-full bg-white border border-rose-mid/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-rose-text transition-colors"
              placeholder="Ej: 11 2345 6789"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
            <p className="mt-2 text-[10px] text-text-mid">No hace falta ingresar el código internacional 549, solo área y número.</p>
          </div>

          <div className="space-y-3 mb-8">
            <p className="text-[10px] uppercase tracking-widest text-text-mid font-bold ml-1">Método de Seña</p>
            
            <div 
                onClick={() => setPaymentMethod('MP')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                paymentMethod === 'MP' ? 'border-rose-text bg-rose-light/20' : 'border-rose-mid/30 bg-white'
                }`}
            >
                <span className="text-sm font-medium">Mercado Pago (Crédito/Débito)</span>
                <div className={`h-4 w-4 rounded-full border-2 ${paymentMethod === 'MP' ? 'border-rose-text bg-rose-text' : 'border-rose-mid'}`}></div>
            </div>

            <div 
                onClick={() => setPaymentMethod('TRANSFERENCIA')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                paymentMethod === 'TRANSFERENCIA' ? 'border-rose-text bg-rose-light/20' : 'border-rose-mid/30 bg-white'
                }`}
            >
                <span className="text-sm font-medium">Transferencia / Otros (vía WhatsApp)</span>
                <div className={`h-4 w-4 rounded-full border-2 ${paymentMethod === 'TRANSFERENCIA' ? 'border-rose-text bg-rose-text' : 'border-rose-mid'}`}></div>
            </div>
            </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-5 rounded-full font-bold uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${
              isSubmitting ? 'bg-text-mid cursor-not-allowed' : 'bg-rose-text text-white hover:bg-rose-deep shadow-rose-text/20'
            }`}
          >
            {isSubmitting ? 'Procesando...' : 'Finalizar Reserva ✨'}
          </button>
        </form>
      </main>
    </div>
  );
};

export default ConfirmationPage;