import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout para todas las páginas (temporalmente sin protección)
function MainLayout({ children }) {
  return (    
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100">
        <Header />
        <main className="flex-1 bg-gray-50 p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* TODO: Implementar protección de rutas
function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  return <MainLayout>{children}</MainLayout>;
}
*/

function AppRoutes() {
  // TODO: Implementar lógica de autenticación
  // const { auth } = useAuth();

  return (
    <Routes>
      {/* TODO: Implementar rutas públicas y protegidas
      <Route 
        path="/login" 
        element={auth ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
      />
      */}

      {/* Rutas temporalmente sin protección */}
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

      {/* Ruta por defecto */}
      <Route 
        path="/" 
        element={<Navigate to="/dashboard" replace />} 
      />

      {/* Ruta 404 */}
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
