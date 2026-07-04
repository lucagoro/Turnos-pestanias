import React from 'react'
import Header from '../components/Header.jsx'
import api from '../api.js'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const Home = () => {

const [services, setServices] = useState([])

useEffect(() => {
    // Llamamos al backend
    api.get('/services')
      .then(response => {
        setServices(response.data)
      })
      .catch(error => {
        console.error('Error al traer servicios:', error)
        toast.error("Error al cargar servicios. Intenta de nuevo.");
      })
  }, [])

  // Iconos decorativos para los cuadritos (puedes variarlos según el servicio)
  const getIcon = (index) => {
    const icons = ['✦', '✦✦', '◇', '↺', '✨', '♡'];
    return icons[index % icons.length];
  };


  return (
    <div className="min-h-screen bg-warm-white font-sans text-text-dark">
      {/* Hero Section */}
      <header className="relative px-5 py-10 text-center bg-gradient-to-b from-rose-light to-warm-white sm:px-6 sm:py-12">
        
        {/* Contenedor Horizontal Estilo Estudio */}
        <div className="relative mx-auto mb-8 w-full max-w-md aspect-[16/10] overflow-hidden rounded-2xl border border-rose-mid/20 bg-white p-1.5 shadow-md shadow-rose-text/5">
          {/* Imagen en formato horizontal optimizada para detalles */}
          <div className="relative h-full w-full overflow-hidden rounded-[10px] active:scale-[1.01] transition-transform duration-500">
            <img 
              src="/images/ft-home-tres.jpeg" 
              alt="Visage Studio - Resultado" 
              className="absolute max-none w-[170%] scale-[1.80] h-auto -left-[-12%] -top-[35%] brightness-[1.03] saturate-[1.05] contrast-[1.02]"
            />
          </div>

          {/* Sombreado perimetral interno para dar profundidad sin oscurecer */}
          <div className="absolute inset-1.5 z-20 rounded-[10px] ring-1 ring-inset ring-black/5 pointer-events-none"></div>

          {/* Etiqueta minimalista integrada de forma sutil */}
          <div className="absolute bottom-3.5 left-4 z-30 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-rose-mid/10">
            <span className="w-1 h-1 rounded-full bg-rose-text animate-pulse"></span>
            <span className="font-sans text-[8px] uppercase tracking-[0.15em] text-rose-text font-semibold">
              Trabajo Real
            </span>
          </div>
        </div>

          
        <h1 className="mb-4 font-serif text-3xl leading-tight text-text-dark sm:text-4xl">
          Tu mejor versión,<br />
          <span className="italic text-rose-text">empieza en tu mirada</span>
        </h1>
        
        <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-text-mid">
          Cejas y pestañas By Yas
        </p>

        <Link 
          to="/services" 
          className="inline-block w-full max-w-xs rounded-full bg-rose-text px-8 py-4 text-sm font-medium tracking-wide text-white transition-transform hover:-translate-y-1 hover:bg-rose-text/90 active:scale-95 shadow-lg shadow-rose-text/20"
        >
          ✦ Agendar Mi Turno
        </Link>
      </header>

      {/* Services Grid 2x2 (Estilo del HTML original) */}
      <section className="px-5 py-8 sm:px-6">
        <div className="mb-8 text-center">
          <h2 className="font-serif text-2xl text-text-dark">Nuestros Servicios</h2>
          <p className="text-xs tracking-wide text-text-mid uppercase">Elegí el tratamiento ideal para vos</p>
        </div>

        {/* Grid de 2 columnas (2x2 en mobile) */}
        <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
          {services.slice(0, 4).map((service, index) => (
            <Link 
              to="/services" 
              key={service.id}
              className={`flex flex-col items-center justify-center rounded-2xl border border-rose-mid p-5 text-center transition-all active:scale-95 ${
                index % 3 === 0 ? 'bg-rose-light/40' : 'bg-beige-soft/40'
              }`}
            >
              <div className="mb-2 text-2xl text-rose-text">{getIcon(index)}</div>
              <h3 className="font-serif text-sm font-medium text-text-dark leading-tight">{service.name}</h3>
              <span className="mt-2 text-[10px] uppercase tracking-widest text-text-mid">Ver detalle</span>
            </Link>
          ))}
        </div>

        {/* Botón para ver todos si hay más de 4 */}
        {services.length > 4 && (
          <div className="mt-8 text-center">
            <Link to="/services" className="text-xs font-semibold uppercase tracking-widest text-rose-text underline underline-offset-4">
              Ver todos los servicios
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home
