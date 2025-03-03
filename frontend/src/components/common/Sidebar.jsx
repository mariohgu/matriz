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
} from "react-icons/fa";
import { MdExpandMore, MdExpandLess } from "react-icons/md";
import Accordion from "./Accordion";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

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
      href: "/municipalidades",
      title: "Municipalidades",
      icon: <FaBuilding />,
      subItems: [
        { href: "/municipalidades", title: "Lista" },
        { href: "/municipalidades/mapa", title: "Mapa" },
      ]
    },
    {
      href: "/eventos",
      title: "Eventos",
      icon: <FaCalendarAlt />,
      subItems: [
        { href: "/eventos", title: "Lista" },
        { href: "/eventos/calendario", title: "Calendario" },
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
  };

  const isActive = (href) => location.pathname === href;

  return (
    <nav
      className={`sticky top-0 h-screen bg-gray-800 text-white flex flex-col transition-all duration-500 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gray-600 rounded-lg flex items-center justify-center">
            <FaBuilding className="text-2xl" />
          </div>
          {!collapsed && (
            <a href="/dashboard" className="text-xl font-bold">
              Matriz
            </a>
          )}
        </div>
        <button
          className="p-2 bg-white text-gray-800 rounded-full shadow-md"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MdExpandMore size={24} /> : <MdExpandLess size={24} />}
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
                      {!collapsed && <span className="text-lg">{link.title}</span>}
                    </div>
                    {!collapsed && (
                      <span className="text-lg">
                        <FaAngleRight />
                      </span>
                    )}
                  </div>
                }
              >
                {!collapsed && (
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
                {!collapsed && <span className="text-lg">{link.title}</span>}
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
                {!collapsed && <span className="text-lg">{link.title}</span>}
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
          {!collapsed && (
            <div className="text-left">
              <p className="font-bold">Usuario Temporal</p>
              <p className="text-sm text-gray-400">usuario@ejemplo.com</p>
            </div>
          )}
        </button>
      </div>
    </nav>
  );
}
