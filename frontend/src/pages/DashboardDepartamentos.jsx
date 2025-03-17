import React, { useState, useEffect, useRef } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import { 
  FiUsers, 
  FiActivity, 
  FiFilter, 
  FiRefreshCw,
  FiPrinter
} from 'react-icons/fi';

import PeruMap from '../components/common/PeruMap';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Table, Pagination } from '../components/ui';  // Importa tu Table.jsx
import ReactToPrint from 'react-to-print';        // <-- Nueva importación para la impresión

import { ADDRESS } from '../utils.jsx';
import { apiService } from '../services/authService';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);

const DashboardDepartamentos = () => {
  // -----------------------------
  // ESTADOS PRINCIPALES
  // -----------------------------
  const [municipalidades, setMunicipalidades] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estados, setEstados] = useState([]);
  
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Referencia para imprimir con react-to-print
  const printRef = useRef(null);

  // -----------------------------
  // FUNCIONES DE FORMATEO
  // -----------------------------
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

  // -----------------------------
  // CARGA DE DATOS
  // -----------------------------
  const loadData = async () => {
    setLoading(true);
    try {
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
      
      const now = new Date();
      setLastUpdateDate(now);
      localStorage.setItem('dashboardDepartamentosLastUpdate', now.toISOString());
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedDate = localStorage.getItem('dashboardDepartamentosLastUpdate');
    if (storedDate) {
      setLastUpdateDate(storedDate);
    }
    loadData();
  }, []);

  // -----------------------------
  // CÁLCULOS BÁSICOS
  // -----------------------------
  const departamentos = [...new Set(
    municipalidades
      .filter(muni => muni.departamento)
      .map(muni => muni.departamento)
  )].sort();

  // Contar total de municipalidades por dpto
  const totalMunicipalidadesPorDepartamento = departamentos.reduce((acc, dep) => {
    acc[dep] = municipalidades.filter(muni => muni.departamento === dep).length;
    return acc;
  }, {});

  // Contar cuántas están contactadas por dpto
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

  // Calcular % de avance
  const porcentajeAvancePorDepartamento = departamentos.reduce((acc, dep) => {
    const total = totalMunicipalidadesPorDepartamento[dep] || 0;
    const contactadas = municipalidadesContactadasPorDepartamento[dep] || 0;
    acc[dep] = total > 0 ? (contactadas / total) * 100 : 0;
    return acc;
  }, {});

  // Totales globales
  const getTotalMunicipalidades = () => municipalidades.length;
  const getTotalContactadas = () => {
    return new Set(
      contactos
        .filter(contact => contact.id_municipalidad)
        .map(contact => contact.id_municipalidad)
    ).size;
  };
  const getPorcentajeAvance = () => {
    const total = getTotalMunicipalidades();
    const contactadas = getTotalContactadas();
    return total > 0 ? (contactadas / total) * 100 : 0;
  };

  // -----------------------------
  // FILTRADOS
  // -----------------------------
  // Filtrado por departamento seleccionado
  const filteredMunicipalidades = selectedDepartamento 
    ? municipalidades.filter(muni => muni.departamento === selectedDepartamento) 
    : municipalidades;

  // -----------------------------
  // GRÁFICO: MUNICIPALIDADES POR DEPARTAMENTO (Bar)
  // -----------------------------
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

  // -----------------------------
  // NUEVO GRÁFICO: MUNICIPALIDADES CONTACTADAS POR NIVEL
  // -----------------------------
  // Asumiendo que municipalidades tengan un campo "nivel"
  const contactedSet = new Set(
    contactos.map(c => c.id_municipalidad).filter(Boolean)
  );
  const contactedMunicipalitiesData = municipalidades.filter(m =>
    contactedSet.has(m.id_municipalidad)
  );
  // Agrupamos por nivel
  const countsByNivel = {};
  contactedMunicipalitiesData.forEach(m => {
    const nivel = m.nivel || 'Sin Nivel';
    if (!countsByNivel[nivel]) {
      countsByNivel[nivel] = 0;
    }
    countsByNivel[nivel]++;
  });
  const nivelLabels = Object.keys(countsByNivel).sort();
  const nivelCounts = nivelLabels.map(n => countsByNivel[n]);

  const nivelChartData = {
    labels: nivelLabels,
    datasets: [
      {
        label: 'Municipalidades Contactadas',
        data: nivelCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // -----------------------------
  // GRÁFICO: PROGRESO EN EL TIEMPO (Line)
  // -----------------------------
  const filteredEvents = selectedDepartamento
    ? eventos.filter(evento => {
        const muni = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
        return muni && muni.departamento === selectedDepartamento;
      })
    : eventos;
  
  const eventsByDate = {};
  filteredEvents.forEach(event => {
    if (!event.fecha) return;
    const dateKey = new Date(event.fecha).toISOString().split('T')[0];
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = 0;
    }
    eventsByDate[dateKey]++;
  });
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => new Date(a) - new Date(b));
  const progressChartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Total de Eventos',
        data: sortedDates.map(d => eventsByDate[d]),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      }
    ]
  };
  const progressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      x: {
        title: { display: true, text: 'Fecha' }
      },
      y: {
        title: { display: true, text: 'Cantidad de Eventos' },
        beginAtZero: true
      }
    }
  };

  // -----------------------------
  // TABLA DE ÚLTIMOS 10 ESTADOS SEGUIMIENTOS
  // -----------------------------
  const last10StatesData = [...eventos]
    .filter(e => e.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10)
    .map(e => {
      const muni = municipalidades.find(m => m.id_municipalidad === e.id_municipalidad);
      const state = estadosSeguimiento.find(
        es => es.id_estado === e.id_estado || es.id === e.estado_seguimiento_id
      );
      return {
        fecha: e.fecha,
        municipalidad: muni ? muni.nombre : 'No disponible',
        estado: state ? (state.nombre || state.descripcion) : 'No disponible',
        tipoReunion: e.tipo_evento || 'No disponible',
        eventoId: e.id_evento || e.id, 
      };
    });

  const handleViewState = (id) => {
    // Manejador para el botón "Visualizar"
    alert(`Mostrar información detallada del estadoSeguimiento con ID: ${id}`);
  };

  const lastStatesColumns = [
    {
      field: 'fecha',
      header: 'Fecha',
      body: (row) => formatDate(row.fecha),
    },
    {
      field: 'municipalidad',
      header: 'Nombre Municipalidad'
    },
    {
      field: 'estado',
      header: 'Estado'
    },
    {
      field: 'tipoReunion',
      header: 'Tipo de Reunion'
    },
    {
      field: 'visualizar',
      header: 'Visualizar',
      body: (row) => (
        <button
          onClick={() => handleViewState(row.eventoId)}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          Visualizar
        </button>
      )
    }
  ];

  // -----------------------------
  // OPCIONES COMUNES DE GRÁFICO
  // -----------------------------
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

  // -----------------------------
  // ORDEN DESC Y PAGINACIÓN DE LA TABLA DEPARTAMENTOS
  // -----------------------------
  // Ordenar departamentos por % de avance (desc)
  const sortedDepartamentos = [...departamentos].sort((a, b) => {
    const avanceA = porcentajeAvancePorDepartamento[a] || 0;
    const avanceB = porcentajeAvancePorDepartamento[b] || 0;
    return avanceB - avanceA; // mayor a menor
  });

  // Paginación local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(sortedDepartamentos.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDepartamentos = sortedDepartamentos.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Obtener color para la barra de avance
  const getAvanceColor = (valor) => {
    if (valor <= 20) return 'bg-red-600';
    if (valor <= 50) return 'bg-amber-500';
    if (valor <= 75) return 'bg-blue-600';
    return 'bg-green-600';
  };

  // -----------------------------
  // RENDER PRINCIPAL
  // -----------------------------
  return (
    <>
      {/* Componente para Imprimir */}
      

      {/* Contenido del Dashboard (lo que se va a imprimir) */}
      <div id="print-area" className="p-6 max-w-full" ref={printRef}>
        {/* Encabezado y filtros */}
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
            {/* Filtro de Departamento */}
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
          {/* Total Municipalidades */}
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

          {/* Municipalidades Contactadas */}
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

          {/* Porcentaje Avance */}
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

        {/* Mapa y gráfico de municipalidades por departamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Mapa de Perú con leyenda fija */}
          <div className="bg-white p-6 rounded-lg shadow relative">
            <h3 className="text-lg font-semibold mb-4">Mapa de Avance por Departamento</h3>
            <div className="h-80 relative">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <PeruMap 
                    departamentosData={porcentajeAvancePorDepartamento}
                    onSelectDepartamento={setSelectedDepartamento}
                    selectedDepartamento={selectedDepartamento}
                  />
                  {/* Leyenda fija dentro del contenedor */}
                  <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow text-sm">
                    <p className="font-bold mb-1">Avance:</p>
                    <ul>
                      <li>
                        <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
                        0-25%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-orange-500 mr-2"></span>
                        25-50%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
                        50-75%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
                        75-100%
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gráfico de barras: Municipalidades por departamento */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Municipalidades por Departamento</h3>
            <div className="h-80">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <Bar data={departamentosChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Gráficos adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* NUEVO: Municipalidades Contactadas por Nivel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Municipalidades Contactadas por Nivel</h3>
            <div className="h-80">
              {loading ? (
                <LoadingSpinner />
              ) : (
                nivelLabels.length > 0 ? (
                  <Bar data={nivelChartData} options={chartOptions} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No hay municipalidades con nivel definido o no se han contactado</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Progreso en el Tiempo */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Progreso en el Tiempo</h3>
            <div className="h-80">
              {loading ? (
                <LoadingSpinner />
              ) : sortedDates.length > 0 ? (
                <Line data={progressChartData} options={progressChartOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">
                  Datos no disponibles
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de estadísticas por departamento (paginada) */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Estadísticas por Departamento</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Municipalidades
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contactadas
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Avance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : sortedDepartamentos.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                      No hay datos disponibles
                    </td>
                  </tr>
                ) : (
                  displayedDepartamentos.map(dep => {
                    const avance = porcentajeAvancePorDepartamento[dep] || 0;
                    const colorBar = getAvanceColor(avance);
                    return (
                      <tr
                        key={dep}
                        className={`hover:bg-gray-50 ${selectedDepartamento === dep ? 'bg-blue-50' : ''}`}
                        onClick={() => setSelectedDepartamento(dep)}
                      >
                        <td className="py-3 px-4 text-sm font-medium text-gray-900">
                          {dep}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {totalMunicipalidadesPorDepartamento[dep] || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {municipalidadesContactadasPorDepartamento[dep] || 0}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <span className="mr-2">{avance.toFixed(2)}%</span>
                            <div className="w-24 bg-gray-200 rounded-full h-2.5">
                              <div
                                className={`${colorBar} h-2.5 rounded-full`}
                                style={{ width: `${avance}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Botones de paginación */}
          {!loading && sortedDepartamentos.length > 10 && (
            <div className="flex justify-end items-center mt-4 space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md border text-sm ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md border text-sm ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* TABLA con últimos 10 EstadosSeguimientos */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">Últimos Estados de Seguimiento</h3>
          <Table
            data={last10StatesData}
            columns={lastStatesColumns}
            loading={loading}
            emptyMessage="No hay registros de seguimiento"
            className="text-sm"
          />
          {/* Paginación */}
  
        </div>
      </div>
    </>
  );
};

export default DashboardDepartamentos;
