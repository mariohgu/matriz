import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { 
  FiUsers, 
  FiActivity, 
  FiCalendar, 
  FiFilter, 
  FiRefreshCw,
  FiCheck,  
  FiX
} from 'react-icons/fi';
import PeruMap from '../components/common/PeruMap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ADDRESS } from '../utils.jsx';
import { api, apiService } from '../services/authService';

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
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  
  // Estados para fecha de última actualización
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // Estado para carga
  const [loading, setLoading] = useState(true);
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };
  
  // Función para cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      // Cargar todos los datos usando Promise.all para optimizar
      const [
        municipalidadesData, 
        estadosSeguimientoData, 
        contactosData, 
        eventosData,
        estadosData
      ] = await Promise.all([
        apiService.getAll('municipalidades'),
        apiService.getAll('estados-seguimiento'),
        apiService.getAll('contactos'),
        apiService.getAll('eventos'),
        apiService.getAll('estados')
      ]);
      
      setMunicipalidades(municipalidadesData || []);
      setEstadosSeguimiento(estadosSeguimientoData || []);
      setContactos(contactosData || []);
      setEventos(eventosData || []);
      setEstados(estadosData || []);
      
      // Actualizar fecha de última actualización
      const now = new Date();
      setLastUpdateDate(now);
      localStorage.setItem('dashboardDepartamentosLastUpdate', now.toISOString());
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    const storedDate = localStorage.getItem('dashboardDepartamentosLastUpdate');
    if (storedDate) {
      setLastUpdateDate(storedDate);
    }
    
    loadData();
  }, []);
  
  // Obtener departamentos únicos de las municipalidades
  const departamentos = [...new Set(municipalidades
    .filter(muni => muni.departamento) // Filtrar valores nulos o undefined
    .map(muni => muni.departamento))]
    .sort();
  
  // Calcular total de municipalidades por departamento
  const totalMunicipalidadesPorDepartamento = departamentos.reduce((acc, dep) => {
    acc[dep] = municipalidades.filter(muni => muni.departamento === dep).length;
    return acc;
  }, {});
  
  // Calcular municipalidades contactadas por departamento (tienen al menos un contacto)
  const municipalidadesContactadasPorDepartamento = departamentos.reduce((acc, dep) => {
    const muniIds = municipalidades
      .filter(muni => muni.departamento === dep)
      .map(muni => muni.id_municipalidad);
    
    const contactadasCount = new Set(
      contactos
        .filter(contact => muniIds.includes(contact.id_municipalidad))
        .map(contact => contact.id_municipalidad)
    ).size;
    
    acc[dep] = contactadasCount;
    return acc;
  }, {});
  
  // Calcular porcentaje de avance por departamento
  const porcentajeAvancePorDepartamento = departamentos.reduce((acc, dep) => {
    const total = totalMunicipalidadesPorDepartamento[dep] || 0;
    const contactadas = municipalidadesContactadasPorDepartamento[dep] || 0;
    acc[dep] = total > 0 ? (contactadas / total) * 100 : 0;
    return acc;
  }, {});
  
  // Funciones para obtener totales globales
  const getTotalMunicipalidades = () => municipalidades.length;
  
  const getTotalContactadas = () => {
    return new Set(contactos
      .filter(contact => contact.id_municipalidad)
      .map(contact => contact.id_municipalidad)).size;
  };
  
  const getPorcentajeAvance = () => {
    const total = getTotalMunicipalidades();
    const contactadas = getTotalContactadas();
    return total > 0 ? (contactadas / total) * 100 : 0;
  };
  
  // Filtrar datos por departamento seleccionado
  const filteredMunicipalidades = selectedDepartamento 
    ? municipalidades.filter(muni => muni.departamento === selectedDepartamento) 
    : municipalidades;
  
  // Datos para el gráfico de departamentos
  const departamentosChartData = {
    labels: departamentos,
    datasets: [
      {
        label: 'Total Municipalidades',
        data: departamentos.map(dep => totalMunicipalidadesPorDepartamento[dep] || 0),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Municipalidades Contactadas',
        data: departamentos.map(dep => municipalidadesContactadasPorDepartamento[dep] || 0),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Datos para el gráfico de estado de seguimiento
  const estadoSeguimientoData = {
    labels: estadosSeguimiento.map(estado => estado.nombre || estado.descripcion || 'Sin nombre'),
    datasets: [
      {
        label: 'Eventos por Estado',
        data: estadosSeguimiento.map(estado => {
          const eventosEnEstado = eventos.filter(
            evento => evento.id_estado === estado.id_estado ||
            evento.estado_seguimiento_id === estado.id
          );
          return eventosEnEstado.length;
        }),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Opciones compartidas para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.parsed.y;
          }
        }
      }
    },
  };
  
  return (
    <div className="p-6 max-w-full" style={{ 
      paddingRight: '1.5rem', 
      paddingLeft: '1.5rem', 
      boxSizing: 'border-box', 
      width: '100%' 
    }}>
      {/* Encabezado y filtro de departamento */}
      <div className="flex flex-wrap items-center justify-between mb-6">
        <div className="w-full md:w-auto mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard por Departamentos</h1>
          <p className="text-sm text-gray-600">
            Última actualización: {lastUpdateDate ? formatDate(lastUpdateDate) : 'Nunca'}
            <button 
              onClick={loadData} 
              className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none text-xs"
            >
              Actualizar
            </button>
          </p>
        </div>

        <div className="w-full md:w-auto flex space-x-2">
          <div className="relative">
            <select 
              className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedDepartamento}
              onChange={(e) => setSelectedDepartamento(e.target.value)}
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map((dep) => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <FiFilter />
            </div>
          </div>
          
          <button 
            onClick={() => setSelectedDepartamento('')} 
            className="bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Limpiar
          </button>
          
          <button 
            onClick={loadData} 
            className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <FiRefreshCw className="mr-1" /> Actualizar
          </button>
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Municipalidades */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Total de Municipalidades</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {selectedDepartamento 
                  ? totalMunicipalidadesPorDepartamento[selectedDepartamento] || 0 
                  : getTotalMunicipalidades()}
              </h3>
            </div>
            <span className="bg-blue-100 p-3 rounded-full">
              <FiUsers className="text-blue-500 text-xl" />
            </span>
          </div>
        </div>
        
        {/* Contactos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Municipalidades Contactadas</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {selectedDepartamento 
                  ? municipalidadesContactadasPorDepartamento[selectedDepartamento] || 0 
                  : getTotalContactadas()}
              </h3>
            </div>
            <span className="bg-green-100 p-3 rounded-full">
              <FiUsers className="text-green-500 text-xl" />
            </span>
          </div>
        </div>
        
        {/* Porcentaje */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Porcentaje de Avance</p>
              <h3 className="text-3xl font-bold text-gray-800">
                {selectedDepartamento 
                  ? (porcentajeAvancePorDepartamento[selectedDepartamento] || 0).toFixed(2) 
                  : getPorcentajeAvance().toFixed(2)}%
              </h3>
            </div>
            <span className="bg-yellow-100 p-3 rounded-full">
              <FiActivity className="text-yellow-500 text-xl" />
            </span>
          </div>
        </div>
      </div>
      
      {/* Mapa y gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Mapa de Perú */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Mapa de Avance por Departamento</h3>
          <div className="h-80 flex justify-center items-center">
            {loading ? <LoadingSpinner /> : (
              <PeruMap 
                departamentosData={porcentajeAvancePorDepartamento}
                onSelectDepartamento={setSelectedDepartamento}
                selectedDepartamento={selectedDepartamento}
              />
            )}
          </div>
        </div>
        
        {/* Gráfico de barras de municipalidades por departamento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Municipalidades por Departamento</h3>
          <div className="h-80">
            {loading ? <LoadingSpinner /> : (
              <Bar data={departamentosChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>
      
      {/* Gráficos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Estado de seguimiento */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Estados de Seguimiento</h3>
          <div className="h-80">
            {loading ? <LoadingSpinner /> : (
              estadosSeguimiento.length > 0 ? (
                <Pie data={estadoSeguimientoData} options={chartOptions} />
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-500">No hay datos de estados de seguimiento</p>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Otra métrica */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Progreso en el Tiempo</h3>
          <div className="h-80 flex items-center justify-center">
            {loading ? <LoadingSpinner /> : <p className="text-gray-500">Datos no disponibles</p>}
          </div>
        </div>
      </div>
      
      {/* Tabla de estadísticas por departamento */}
      <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">Estadísticas por Departamento</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departamento</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Municipalidades</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contactadas</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Avance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-4 px-4 text-center">
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : departamentos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                    No hay datos disponibles
                  </td>
                </tr>
              ) : (
                departamentos.map(dep => (
                  <tr 
                    key={dep} 
                    className={`hover:bg-gray-50 ${selectedDepartamento === dep ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDepartamento(dep)}
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{dep}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{totalMunicipalidadesPorDepartamento[dep] || 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{municipalidadesContactadasPorDepartamento[dep] || 0}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className="mr-2">
                          {(porcentajeAvancePorDepartamento[dep] || 0).toFixed(2)}%
                        </span>
                        <div className="w-24 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${porcentajeAvancePorDepartamento[dep] || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Lista de últimas interacciones en el departamento seleccionado */}
      {selectedDepartamento && (
        <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">
            Últimas Interacciones en {selectedDepartamento}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Municipalidad</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Evento</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : (
                  eventos
                    .filter(evento => {
                      const muni = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
                      return muni && muni.departamento === selectedDepartamento;
                    })
                    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                    .slice(0, 10)
                    .map(evento => {
                      const muni = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
                      const estado = estadosSeguimiento.find(e => 
                        e.id_estado === evento.id_estado || 
                        e.id === evento.estado_seguimiento_id
                      );
                      
                      return (
                        <tr key={evento.id_evento || evento.id} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {muni ? muni.nombre : 'No disponible'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {evento.tipo_evento || evento.tipo || 'No disponible'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {formatDate(evento.fecha)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium
                                ${estado && (estado.nombre || estado.descripcion || '').toLowerCase().includes('completado') 
                                  ? 'bg-green-100 text-green-800' 
                                  : estado && (estado.nombre || estado.descripcion || '').toLowerCase().includes('pendiente')
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }
                              `}
                            >
                              {estado ? (estado.nombre || estado.descripcion) : 'No disponible'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                )}
                {!loading && eventos.filter(evento => {
                  const muni = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
                  return muni && muni.departamento === selectedDepartamento;
                }).length === 0 && (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
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
