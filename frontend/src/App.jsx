import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
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
import { AuthProvider } from './context/AuthContext';

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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
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
      <Route path="/" element={<Navigate replace to="/dashboard" />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
