import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const AdminSettings = () => {
  const [services, setServices] = useState([]);
  const [combos, setCombos] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [newBlockDate, setNewBlockDate] = useState('');
  const [blockType, setBlockType] = useState('allDay');
  const [newBlockStartTime, setNewBlockStartTime] = useState('');
  const [newBlockEndTime, setNewBlockEndTime] = useState('');
  const [newBlockReason, setNewBlockReason] = useState('Día Libre');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [resServices, resCombos, resBlocks] = await Promise.all([
      api.get('/services'),
      api.get('/combos'),
      api.get('/admin/blocks')
    ]);
    setServices(resServices.data);
    setCombos(resCombos.data);
    setBlocks(resBlocks.data);
  };

  // Función para actualizar precio de un servicio
  const updatePrice = async (id, newPrice) => {
    if (!newPrice || newPrice <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    try {
      await api.patch(`/admin/services/${id}`, { price: parseFloat(newPrice) });
      fetchData();
      toast.success("Precio actualizado");
    } catch (err) { 
      console.error(err);
      toast.error("Error al actualizar"); 
    }
  };

  const updateComboPrice = async (id, newPrice) => {
    if (!newPrice || newPrice <= 0) {
      toast.error("Ingresa un precio válido");
      return;
    }
    try {
      await api.patch(`/admin/combos/${id}`, { price: parseFloat(newPrice) });
      fetchData();
      toast.success("Precio del combo actualizado");
    } catch (err) { 
      console.error(err);
      toast.error("Error al actualizar el combo"); 
    }
  };

  const formatBlockTime = (block) => {
    if (block.allDay) return 'Todo el día';
    if (!block.startTime || !block.endTime) return 'Horario parcial';

    const start = new Date(block.startTime);
    const end = new Date(block.endTime);
    return `${start.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })} - ${end.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  };

  const handleAddBlock = async () => {
    if (!newBlockDate) {
      toast.error("Selecciona una fecha");
      return;
    }

    try {
      const payload = {
        date: newBlockDate,
        allDay: blockType === 'allDay',
        reason: newBlockReason || 'Día Libre'
      };

      if (blockType === 'partial') {
        if (!newBlockStartTime || !newBlockEndTime) {
          toast.error("Selecciona hora de inicio y fin");
          return;
        }

        const startDateTime = new Date(`${newBlockDate}T${newBlockStartTime}`);
        const endDateTime = new Date(`${newBlockDate}T${newBlockEndTime}`);

        if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
          toast.error("Formato de hora inválido");
          return;
        }

        if (startDateTime >= endDateTime) {
          toast.error("La hora de inicio debe ser anterior a la de fin");
          return;
        }

        payload.startTime = startDateTime.toISOString();
        payload.endTime = endDateTime.toISOString();
      }

      await api.post('/admin/blocks', payload);
      setNewBlockDate('');
      setNewBlockStartTime('');
      setNewBlockEndTime('');
      setNewBlockReason('Día Libre');
      setBlockType('allDay');
      fetchData();
      toast.success(blockType === 'allDay' ? 'Día bloqueado' : 'Horario bloqueado');
    } catch (err) {
      console.error(err);
      toast.error("Error al bloquear agenda");
    }
  };

  return (
    <div className="min-h-screen bg-warm-white">
      
      <main className="max-w-4xl mx-auto p-6 space-y-10">
        
        {/* SECCIÓN: SERVICIOS */}
        <section>
          <h2 className="flex justify-center font-serif text-2xl mb-6">Mis Servicios</h2>
          <div className="grid gap-4">
            {services.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl border border-rose-mid/30 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-medium text-text-dark">{s.name}</p>
                  <p className="text-[10px] text-text-mid uppercase tracking-widest">{s.durationMinutes} min</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-text">$</span>
                  <input 
                    type="number" 
                    id={`price-${s.id}`}
                    className="w-20 p-2 border-b border-rose-mid outline-none text-right text-sm"
                    defaultValue={s.price}
                  />
                  <button 
                    onClick={() => {
                      const newPrice = document.getElementById(`price-${s.id}`).value;
                      updatePrice(s.id, newPrice);
                    }}
                    className="text-xs font-bold text-white bg-rose-text hover:bg-rose-deep px-2 py-1.5 rounded transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <hr className="border-rose-mid/20" />

        {/* COMBOS */}
        <section>
          <h2 className="flex justify-center font-serif text-2xl mb-6">Mis Combos</h2>
          <div className="grid gap-4">
            {combos.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-rose-mid/30 flex justify-between items-center shadow-sm">
                <div>
                  <p className="font-medium text-text-dark">{c.name}</p>
                  {/* Si tus combos tienen descripción o lista de servicios podés renderizarla de fondo de forma sutil */}
                  <p className="text-[10px] text-rose-text uppercase tracking-widest italic">Combo Especial</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-text">$</span>
                  <input 
                    type="number" 
                    id={`combo-price-${c.id}`}
                    className="w-20 p-2 border-b border-rose-mid outline-none text-right text-sm"
                    defaultValue={c.price}
                  />
                  <button 
                    onClick={() => {
                      const newPrice = document.getElementById(`combo-price-${c.id}`).value;
                      updateComboPrice(c.id, newPrice);
                    }}
                    className="text-xs font-bold text-white bg-rose-text hover:bg-rose-deep px-2 py-1.5 rounded transition-colors"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            ))}
            {combos.length === 0 && (
              <p className="text-center text-sm text-text-mid italic">No hay combos configurados actualmente.</p>
            )}
          </div>
        </section>

        <hr className="border-rose-mid/20" />

        {/* SECCIÓN: BLOQUEOS DE AGENDA */}
        <section className="bg-rose-light/20 p-6 rounded-3xl border border-rose-mid/50">
          <h2 className="font-serif text-2xl mb-2">Bloqueos de Agenda</h2>
          <p className="text-xs text-text-mid mb-6">Configura días completos o franjas horarias en las que no quieras recibir turnos.</p>
          
          <div className="grid gap-4 mb-6 lg:grid-cols-[1fr_auto]">
            <div className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="text-[10px] uppercase tracking-[0.35em] text-text-mid font-bold">Fecha</label>
                <input 
                  type="date" 
                  value={newBlockDate}
                  onChange={(e) => setNewBlockDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-mid outline-none text-sm"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[10px] uppercase tracking-[0.35em] text-text-mid font-bold">Tipo de bloqueo</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setBlockType('allDay')}
                    className={`flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] transition ${blockType === 'allDay' ? 'bg-rose-text text-white' : 'bg-white text-text-mid border border-rose-mid/50'}`}
                  >
                    Día completo
                  </button>
                  <button
                    type="button"
                    onClick={() => setBlockType('partial')}
                    className={`flex-1 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] transition ${blockType === 'partial' ? 'bg-rose-text text-white' : 'bg-white text-text-mid border border-rose-mid/50'}`}
                  >
                    Franja horaria
                  </button>
                </div>
              </div>

              {blockType === 'partial' && (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.35em] text-text-mid font-bold mb-2">Inicio</label>
                    <input 
                      type="time"
                      value={newBlockStartTime}
                      onChange={(e) => setNewBlockStartTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-rose-mid outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.35em] text-text-mid font-bold mb-2">Fin</label>
                    <input 
                      type="time"
                      value={newBlockEndTime}
                      onChange={(e) => setNewBlockEndTime(e.target.value)}
                      className="w-full p-3 rounded-xl border border-rose-mid outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.35em] text-text-mid font-bold mb-2">Motivo</label>
                    <input 
                      type="text"
                      value={newBlockReason}
                      onChange={(e) => setNewBlockReason(e.target.value)}
                      className="w-full p-3 rounded-xl border border-rose-mid outline-none text-sm"
                      placeholder="Ej. Médico, Vacaciones"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={handleAddBlock}
                className="w-full bg-rose-text text-white px-6 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-sm shadow-rose-text/20"
              >
                {blockType === 'allDay' ? 'Bloquear día' : 'Bloquear franja'}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-5 border border-rose-mid/40 shadow-sm">
              <p className="text-xs uppercase tracking-widest text-text-mid mb-3">Resumen de bloqueos</p>
              <div className="space-y-3">
                {blocks.length === 0 && (
                  <p className="text-sm text-text-mid">No hay bloqueos configurados.</p>
                )}
                {blocks.map(b => (
                  <div key={b.id} className="rounded-2xl border border-rose-mid/20 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-text-dark">
                          {new Date(b.date).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider text-text-mid mt-1">
                          {formatBlockTime(b)} · {b.reason || 'Sin motivo'}
                        </p>
                      </div>
                      <button 
                        onClick={async () => {
                          await api.delete(`/admin/blocks/${b.id}`);
                          fetchData();
                          toast.success("Bloqueo eliminado");
                        }}
                        className="text-rose-deep text-[10px] font-bold uppercase tracking-tighter"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};
  export default AdminSettings;