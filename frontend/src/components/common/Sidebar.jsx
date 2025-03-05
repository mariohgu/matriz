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
        { href: "/seguimiento", title: "Estado" },
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

  // Clase base para el sidebar
  const sidebarClasses = `
    fixed md:sticky top-0 left-0 z-20 h-screen bg-gray-800 text-white 
    transform transition-transform duration-300 ease-in-out md:transform-none
    ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    ${isOpen ? 'w-72' : 'w-20 md:w-20'}
  `;

  // Overlay para móvil
  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-10 transition-opacity duration-300
    ${isOpen ? 'opacity-100 md:hidden' : 'opacity-0 pointer-events-none'}
  `;

  return (
    <>
      <div className={overlayClasses} onClick={onToggle}></div>
      <nav className={sidebarClasses}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-600 rounded-lg flex items-center justify-center">
              <FaBuilding className="text-2xl" />
            </div>
            {isOpen && (
              <a href="/dashboard" className="text-xl font-bold">
                Matriz
              </a>
            )}
          </div>
          <button
            className="p-2 bg-white text-gray-800 rounded-full shadow-md"
            onClick={onToggle}
          >
            {isOpen ? <FaTimes size={20} /> : <FaAngleRight size={20} />}
          </button>
        </div>

        <ul className="flex-1 mt-4 space-y-2 px-3">
          {links.map((link, index) => (
            <li key={index}>
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
            </li>
          ))}
        </ul>

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
      </nav>
    </>
  );
}
