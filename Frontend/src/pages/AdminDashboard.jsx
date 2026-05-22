import { useEffect, useState } from 'react';
import api from '../api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_TRANSLATIONS = {
  'CONFIRMED': 'Confirmado',
  'PENDING_REVIEW': 'Por Revisar',
  'PENDING_PAYMENT': 'Pago Pendiente',
  'CANCELLED': 'Cancelado'
};

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {

        const res = await api.get(`/admin/appointments?date=${selectedDate}`);
        setAppointments(res.data);
      } catch (err) {
        console.error("Error al cargar turnos", err);
        toast.error("Error al cargar turnos. Intenta de nuevo.");
        // Si el error es 401 (No autorizado/Token vencido)
        if (err.response && err.response.status === 401) {
            localStorage.removeItem('token'); // Limpiamos la basura
            navigate('/admin/login');         // Re-logueo
        }
      }
    };
    fetchAppointments();
  }, [selectedDate]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700';
      case 'PENDING_REVIEW': return 'bg-amber-100 text-amber-700';
      case 'PENDING_PAYMENT': return 'bg-blue-100 text-blue-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    try {
      await api.patch(`/admin/appointments/${id}`, { status: newStatus });
      toast.success('Estado actualizado');
      // Recargar turnos
      const res = await api.get(`/admin/appointments?date=${selectedDate}`);
      setAppointments(res.data);
    } catch (err) {
      console.error("Error al actualizar turno", err);
      toast.error("Error al actualizar turno. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-warm-white p-6">
      <div className="flex justify-center mb-8">
        <h2 className="font-serif text-2xl">Agenda de hoy</h2>
      </div>
      <div className="flex justify-center mb-6">
        <input 
          type="date" 
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="p-2 rounded-lg border border-rose-mid bg-white text-sm"
        />
      </div>
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-center text-text-mid italic py-10">No hay turnos para este día.</p>
        ) : (
          appointments.map((app) => (
            <div key={app.id} className="bg-white p-5 rounded-2xl border border-rose-mid/30 shadow-sm flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-rose-text font-bold">
                  {format(new Date(app.startTime), 'HH:mm')} hs
                </p>
                <h3 className="font-medium text-text-dark">{app.clientName}</h3>
                <p className="text-xs text-text-mid">{app.service?.name || app.combo?.name}</p>
                {app.combo && app.combo.services && (
                  <p className="text-xs text-text-mid">Incluye: {app.combo.services.map(s => s.name).join(', ')}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(app.status)}`}>
                  {STATUS_TRANSLATIONS[app.status] || app.status}
                </span>
                {(app.status === 'PENDING_REVIEW' || app.status === 'PENDING_PAYMENT') && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'CONFIRMED')}
                      className="px-4 py-2 bg-rose-text text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-rose-deep shadow-lg shadow-rose-text/20 transition active:scale-95"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => updateAppointmentStatus(app.id, 'CANCELLED')}
                      className="px-4 py-2 bg-text-mid text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-gray-700 shadow-lg shadow-text-mid/20 transition active:scale-95"
                    >
                      ✗
                    </button>
                  </div>
                )}
                <a 
                  href={`https://wa.me/${app.clientWhatsApp}`} 
                  target="_blank" 
                  className="text-[12px] text-rose-text font-bold p-1"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

};
  export default AdminDashboard;