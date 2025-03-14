import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <svg 
            className="mx-auto h-16 w-16 text-red-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">
          No tienes los permisos necesarios para acceder a esta página. Por favor, contacta al administrador si crees que deberías tener acceso.
        </p>
        <div className="flex justify-center space-x-3">
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-150"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
