import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DashboardDepartamentos from './pages/DashboardDepartamentos';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import ContactosList from './components/contactos/ContactosList';
import TipoReunionList from './components/tipos-reunion/TipoReunionList';
import EventosList from './components/eventos/EventosList';
import EstadoSeguimientosList from './components/estado-seguimiento/EstadoSeguimientosList';
import OficiosList from './components/oficios/OficiosList';
import ConveniosList from './components/convenios/ConveniosList';
import EstadosList from './components/estados/EstadoList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import UnauthorizedPage from './pages/UnauthorizedPage';
import { Box, Typography, Container, Paper } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';

// Aplicar estilos directamente al componente MainLayout
function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Estilos para contener rígidamente el layout y evitar overflow
  const rootStyle = {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    overflow: 'hidden',
    backgroundColor: 'rgb(243, 244, 246)'
  };

  const contentWrapperStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    overflowX: 'hidden'
  };

  const mainContentStyle = {
    flex: 1,
    overflowX: 'hidden',
    padding: '0',
    margin: '0',
    width: '100%'
  };

  return (    
    <div style={rootStyle}>
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div style={contentWrapperStyle}>
        <Header onMenuClick={toggleSidebar} />
        <main style={mainContentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}

// Componente para la ruta raíz que utiliza el contexto de autenticación
function RootRedirect() {
  const { auth, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }
  
  return auth ? <Navigate replace to="/dashboard" /> : <Navigate replace to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      
      {/* Rutas protegidas - requieren autenticación */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        } />
        <Route path="/dashboard/departamentos" element={
          <MainLayout>
            <DashboardDepartamentos />
          </MainLayout>
        } />
      
        {/* Rutas protegidas con permisos específicos */}
        <Route path="/municipalidades" element={
          <MainLayout>
            <MunicipalidadesList />
          </MainLayout>
        } />
        <Route path="/contactos" element={
          <MainLayout>
            <ContactosList />
          </MainLayout>
        } />
        <Route path="/tipos-reunion" element={
          <MainLayout>
            <TipoReunionList />
          </MainLayout>
        } />
        <Route path="/eventos" element={
          <MainLayout>
            <EventosList />
          </MainLayout>
        } />
        <Route path="/estado-seguimiento" element={
          <MainLayout>
            <EstadoSeguimientosList />
          </MainLayout>
        } />
        <Route path="/oficios" element={
          <MainLayout>
            <OficiosList />
          </MainLayout>
        } />
        <Route path="/convenios" element={
          <MainLayout>
            <ConveniosList />
          </MainLayout>
        } />
        <Route path="/estados" element={
          <MainLayout>
            <EstadosList />
          </MainLayout>
        } />
      </Route>
      
      {/* Redirecciones por defecto */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
