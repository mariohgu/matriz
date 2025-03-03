import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import Dashboard from './pages/Dashboard';
import MunicipalidadesList from './components/municipalidades/MunicipalidadesList';
import Sidebar from './components/common/Sidebar';
import Header from './components/common/Header';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainLayout({ children }) {
  return (    
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <Header />
        <main className="p-8">
          {children}
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
