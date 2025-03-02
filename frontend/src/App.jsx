import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout para rutas protegidas
function ProtectedLayout({ children }) {
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

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { auth } = useAuth();
  
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  
  return <ProtectedLayout>{children}</ProtectedLayout>;
}

function AppRoutes() {
  const { auth } = useAuth();

  return (
    <Routes>
      {/* Ruta pública */}
      <Route 
        path="/login" 
        element={auth ? <Navigate to="/dashboard" replace /> : <LoginScreen />} 
      />

      {/* Rutas protegidas */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/municipalidades"
        element={
          <ProtectedRoute>
            <MunicipalidadesList />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route 
        path="/" 
        element={<Navigate to={auth ? "/dashboard" : "/login"} replace />} 
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
