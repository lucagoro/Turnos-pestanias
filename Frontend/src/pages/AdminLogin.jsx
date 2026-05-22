import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token); // Guardamos el JWT
      toast.success("Login exitoso");
      navigate('/admin/dashboard');
    } catch (err) {
      console.error("Error de login", err);
      toast.error("Credenciales incorrectas. Intenta de nuevo.");
    }
  };

  return (
    <div className="min-h-screen bg-warm-white flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-rose-mid shadow-sm">
        {/* Logo Area */}
        <div className="flex justify-center items-center gap-4 mb-8">
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
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="email" placeholder="Email" 
            className="w-full p-4 rounded-2xl bg-beige-soft/30 border border-rose-mid/30 outline-none focus:border-rose-text"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input 
            type="password" placeholder="Contraseña" 
            className="w-full p-4 rounded-2xl bg-beige-soft/30 border border-rose-mid/30 outline-none focus:border-rose-text"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="w-full py-4 bg-rose-text text-white rounded-full font-bold uppercase tracking-widest text-xs">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
  
};
  export default AdminLogin;