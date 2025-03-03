import React from 'react';
import { FaBell, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const { user } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center flex-1">
          <div className="max-w-lg w-full lg:max-w-xs">
            <label htmlFor="search" className="sr-only">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar"
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="sr-only">Ver notificaciones</span>
            <FaBell className="h-6 w-6" />
          </button>

          <span className="text-gray-700 ml-4">Usuario Temporal</span>
          <button
            onClick={() => console.log('Implementar logout')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors ml-4"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
