import Home from './pages/Home.jsx'
import Header from './components/Header.jsx'
import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Service from './pages/Service.jsx'
import BookingPage from './pages/BookingPage.jsx'
import ConfirmationPage from './pages/ConfirmationPage.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminSettings from './pages/AdminSettings.jsx'
import AdminLayout from './components/AdminLayout.jsx'
import SuccessPage from './pages/SuccessPage.jsx'
import toast, { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'

// Componente para hacer scroll al tope cuando cambia la ruta
const ScrollToTop = () => {
  const { pathname } = useLocation()
  
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  
  return null
}

// 1. Layout para CLIENTAS (Público)
const PublicLayout = () => (
  <div className="flex min-h-screen flex-col bg-warm-white">
    <Header />
    <main className="flex-grow">
      <Outlet /> {/* Aquí irán Home, Service, Booking, etc. */}
    </main>
    <Footer />
  </div>
);

function App() {

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster />
      <Routes>
        
        {/* GRUPO 1: CLIENTAS (Con Header y Footer) */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Service />} />
          <Route path="/booking" element={<BookingPage />} />
          <Route path="/confirm" element={<ConfirmationPage />} />
          <Route path="/success" element={<SuccessPage />} />
        </Route>

        {/* GRUPO 2: ADMIN (Sin Header/Footer de clienta, con AdminNavbar) */}
        {/* Usamos el AdminLayout que te pasé antes (el que tiene el token check) */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* LOGIN: Solo, sin ningún navbar */}
        <Route path="/admin/login" element={<AdminLogin />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App