import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { FiUsers, FiCalendar, FiActivity, FiSearch, FiMapPin } from 'react-icons/fi';
import PeruMap from '../components/common/PeruMap';
import { ADDRESS } from '../utils.jsx';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);

const DashboardDepartamentos = () => {
  // Estados para datos
  const [municipalidades, setMunicipalidades] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estados, setEstados] = useState([]);
  
  // Estado para el departamento seleccionado
  const [selectedDepartamento, setSelectedDepartamento] = useState(null);
  const [showDepartamentoDropdown, setShowDepartamentoDropdown] = useState(false);
  const [departamentoSearchQuery, setDepartamentoSearchQuery] = useState('');
  
  // Estados para estadísticas
  const [departamentosStats, setDepartamentosStats] = useState([]);
  const [municipalidadesContactadasPorDepartamento, setMunicipalidadesContactadasPorDepartamento] = useState({});
  const [totalMunicipalidadesPorDepartamento, setTotalMunicipalidadesPorDepartamento] = useState({});
  const [porcentajeAvancePorDepartamento, setPorcentajeAvancePorDepartamento] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdateDate, setLastUpdateDate] = useState(new Date());

  // Función para obtener la descripción del estado
  const getEstadoDescripcion = (estadoSeguimiento) => {
    if (!estadoSeguimiento.id_estado_ref) return 'N/A';
    
    const estadoRef = estados.find(e => e.id_estado == estadoSeguimiento.id_estado_ref);
    if (estadoRef) {
      return estadoRef.descripcion || 'N/A';
    }
    
    return 'N/A';
  };

  // Función para formatear fechas
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Función para cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        municipalidadesRes, 
        estadosSeguimientoRes, 
        contactosRes,
        eventosRes,
        estadosRes
      ] = await Promise.all([
        axios.get(`${ADDRESS}api/municipalidades`),
        axios.get(`${ADDRESS}api/estados-seguimiento`),
        axios.get(`${ADDRESS}api/contactos`),
        axios.get(`${ADDRESS}api/eventos`),
        axios.get(`${ADDRESS}api/estados`)
      ]);
      
      setMunicipalidades(municipalidadesRes.data || []);
      setEstadosSeguimiento(estadosSeguimientoRes.data || []);
      setContactos(contactosRes.data || []);
      setEventos(eventosRes.data || []);
      setEstados(estadosRes.data || []);
      setLastUpdateDate(new Date());
      
      // Procesar datos después de cargarlos
      procesarDatosPorDepartamento(
        municipalidadesRes.data || [], 
        estadosSeguimientoRes.data || [], 
        eventosRes.data || []
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener todos los departamentos únicos de las municipalidades
  const obtenerDepartamentosUnicos = useCallback(() => {
    const departamentos = [...new Set(
      municipalidades
        .filter(m => m.departamento)
        .map(m => m.departamento)
    )].sort();
    
    return departamentos;
  }, [municipalidades]);

  // Procesar datos por departamento
  const procesarDatosPorDepartamento = useCallback((municipalidades, estadosSeguimiento, eventos) => {
    // Obtener todos los departamentos únicos
    const departamentos = [...new Set(
      municipalidades
        .filter(m => m.departamento)
        .map(m => m.departamento)
    )].sort();

    // Contar municipalidades por departamento
    const totalPorDepartamento = departamentos.reduce((acc, departamento) => {
      acc[departamento] = municipalidades.filter(m => m.departamento === departamento).length;
      return acc;
    }, {});
    
    // Contar municipalidades contactadas por departamento
    const contactadasPorDepartamento = departamentos.reduce((acc, departamento) => {
      // Filtrar municipalidades del departamento actual
      const municipalidadesDepartamento = municipalidades.filter(m => m.departamento === departamento);
      
      // Contar cuántas municipalidades tienen al menos un evento
      let count = 0;
      for (const municipalidad of municipalidadesDepartamento) {
        const tieneEvento = eventos.some(e => e.id_municipalidad === municipalidad.id_municipalidad);
        if (tieneEvento) count++;
      }
      
      acc[departamento] = count;
      return acc;
    }, {});
    
    // Calcular porcentaje de avance por departamento
    const porcentaje = departamentos.reduce((acc, departamento) => {
      const total = totalPorDepartamento[departamento] || 0;
      const contactadas = contactadasPorDepartamento[departamento] || 0;
      acc[departamento] = total > 0 ? (contactadas / total) * 100 : 0;
      return acc;
    }, {});
    
    // Preparar estadísticas por departamento para mostrar
    const stats = departamentos.map(departamento => ({
      departamento,
      total: totalPorDepartamento[departamento] || 0,
      contactadas: contactadasPorDepartamento[departamento] || 0,
      porcentaje: porcentaje[departamento] || 0,
    }));
    
    setDepartamentosStats(stats);
    setTotalMunicipalidadesPorDepartamento(totalPorDepartamento);
    setMunicipalidadesContactadasPorDepartamento(contactadasPorDepartamento);
    setPorcentajeAvancePorDepartamento(porcentaje);
  }, []);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  // Procesar datos cuando cambian
  useEffect(() => {
    if (municipalidades.length > 0 && eventos.length > 0) {
      procesarDatosPorDepartamento(municipalidades, estadosSeguimiento, eventos);
    }
  }, [municipalidades, estadosSeguimiento, eventos]);

  // Estadísticas generales
  const getTotalMunicipalidades = () => municipalidades.length;
  const getTotalContactadas = () => {
    // Una municipalidad está contactada si tiene al menos un evento
    const municipalidadesContactadas = new Set();
    eventos.forEach(evento => {
      if (evento.id_municipalidad) {
        municipalidadesContactadas.add(evento.id_municipalidad);
      }
    });
    return municipalidadesContactadas.size;
  };
  const getPorcentajeAvance = () => {
    const total = getTotalMunicipalidades();
    const contactadas = getTotalContactadas();
    return total > 0 ? (contactadas / total) * 100 : 0;
  };

  // Filtrar municipalidades por departamento seleccionado
  const municipalidadesFiltered = selectedDepartamento 
    ? municipalidades.filter(m => m.departamento === selectedDepartamento)
    : municipalidades;
  
  // Filtrar eventos por departamento seleccionado
  const eventosFiltered = selectedDepartamento
    ? eventos.filter(evento => {
        const municipalidad = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
        return municipalidad && municipalidad.departamento === selectedDepartamento;
      })
    : eventos;
  
  // Filtrar seguimientos por departamento seleccionado
  const seguimientosFiltered = selectedDepartamento
    ? estadosSeguimiento.filter(estado => {
        const evento = eventos.find(e => e.id_evento === estado.id_evento);
        if (!evento) return false;
        
        const municipalidad = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
        return municipalidad && municipalidad.departamento === selectedDepartamento;
      })
    : estadosSeguimiento;

  // Preparar datos para gráficos
  const departamentosChartData = {
    labels: Object.keys(municipalidadesContactadasPorDepartamento),
    datasets: [
      {
        label: 'Municipalidades Contactadas',
        data: Object.values(municipalidadesContactadasPorDepartamento),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Total Municipalidades',
        data: Object.values(totalMunicipalidadesPorDepartamento),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  const porcentajeAvanceChartData = {
    labels: Object.keys(porcentajeAvancePorDepartamento),
    datasets: [
      {
        label: 'Porcentaje de Avance',
        data: Object.values(porcentajeAvancePorDepartamento),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Configuración de gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Estadísticas por Departamento',
      },
    },
  };

  return (
    <div className="mt-2">
      <h1 className="text-2xl font-bold mb-6">Dashboard Geográfico - Departamentos</h1>
      
      {/* Última actualización */}
      <div className="text-sm text-gray-500 mb-4">
        Última actualización: {formatDate(lastUpdateDate)} {lastUpdateDate.toLocaleTimeString()}
        <button
          onClick={loadData}
          className="ml-2 text-blue-500 hover:text-blue-700"
        >
          Actualizar
        </button>
      </div>

      {/* Selector de departamento */}
      <div className="mb-6">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <div className="relative">
            <div
              className="w-full p-2.5 bg-white border border-gray-300 rounded-md shadow-sm cursor-pointer flex items-center justify-between"
              onClick={() => setShowDepartamentoDropdown(!showDepartamentoDropdown)}
            >
              <div className="flex items-center">
                <FiMapPin className="mr-2 text-gray-500" />
                <span>
                  {selectedDepartamento || "Seleccionar Departamento"}
                </span>
              </div>
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            
            {showDepartamentoDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md overflow-auto focus:outline-none">
                <div className="sticky top-0 z-20 bg-white p-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Buscar departamento..."
                      value={departamentoSearchQuery}
                      onChange={(e) => setDepartamentoSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                {/* Opción para limpiar la selección */}
                <div
                  className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 border-b border-gray-200"
                  onClick={() => {
                    setSelectedDepartamento(null);
                    setShowDepartamentoDropdown(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium truncate text-gray-500">Todos los departamentos</span>
                  </div>
                </div>
                
                {obtenerDepartamentosUnicos().filter(depto => 
                  !departamentoSearchQuery.trim() || 
                  depto.toLowerCase().includes(departamentoSearchQuery.toLowerCase())
                ).map((departamento, index) => (
                  <div
                    key={index}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                      selectedDepartamento === departamento ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                    }`}
                    onClick={() => {
                      setSelectedDepartamento(departamento);
                      setShowDepartamentoDropdown(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{departamento}</span>
                    </div>
                    
                    {selectedDepartamento === departamento && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Municipalidades</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedDepartamento 
                  ? totalMunicipalidadesPorDepartamento[selectedDepartamento] || 0 
                  : getTotalMunicipalidades()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Municipalidades Contactadas</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedDepartamento 
                  ? municipalidadesContactadasPorDepartamento[selectedDepartamento] || 0 
                  : getTotalContactadas()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FiActivity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Porcentaje de Avance</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedDepartamento 
                  ? (porcentajeAvancePorDepartamento[selectedDepartamento] || 0).toFixed(2) 
                  : getPorcentajeAvance().toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mapa y gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mapa de Perú */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Mapa de Avance por Departamento</h3>
          <div className="h-80 flex justify-center items-center">
            <PeruMap 
              departamentosData={porcentajeAvancePorDepartamento}
              onSelectDepartamento={setSelectedDepartamento}
              selectedDepartamento={selectedDepartamento}
            />
          </div>
        </div>
        
        {/* Gráfico de barras de municipalidades por departamento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Municipalidades por Departamento</h3>
          <div className="h-80">
            <Bar data={departamentosChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Tabla de estadísticas por departamento */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Estadísticas por Departamento</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Departamento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Municipalidades
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Municipalidades Contactadas
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje Avance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departamentosStats
                .sort((a, b) => b.porcentaje - a.porcentaje) // Ordenar por porcentaje descendente
                .map((stat, index) => (
                  <tr 
                    key={index}
                    className={`${selectedDepartamento === stat.departamento ? 'bg-blue-50' : ''} 
                              cursor-pointer hover:bg-gray-50`}
                    onClick={() => setSelectedDepartamento(stat.departamento)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.departamento}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stat.contactadas}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              stat.porcentaje >= 75 ? 'bg-green-600' :
                              stat.porcentaje >= 50 ? 'bg-blue-600' :
                              stat.porcentaje >= 25 ? 'bg-yellow-500' :
                              'bg-red-600'
                            }`}
                            style={{ width: `${stat.porcentaje}%` }}
                          ></div>
                        </div>
                        <span className="ml-3">{stat.porcentaje.toFixed(2)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Gráfico de porcentaje de avance */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4">Porcentaje de Avance por Departamento</h3>
        <div className="h-96">
          <Bar data={porcentajeAvanceChartData} options={chartOptions} />
        </div>
      </div>
      
      {/* Lista de últimas interacciones en el departamento seleccionado */}
      {selectedDepartamento && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">
            Últimas Interacciones en {selectedDepartamento}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipalidad
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Compromiso
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seguimientosFiltered
                  .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                  .slice(0, 10)
                  .map((estado, index) => {
                    // Encontrar evento relacionado
                    const evento = eventos.find(e => e.id_evento === estado.id_evento);
                    
                    // Encontrar municipalidad relacionada
                    const municipalidad = evento && municipalidades.find(
                      m => m.id_municipalidad === evento.id_municipalidad
                    );
                    
                    // Encontrar contacto relacionado
                    const contacto = contactos.find(c => c.id_contacto === estado.id_contacto);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(estado.fecha)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {municipalidad ? municipalidad.nombre : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {contacto ? contacto.nombre_completo : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${getEstadoDescripcion(estado) === 'Completado' ? 'bg-green-100 text-green-800' : 
                              getEstadoDescripcion(estado) === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' : 
                              getEstadoDescripcion(estado) === 'Pendiente' ? 'bg-blue-100 text-blue-800' : 
                              getEstadoDescripcion(estado) === 'Cancelado' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {getEstadoDescripcion(estado)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {estado.fecha_compromiso ? formatDate(estado.fecha_compromiso) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                {seguimientosFiltered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay interacciones registradas para este departamento
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDepartamentos;
