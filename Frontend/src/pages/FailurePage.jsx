import { Link } from 'react-router-dom';

const FailurePage = () => {
  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center bg-white border border-rose-mid/30 rounded-3xl p-8 shadow-xl">
        <div className="mb-6 inline-block w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
          <span className="text-3xl">❌</span>
        </div>

        <h1 className="font-serif text-2xl text-text-dark mb-3">No pudimos procesar tu pago</h1>
        <p className="text-sm text-text-mid mb-8 leading-relaxed">
          Hubo un problema con la tarjeta o la operación fue cancelada. No te preocupes, tu dinero no fue debitado y podés volver a intentar la reserva.
        </p>

        <Link 
          to="/booking" 
          className="inline-block w-full py-4 bg-text-dark text-white font-bold uppercase tracking-widest text-xs rounded-full shadow-md hover:bg-black transition-all"
        >
          Reintentar Reserva ↩
        </Link>
      </div>
    </div>
  );
};

export default FailurePage;