import React, { useState, useEffect, useRef } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { api, authService } from '../services/authService';
import { useReactToPrint } from "react-to-print";
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

import { apiService } from '../services/authService';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);
//console.log('ReactToPrint:', ReactToPrint);  // Si imprime undefined, hay un problema con la importación
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
  //const printRef = useRef(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  // Modal o diálogo para visualizar detalles
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

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
        backgroundColor: 'rgba(138,221,45,0.8)',
        borderColor: 'rgba(138,221,45,0.8)',
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
  
  // Filtramos por departamento seleccionado si existe
  const contactedMunicipalitiesData = municipalidades
    .filter(m => contactedSet.has(m.id_municipalidad))
    .filter(m => selectedDepartamento ? m.departamento === selectedDepartamento : true);
  
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
  // OBTENER DATOS DE MUNICIPALIDADES CONTACTADAS CON ÚLTIMA INTERACCIÓN
  // -----------------------------
  // Obtener las municipalidades contactadas con su última interacción
  const getMunicipalidadesContactadas = () => {
    // Filtrar municipalidades según departamento seleccionado
    const filteredMunis = selectedDepartamento 
      ? municipalidades.filter(m => m.departamento === selectedDepartamento)
      : municipalidades;
    
    // Obtener solo las que han sido contactadas
    const contactadasMunis = filteredMunis.filter(m => 
      contactos.some(c => c.id_municipalidad === m.id_municipalidad)
    );
    
    // Para cada municipalidad contactada, buscar su última interacción
    return contactadasMunis.map(muni => {
      // Encontrar todos los eventos relacionados con esta municipalidad
      const relatedEvents = eventos.filter(e => e.id_municipalidad === muni.id_municipalidad);
      
      // Si no hay eventos, devolver datos básicos
      if (relatedEvents.length === 0) {
        return {
          id: muni.id_municipalidad,
          nombre: muni.nombre,
          ultimaInteraccion: 'Sin interacciones',
          fecha: null
        };
      }
      
      // Ordenar eventos por fecha (más reciente primero)
      const sortedEvents = [...relatedEvents].sort((a, b) => 
        new Date(b.fecha || 0) - new Date(a.fecha || 0)
      );
      
      // Obtener el evento más reciente
      const lastEvent = sortedEvents[0];
      
      // Encontrar el estado de seguimiento para este evento
      const estadoSeg = estadosSeguimiento.find(es => es.id_evento === lastEvent.id_evento);
      
      // Descripción del estado
      const estadoDesc = estadoSeg && estadoSeg.id_estado_ref
        ? estados.find(e => e.id_estado === estadoSeg.id_estado_ref)?.descripcion || 'Desconocido'
        : 'Desconocido';
      
      return {
        id: muni.id_municipalidad,
        nombre: muni.nombre,
        ultimaInteraccion: estadoDesc,
        fecha: lastEvent.fecha ? new Date(lastEvent.fecha) : null
      };
    })
    .filter(m => m.fecha) // Filtrar solo las que tienen fecha
    .sort((a, b) => b.fecha - a.fecha); // Ordenar por fecha más reciente
  };
  
  const municipalidadesContactadasConInteraccion = getMunicipalidadesContactadas();

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

    const handleViewState = async (eventoId) => {
      if (!eventoId) return;
    
      try {
        // 1️⃣ Obtener los detalles del evento
        const response = await api.get(`eventos/${eventoId}`);
        const evento = response.data;
    
        if (!evento) {
          console.error('No se encontró el evento.');
          return;
        }
    
        // 2️⃣ Buscar la municipalidad asociada al evento
        const municipalidad = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad) || null;
    
        // 3️⃣ Buscar el contacto asociado al evento
        const contacto = contactos.find(c => c.id_contacto === evento.id_contacto) || null;
    
        // 4️⃣ Obtener la descripción del tipo de reunión (si existe)
        let tipoReunionDesc = 'N/A';
        if (evento.id_tipo_reunion) {
          const tipoReunionRes = await api.get(`tipos-reunion/${evento.id_tipo_reunion}`);
          tipoReunionDesc = tipoReunionRes.data?.descripcion || 'N/A';
        }
    
        // 5️⃣ Guardar los datos en el estado
        setSelectedInteraction({
          ...evento,
          tipoReunionDesc,
          municipalidad,
          contacto
        });
    
        // 6️⃣ Mostrar el modal
        setViewDialogVisible(true);
      } catch (error) {
        console.error('Error al obtener detalles del evento:', error);
      }
    };
    const lastStatesColumns = [
      {
        field: 'fecha',
        header: 'Fecha',
        body: (row) => formatDate(row.fecha),
      },
      {
        field: 'municipalidad',
        header: 'Nombre Municipalidad',
        body: (row) => {
          const evento = eventos.find(e => e.id_evento === row.eventoId);
          const municipalidad = evento ? municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad) : null;
          return municipalidad ? municipalidad.nombre : 'N/A';
        }
      },
      {
        field: 'estado',
        header: 'Estado',
        body: (row) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${row.estado === 'ESTADO 01' ? 'bg-green-100 text-green-800' :
              row.estado === 'ESTADO 02' ? 'bg-yellow-100 text-yellow-800' :
              row.estado === 'ESTADO 03' ? 'bg-blue-100 text-blue-800' :
              row.estado === 'ESTADO 04' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {row.estado}
          </span>
        ),
      },
      {
        field: 'tipoReunion',
        header: 'Tipo de Reunion',
        body: (row) => row.tipoReunion || 'N/A'
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
      <div id="print-area" className="p-6 max-w-full">
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
            <h3 className="text-lg font-semibold mb-4">
              {selectedDepartamento 
                ? `Municipalidades Contactadas en ${selectedDepartamento}` 
                : 'Municipalidades por Departamento'}
            </h3>
            <div className="h-80 overflow-y-auto">
              {loading ? (
                <LoadingSpinner />
              ) : (
                selectedDepartamento ? (
                  municipalidadesContactadasConInteraccion.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Municipalidad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Última Interacción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {municipalidadesContactadasConInteraccion.map((muni) => (
                            <tr key={muni.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-sm text-gray-900">{muni.nombre}</td>
                              <td className="px-6 py-3 text-sm text-gray-500">{muni.ultimaInteraccion}</td>
                              <td className="px-6 py-3 text-sm text-gray-500">
                                {muni.fecha ? formatDate(muni.fecha) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No hay municipalidades contactadas en este departamento</p>
                    </div>
                  )
                ) : (
                  <Bar data={departamentosChartData} options={chartOptions} />
                )
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

        {/* Últimas Interacciones */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-4">Últimas Interacciones</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Municipalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
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
                    // Filtrar por fecha (últimos 30 días por defecto)
                    const estadoDate = new Date(estado.fecha);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);
                    
                    // Primero filtramos por fecha
                    if (estadoDate < thirtyDaysAgo) return false;
                    
                    // Luego por departamento seleccionado
                    if (selectedDepartamento) {
                      const evento = eventos.find((e) => e.id_evento === estado.id_evento);
                      if (!evento) return false;
                      
                      const muni = municipalidades.find(
                        (m) => m.id_municipalidad === evento.id_municipalidad
                      );
                      
                      return muni && muni.departamento === selectedDepartamento;
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
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {new Date(estado.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-800">
                          <div className="font-medium">{municipalidad ? municipalidad.nombre : 'N/A'}</div>
                          <div className="text-xs text-gray-500 md:hidden">
                            {new Date(estado.fecha).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {contacto ? contacto.nombre_completo : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${
                                estado.id_estado_ref === 1 // Completado
                                  ? 'bg-green-100 text-green-800'
                                  : estado.id_estado_ref === 2 // En Proceso
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : estado.id_estado_ref === 3 // Pendiente
                                  ? 'bg-blue-100 text-blue-800'
                                  : estado.id_estado_ref === 4 // Cancelado
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                          >
                            {estados.find(e => e.id_estado === estado.id_estado_ref)?.descripcion || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                          {estado.fecha_compromiso
                            ? new Date(estado.fecha_compromiso).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                          <button
                            onClick={() => {
                              setSelectedInteraction({
                                ...estado,
                                evento,
                                municipalidad,
                                contacto,
                                descripcion: estado.descripcion,
                                estado_desc: estados.find(e => e.id_estado === estado.id_estado_ref)?.descripcion || 'N/A'
                              });
                              setViewDialogVisible(true);
                            }}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium"
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {estadosSeguimiento
                  .filter((estado) => {
                    if (selectedDepartamento) {
                      const evento = eventos.find((e) => e.id_evento === estado.id_evento);
                      if (!evento) return false;
                      
                      const muni = municipalidades.find(
                        (m) => m.id_municipalidad === evento.id_municipalidad
                      );
                      
                      return muni && muni.departamento === selectedDepartamento;
                    }
                    return true;
                  })
                  .length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay interacciones recientes
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal para ver detalle de interacción */}
        {viewDialogVisible && selectedInteraction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
              {/* Encabezado del modal */}
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

              {/* Contenido del modal */}
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
                    <label className="block text-gray-700 font-medium mb-1">Estado</label>
                    <p className="text-gray-800">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            selectedInteraction.estado_desc === 'Completado'
                              ? 'bg-green-100 text-green-800'
                              : selectedInteraction.estado_desc === 'En Proceso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedInteraction.estado_desc === 'Pendiente'
                              ? 'bg-blue-100 text-blue-800'
                              : selectedInteraction.estado_desc === 'Cancelado'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        {selectedInteraction.estado_desc}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-1">Descripción</label>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedInteraction.descripcion || 'Sin descripción'}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 font-medium mb-1">Observaciones</label>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {selectedInteraction.observaciones || 'Sin observaciones'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setViewDialogVisible(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardDepartamentos;
