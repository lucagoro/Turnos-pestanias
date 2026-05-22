import { Navigate, Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

const AdminLayout = () => {
  const token = localStorage.getItem('token');

  // Si no hay token, lo rebota al login antes de que vea nada
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <AdminNavbar />
      <main>
        {/* Outlet es donde se renderizará el contenido de cada página (Dashboard, Settings, etc.) */}
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;