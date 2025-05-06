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

  // Cargar datos de presupuesto y ejecución para cada área
  const loadAreasDatos = async (areas) => {
    setLoading(true);
    setError(null);
    
    try {
      const datosPromises = areas.map(async (area) => {
        // Cargar datos de presupuesto para el área
        const presupuestoEndpoint = `presupuesto/areas-ejecutoras/${area.id_ae}/presupuestos`;
        const presupuestoResponse = await apiService.getAll(presupuestoEndpoint);
        const presupuestoData = presupuestoResponse?.data || presupuestoResponse;
        
        // Cargar datos de ejecución para el área
        const ejecucionEndpoint = `presupuesto/areas-ejecutoras/${area.id_ae}/ejecuciones`;
        const ejecucionResponse = await apiService.getAll(ejecucionEndpoint);
        const ejecucionData = ejecucionResponse?.data || ejecucionResponse;
        
        // Calcular totales
        let totalPIM = 0;
        let totalDevengado = 0;
        
        // Procesar datos de presupuesto
        if (presupuestoData && presupuestoData.presupuestos) {
          const presupuestos = presupuestoData.presupuestos || [];
          totalPIM = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_pim || 0), 0);
        }
        
        // Procesar datos de ejecución
        if (ejecucionData && ejecucionData.ejecuciones) {
          const ejecuciones = ejecucionData.ejecuciones || [];
          totalDevengado = ejecuciones.reduce((sum, e) => sum + parseFloat(e.mto_devengado || 0), 0);
        }
        
        // Calcular porcentaje de ejecución
        const porcentajeEjecucion = totalPIM > 0 ? (totalDevengado / totalPIM) * 100 : 0;
        
        // Retornar datos del área con sus totales y porcentaje
        return {
          ...area,
          totalPIM,
          totalDevengado,
          porEjecutar: Math.max(0, totalPIM - totalDevengado),
          porcentajeEjecucion
        };
      });
      
      // Esperar a que todas las promesas se resuelvan
      const resultados = await Promise.all(datosPromises);
      
      // Ordenar áreas por porcentaje de ejecución (descendente)
      const areasOrdenadas = resultados.sort((a, b) => b.porcentajeEjecucion - a.porcentajeEjecucion);
      
      setAreasDatos(areasOrdenadas);
      
      // Actualizar timestamp
      setLastUpdateDate(new Date());
    } catch (error) {
      console.error('Error al cargar datos de áreas:', error);
      setError('No se pudieron cargar los datos de las áreas. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      const areas = await loadAreasEjecutoras();
      if (areas.length > 0) {
        await loadAreasDatos(areas);
      }
    };
    
    loadData();
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
    const porcentaje = area.porcentajeEjecucion;
    const color = getEjecucionColor(porcentaje);
    
    // Determinar la categoría de avance (pronóstico, avance, por cumplir)
    const getAvanceCategoria = () => {
      if (porcentaje >= 75) return 'avance';
      if (porcentaje >= 25) return 'pronostico';
      return 'por-cumplir';
    };
    
    const categoriaAvance = getAvanceCategoria();
    
    return (
      <div 
        className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center cursor-pointer"
        onClick={() => handleAreaClick(area)}
      >
        <h3 className="text-sm font-medium text-gray-800 mb-2 text-center h-10 line-clamp-2">
          {area.descripcion || 'Área sin nombre'}
        </h3>
        
        {/* Termómetro realista */}
        <div className="w-full flex justify-center my-2 relative h-48">
          <div className="relative">
            {/* Contenedor principal del termómetro */}
            <div className="flex flex-col items-center">
              {/* Tubo del termómetro */}
              <div className="w-8 h-36 bg-white border-2 border-gray-400 rounded-t-md relative mb-0">
                {/* Marcas de graduación */}
                <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col justify-between">
                  <div className="ml-1 mr-1 h-px bg-gray-300"></div>
                  <div className="ml-1 mr-1 h-px bg-gray-300"></div>
                  <div className="ml-1 mr-1 h-px bg-gray-300"></div>
                  <div className="ml-1 mr-1 h-px bg-gray-300"></div>
                  <div className="ml-1 mr-1 h-px bg-gray-300"></div>
                </div>
                
                {/* Escala del termómetro */}
                <div className="absolute left-full top-0 h-full ml-1 flex flex-col justify-between items-start text-[8px] text-gray-600">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
                
                {/* Relleno rojo del termómetro */}
                <div 
                  className="absolute bottom-0 left-1 right-1 rounded-t-md transition-all duration-500 ease-out"
                  style={{ 
                    backgroundColor: color,
                    height: `${Math.min(porcentaje, 100)}%`
                  }}
                ></div>
              </div>
              
              {/* Conector entre tubo y bulbo */}
              <div className="h-1 w-6 -mt-1 bg-white border-l-2 border-r-2 border-gray-400 z-10"></div>
              
              {/* Bulbo circular del termómetro */}
              <div className="w-16 h-16 bg-white border-2 border-gray-400 rounded-full relative -mt-1">
                {/* Relleno rojo del bulbo */}
                <div 
                  className="absolute top-0 left-0 w-full h-full rounded-full overflow-hidden"
                  style={{ backgroundColor: color }}
                >
                  {/* Brillo para dar efecto 3D */}
                  <div className="absolute top-2 left-3 w-4 h-4 bg-white opacity-40 rounded-full"></div>
                </div>
              </div>
            </div>
            
            {/* Etiqueta de categoría */}
            <div className="absolute top-1 right-1">
              <div className="flex flex-col items-end">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded mb-1 ${
                  categoriaAvance === 'avance' ? 'bg-green-600 text-white' : 
                  categoriaAvance === 'pronostico' ? 'bg-yellow-500 text-white' : 
                  'bg-orange-500 text-white'
                }`}>
                  {categoriaAvance === 'avance' ? 'AVANCE' : 
                   categoriaAvance === 'pronostico' ? 'PRONÓSTICO' : 
                   'POR CUMPLIR'}
                </span>
                
                {/* Porcentaje grande */}
                <div className="text-lg font-bold mr-1" style={{ color }}>
                  {porcentaje.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 text-center mt-3">
          Ver detalles
        </div>
      </div>
    );
  };

  // Modal de detalles del área
  const DetalleAreaModal = ({ area, onClose }) => {
    if (!area) return null;
    
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
                <p className="text-xl font-bold text-blue-700">{formatCurrency(area.totalPIM)}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800 mb-1">Devengado Total</h3>
                <p className="text-xl font-bold text-green-700">{formatCurrency(area.totalDevengado)}</p>
              </div>
              
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-orange-800 mb-1">Por Ejecutar</h3>
                <p className="text-xl font-bold text-orange-700">{formatCurrency(area.porEjecutar)}</p>
              </div>
            </div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium text-gray-800">Porcentaje de Ejecución</h3>
                <p 
                  className="text-2xl font-bold"
                  style={{ color: getEjecucionColor(area.porcentajeEjecucion) }}
                >
                  {area.porcentajeEjecucion.toFixed(2)}%
                </p>
              </div>
              
              <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full"
                  style={{ 
                    width: `${Math.min(area.porcentajeEjecucion, 100)}%`,
                    backgroundColor: getEjecucionColor(area.porcentajeEjecucion)
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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de Ejecución Presupuestal por Áreas</h1>
        
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* Enlace al Dashboard principal */}
          <Link 
            to="/dashboard/presupuesto" 
            className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            <FiBarChart2 className="mr-2" />
            Ver Dashboard General
          </Link>
          
          {/* Filtro por año */}
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
            onClick={() => loadAreasDatos(areasEjecutoras)}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiRefreshCw className="mr-2" />
            Actualizar
          </button>
        </div>
      </div>
      
      {lastUpdateDate && (
        <p className="text-sm text-gray-500 mb-4">
          Última actualización: {lastUpdateDate.toLocaleString('es-ES')}
        </p>
      )}
      
      {/* Leyenda */}
      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 inline-block bg-green-600 rounded-sm"></span>
          <span className="text-xs text-gray-700">AVANCE</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 inline-block bg-yellow-500 rounded-sm"></span>
          <span className="text-xs text-gray-700">PRONÓSTICO</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-4 w-4 inline-block bg-orange-500 rounded-sm"></span>
          <span className="text-xs text-gray-700">POR CUMPLIR</span>
        </div>
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
            <AreaTermometro key={area.id_ae} area={area} />
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