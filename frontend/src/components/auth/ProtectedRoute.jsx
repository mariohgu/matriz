import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';

/**
 * Componente que protege rutas basado en autenticación, roles y permisos
 * Actúa como un middleware para verificar permisos antes de mostrar una ruta
 */
const ProtectedRoute = ({ 
  requiredRole = null, 
  requiredPermission = null,
  redirectPath = '/login' 
}) => {
  const { auth, user, setAuth, setUser, hasRole, hasPermission, loading } = useAuth();
  const [isValidating, setIsValidating] = useState(true);
  const location = useLocation();
  
  // Validar token al acceder a rutas protegidas
  useEffect(() => {
    const validateToken = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Validar token con el backend
          const userData = await authService.getUserProfile();
          if (userData && userData.user) {
            setUser(userData.user);
            setAuth(true);
          } else {
            // Si la respuesta no contiene datos de usuario válidos
            setAuth(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Error validando token:', error);
          // Si hay un error, probablemente el token expiró o es inválido
          setAuth(false);
          setUser(null);
          authService.logout(); // Limpia localStorage
        }
      } else {
        setAuth(false);
        setUser(null);
      }
      setIsValidating(false);
    };

    validateToken();
  }, [location.pathname, setAuth, setUser]);

  // Mientras estamos validando o cargando, mostrar un indicador de carga
  if (loading || isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Si el usuario no está autenticado, redirigir al login
  if (!auth) {
    return <Navigate to={redirectPath} replace state={{ from: location }} />;
  }
  
  // Si se requiere un rol específico, verificar
  if (requiredRole && !hasRole(requiredRole)) {
    // Redirigir a una página de acceso denegado o al dashboard
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Si se requiere un permiso específico, verificar
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // Redirigir a una página de acceso denegado o al dashboard
    return <Navigate to="/unauthorized" replace />;
  }
  
  // Si todo está bien, mostrar el componente protegido
  return <Outlet />;
};

export default ProtectedRoute;
