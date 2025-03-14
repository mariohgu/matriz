import React, { useState, useEffect } from 'react';
import { FaBell, FaSearch, FaBars, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Menu, MenuItem, Button, Avatar, IconButton, Badge, Popover } from '@mui/material';

function Header({ onMenuClick }) {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Cargar información del usuario al montar el componente
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <FaBars className="h-6 w-6" />
          </button>
          
          <div className="hidden md:block max-w-lg w-full lg:max-w-xs">
            <label htmlFor="search" className="sr-only">Buscar</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar..."
                type="search"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <span className="sr-only">Ver notificaciones</span>
            <FaBell className="h-6 w-6" />
          </button>

          <div className="hidden md:flex items-center space-x-4">
            <span className="text-gray-700">{user?.name || 'Usuario'}</span>
            <IconButton 
              onClick={handleUserMenuOpen}
              size="small"
              className="focus:outline-none"
            >
              <FaUserCircle className="h-8 w-8 text-gray-600" />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
            >
              <MenuItem onClick={handleUserMenuClose}>Mi Perfil</MenuItem>
              <MenuItem onClick={handleUserMenuClose}>Configuración</MenuItem>
              <MenuItem onClick={handleLogout}>Cerrar Sesión</MenuItem>
            </Menu>
          </div>

          {/* Menú móvil */}
          <button className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
            <span className="sr-only">Abrir menú</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Barra de búsqueda móvil */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Buscar..."
            type="search"
          />
        </div>
      </div>
    </header>
  );
}

export default Header;
