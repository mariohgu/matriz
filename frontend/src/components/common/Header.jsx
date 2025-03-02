import React from 'react';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sistema Municipal</h1>
        <div className="flex items-center space-x-4">
          {/* TODO: Implementar autenticación real */}
          <span className="text-gray-700">Usuario Temporal</span>
          <button
            onClick={() => console.log('Implementar logout')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            Cerrar Sesión (Pendiente)
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
