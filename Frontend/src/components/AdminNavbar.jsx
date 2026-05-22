import { NavLink, useNavigate } from 'react-router-dom';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/admin/login');
  };

  const baseStyle = "text-[10px] uppercase tracking-widest font-bold transition-all duration-300 relative pb-1";

  // Función para determinar el estilo si está activo o no
  const getLinkStyle = ({ isActive }) => 
    isActive 
      ? `${baseStyle} text-rose-text` 
      : `${baseStyle} text-text-mid hover:text-rose-text/70`;

  return (
  <nav className="bg-white border-b border-rose-mid/30 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
    {/* Logotipo en el panel de Admin */}
    <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 active:opacity-80 select-none">
      {/* Isotipo: Icono de Ojo */}
      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-rose-mid/40 bg-rose-light flex-shrink-0">
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          className="w-4.5 h-4.5 text-rose-text"
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7" />
          <path d="M7 8.5L5.5 6" />
          <path d="M12 7V4" />
          <path d="M17 8.5L18.5 6" />
          <circle cx="12" cy="12" r="2.5" fill="currentColor" fillOpacity="0.15" />
        </svg>
      </div>

      {/* Nombre de la marca fino (Sin el subtítulo abajo) */}
      <span className="font-serif text-lg font-medium text-rose-text tracking-wide leading-none">
        Visage
      </span>
    </NavLink>

    <div className="flex gap-8 items-center">
      {/* NavLink para Agenda */}
      <NavLink to="/admin/dashboard" className={getLinkStyle}>
        Agenda
        <span className="active-dot block absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-text rounded-full opacity-0 transition-opacity duration-300"></span>
      </NavLink>

      {/* NavLink para Ajustes */}
      <NavLink to="/admin/settings" className={getLinkStyle}>
        Ajustes
        <span className="active-dot block absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-text rounded-full opacity-0 transition-opacity duration-300"></span>
      </NavLink>

      <button 
        onClick={handleLogout} 
        className="text-[10px] uppercase tracking-widest font-bold text-rose-deep bg-rose-light/50 hover:bg-rose-light px-4 py-2 rounded-full transition-colors"
      >
        Salir
      </button>
    </div>
  </nav>
);


};
  export default AdminNavbar;