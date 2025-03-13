import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTachometerAlt,
  FaBuilding,
  FaCalendarAlt,
  FaClipboardList,
  FaUserCircle,
  FaQuestionCircle,
  FaCog,
  FaAngleRight,
  FaTimes
} from "react-icons/fa";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import Accordion from "./Accordion";

export default function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const links = [
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: <FaTachometerAlt />,
      subItems: [
        { href: "/dashboard/overview", title: "Vista General" },
        { href: "/dashboard/analytics", title: "Análisis" },
        { href: "/dashboard/departamentos", title: "Por Departamentos" },
      ]
    },
    {
      href: "#",
      title: "Items de Carga",
      icon: <FaBuilding />,
      subItems: [
        { href: "/municipalidades", title: "Municipalidades" },        
        { href: "/contactos", title: "Contactos" },
        { href: "/tipos-reunion", title: "Tipos de Reunión" },
        { href: "/estados", title: "Estados" },
      ]
    },
    {
      href: "/eventos",
      title: "Eventos",
      icon: <FaCalendarAlt />,
      subItems: [
        { href: "/eventos", title: "Lista" },
      ]
    },
    {
      href: "/seguimiento",
      title: "Seguimiento",
      icon: <FaClipboardList />,
      subItems: [
        { href: "/estado-seguimiento", title: "Lista" },
        { href: "/oficios", title: "Oficios" },
        { href: "/convenios", title: "Convenios" },
        { href: "/seguimiento/historial", title: "Historial" },
      ]
    },
  ];

  const bottomLinks = [
    { href: "/ayuda", title: "Ayuda", icon: <FaQuestionCircle /> },
    { href: "/configuracion", title: "Configuración", icon: <FaCog /> },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error durante el logout:', error);
    }
  };

  const handleNavigation = (href, e) => {
    e.preventDefault();
    navigate(href);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  const isActive = (href) => location.pathname === href;

  // Estilo específico para el sidebar con ancho fijo
  const sidebarStyle = {
    width: isOpen ? '16rem' : '5rem',
    minWidth: isOpen ? '16rem' : '5rem',
    maxWidth: isOpen ? '16rem' : '5rem',
    transition: 'width 0.3s, min-width 0.3s, max-width 0.3s',
    overflowX: 'hidden'
  };

  // Clase base para el sidebar con ancho fijo
  const sidebarClasses = `
    fixed md:sticky top-0 left-0 z-20 h-screen bg-gray-800 text-white 
    transform transition-transform duration-300 ease-in-out md:transform-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
  `;

  // Overlay para móvil
  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-10 transition-opacity duration-300
    ${isOpen ? 'opacity-100 md:hidden' : 'opacity-0 pointer-events-none'}
  `;

  return (
    <>
      {/* Overlay para móvil */}
      <div className={overlayClasses} onClick={onToggle}></div>
      
      {/* Sidebar */}
      <div className={sidebarClasses} style={sidebarStyle}>
        {/* Título y botón de cerrar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h1 className={`font-bold text-xl transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:opacity-100'}`}>
            MATRIZ
          </h1>
          <button onClick={onToggle} className="p-2 rounded-full hover:bg-gray-700 md:hidden">
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        
        {/* Links principales */}
        <nav className="mt-4 px-2 space-y-1">
          {links.map((link, index) => (
            <div key={index}>
              {link.subItems.length > 0 ? (
                <Accordion
                  summary={
                    <div
                      className={`w-full flex items-center justify-between p-3 rounded-md transition-colors duration-200 hover:bg-gray-700 ${
                        isActive(link.href) ? "bg-gray-700" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{link.icon}</span>
                        {isOpen && <span className="text-lg">{link.title}</span>}
                      </div>
                      {isOpen && (
                        <span className="text-lg">
                          <FaAngleRight />
                        </span>
                      )}
                    </div>
                  }
                >
                  {isOpen && (
                    <ul className="ml-12 mt-2 space-y-2 border-l-2 border-gray-600">
                      {link.subItems.map((subItem, subIndex) => (
                        <li key={subIndex}>
                          <a
                            href={subItem.href}
                            onClick={(e) => handleNavigation(subItem.href, e)}
                            className={`block py-2 px-4 text-gray-400 hover:text-white transition-colors duration-200 ${
                              isActive(subItem.href) ? "text-white" : ""
                            }`}
                          >
                            {subItem.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </Accordion>
              ) : (
                <a
                  href={link.href}
                  onClick={(e) => handleNavigation(link.href, e)}
                  className={`flex items-center gap-4 p-3 rounded-md transition-colors duration-200 hover:bg-gray-700 ${
                    isActive(link.href) ? "bg-gray-700" : ""
                  }`}
                >
                  <span className="text-2xl">{link.icon}</span>
                  {isOpen && <span className="text-lg">{link.title}</span>}
                </a>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-auto border-t border-gray-700">
          <ul className="p-3 space-y-2">
            {bottomLinks.map((link, index) => (
              <li key={index}>
                <a
                  href={link.href}
                  onClick={(e) => handleNavigation(link.href, e)}
                  className="flex items-center gap-4 p-3 rounded-md transition-colors duration-200 hover:bg-gray-700"
                >
                  <span className="text-2xl">{link.icon}</span>
                  {isOpen && <span className="text-lg">{link.title}</span>}
                </a>
              </li>
            ))}
          </ul>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 p-4 border-t border-gray-600 hover:bg-gray-700"
          >
            <div className="relative w-12 h-12">
              <div className="w-full h-full rounded-full bg-gray-600 flex items-center justify-center">
                <FaUserCircle className="text-3xl" />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            {isOpen && (
              <div className="text-left">
                <p className="font-bold">Usuario Temporal</p>
                <p className="text-sm text-gray-400">usuario@ejemplo.com</p>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
