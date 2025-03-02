import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // TODO: Implementar autenticación real
  // const [auth, setAuth] = useState(false);
  const [auth, setAuth] = useState(true); // Temporalmente siempre autenticado
  const [user, setUser] = useState({ name: 'Usuario Temporal' });

  /* TODO: Implementar login real
  const login = async (credentials) => {
    try {
      const response = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        throw new Error('Credenciales inválidas');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      setAuth(true);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };
  */

  // Versión temporal del login
  const login = async (credentials) => {
    setAuth(true);
    setUser({ name: 'Usuario Temporal' });
    return { token: 'temp-token' };
  };

  /* TODO: Implementar logout real
  const logout = () => {
    localStorage.removeItem('token');
    setAuth(false);
    setUser(null);
  };
  */

  // Versión temporal del logout
  const logout = () => {
    console.log('Logout temporal - Será implementado más adelante');
  };

  return (
    <AuthContext.Provider value={{ auth, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
