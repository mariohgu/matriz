import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  FaTimes,
  FaClipboardList,
  FaChartPie,
  FaBoxes,
  FaCalendarAlt,
  FaHandsHelping
} from "react-icons/fa";
import { MdExpandMore } from "react-icons/md";
import Accordion from "./Accordion"; // Tu componente 'Accordion'

export default function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { /* logout */ } = useAuth(); // si no requieres logout, no lo uses

  // Menú principal con "Matriz"
  const links = [
    {
      href: "#",
      title: "Matriz",
      icon: <FaClipboardList />,
      subItems: [
        {
          title: "Dashboard",
          icon: <FaChartPie />,
          // Eliminamos "Análisis"
          subItems: [
            { href: "/dashboard/overview", title: "Vista General" },
            { href: "/dashboard/departamentos", title: "Por Departamentos" },
          ],
        },
        {
          title: "Items",
          icon: <FaBoxes />,
          subItems: [
            { href: "/municipalidades", title: "Municipalidades" },
            { href: "/contactos", title: "Contactos" },
            { href: "/tipos-reunion", title: "Tipos de Reunión" },
            { href: "/estados", title: "Estados" },
          ],
        },
        {
          title: "Eventos",
          icon: <FaCalendarAlt />,
          subItems: [
            { href: "/eventos", title: "Lista de Eventos" },
          ],
        },
        {
          title: "Seguimiento",
          icon: <FaHandsHelping />,
          // Eliminamos "Historial"
          subItems: [
            { href: "/estado-seguimiento", title: "Estado de Seguimiento" },
            { href: "/oficios", title: "Oficios" },
            { href: "/convenios", title: "Convenios" },
          ],
        },
      ],
    },
  ];

  const handleNavigation = (href, e) => {
    e.preventDefault();
    navigate(href);
    if (window.innerWidth < 768) onToggle();
  };

  const isActive = (href) => location.pathname === href;

  // Ajustamos ancho del Sidebar
  const sidebarStyle = {
    width: isOpen ? "20rem" : "5rem",
    minWidth: isOpen ? "20rem" : "5rem",
    maxWidth: isOpen ? "20rem" : "5rem",
    transition: "width 0.3s, min-width 0.3s, max-width 0.3s",
  };

  // Clases principales
  // Garantizamos altura completa y scroll correcto
  const sidebarClasses = `
    fixed md:sticky top-0 left-0 z-20
    bg-gradient-to-b from-slate-900 to-slate-800
    text-gray-100
    transform transition-transform duration-300 ease-in-out md:transform-none
    flex flex-col h-screen
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `;

  // Overlay en móvil
  const overlayClasses = `
    fixed inset-0 bg-black bg-opacity-50 z-10 transition-opacity duration-300
    ${isOpen ? "opacity-100 md:hidden" : "opacity-0 pointer-events-none"}
  `;

  // Render de nivel 3 (sub-items finales)
  const renderLevel3 = (subItems) => (
    <ul className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-2">
      {subItems.map((item, idx) => (
        <li key={idx}>
          <a
            href={item.href}
            onClick={(e) => handleNavigation(item.href, e)}
            className={`
              block py-1 px-3 text-sm text-slate-300 hover:text-white
              transition-colors duration-200
              ${isActive(item.href) ? "text-white font-semibold" : ""}
            `}
          >
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  );

  // Render de nivel 2 (por ejemplo, Dashboard, Items, etc.)
  const renderLevel2Submenu = (sub) => {
    // subItems => array de links de nivel 3
    if (sub.subItems && sub.subItems.length > 0) {
      return (
        <Accordion
          summary={
            <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-2">
                <span>{sub.icon}</span>
                <span className="text-sm text-slate-200">{sub.title}</span>
              </div>
              {isOpen && <MdExpandMore className="text-slate-200" />}
            </div>
          }
        >
          {renderLevel3(sub.subItems)}
        </Accordion>
      );
    }
    // si no hay subItems
    return (
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="block py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
      >
        <span>{sub.title}</span>
      </a>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      <div className={overlayClasses} onClick={onToggle}></div>

      {/* Sidebar */}
      <div className={sidebarClasses} style={sidebarStyle}>
        {/* Encabezado - Fijo en la parte superior */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-slate-700">
          <h1
            className={`
              font-bold text-xl transition-opacity duration-300
              ${isOpen ? "opacity-100" : "opacity-0 md:opacity-100"}
            `}
          >
            OEDI
          </h1>
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-slate-700 md:hidden"
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>

        {/* Contenedor scrollable - Ocupa todo el espacio disponible y permite scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2">
          {links.map((link, index) => (
            <Accordion
              key={index}
              summary={
                <div
                  className={`
                    flex items-center justify-between p-3 rounded-md
                    hover:bg-slate-700 transition-colors
                  `}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{link.icon}</span>
                    {isOpen && <span className="text-lg">{link.title}</span>}
                  </div>
                  {isOpen && <MdExpandMore className="text-slate-200" />}
                </div>
              }
            >
              {/* Submenús de nivel 2 (Dashboard, Items, Eventos, Seguimiento) */}
              {isOpen && (
                <ul className="ml-8 mt-2 space-y-2 border-l-2 border-slate-700">
                  {link.subItems.map((subLink, subIndex) => (
                    <li key={subIndex}>
                      {renderLevel2Submenu(subLink)}
                    </li>
                  ))}
                </ul>
              )}
            </Accordion>
          ))}
        </div>

        {/* Puedes agregar un pie de página fijo si lo necesitas */}
        <div className="flex-shrink-0 border-t border-slate-700 p-2 text-center text-xs text-slate-500">
          {isOpen && <span> OEDI {new Date().getFullYear()}</span>}
        </div>
      </div>
    </>
  );
}
