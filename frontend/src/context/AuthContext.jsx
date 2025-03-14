import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, apiService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.getCurrentUser() || null);
  const [loading, setLoading] = useState(true);

  // Verificar el estado de autenticación al cargar el componente
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Intentar obtener el perfil del usuario si hay un token
          const userData = await authService.getUserProfile();
          setUser(userData.user || authService.getCurrentUser());
          setAuth(true);
        } else {
          setAuth(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setAuth(false);
        setUser(null);
        // Si hay un error, probablemente el token expiró o es inválido
        authService.logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función de registro que utiliza authService
  const register = async (name, username, email, password, password_confirmation) => {
    try {
      return await authService.register(name, username, email, password, password_confirmation);
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  // Función de login que utiliza authService
  const login = async (credentials) => {
    try {
      const response = await authService.login(credentials.username, credentials.password);
      setAuth(true);
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  // Función de logout que utiliza authService
  const logout = async () => {
    try {
      await authService.logout();
      setAuth(false);
      setUser(null);
    } catch (error) {
      console.error('Error en logout:', error);
      // Incluso si hay un error, limpiamos el estado local
      setAuth(false);
      setUser(null);
    }
  };

  // Función para actualizar el perfil del usuario
  const updateUserProfile = async () => {
    try {
      const userData = await authService.getUserProfile();
      setUser(userData.user);
      return userData;
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      throw error;
    }
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (roleName) => {
    return authService.hasRole(roleName);
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permissionName) => {
    return authService.hasPermission(permissionName);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        auth, 
        user, 
        login, 
        logout, 
        register,
        updateUserProfile,
        hasRole,
        hasPermission,
        loading,
        setAuth, 
        setUser  
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
