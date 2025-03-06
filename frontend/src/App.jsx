import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import ContactosList from './components/contactos/ContactosList';
import TipoReunionList from './components/tipos-reunion/TipoReunionList';
import EventosList from './components/eventos/EventosList';
import EstadoSeguimientosList from './components/estado-seguimiento/EstadoSeguimientosList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { AuthProvider } from './context/AuthContext';

function MainLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (    
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col">
        <Header onMenuClick={toggleSidebar} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-auto w-full">
          <div className="container mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/dashboard"
        element={
          <MainLayout>
            <Dashboard />
          </MainLayout>
        }
      />
      
      <Route
        path="/municipalidades"
        element={
          <MainLayout>
            <MunicipalidadesList />
          </MainLayout>
        }
      />
      <Route
        path="/contactos"
        element={
          <MainLayout>
            <ContactosList />
          </MainLayout>
        }
      />
      <Route
        path="/tipos-reunion"
        element={
          <MainLayout>
            <TipoReunionList />
          </MainLayout>
        }
      />

      <Route
        path="/eventos"
        element={
          <MainLayout>
            <EventosList />
          </MainLayout>
        }
      />
      <Route
        path="/estado-seguimiento"
        element={
          <MainLayout>
            <EstadoSeguimientosList />
          </MainLayout>
        }
      />

      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />

      <Route 
        path="*" 
        element={<Navigate to="/" replace />} 
      />
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
