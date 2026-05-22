import React from 'react'
import { Link, useLocation } from 'react-router-dom';

const Header = () => {
  const location = useLocation();

  const handleContactClick = (e) => {
    e.preventDefault();
    const footer = document.getElementById('contact');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Contacto', path: '#contact', isAnchor: true },
  ];


  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-warm-white border-rose-mid px-5 py-4 sm:px-6">
      <div className="flex w-full gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Logo Area */}
        <Link to="/" className="flex items-center gap-3 active:opacity-80 select-none">
          {/* Isotipo: Icono de Ojo y Pestañas Minimalista */}
          <div className="flex items-center justify-center w-9 h-9 rounded-full border border-rose-mid/40 bg-rose-light flex-shrink-0">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className="w-5 h-5 text-rose-text"
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              {/* Silueta del ojo (párpado superior) */}
              <path d="M2 12s3-7 10-7 10 7 10 7" />
              {/* Pestañas superiores estilizadas */}
              <path d="M7 8.5L5.5 6" />
              <path d="M12 7V4" />
              <path d="M17 8.5L18.5 6" />
              {/* Iris / Pupila central */}
              <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" />
            </svg>
          </div>

          {/* Logotipo: Nombre de la marca fino */}
          <div className="flex flex-col justify-center">
            <span className="font-serif text-xl font-medium text-rose-text tracking-wide leading-none">
              Visage
            </span>
            <span className="font-sans text-[8px] uppercase tracking-[0.18em] text-rose-mid mt-1.5 font-semibold leading-none">
              Cejas & Pestañas
            </span>
          </div>
        </Link>




        {/* Navigation */}
        <div className="flex w-full items-center justify-end gap-3 sm:w-auto sm:flex-row sm:gap-4 pt-2 sm:pt-2">
          {navLinks.map((link) => (
            link.isAnchor ? (
              <button
                key={link.path}
                onClick={handleContactClick}
                className="text-xs uppercase tracking-widest leading-none transition-all duration-300 pb-1 border-b-2 text-text-mid border-transparent hover:text-rose-text"
              >
                {link.name}
              </button>
            ) : (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs uppercase tracking-widest leading-none transition-all duration-300 pb-1 border-b-2 ${
                  location.pathname === link.path 
                    ? 'text-rose-text border-rose-deep' 
                    : 'text-text-mid border-transparent hover:text-rose-text'
                }`}
              >
                {link.name}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  )
}

export default Header
