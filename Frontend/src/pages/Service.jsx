import React from 'react'
import { useEffect, useState } from 'react'
import api from '../api.js'
import { Link } from 'react-router-dom'
import Stepper from '../components/Stepper.jsx'
import toast from 'react-hot-toast'

const Service = () => {
  const [services, setServices] = useState([])
  const [combos, setCombos] = useState([])
  const [activeTab, setActiveTab] = useState('services')

  useEffect(() => {
    api.get('/services')
      .then(response => setServices(response.data))
      .catch(error => {
        console.error('Error al traer servicios:', error)
        toast.error('Error al cargar servicios. Intenta de nuevo.')
      })

    api.get('/combos')
      .then(response => setCombos(response.data))
      .catch(error => {
        console.error('Error al traer combos:', error)
        toast.error('Error al cargar combos. Intenta de nuevo.')
      })
  }, [])

  return (
    <div className="min-h-screen bg-warm-white font-sans text-text-dark">
      {/* Back Button */}
      <div className="px-5 py-6 sm:px-6">
        <Link 
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-rose-text hover:text-rose-deep transition-colors"
        >
          ← Volver
        </Link>
        {/* Indicador de Pasos - Estamos en el Paso 1 */}
        <div className="pt-4">
          <Stepper currentStep={1} />
        </div>
      </div>

      {/* Services Section */}
      <section className="px-5 pb-10 sm:px-6 sm:pb-12">
        <div className="mb-10 text-center">
          <h2 className="font-serif text-2xl text-text-dark">Nuestros Servicios</h2>
          <p className="text-xs tracking-wide text-text-mid">Elegí el tratamiento ideal para vos</p>
        </div>

        {/* Tabs Estilo Minimal con Desplazamiento */}
        <div className="relative flex max-w-md mx-auto mb-10 overflow-hidden rounded-full border border-rose-mid p-1 bg-beige-soft/30 select-none">
          
          {/* Fondo animado que se desliza */}
          <div 
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-rose-text shadow-md transition-transform duration-300 ease-out ${
              activeTab === 'combos' ? 'translate-x-full' : 'translate-x-0'
            }`}
          />

          {/* Botón: Servicios */}
          <button
            onClick={() => setActiveTab('services')}
            className={`relative z-10 flex-1 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 rounded-full ${
              activeTab === 'services' ? 'text-white' : 'text-text-mid'
            }`}
          >
            Servicios
          </button>

          {/* Botón: Combos */}
          <button
            onClick={() => setActiveTab('combos')}
            className={`relative z-10 flex-1 py-2 text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-300 rounded-full ${
              activeTab === 'combos' ? 'text-white' : 'text-text-mid'
            }`}
          >
            Combos
          </button>
        </div>


        {/* Services Tab Content */}
        {activeTab === 'services' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="group relative flex flex-col rounded-2xl border border-rose-mid bg-warm-white p-6 transition-all hover:border-rose-deep hover:shadow-lg hover:shadow-rose-text/5"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="font-serif text-xl text-text-dark">{service.name}</h3>
                  <span className="font-sans font-medium text-rose-text bg-rose-light/50 px-3 py-1 rounded-full text-sm">
                    ${service.price.toLocaleString('es-AR')}
                  </span>
                </div>
                
                <p className="mb-6 text-sm leading-relaxed text-text-mid italic font-light">
                  "{service.description}"
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-rose-mid/30 pt-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-rose-text">⏱</span>
                    <span className="text-[10px] uppercase tracking-wider text-text-mid font-semibold">
                      {service.durationMinutes} min
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-text-mid font-semibold"> · Seña: ${(service.price * 0.3).toLocaleString('es-AR')}</span>
                  </div>
                  <Link 
                    to={`/booking?serviceId=${service.id}`}
                    className="inline-block rounded-full bg-rose-text px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-rose-deep active:scale-95 shadow-sm"
                  >
                    Seleccionar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'combos' && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {combos.length > 0 ? combos.map((combo) => {
              const totalDuration = combo.services.reduce((sum, service) => sum + service.durationMinutes, 0)
              const serviceNames = combo.services.map(service => service.name).join(' • ')

              return (
                <div
                  key={combo.id}
                  className="group relative flex flex-col rounded-2xl border border-rose-mid bg-warm-white p-6 transition-all hover:border-rose-deep hover:shadow-lg hover:shadow-rose-text/5"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <h3 className="font-serif text-xl text-text-dark">{combo.name}</h3>
                    <span className="font-sans font-medium text-rose-text bg-rose-light/50 px-3 py-1 rounded-full text-sm">
                      ${combo.price.toLocaleString('es-AR')}
                    </span>
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-text-mid italic font-light">
                    "{combo.description}"
                  </p>

                  <div className="mb-5 rounded-2xl bg-rose-light/10 p-4 text-[11px] text-text-mid pl-2">
                    <p className="font-semibold text-text-dark mb-2">Incluye:</p>
                    <p className="leading-snug">{serviceNames}</p>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-rose-mid/30 pt-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-rose-text">⏱</span>
                      <span className="text-[10px] uppercase tracking-wider text-text-mid font-semibold">
                        {totalDuration} min
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-text-mid font-semibold"> · Seña: ${(combo.price * 0.3).toLocaleString('es-AR')}</span>
                    </div>
                    <Link
                      to={`/booking?comboId=${combo.id}`}
                      className="inline-block rounded-full bg-rose-text px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-white transition-all hover:bg-rose-deep active:scale-95 shadow-sm"
                    >
                      Seleccionar
                    </Link>
                  </div>
                </div>
              )
            }) : (
              <div className="max-w-md mx-auto text-center py-20 border-2 border-dashed border-rose-mid/40 rounded-3xl">
                <span className="text-2xl mb-2 block">✨</span>
                <p className="text-xs uppercase tracking-widest text-text-mid">No hay combos disponibles por ahora</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

export default Service
