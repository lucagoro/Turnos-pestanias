import { Link, useSearchParams } from 'react-router-dom';

const SuccessPage = () => {
  const [searchParams] = useSearchParams();
  const method = searchParams.get('method')?.toLowerCase();
  const isTransfer = method === 'transferencia';
  const isMP = searchParams.has('collection_status') || searchParams.get('status') === 'approved';
  const requiresProof = isTransfer || method === 'efectivo';

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        
        {/* Ícono de Éxito Aesthetic */}
        <div className="mb-8 relative inline-block">
          <div className="w-24 h-24 bg-rose-light rounded-full flex items-center justify-center animate-pulse">
            <span className="text-4xl">❀</span>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-rose-mid">
            <span className="text-rose-text text-sm font-bold">✓</span>
          </div>
        </div>

        <h1 className="font-serif text-3xl text-text-dark mb-4 italic">
          {isMP ? '¡Pago Confirmado!' : '¡Reserva realizada!'}
        </h1>
        
        <div className="space-y-4 text-text-mid text-sm leading-relaxed mb-10">
          <p>
            Gracias por elegir <span className="font-bold text-rose-text">Visage</span>. 
            {isMP 
              ? ' Tu pago fue aprobado con éxito y tu lugar ya está asegurado en la agenda.' 
              : ' Tu espacio ha sido reservado con éxito.'
            }
          </p>
          
          {requiresProof ? (
            <div className="bg-white/50 border border-rose-mid/30 p-4 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest font-bold text-rose-deep mb-1">Paso siguiente</p>
              <p className="italic text-xs">
                Envía el comprobante de pago por WhatsApp para que podamos confirmar tu turno.
              </p>
            </div>
          ) : (
            <p>Te enviamos un WhatsApp con los detalles del turno.</p>
          )}
        </div>

        <div className="space-y-3">
          <Link 
            to="/" 
            className="block w-full py-4 bg-rose-text text-white rounded-full font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-text/20 hover:bg-rose-deep transition-all"
          >
            Volver al inicio
          </Link>
        </div>

        <p className="mt-12 text-[10px] uppercase tracking-[0.3em] text-rose-mid font-bold">
          Te esperamos para brillar ✦
        </p>
      </div>
    </div>
  );
};

export default SuccessPage;