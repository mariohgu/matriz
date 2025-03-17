import React, { useState, useEffect, useRef } from 'react';
import { api, authService, apiService } from '../services/authService';
import { TailwindCalendar } from '../components/ui';
import {
  FiCalendar,
  FiUsers,
  FiActivity,
  FiBarChart2,
  FiClock,
  FiFilter,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiPrinter,
  FiRefreshCw
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

// Registrar componentes para ChartJS
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

function Dashboard() {
  // ----------------------
  // ESTADOS
  // ----------------------
  const [municipalidades, setMunicipalidades] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estados, setEstados] = useState([]); // Estados disponibles (para descripcion)
  const [loading, setLoading] = useState(true);

  // Fecha de última actualización
  const [lastUpdateDate, setLastUpdateDate] = useState(new Date());

  // Filtros
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 3))
  );
  const [endDate, setEndDate] = useState(new Date());
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const municipalidadDropdownRef = useRef(null);

  // Datos procesados para gráficos
  const [interactionsByType, setInteractionsByType] = useState({});
  const [contactsByMunicipality, setContactsByMunicipality] = useState({});
  const [interactionsByMonth, setInteractionsByMonth] = useState({});
  const [interactionFrequency, setInteractionFrequency] = useState({});

  // Modal o diálogo para visualizar detalles
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  // ----------------------
  // FUNCIONES AUXILIARES
  // ----------------------
  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoDescripcion = (estadoSeguimiento) => {
    if (!estadoSeguimiento.id_estado_ref) return 'N/A';
    const estadoRef = estados.find((e) => e.id_estado === estadoSeguimiento.id_estado_ref);
    return estadoRef ? estadoRef.descripcion || 'N/A' : 'N/A';
  };

  // Función para manejar la impresión del dashboard
  const handlePrintDashboard = () => {
    // Crear una nueva ventana para imprimir
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Obtener el contenido del dashboard
    const dashboardContent = document.getElementById('print-areas');
    if (!dashboardContent) {
      console.error('No se pudo encontrar el contenido del dashboard');
      printWindow.close();
      return;
    }
    
    // Crear el HTML para la ventana de impresión
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dashboard - Matriz de Seguimiento</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              padding-bottom: 10px;
              border-bottom: 1px solid #ccc;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .card {
              background: white;
              border-radius: 8px;
              padding: 15px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            h1 {
              font-size: 24px;
              color: #333;
            }
            h3 {
              font-size: 18px;
              color: #444;
              margin-top: 0;
            }
            @media print {
              body {
                padding: 0;
              }
              .header {
                margin-bottom: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dashboard - Matriz de Seguimiento</h1>
            <div>Fecha: ${formatDate(new Date())}</div>
          </div>
          <div class="content">
            ${dashboardContent.innerHTML}
          </div>
          <script>
            // Imprimir automáticamente y cerrar
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };


  // -------------------------------------------------
  // CARGA DE DATOS PRINCIPAL (SÓLO ACTUALIZA ESTADO)
  // -------------------------------------------------
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [municipalidadesRes, estadosSeguimientoRes, contactosRes, eventosRes, estadosRes] =
        await Promise.all([
          apiService.getAll('municipalidades'),
          apiService.getAll('estados-seguimiento'),
          apiService.getAll('contactos'),
          apiService.getAll('eventos'),
          apiService.getAll('estados')
        ]);

      setMunicipalidades(municipalidadesRes || []);
      setEstadosSeguimiento(estadosSeguimientoRes || []);
      setContactos(contactosRes || []);
      setEventos(eventosRes || []);
      setEstados(estadosRes || []);

      // Actualizamos la fecha de última carga en state y localStorage
      const now = new Date();
      setLastUpdateDate(now);
      localStorage.setItem('dashboardLastUpdate', now.toISOString());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------
  // USEEFFECT DE MONTAJE
  // ----------------------
  useEffect(() => {
    // Si se guardó la fecha de última actualización, la leemos
    const storedDate = localStorage.getItem('dashboardLastUpdate');
    if (storedDate) {
      setLastUpdateDate(new Date(storedDate));
    }
    // Cargar datos sin recargar toda la página
    loadAllData();
  }, []);

  // ----------------------
  // EFECTOS
  // ----------------------
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        municipalidadDropdownRef.current &&
        !municipalidadDropdownRef.current.contains(event.target)
      ) {
        setShowMunicipalidadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Procesar datos cuando cambian los filtros o la data cargada
    if (!loading) {
      processInteractionsByType();
      processContactsByMunicipality();
      processInteractionsByMonth();
      processInteractionFrequency();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estadosSeguimiento, eventos, contactos, municipalidades, startDate, endDate, selectedMunicipalidad, loading]);

  // ----------------------
  // PROCESADORES DE DATOS
  // ----------------------
  const processInteractionsByType = () => {
    let filteredInteractions = estadosSeguimiento.filter((estado) => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });

    if (selectedMunicipalidad) {
      const municipalidadId = selectedMunicipalidad.id_municipalidad;
      filteredInteractions = filteredInteractions.filter((estado) => {
        const evento = eventos.find((e) => e.id_evento === estado.id_evento);
        return evento && evento.id_municipalidad === municipalidadId;
      });
    }

    const interactionCounts = filteredInteractions.reduce((acc, estado) => {
      const estadoValue = getEstadoDescripcion(estado);
      acc[estadoValue] = (acc[estadoValue] || 0) + 1;
      return acc;
    }, {});
    setInteractionsByType(interactionCounts);
  };

  const processContactsByMunicipality = () => {
    let filteredMunicipalities = municipalidades;
    if (selectedMunicipalidad) {
      filteredMunicipalities = filteredMunicipalities.filter(
        (m) => m.id_municipalidad === selectedMunicipalidad.id_municipalidad
      );
    }
    const contactCounts = {};
    filteredMunicipalities.forEach((municipalidad) => {
      const municipalidadContactos = contactos.filter(
        (contacto) => contacto.id_municipalidad === municipalidad.id_municipalidad
      );
      if (municipalidadContactos.length > 0) {
        contactCounts[municipalidad.nombre] = municipalidadContactos.length;
      }
    });
    setContactsByMunicipality(contactCounts);
  };

  const processInteractionsByMonth = () => {
    let filteredInteractions = estadosSeguimiento.filter((estado) => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });
    if (selectedMunicipalidad) {
      const municipalidadId = selectedMunicipalidad.id_municipalidad;
      filteredInteractions = filteredInteractions.filter((estado) => {
        const evento = eventos.find((e) => e.id_evento === estado.id_evento);
        return evento && evento.id_municipalidad === municipalidadId;
      });
    }
    const monthlyData = {};
    filteredInteractions.forEach((estado) => {
      const date = new Date(estado.fecha);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });
    // Ordenar cronológicamente
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    const sortedData = {};
    sortedMonths.forEach((month) => {
      sortedData[month] = monthlyData[month];
    });
    setInteractionsByMonth(sortedData);
  };

  const processInteractionFrequency = () => {
    let filteredInteractions = estadosSeguimiento.filter((estado) => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });
    if (selectedMunicipalidad) {
      const municipalidadId = selectedMunicipalidad.id_municipalidad;
      filteredInteractions = filteredInteractions.filter((estado) => {
        const evento = eventos.find((e) => e.id_evento === estado.id_evento);
        return evento && evento.id_municipalidad === municipalidadId;
      });
    }
    const eventosIds = filteredInteractions
      .map((estado) => estado.id_evento)
      .filter((id) => id);
    const interactionsByMunicipality = {};
    eventosIds.forEach((eventoId) => {
      const evento = eventos.find((e) => e.id_evento === eventoId);
      if (evento && evento.id_municipalidad) {
        const muniId = evento.id_municipalidad;
        interactionsByMunicipality[muniId] = (interactionsByMunicipality[muniId] || 0) + 1;
      }
    });
    const frequency = {
      '1 interacción': 0,
      '2 interacciones': 0,
      '3 interacciones': 0,
      '4+ interacciones': 0
    };
    Object.values(interactionsByMunicipality).forEach((count) => {
      if (count === 1) frequency['1 interacción']++;
      else if (count === 2) frequency['2 interacciones']++;
      else if (count === 3) frequency['3 interacciones']++;
      else frequency['4+ interacciones']++;
    });
    setInteractionFrequency(frequency);
  };

  // ----------------------
  // FILTRO DE MUNICIPALIDADES
  // ----------------------
  const municipalidadesFiltered = municipalidades.filter((municipalidad) => {
    const q = municipalidadSearchQuery.trim().toLowerCase();
    if (!q) return true;
    const { nombre, ubigeo } = municipalidad;
    return (
      (nombre && nombre.toLowerCase().includes(q)) ||
      (ubigeo && ubigeo.toLowerCase().includes(q))
    );
  });

  // ----------------------
  // DATASETS PARA GRÁFICOS
  // ----------------------
  const interactionsByTypeChartData = {
    labels: Object.keys(interactionsByType),
    datasets: [
      {
        label: 'Número de Interacciones',
        data: Object.values(interactionsByType),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const contactsByMunicipalityChartData = {
    labels: Object.keys(contactsByMunicipality).slice(0, 10),
    datasets: [
      {
        label: 'Número de Contactos',
        data: Object.values(contactsByMunicipality).slice(0, 10),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1
      }
    ]
  };

  const interactionsByMonthChartData = {
    labels: Object.keys(interactionsByMonth),
    datasets: [
      {
        label: 'Interacciones por Mes',
        data: Object.values(interactionsByMonth),
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      }
    ]
  };

  const interactionFrequencyChartData = {
    labels: Object.keys(interactionFrequency),
    datasets: [
      {
        label: 'Municipalidades por Frecuencia de Interacción',
        data: Object.values(interactionFrequency),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Datos de Interacciones'
      }
    }
  };

  // ----------------------
  // RENDER
  // ----------------------
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header - Título y controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="flex items-center gap-2">
          <button
            onClick={loadAllData}
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 no-print"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            Actualizar
          </button>
          
          <button 
            onClick={handlePrintDashboard}
            className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 no-print"
          >
            <FiPrinter />
            Imprimir
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        Última actualización: {formatDate(lastUpdateDate)}
      </div>

      {/* Panel de filtros */}
      <div className="bg-white rounded-lg shadow mb-6 p-4 no-print">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiFilter className="mr-2" /> Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Calendarios de fecha inicio y fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
            <TailwindCalendar
              id="start-date"
              selectedDate={startDate}
              onChange={(date) =>
                setStartDate(date || new Date(new Date().setMonth(new Date().getMonth() - 3)))
              }
              className="mb-2"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1 mt-3">Fecha Fin</label>
            <TailwindCalendar
              id="end-date"
              selectedDate={endDate}
              onChange={(date) => setEndDate(date || new Date())}
              className="mb-2"
            />
          </div>
          {/* Dropdown de municipalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Municipalidad</label>
            <div className="relative" ref={municipalidadDropdownRef}>
              <div
                className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center cursor-pointer"
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                <span className="truncate">
                  {selectedMunicipalidad
                    ? selectedMunicipalidad.nombre
                    : 'Seleccione una municipalidad'}
                </span>
                <span>
                  {showMunicipalidadDropdown ? (
                    <FiChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </span>
              </div>

              {showMunicipalidadDropdown && (
                <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div className="sticky top-0 z-10 bg-white p-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Buscar municipalidad..."
                        value={municipalidadSearchQuery}
                        onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiSearch className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Opción para limpiar selección */}
                  <div
                    className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 border-b border-gray-200"
                    onClick={() => {
                      setSelectedMunicipalidad(null);
                      setShowMunicipalidadDropdown(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate text-gray-500">
                        Todas las municipalidades
                      </span>
                    </div>
                  </div>

                  {municipalidadesFiltered.length === 0 ? (
                    <div className="py-2 px-3 text-gray-700">No se encontraron resultados</div>
                  ) : (
                    municipalidadesFiltered.map((municipalidad) => (
                      <div
                        key={municipalidad.id_municipalidad}
                        className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                          selectedMunicipalidad &&
                          selectedMunicipalidad.id_municipalidad ===
                            municipalidad.id_municipalidad
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-900'
                        }`}
                        onClick={() => {
                          setSelectedMunicipalidad(municipalidad);
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium truncate">
                            {municipalidad.nombre || 'Sin nombre'}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {municipalidad.ubigeo && (
                              <span className="font-semibold mr-1">[{municipalidad.ubigeo}]</span>
                            )}
                            {municipalidad.provincia || ''}{' '}
                            {municipalidad.departamento
                              ? `- ${municipalidad.departamento}`
                              : ''}
                          </span>
                        </div>
                        {selectedMunicipalidad &&
                          selectedMunicipalidad.id_municipalidad ===
                            municipalidad.id_municipalidad && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                              <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </span>
                          )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div id="print-area" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Municipalidades</p>
              <p className="text-2xl font-bold text-gray-900">{municipalidades.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contactos</p>
              <p className="text-2xl font-bold text-gray-900">{contactos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FiCalendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900">{eventos.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FiActivity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Interacciones</p>
              <p className="text-2xl font-bold text-gray-900">{estadosSeguimiento.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div id="print-areas" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Interacciones por Estado */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Interacciones por Estado</h3>
          <div className="h-80">
            <Pie data={interactionsByTypeChartData} options={chartOptions} />
          </div>
        </div>

        {/* Frecuencia de Interacciones */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Frecuencia de Interacciones por Municipalidad</h3>
          <div className="h-80">
            <Pie data={interactionFrequencyChartData} options={chartOptions} />
          </div>
        </div>

        {/* Interacciones por Mes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Interacciones por Mes</h3>
          <div className="h-80">
            <Line data={interactionsByMonthChartData} options={chartOptions} />
          </div>
        </div>

        {/* Top 10 Municipalidades por Contactos */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Municipalidades por Número de Contactos</h3>
          <div className="h-80">
            <Bar data={contactsByMunicipalityChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Últimas Interacciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Últimas Interacciones</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Municipalidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Compromiso
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estadosSeguimiento
                .filter((estado) => {
                  // Filtrar por municipalidad si hay una seleccionada
                  if (selectedMunicipalidad) {
                    const evento = eventos.find((e) => e.id_evento === estado.id_evento);
                    return (
                      evento && evento.id_municipalidad === selectedMunicipalidad.id_municipalidad
                    );
                  }
                  return true;
                })
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5)
                .map((estado, index) => {
                  const evento = eventos.find((e) => e.id_evento === estado.id_evento);
                  const municipalidad =
                    evento &&
                    municipalidades.find(
                      (m) => m.id_municipalidad === evento.id_municipalidad
                    );
                  const contacto = contactos.find((c) => c.id_contacto === estado.id_contacto);

                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(estado.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipalidad ? municipalidad.nombre : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contacto ? contacto.nombre_completo : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              getEstadoDescripcion(estado) === 'Completado'
                                ? 'bg-green-100 text-green-800'
                                : getEstadoDescripcion(estado) === 'En Proceso'
                                ? 'bg-yellow-100 text-yellow-800'
                                : getEstadoDescripcion(estado) === 'Pendiente'
                                ? 'bg-blue-100 text-blue-800'
                                : getEstadoDescripcion(estado) === 'Cancelado'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {getEstadoDescripcion(estado)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {estado.fecha_compromiso
                          ? new Date(estado.fecha_compromiso).toLocaleDateString()
                          : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <button
                          onClick={() => {
                            const getTipoReunion = async () => {
                              if (estado.id_tipo_reunion) {
                                try {
                                  const response = await api.get(
                                    `api/tipos-reunion/${estado.id_tipo_reunion}`
                                  );
                                  return response.data?.descripcion || 'N/A';
                                } catch (error) {
                                  console.error('Error al obtener tipo de reunión:', error);
                                  return 'N/A';
                                }
                              }
                              return 'N/A';
                            };
                            getTipoReunion().then((descripcion) => {
                              setSelectedInteraction({
                                ...estado,
                                tipoReunionDesc: descripcion
                              });
                              setViewDialogVisible(true);
                            });
                          }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium"
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para ver detalle de interacción */}
      {viewDialogVisible && selectedInteraction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Detalles de la Interacción</h3>
              <button
                onClick={() => setViewDialogVisible(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Municipalidad</label>
                  <p className="text-gray-800">
                    {selectedInteraction.municipalidad
                      ? selectedInteraction.municipalidad.nombre
                      : 'N/A'}
                  </p>
                </div>
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Contacto</label>
                  <p className="text-gray-800">
                    {selectedInteraction.contacto
                      ? selectedInteraction.contacto.nombre_completo
                      : 'N/A'}
                  </p>
                </div>
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Fecha</label>
                  <p className="text-gray-800">
                    {new Date(selectedInteraction.fecha).toLocaleDateString()}
                  </p>
                </div>
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Fecha de Compromiso</label>
                  <p className="text-gray-800">
                    {selectedInteraction.fecha_compromiso
                      ? new Date(selectedInteraction.fecha_compromiso).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Tipo de Reunión</label>
                  <p className="text-gray-800">
                    {typeof selectedInteraction.tipoReunionDesc === 'string'
                      ? selectedInteraction.tipoReunionDesc
                      : 'N/A'}
                  </p>
                </div>
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Estado</label>
                  <p className="text-gray-800">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                        selectedInteraction.estado === 'Pendiente'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedInteraction.estado === 'En Proceso'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedInteraction.estado === 'Completado'
                          ? 'bg-green-100 text-green-800'
                          : selectedInteraction.estado === 'Cancelado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {getEstadoDescripcion(selectedInteraction)}
                    </span>
                  </p>
                </div>
                <div className="field col-span-1 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Descripción</label>
                  <p className="text-gray-800 whitespace-pre-line">
                    {selectedInteraction.descripcion || 'N/A'}
                  </p>
                </div>
                <div className="field col-span-1 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Compromiso</label>
                  <p className="text-gray-800 whitespace-pre-line">
                    {selectedInteraction.compromiso || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewDialogVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
