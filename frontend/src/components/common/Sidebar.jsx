import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaTimes,
  FaClipboardList,
  FaChartPie,
  FaBoxes,
  FaCalendarAlt,
  FaHandsHelping,
  FaCog,
  FaUsersCog,
  FaUserCircle,
  FaMoneyBillWave,
  FaDatabase
} from "react-icons/fa";
import { MdFollowTheSigns, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FiHome, FiUsers, FiFileText, FiSettings, FiDollarSign, FiList, FiBarChart2, FiLayers } from 'react-icons/fi';

/**
 * Componente Accordion personalizado con control de estado externo.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.summary - Contenido del encabezado del acordeón
 * @param {React.ReactNode} props.children - Contenido que se muestra/oculta
 * @param {boolean} props.isExpanded - Estado expandido controlado externamente
 * @param {function} props.onToggle - Función para cambiar el estado
 */
const ControlledAccordion = ({ summary, children, isExpanded, onToggle }) => {
  return (
    <div className="mb-2">
      <div className="cursor-pointer" onClick={onToggle}>
        {summary}
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Sidebar principal.
 *
 * @param {boolean} isOpen  Indica si está expandido (en Desktop) o abierto en móvil
 * @param {function} onToggle Función para alternar abierto/cerrado
 */
export default function Sidebar({ isOpen, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para controlar qué menús están abiertos
  const [openMenuIndex, setOpenMenuIndex] = useState(null);
  const [openSubMenus, setOpenSubMenus] = useState({});

  // Menú principal con "Matriz" y "Configuración"
  // Se anidan submenús
  const links = [
    {
      href: "#",
      title: "Matriz",
      icon: <FaClipboardList />,
      subItems: [
        {
          title: "Dashboard",
          icon: <FaChartPie />,
          subItems: [
            { href: "/dashboard", title: "Vista General" },
            // { href: "/dashboard/departamentos", title: "Por Departamentos" },
            { href: "/dashboard/lista", title: "Por Lista" },
            { href: "/dashboard/calendario-compromisos", title: "Calendario de Compromisos" },
          ],
        },
        {
          title: "Items",
          icon: <FaBoxes />,
          subItems: [
            { href: "/municipalidades", title: "Entidades" },
            { href: "/contactos", title: "Contactos" },
            { href: "/tipos-reunion", title: "Tipos de Reunión" },
            { href: "/estados", title: "Estados" },
            { href: "/sectores", title: "Sectores" },
            { href: "/direcciones-linea", title: "Direcciones de Línea" },
            { href: "/estados-convenios", title: "Estados de Convenio" },
          ],
        },
        {
          title: "Primer Acercamiento",
          icon: <FaCalendarAlt />,
          subItems: [
            { href: "/eventos", title: "Lista de Primer Acercamiento" },
          ],
        },
        {
          title: "Seguimiento",
          icon: <MdFollowTheSigns />,
          subItems: [
            { href: "/estado-seguimiento", title: "Estado de Seguimiento" },
            // { href: "/oficios", title: "Oficios" },
          ],
        },
        {
          title: "Convenios",
          icon: <FaHandsHelping />,
          subItems: [
            { href: "/convenios", title: "Convenios" },            
            { href: "/convenio-seguimiento", title: "Convenio de Seguimiento" },            
          ],
        },
      ],
    },
    {
      href: "#",
      title: "Presupuesto",
      icon: <FaMoneyBillWave />,
      subItems: [
        {
          title: "Dashboard",
          icon: <FaChartPie />,
          subItems: [
            { href: "/dashboard/presupuesto-areas", title: "Dashboard por Áreas" },
            { href: "/dashboard/presupuesto", title: "Dashboard Presupuestal" },
            { href: "/dashboard/presupuesto-detallado", title: "Dashboard Presupuestal Detallado" },
          ],
        },
        {
          title: "Importar",
          icon: <FaMoneyBillWave />,
          subItems: [
            { href: "/presupuesto/importar", title: "Importar Presupuesto" },
          ],
        },
        {
          title: "Datos",
          icon: <FaDatabase />,
          subItems: [
            { href: "/presupuesto/areas-ejecutoras", title: "Áreas Ejecutoras" },
            { href: "/presupuesto/categorias", title: "Categorías" },
            { href: "/presupuesto/clasificadores", title: "Clasificadores" },
            { href: "/presupuesto/ejecuciones", title: "Ejecución Mensual" },
            { href: "/presupuesto/resumen", title: "Resumen" },
          ],
        },
      ],
    },
    {
      href: "#",
      title: "Configuración",
      icon: <FaCog />,
      subItems: [
        {
          title: "Usuarios",
          icon: <FaUsersCog />,
          subItems: [
            { href: "/usuarios", title: "Gestión de Usuarios" },
          ],
        },
        {
          title: "Perfil",
          icon: <FaUserCircle />,
          subItems: [
            { href: "/perfil", title: "Mi Perfil" },
          ],
        },
      ],
    },
  ];

  /**
   * Maneja el toggle de un menú principal
   */
  const handleMainMenuToggle = (index) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
    // Al abrir un menú principal, cerramos todos los submenús
    setOpenSubMenus({});
  };

  /**
   * Maneja el toggle de un submenú
   */
  const handleSubMenuToggle = (mainIndex, subIndex) => {
    setOpenSubMenus(prev => {
      const key = `${mainIndex}-${subIndex}`;
      const newState = { ...prev };
      
      // Cierra todos los demás submenús del mismo nivel
      Object.keys(newState).forEach(k => {
        if (k.startsWith(`${mainIndex}-`) && k !== key) {
          delete newState[k];
        }
      });
      
      // Toggle el submenú actual
      newState[key] = !prev[key];
      
      return newState;
    });
  };

  /**
   * Navega a la ruta 'href' y cierra el sidebar en móvil.
   */
  const handleNavigation = (href, e) => {
    e.preventDefault();
    navigate(href);
    if (window.innerWidth < 768) {
      onToggle();
    }
  };

  /**
   * Determina si la ruta actual coincide con `href` (se marca activo).
   */
  const isActive = (href) => location.pathname === href;

  /**
   * Renderiza un sub-submenú (nivel 3).
   */
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

  /**
   * Renderiza un submenú de nivel 2 (como "Dashboard", "Items", etc.).
   * Si tiene subItems, se muestra con un Accordion.
   * Si no, es solo un link.
   */
  const renderLevel2Submenu = (submenu, mainIndex, subIndex) => {
    // Revisa si hay subItems
    if (submenu.subItems && submenu.subItems.length > 0) {
      const isSubMenuExpanded = openSubMenus[`${mainIndex}-${subIndex}`] || false;
      
      return (
        <ControlledAccordion
          isExpanded={isSubMenuExpanded}
          onToggle={() => handleSubMenuToggle(mainIndex, subIndex)}
          summary={
            <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-slate-700 transition-colors">
              <div className="flex items-center gap-2">
                {/* Icono del submenu */}
                <span>{submenu.icon}</span>
                {/* Título del submenu */}
                <span className="text-sm text-slate-200">{submenu.title}</span>
              </div>
              {isOpen && (isSubMenuExpanded ? <MdExpandLess className="text-slate-200" /> : <MdExpandMore className="text-slate-200" />)}
            </div>
          }
        >
          {renderLevel3(submenu.subItems)}
        </ControlledAccordion>
      );
    }

    // Si no hay subItems, simplemente un enlace
    return (
      <a
        href="#"
        onClick={(e) => e.preventDefault()}
        className="block py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700 rounded-md"
      >
        <span>{submenu.title}</span>
      </a>
    );
  };

  // Estilo para el ancho del sidebar
  const sidebarWidth = isOpen ? "16rem" : "4rem";

  return (
    <>
      {/* Overlay móvil */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onToggle}
      ></div>

      {/* Sidebar */}
      <div 
        className={`fixed md:sticky top-0 left-0 h-screen z-20 transform transition-transform duration-300 ease-in-out md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ 
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth
        }}
      >
        {/* Contenedor principal del sidebar */}
        <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-gray-100">
          {/* Cabecera */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <h1 className={`font-bold text-xl transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 md:opacity-100"}`}>
              OEDI
            </h1>
            <button
              onClick={onToggle}
              className="p-2 rounded-full hover:bg-slate-700 md:hidden"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-2">
            {links.map((link, index) => (
              <ControlledAccordion
                key={index}
                isExpanded={openMenuIndex === index}
                onToggle={() => handleMainMenuToggle(index)}
                summary={
                  <div className="flex items-center justify-between p-2 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{link.icon}</span>
                      {isOpen && <span className="font-medium">{link.title}</span>}
                    </div>
                    {isOpen && (openMenuIndex === index ? <MdExpandLess className="text-slate-200" /> : <MdExpandMore className="text-slate-200" />)}
                  </div>
                }
              >
                {isOpen && (
                  <div className="ml-6 mt-2 space-y-1 border-l-2 border-slate-700 pl-2">
                    {link.subItems.map((subLink, subIndex) => (
                      <div key={subIndex} className="mb-2">
                        {renderLevel2Submenu(subLink, index, subIndex)}
                      </div>
                    ))}
                  </div>
                )}
              </ControlledAccordion>
            ))}
          </div>

          {/* Pie de página */}
          <div className="border-t border-slate-700 p-2 text-center text-xs text-slate-500">
            {isOpen && <span>OEDI {new Date().getFullYear()}</span>}
          </div>
        </div>
      </div>
    </>
  );
}
