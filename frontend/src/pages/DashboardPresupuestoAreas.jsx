import React, { useState, useEffect } from 'react';
import { apiService } from '../services/authService';
import { FiRefreshCw, FiInfo, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';

// Función de ayuda para obtener valores numéricos de manera segura
const safeGetNumber = (obj, path, defaultValue = 0) => {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    
    const num = parseFloat(current);
    return isNaN(num) ? defaultValue : num;
  } catch (error) {
    console.warn(`Error al obtener valor numérico para path: ${path}`, error);
    return defaultValue;
  }
};

const DashboardPresupuestoAreas = () => {
  // Estados para los datos
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [areasDatos, setAreasDatos] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [detalleArea, setDetalleArea] = useState(null);
  const [showDetalle, setShowDetalle] = useState(false);
  const [cargandoArea, setCargandoArea] = useState({});
  const [cacheExpiry] = useState(5 * 60 * 1000); // 5 minutos en milisegundos

  // Función para verificar si hay datos en caché
  const getCachedData = (key) => {
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp } = JSON.parse(cached);
      const isExpired = Date.now() - timestamp > cacheExpiry;
      
      return isExpired ? null : data;
    } catch (error) {
      console.warn('Error al recuperar datos de caché:', error);
      return null;
    }
  };

  // Función para guardar datos en caché
  const setCachedData = (key, data) => {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Error al guardar datos en caché:', error);
    }
  };

  // Cargar datos de áreas ejecutoras
  const loadAreasEjecutoras = async () => {
    try {
      const response = await apiService.getAll('presupuesto/areas-ejecutoras');
      const data = response?.data || response;
      
      if (Array.isArray(data)) {
        setAreasEjecutoras(data);
        return data;
      } else {
        console.warn('La respuesta de áreas ejecutoras no es un array:', data);
        setAreasEjecutoras([]);
        return [];
      }
    } catch (error) {
      console.error('Error al cargar áreas ejecutoras:', error);
      setAreasEjecutoras([]);
      return [];
    }
  };

  // Cargar datos optimizados de presupuesto y ejecución para todas las áreas
  const loadAreasDatos = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    const cacheKey = `areas-resumen-${selectedYear}`;
    
    // Verificar caché si no se fuerza refresco
    if (!forceRefresh) {
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('Usando datos en caché para áreas');
        setAreasDatos(cachedData.areas || []);
        setLastUpdateDate(new Date(cachedData.timestamp || Date.now()));
        setLoading(false);
        return;
      }
    }
    
    try {
      // Usar el nuevo endpoint optimizado
      const response = await apiService.getAll(`presupuesto/dashboard/areas-resumen/${selectedYear}`);
      const data = response?.data || response;
      
      if (data && Array.isArray(data.areas)) {
        // Guardar en caché
        setCachedData(cacheKey, data);
        
        setAreasDatos(data.areas);
        setLastUpdateDate(new Date(data.timestamp || Date.now()));
      } else {
        console.warn('La respuesta no tiene el formato esperado:', data);
        setAreasDatos([]);
      }
    } catch (error) {
      console.error('Error al cargar datos de áreas:', error);
      setError('No se pudieron cargar los datos de las áreas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    loadAreasDatos();
  }, [selectedYear]);

  // Formatear montos como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Opciones para años (últimos 5 años)
  const getAniosOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };

  // Obtener color según el porcentaje de ejecución
  const getEjecucionColor = (porcentaje) => {
    if (porcentaje < 25) return '#dc2626'; // Rojo (peligro)
    if (porcentaje < 50) return '#f97316'; // Naranja (precaución)
    if (porcentaje < 75) return '#facc15'; // Amarillo (moderado)
    return '#16a34a'; // Verde (bueno)
  };

  // Mostrar detalles de un área al hacer clic
  const handleAreaClick = (area) => {
    setDetalleArea(area);
    setShowDetalle(true);
  };

  // Cerrar el modal de detalles
  const closeDetalle = () => {
    setShowDetalle(false);
  };

  // Componente para termómetro de área
  const AreaTermometro = ({ area }) => {
    const porcentaje = area.porcentaje_ejecucion;
    const [animPorcentaje, setAnimPorcentaje] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const colorMercurio =
      porcentaje < 25 ? '#dc2626' : porcentaje < 50 ? '#f97316' : porcentaje < 75 ? '#facc15' : '#16a34a';
    const colorMercurioVivo =
      porcentaje < 25 ? '#ff3b3b' : porcentaje < 50 ? '#ff9800' : porcentaje < 75 ? '#ffe066' : '#22c55e';

    // Icono temático (caritas)
    const icono = porcentaje < 25 ? '😟' : porcentaje < 50 ? '😐' : porcentaje < 75 ? '🙂' : '😃';

    // Animación de subida del mercurio
    useEffect(() => {
      let start = 0;
      const duration = 1200; // ms
      const startTime = performance.now();
      function animate(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        setAnimPorcentaje(progress * porcentaje);
        if (progress < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);
      // eslint-disable-next-line
    }, [porcentaje]);

    // Altura máxima del mercurio (en px)
    const maxHeight = 140;
    const mercurioHeight = (animPorcentaje / 100) * maxHeight;
    const mercurioY = maxHeight - mercurioHeight;

    // Resplandor animado para el bulbo
    const resplandor = {
      animation: 'halo-pulse 1.5s infinite',
      transformOrigin: 'center center',
      opacity: 0.5,
      filter: `blur(2px)`
    };

    return (
      <div
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center cursor-pointer relative"
        onClick={() => handleAreaClick(area)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <h3 className="text-sm font-medium text-gray-800 mb-2 text-center h-10 line-clamp-2">
          {area.descripcion || 'Área sin nombre'}
        </h3>
        <div className="w-full flex justify-center my-2 relative h-48">
          <div className="relative flex flex-col items-center">
            {/* SVG Termómetro */}
            <svg width="170" height="300" viewBox="0 0 110 200">
              {/* Resplandor animado en todo el tubo */}
              <rect x="23" y="13" width="24" height={maxHeight + 44} rx="12" fill={colorMercurioVivo} style={resplandor} />
              {/* Tubo */}
              <rect x="30" y="20" width="10" height={maxHeight} rx="5" fill="#eee" stroke="#bbb" strokeWidth="2" />
              {/* Brillo del tubo */}
              <rect x="33" y="25" width="3" height={maxHeight-10} rx="2" fill="#fff" opacity="0.25" />
              {/* Mercurio animado con gradiente y sombra */}
              <rect
                x="30"
                y={20 + mercurioY}
                width="10"
                height={mercurioHeight}
                rx="5"
                fill={`url(#mercurioGradientVivo)`}
                style={{ transition: 'y 0.5s, height 0.5s', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }}
              />
              {/* Bulbo */}
              <circle cx="35" cy={maxHeight + 30} r="25" fill="#fff" stroke="#bbb" strokeWidth="2" />
              <circle cx="35" cy={maxHeight + 30} r="24" fill={colorMercurioVivo} style={resplandor} />
              <circle cx="35" cy={maxHeight + 30} r="20" fill={colorMercurioVivo} style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.18))' }} />
              {/* Brillo en el bulbo */}
              <ellipse cx="28" cy={maxHeight + 20} rx="7" ry="3" fill="#fff" opacity="0.4" />
              {/* Gradiente para el mercurio */}
              <defs>
                <linearGradient id="mercurioGradientVivo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fff" />
                  <stop offset="30%" stopColor={colorMercurioVivo} />
                  <stop offset="100%" stopColor={colorMercurio} />
                </linearGradient>
              </defs>
              {/* Marcas y etiquetas */}
              {[0, 25, 50, 75, 100].map((val) => (
                <g key={val}>
                  <line
                    x1="42"
                    x2="80"
                    y1={20 + maxHeight - (val / 100) * maxHeight}
                    y2={20 + maxHeight - (val / 100) * maxHeight}
                    stroke="#888"
                    strokeWidth="2"
                  />
                  <text
                    x="90"
                    y={24 + maxHeight - (val / 100) * maxHeight}
                    fontSize="14"
                    fill="#666"
                    alignmentBaseline="middle"
                    textAnchor="start"
                  >
                    {val}%
                  </text>
                </g>
              ))}
            </svg>
            {/* Burbuja de valor animada */}
            <div
              className="absolute left-1/2 transform -translate-x-1/2"
              style={{
                top: `${30 + mercurioY}px`,
                transition: 'top 0.5s',
                zIndex: 10,
              }}
            >
              <div className="bg-white shadow-lg rounded px-2 py-1 text-lg font-bold border border-gray-200 animate-bounce flex items-center" style={{ color: colorMercurioVivo }}>
                <span className="mr-1">{icono}</span>
                {animPorcentaje.toFixed(1)}%
              </div>
            </div>
            {/* Tooltip */}
            {showTooltip && (
              <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-black text-white text-xs rounded px-2 py-1 shadow-lg z-20 whitespace-nowrap pointer-events-none opacity-90">
                Porcentaje de ejecución: {porcentaje.toFixed(1)}%
              </div>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 text-center mt-3">Ver detalles</div>
        {/* Animación de pulso para el bulbo */}
        <style>{`
          @keyframes halo-pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.25); opacity: 0.15; }
            100% { transform: scale(1); opacity: 0.5; }
          }
        `}</style>
      </div>
    );
  };

  // Modal de detalles del área
  const DetalleAreaModal = ({ area, onClose }) => {
    if (!area) return null;
    
    // Extraer valores optimizados
    const totalPIM = area.presupuesto?.total_pim || 0;
    const totalDevengado = area.ejecucion?.total_devengado || 0;
    const porEjecutar = area.por_ejecutar || 0;
    const porcentaje = area.porcentaje_ejecucion || 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {area.descripcion || 'Área sin nombre'}
              </h2>
              <button 
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-1">PIM Total</h3>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(totalPIM)}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-1">Devengado Total</h3>
                <p className="text-xl font-bold text-green-700">{formatCurrency(totalDevengado)}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-800 mb-1">Por Ejecutar</h3>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(porEjecutar)}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-800">Porcentaje de Ejecución</h3>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: getEjecucionColor(porcentaje) }}
                >
                  {porcentaje.toFixed(2)}%
                </p>
              </div>
              
              <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full"
                  style={{ 
                    width: `${Math.min(porcentaje, 100)}%`,
                    backgroundColor: getEjecucionColor(porcentaje)
                  }}
                ></div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      {/* Fila principal: título y controles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 md:mb-0">Dashboard de Ejecución Presupuestal por Áreas</h1>
        <div className="flex flex-row items-center gap-3 w-full md:w-auto">
          <Link 
            to="/dashboard/presupuesto" 
            className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            <FiBarChart2 className="mr-2" />
            Ver Dashboard General
          </Link>
          <div className="inline-block min-w-[100px] relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none w-full px-3 py-1.5 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
            >
              {getAniosOptions().map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <button
            onClick={() => loadAreasDatos(true)} // Forzar refresco
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiRefreshCw className="mr-2" />
            Actualizar
          </button>
        </div>
      </div>
      {/* Fila: Última actualización a la izquierda, leyenda a la derecha */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-2 w-full">
        <div className="w-full md:w-auto text-sm text-gray-500 mb-2 md:mb-0 flex-1">
          {lastUpdateDate && (
            <span>
              Última actualización: {lastUpdateDate.toLocaleString('es-ES')}
            </span>
          )}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4 text-xs md:text-right">
          <span className="flex items-center mb-1 md:mb-0"><span className="inline-block w-4 h-2 rounded bg-[#dc2626] mr-2"></span>Menos de 25%</span>
          <span className="flex items-center mb-1 md:mb-0"><span className="inline-block w-4 h-2 rounded bg-[#f97316] mr-2"></span>25% - 49%</span>
          <span className="flex items-center mb-1 md:mb-0"><span className="inline-block w-4 h-2 rounded bg-[#facc15] mr-2"></span>50% - 74%</span>
          <span className="flex items-center"><span className="inline-block w-4 h-2 rounded bg-[#16a34a] mr-2"></span>75% - 100%</span>
        </div>
      </div>
      
      {/* Leyenda de colores */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <div className="flex items-center text-xs text-gray-600">
          <FiInfo className="mr-1" />
          <span>Haga clic en un área para ver detalles</span>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {areasDatos.map(area => (
            <div key={area.id_ae} className="relative">
              {cargandoArea[area.id_ae] && (
                <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              <AreaTermometro area={area} />
            </div>
          ))}
          
          {areasDatos.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-500">
              No hay datos de áreas para mostrar
            </div>
          )}
        </div>
      )}
      
      {/* Modal de detalles */}
      {showDetalle && detalleArea && (
        <DetalleAreaModal area={detalleArea} onClose={closeDetalle} />
      )}
    </div>
  );
};

export default DashboardPresupuestoAreas; 