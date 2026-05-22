import React from 'react'
import { MessageCircle, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer id="contact" className="mt-auto border-t border-rose-mid bg-warm-white px-6 py-10 text-center">
      {/* Redes Sociales */}
      <div className="mb-8 flex justify-center gap-6">
        {/* Botón Instagram - SVG Manual */}
        <a 
          href="https://instagram.com/visageby_yas" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-mid bg-rose-light text-rose-text transition-transform active:scale-90"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>
        <a 
          href="https://wa.me/5492314617457" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-mid bg-rose-light text-rose-text transition-transform active:scale-90"
        >
          <MessageCircle size={20} />
        </a>
      </div>

      {/* Información de Contacto */}
      <div className="mb-6 space-y-1">
        <div className="flex items-center justify-center gap-2 text-rose-text">
        <MapPin size={14} />
        <p className="text-xs text-text-mid uppercase tracking-widest">Falucho 370</p>
        </div>
        <p className="text-xs text-text-mid">Bolivar, Buenos Aires · Argentina</p>
      </div>

      {/* Separador sutil */}
      <div className="mx-auto mb-6 h-px w-12 bg-rose-mid"></div>

      {/* Copyright */}
      <p className="text-[10px] uppercase tracking-[0.2em] text-text-mid/60">
        © 2026 Visage · All Rights Reserved
      </p>
    </footer>
  )
}

export default Footer
